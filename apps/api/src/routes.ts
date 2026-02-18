import type { FastifyInstance } from "fastify";
import type { Origin, Tool, Check } from "@prisma/client";
import { validateManifest } from "@toolindex/validator";
import { prisma } from "./db";
import { renderBadge } from "./badge";
import {
  computeTrustScore,
  computeRelevanceScore,
  combinedScore,
} from "./scoring";

type OriginWithTools = Origin & { tools: Tool[] };
type OriginWithToolsAndChecks = Origin & { tools: Tool[]; checks: Check[] };
type ToolWithOriginAndChecks = Tool & { origin: OriginWithToolsAndChecks };

function normalizeOrigin(raw: string): string {
  let o = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(o)) o = `https://${o}`;
  const url = new URL(o);
  return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/+$/, "");
}

export async function registerRoutes(app: FastifyInstance) {
  // POST /submit
  app.post<{ Body: { origin: string } }>("/submit", async (req, reply) => {
    const { origin: rawOrigin } = req.body ?? {};
    if (!rawOrigin || typeof rawOrigin !== "string") {
      return reply.status(400).send({ error: "Missing `origin` in request body" });
    }

    let origin: string;
    try {
      origin = normalizeOrigin(rawOrigin);
    } catch {
      return reply.status(400).send({ error: "Invalid origin URL" });
    }

    const manifestUrl = `${origin}/.well-known/webmcp.json`;
    const start = Date.now();
    let fetchError: string | undefined;
    let json: unknown;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(manifestUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        fetchError = `HTTP ${res.status} from ${manifestUrl}`;
      } else {
        json = await res.json();
      }
    } catch (err: any) {
      fetchError = err?.message ?? "Fetch failed";
    }

    const latencyMs = Date.now() - start;

    if (fetchError) {
      const record = await prisma.origin.upsert({
        where: { origin },
        create: { origin, status: "invalid", lastError: fetchError },
        update: { status: "invalid", lastChecked: new Date(), lastError: fetchError },
      });
      await prisma.check.create({
        data: { originId: record.id, ok: false, error: fetchError, latencyMs },
      });
      return reply.send({ origin, status: "invalid", tool_count: 0, errors: [fetchError] });
    }

    const result = validateManifest(json);
    if (!result.valid) {
      const errorMsgs = result.errors.map((e) => `${e.path}: ${e.message}`);
      const record = await prisma.origin.upsert({
        where: { origin },
        create: { origin, status: "invalid", lastError: errorMsgs.join("; ") },
        update: { status: "invalid", lastChecked: new Date(), lastError: errorMsgs.join("; ") },
      });
      await prisma.check.create({
        data: { originId: record.id, ok: false, error: errorMsgs.join("; "), latencyMs },
      });
      return reply.send({ origin, status: "invalid", tool_count: 0, errors: errorMsgs });
    }

    const manifest = result.manifest!;
    const attested = !!manifest.attestation;
    const requiresAuth = !!(manifest as any).auth?.requires_login;

    // Upsert origin
    const record = await prisma.origin.upsert({
      where: { origin },
      create: {
        origin,
        status: "verified",
        attested,
        requiresAuth,
        manifestJson: JSON.stringify(manifest),
        lastError: null,
      },
      update: {
        status: "verified",
        attested,
        requiresAuth,
        manifestJson: JSON.stringify(manifest),
        lastChecked: new Date(),
        lastError: null,
      },
    });

    // Replace tools
    await prisma.tool.deleteMany({ where: { originId: record.id } });
    await prisma.tool.createMany({
      data: manifest.tools.map((t: any) => ({
        originId: record.id,
        name: t.name,
        description: t.description,
        version: t.version,
        tags: JSON.stringify(t.tags),
        riskLevel: t.risk_level,
        requiresUserConfirm: t.requires_user_confirm,
        pricingModel: t.pricing?.model ?? null,
        pricingPriceUsd: t.pricing?.price_usd ?? null,
      })),
    });

    await prisma.check.create({
      data: { originId: record.id, ok: true, latencyMs },
    });

    return reply.send({
      origin,
      status: "verified",
      tool_count: manifest.tools.length,
    });
  });

  // GET /search?q=string
  app.get<{ Querystring: { q?: string } }>("/search", async (req, reply) => {
    const q = (req.query.q ?? "").trim();

    if (!q) {
      const origins = await prisma.origin.findMany({
        include: { tools: true },
        orderBy: { lastChecked: "desc" },
        take: 50,
      });
      return reply.send(
        origins.map((o: OriginWithTools) => ({
          origin: o.origin,
          status: o.status,
          tool_count: o.tools.length,
          top_tools: o.tools.slice(0, 3).map((t: Tool) => t.name),
        }))
      );
    }

    const pattern = `%${q}%`;

    // Search origins by origin substring
    const byOrigin = await prisma.origin.findMany({
      where: { origin: { contains: q } },
      include: { tools: true },
    });

    // Search tools by name or tag
    const toolMatches = await prisma.tool.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { tags: { contains: q } },
        ],
      },
      include: { origin: { include: { tools: true } } },
    });

    // Merge results by origin, deduplicate
    const seen = new Set<string>();
    const results: Array<{
      origin: string;
      status: string;
      tool_count: number;
      top_tools: string[];
    }> = [];

    for (const o of byOrigin) {
      if (!seen.has(o.origin)) {
        seen.add(o.origin);
        results.push({
          origin: o.origin,
          status: o.status,
          tool_count: o.tools.length,
          top_tools: o.tools.slice(0, 3).map((t: Tool) => t.name),
        });
      }
    }

    for (const t of toolMatches) {
      if (!seen.has(t.origin.origin)) {
        seen.add(t.origin.origin);
        results.push({
          origin: t.origin.origin,
          status: t.origin.status,
          tool_count: t.origin.tools.length,
          top_tools: t.origin.tools.slice(0, 3).map((tt: Tool) => tt.name),
        });
      }
    }

    return reply.send(results);
  });

  // GET /tools/search?q=&risk=&pricing=&auth=&limit=
  app.get<{
    Querystring: {
      q?: string;
      risk?: string;
      pricing?: string;
      auth?: string;
      limit?: string;
    };
  }>("/tools/search", async (req, reply) => {
    const q = (req.query.q ?? "").trim();
    const riskFilter = req.query.risk;
    const pricingFilter = req.query.pricing;
    const authFilter = req.query.auth;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20", 10) || 20));

    // Build where clause for tools
    const toolWhere: any = {};
    if (q) {
      toolWhere.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    }
    if (riskFilter) {
      toolWhere.riskLevel = riskFilter;
    }
    if (pricingFilter) {
      if (pricingFilter === "free") {
        // Free means either no pricing set or explicitly "free"
        const pricingConditions = [
          { pricingModel: null },
          { pricingModel: "free" },
        ];
        if (toolWhere.OR) {
          // Wrap existing OR with AND to combine both conditions
          toolWhere.AND = [
            { OR: toolWhere.OR },
            { OR: pricingConditions },
          ];
          delete toolWhere.OR;
        } else {
          toolWhere.OR = pricingConditions;
        }
      } else {
        toolWhere.pricingModel = pricingFilter;
      }
    }

    // Build origin filter
    const originWhere: any = {};
    if (authFilter === "true") {
      originWhere.requiresAuth = true;
    } else if (authFilter === "false") {
      originWhere.requiresAuth = false;
    }

    const tools = await prisma.tool.findMany({
      where: {
        ...toolWhere,
        origin: Object.keys(originWhere).length > 0 ? originWhere : undefined,
      },
      include: {
        origin: {
          include: {
            tools: { select: { id: true } },
            checks: { orderBy: { checkedAt: "desc" }, take: 100 },
          },
        },
      },
    });

    // Score each tool
    const scored = tools.map((t: any) => {
      const trustResult = computeTrustScore(
        {
          status: t.origin.status,
          attested: t.origin.attested,
          requiresAuth: t.origin.requiresAuth,
          firstSeen: t.origin.firstSeen,
          lastChecked: t.origin.lastChecked,
          toolCount: t.origin.tools.length,
        },
        t.origin.checks.map((c: any) => ({ ok: c.ok, latencyMs: c.latencyMs }))
      );

      const relevanceResult = computeRelevanceScore(
        {
          name: t.name,
          description: t.description,
          tags: t.tags,
          riskLevel: t.riskLevel,
          pricingModel: t.pricingModel,
        },
        q,
        { risk: riskFilter, pricing: pricingFilter }
      );

      const score = q
        ? combinedScore(relevanceResult.total, trustResult.total)
        : trustResult.total;

      return {
        score,
        trust: { total: trustResult.total, breakdown: trustResult.breakdown },
        relevance: { total: relevanceResult.total, breakdown: relevanceResult.breakdown },
        tool: {
          name: t.name,
          description: t.description,
          version: t.version,
          tags: JSON.parse(t.tags),
          risk_level: t.riskLevel,
          requires_user_confirm: t.requiresUserConfirm,
          pricing_model: t.pricingModel,
          pricing_price_usd: t.pricingPriceUsd,
        },
        origin: {
          origin: t.origin.origin,
          status: t.origin.status,
          attested: t.origin.attested,
          requires_auth: t.origin.requiresAuth,
          trust_score: trustResult.total,
        },
      };
    });

    // Sort by combined score descending
    scored.sort((a: any, b: any) => b.score - a.score);

    return reply.send(scored.slice(0, limit));
  });

  // GET /origin/:origin
  app.get<{ Params: { origin: string } }>("/origin/:origin", async (req, reply) => {
    const origin = normalizeOrigin(req.params.origin);
    const record = await prisma.origin.findUnique({
      where: { origin },
      include: {
        tools: true,
        checks: { orderBy: { checkedAt: "desc" }, take: 100 },
      },
    });

    if (!record) {
      return reply.status(404).send({ error: "Origin not found" });
    }

    const checks = record.checks;
    const okChecks = checks.filter((c) => c.ok);
    const uptimePercent =
      checks.length > 0
        ? Math.round((okChecks.length / checks.length) * 100)
        : null;
    const avgLatency =
      okChecks.length > 0
        ? Math.round(okChecks.reduce((s, c) => s + c.latencyMs, 0) / okChecks.length)
        : null;

    const trustResult = computeTrustScore(
      {
        status: record.status,
        attested: record.attested,
        requiresAuth: record.requiresAuth,
        firstSeen: record.firstSeen,
        lastChecked: record.lastChecked,
        toolCount: record.tools.length,
      },
      checks.map((c) => ({ ok: c.ok, latencyMs: c.latencyMs }))
    );

    return reply.send({
      origin: record.origin,
      status: record.status,
      attested: record.attested,
      requires_auth: record.requiresAuth,
      first_seen: record.firstSeen,
      last_checked: record.lastChecked,
      last_error: record.lastError,
      trust_score: trustResult.total,
      trust_breakdown: trustResult.breakdown,
      checks_summary: {
        total: checks.length,
        ok: okChecks.length,
        uptime_percent: uptimePercent,
        avg_latency_ms: avgLatency,
      },
      manifest: record.manifestJson ? JSON.parse(record.manifestJson) : null,
      tools: record.tools.map((t: Tool) => ({
        name: t.name,
        description: t.description,
        version: t.version,
        tags: JSON.parse(t.tags),
        risk_level: t.riskLevel,
        requires_user_confirm: t.requiresUserConfirm,
        pricing_model: t.pricingModel,
        pricing_price_usd: t.pricingPriceUsd,
      })),
    });
  });

  // GET /verify?origin=string
  app.get<{ Querystring: { origin?: string } }>("/verify", async (req, reply) => {
    const rawOrigin = req.query.origin;
    if (!rawOrigin) {
      return reply.status(400).send({ error: "Missing `origin` query parameter" });
    }

    const origin = normalizeOrigin(rawOrigin);
    const record = await prisma.origin.findUnique({ where: { origin } });

    if (!record) {
      return reply.send({ origin, status: "unknown", last_checked: null, attested: false });
    }

    return reply.send({
      origin: record.origin,
      status: record.status,
      last_checked: record.lastChecked,
      attested: record.attested,
    });
  });

  // GET /badge?origin=string
  app.get<{ Querystring: { origin?: string } }>("/badge", async (req, reply) => {
    const rawOrigin = req.query.origin;
    if (!rawOrigin) {
      return reply.status(400).send({ error: "Missing `origin` query parameter" });
    }

    let origin: string;
    try {
      origin = normalizeOrigin(rawOrigin);
    } catch {
      return reply.status(400).send({ error: "Invalid origin" });
    }

    const record = await prisma.origin.findUnique({ where: { origin } });
    const status = record?.status ?? "unknown";

    reply.header("Content-Type", "image/svg+xml;charset=utf-8");
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    return reply.send(renderBadge(status));
  });
}
