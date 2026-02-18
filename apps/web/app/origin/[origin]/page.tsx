"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "../../api-client";

interface ToolInfo {
  name: string;
  description: string;
  version: string;
  tags: string[];
  risk_level: string;
  requires_user_confirm: boolean;
}

interface OriginData {
  origin: string;
  status: string;
  attested: boolean;
  first_seen: string;
  last_checked: string;
  last_error: string | null;
  manifest: any;
  tools: ToolInfo[];
}

export default function OriginPage() {
  const params = useParams();
  const origin = decodeURIComponent(params.origin as string);
  const [data, setData] = useState<OriginData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | false>(false);

  useEffect(() => {
    fetch(`${API_BASE}/origin/${encodeURIComponent(origin)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Origin not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [origin]);

  if (error) {
    return (
      <div className="error-card">
        <strong style={{ color: "var(--red)" }}>Error</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="muted">Loading...</p>;
  }

  const encodedOrigin = encodeURIComponent(data.origin);
  const badgeUrl = `${API_BASE}/badge?origin=${encodedOrigin}`;
  const shieldsUrl = `https://img.shields.io/badge/WebMCP-${data.status}-${data.status === "verified" ? "brightgreen" : data.status === "invalid" ? "red" : "gray"}`;
  const registryUrl = "https://www.webmcpregistry.org";
  const markdownSnippet = `[![WebMCP ${data.status}](${shieldsUrl})](${registryUrl})`;
  const htmlSnippet = `<a href="${registryUrl}"><img src="${shieldsUrl}" alt="WebMCP ${data.status}" /></a>`;

  function copySnippet(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.3rem", wordBreak: "break-all" }}>{data.origin}</h1>
        <span className={`status status-${data.status}`}>{data.status}</span>
        {data.attested && <span className="status status-verified">attested</span>}
      </div>
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--accent), transparent)", marginBottom: "1.5rem" }} />

      {data.last_error && (
        <div className="error-card" style={{ marginBottom: "1rem" }}>
          <strong style={{ color: "var(--red)", display: "block", marginBottom: "0.3rem" }}>Last Error</strong>
          <p>{data.last_error}</p>
        </div>
      )}

      <div className="card">
        <p className="section-title">Info</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
          <span className="muted">First seen</span>
          <span>{new Date(data.first_seen).toLocaleDateString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
          <span className="muted">Last checked</span>
          <span>{new Date(data.last_checked).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Badge */}
      <div className="card">
        <p className="section-title">Badge</p>
        <div style={{ marginBottom: "1rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shieldsUrl} alt={`WebMCP ${data.status}`} />
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Markdown</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <pre style={{ flex: 1, margin: 0, fontSize: "0.78rem", overflow: "auto" }}>
            <code>{markdownSnippet}</code>
          </pre>
          <button onClick={() => copySnippet(markdownSnippet, "md")} style={{ whiteSpace: "nowrap", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
            {copied === "md" ? "Copied!" : "Copy"}
          </button>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>HTML</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <pre style={{ flex: 1, margin: 0, fontSize: "0.78rem", overflow: "auto" }}>
            <code>{htmlSnippet}</code>
          </pre>
          <button onClick={() => copySnippet(htmlSnippet, "html")} style={{ whiteSpace: "nowrap", fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
            {copied === "html" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Tools */}
      <p className="section-title" style={{ marginTop: "1.5rem" }}>
        Tools ({data.tools.length})
      </p>
      {data.tools.map((t) => (
        <div key={t.name} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <strong>{t.name}</strong>
            <span className={`status risk-${t.risk_level}`} style={{ background: "transparent" }}>
              {t.risk_level}
            </span>
          </div>
          <p className="muted" style={{ marginBottom: "0.5rem" }}>{t.description}</p>
          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", color: "var(--text-dim)", flexWrap: "wrap" }}>
            <span>v{t.version}</span>
            {t.requires_user_confirm && (
              <span style={{ color: "var(--amber)" }}>Requires confirm</span>
            )}
            {t.tags.map((tag) => (
              <span key={tag} style={{ color: "var(--accent)", background: "var(--accent-bg)", padding: "1px 8px", borderRadius: "9999px" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Raw manifest */}
      {data.manifest && (
        <>
          <p className="section-title" style={{ marginTop: "1.5rem" }}>
            Raw Manifest
          </p>
          <pre>
            <code>{JSON.stringify(data.manifest, null, 2)}</code>
          </pre>
        </>
      )}
    </div>
  );
}
