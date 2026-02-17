import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { fetchAndVerify } from "@toolindex/shared";
import type { WebMcpManifest, Tool } from "@toolindex/shared";

const app = new Hono();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATUS_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  verified: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Verified" },
  invalid:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Invalid" },
  stale:    { color: "#eab308", bg: "rgba(234,179,8,0.1)", label: "Stale" },
};

const RISK_PILL: Record<string, { color: string; bg: string }> = {
  low:      { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  medium:   { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.18)" },
};

function renderToolCard(tool: Tool): string {
  const risk = RISK_PILL[tool.risk_level] ?? { color: "#8b8b9e", bg: "rgba(139,139,158,0.1)" };
  const tags = (tool as any).tags as string[] | undefined;
  return `<div class="tool-card">
    <div class="tool-header">
      <span class="tool-name">${escapeHtml(tool.name)}</span>
      <span class="risk-pill" style="color:${risk.color};background:${risk.bg};${tool.risk_level === "critical" ? "box-shadow:0 0 8px rgba(239,68,68,0.25);" : ""}">${tool.risk_level}</span>
    </div>
    <p class="tool-desc">${escapeHtml(tool.description)}</p>
    <div class="tool-meta">
      <span>v${escapeHtml(tool.version)}</span>
      <span>${escapeHtml(tool.pricing.model)}${tool.pricing.cost_estimate ? ` · ${escapeHtml(tool.pricing.cost_estimate)}` : ""}</span>
      ${tool.requires_user_confirm ? `<span class="confirm-badge">Requires confirm</span>` : ""}
    </div>
    ${tags?.length ? `<div class="tool-tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
  </div>`;
}

function renderPage(origin: string, status: string, manifest?: WebMcpManifest, error?: string): string {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.invalid;
  const safeOrigin = escapeHtml(origin);

  let body = `
    <header>
      <div class="header-top">
        <h1>${safeOrigin}</h1>
        <span class="status-badge" style="color:${badge.color};background:${badge.bg}">${badge.label}</span>
      </div>
      <div class="accent-line"></div>
    </header>`;

  if (error) {
    body += `<div class="error-card"><strong>Error</strong><p>${escapeHtml(error)}</p></div>`;
  }

  if (manifest) {
    body += `
    <div class="card">
      <h2>Auth</h2>
      <div class="card-row"><span class="label">Requires login</span><span>${manifest.auth.requires_login ? "Yes" : "No"}</span></div>
      ${manifest.auth.oauth_scopes ? `<div class="card-row"><span class="label">OAuth scopes</span><code>${escapeHtml(manifest.auth.oauth_scopes.join(", "))}</code></div>` : ""}
    </div>

    <div class="section-header"><h2>Tools</h2><span class="count">${manifest.tools.length}</span></div>
    <div class="tools-grid">
      ${manifest.tools.map(renderToolCard).join("\n")}
    </div>`;

    if (manifest.attestation) {
      const att = manifest.attestation;
      body += `
    <div class="card">
      <h2>Attestation</h2>
      <div class="card-row"><span class="label">Algorithm</span><span>${escapeHtml(att.algo)}</span></div>
      <div class="card-row"><span class="label">Key type</span><span>${escapeHtml(att.public_key_jwk.kty)}${att.public_key_jwk.crv ? ` (${escapeHtml(att.public_key_jwk.crv)})` : ""}</span></div>
      <div class="card-row"><span class="label">Signed fields</span><span>${escapeHtml(att.signed_fields.join(", "))}</span></div>
      <div class="card-row"><span class="label">Signature</span><code class="sig">${escapeHtml(att.signature)}</code></div>
    </div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WebMCP — ${safeOrigin}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #0a0a0f;
      color: #e4e4e7;
      max-width: 780px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      line-height: 1.6;
    }

    /* Header */
    header { margin-bottom: 2rem; }
    .header-top { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    h1 {
      font-size: 1.35rem;
      font-weight: 600;
      color: #e4e4e7;
      word-break: break-all;
    }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }
    .accent-line {
      height: 2px;
      margin-top: 1rem;
      background: linear-gradient(90deg, #818cf8 0%, transparent 100%);
      border-radius: 1px;
    }

    /* Cards */
    .card {
      background: #13131a;
      border: 1px solid #1e1e2e;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
    }
    .card h2 {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #818cf8;
      margin-bottom: 1rem;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.4rem 0;
      border-bottom: 1px solid #1e1e2e;
      font-size: 0.9rem;
    }
    .card-row:last-child { border-bottom: none; }
    .label { color: #8b8b9e; }

    /* Code */
    code {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      background: rgba(129,140,248,0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.82em;
      color: #a5b4fc;
    }
    code.sig { word-break: break-all; display: inline-block; max-width: 480px; text-align: right; }

    /* Section header */
    .section-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 2rem 0 1rem;
    }
    .section-header h2 {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #818cf8;
    }
    .count {
      font-size: 0.7rem;
      font-weight: 600;
      color: #818cf8;
      background: rgba(129,140,248,0.1);
      padding: 1px 8px;
      border-radius: 9999px;
    }

    /* Tools grid */
    .tools-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .tool-card {
      background: #13131a;
      border: 1px solid #1e1e2e;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      transition: border-color 0.15s;
    }
    .tool-card:hover { border-color: #2e2e42; }
    .tool-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
    .tool-name { font-size: 1rem; font-weight: 600; }
    .risk-pill {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .tool-desc { font-size: 0.875rem; color: #8b8b9e; margin-bottom: 0.75rem; }
    .tool-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.78rem;
      color: #5a5a72;
      flex-wrap: wrap;
    }
    .confirm-badge {
      color: #eab308;
      background: rgba(234,179,8,0.1);
      padding: 1px 8px;
      border-radius: 9999px;
      font-weight: 500;
    }
    .tool-tags { display: flex; gap: 0.4rem; margin-top: 0.65rem; flex-wrap: wrap; }
    .tag {
      font-size: 0.7rem;
      color: #818cf8;
      background: rgba(129,140,248,0.08);
      padding: 2px 8px;
      border-radius: 9999px;
    }

    /* Error card */
    .error-card {
      background: rgba(239,68,68,0.06);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      color: #fca5a5;
    }
    .error-card strong { color: #ef4444; display: block; margin-bottom: 0.35rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .error-card p { font-size: 0.9rem; line-height: 1.5; }
  </style>
</head>
<body>${body}
</body>
</html>`;
}

app.get("/origin/:origin{.+}", async (c) => {
  const origin = c.req.param("origin");

  const result = await fetchAndVerify(origin);

  c.header("Content-Type", "text/html; charset=utf-8");
  c.header("Cache-Control", "public, max-age=60");
  return c.body(renderPage(origin, result.status, result.manifest, result.error));
});

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`@toolindex/web listening on http://localhost:${port}`);
});
