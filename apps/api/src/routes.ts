import type { FastifyInstance } from "fastify";
import { validateManifest } from "@toolindex/validator";
import { prisma } from "./db";
import { renderBadge } from "./badge";

function normalizeOrigin(raw: string): string {
  let o = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(o)) o = `https://${o}`;
  const url = new URL(o);
  return `${url.protocol}//${url.host}`;
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

    // Upsert origin
    const record = await prisma.origin.upsert({
      where: { origin },
      create: {
        origin,
        status: "verified",
        attested,
        manifestJson: JSON.stringify(manifest),
        lastError: null,
      },
      update: {
        status: "verified",
        attested,
        manifestJson: JSON.stringify(manifest),
        lastChecked: new Date(),
        lastError: null,
      },
    });

    // Replace tools
    await prisma.tool.deleteMany({ where: { originId: record.id } });
    await prisma.tool.createMany({
      data: manifest.tools.map((t) => ({
        originId: record.id,
        name: t.name,
        description: t.description,
        version: t.version,
        tags: JSON.stringify(t.tags),
        riskLevel: t.risk_level,
        requiresUserConfirm: t.requires_user_confirm,
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
        origins.map((o) => ({
          origin: o.origin,
          status: o.status,
          tool_count: o.tools.length,
          top_tools: o.tools.slice(0, 3).map((t) => t.name),
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
          top_tools: o.tools.slice(0, 3).map((t) => t.name),
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
          top_tools: t.origin.tools.slice(0, 3).map((tt) => tt.name),
        });
      }
    }

    return reply.send(results);
  });

  // GET /origin/:origin
  app.get<{ Params: { origin: string } }>("/origin/:origin", async (req, reply) => {
    const origin = normalizeOrigin(req.params.origin);
    const record = await prisma.origin.findUnique({
      where: { origin },
      include: { tools: true },
    });

    if (!record) {
      return reply.status(404).send({ error: "Origin not found" });
    }

    return reply.send({
      origin: record.origin,
      status: record.status,
      attested: record.attested,
      first_seen: record.firstSeen,
      last_checked: record.lastChecked,
      last_error: record.lastError,
      manifest: record.manifestJson ? JSON.parse(record.manifestJson) : null,
      tools: record.tools.map((t) => ({
        name: t.name,
        description: t.description,
        version: t.version,
        tags: JSON.parse(t.tags),
        risk_level: t.riskLevel,
        requires_user_confirm: t.requiresUserConfirm,
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

    reply.header("Content-Type", "image/svg+xml");
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    return reply.send(renderBadge(status));
  });
}
