"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "./api-client";

interface ToolSearchResult {
  score: number;
  trust: { total: number; breakdown: Record<string, number> };
  relevance: { total: number; breakdown: Record<string, number> };
  tool: {
    name: string;
    description: string;
    version: string;
    tags: string[];
    risk_level: string;
    requires_user_confirm: boolean;
    pricing_model: string | null;
    pricing_price_usd: number | null;
  };
  origin: {
    origin: string;
    status: string;
    attested: boolean;
    requires_auth: boolean;
    trust_score: number;
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [pricingFilter, setPricingFilter] = useState("");
  const [authFilter, setAuthFilter] = useState("");
  const [results, setResults] = useState<ToolSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (riskFilter) params.set("risk", riskFilter);
      if (pricingFilter) params.set("pricing", pricingFilter);
      if (authFilter) params.set("auth", authFilter);
      fetch(`${API_BASE}/tools/search?${params}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, riskFilter, pricingFilter, authFilter]);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Web MCP Registry
      </h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        The public registry for{" "}
        <a href="https://spec.webmcp.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
          WebMCP
        </a>{" "}
        tool manifests
      </p>

      <div className="card" style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
          <a href="https://spec.webmcp.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>WebMCP</a> is
          an open standard that lets any website publish a machine-readable manifest of the tools it offers to AI
          agents — things like APIs, actions, and data lookups — in a single JSON file at{" "}
          <code>/.well-known/webmcp.json</code>.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
          This registry crawls, validates, and indexes those manifests so that AI agents, developers,
          and platforms can <strong>discover</strong> what tools exist across the web,{" "}
          <strong>verify</strong> they conform to the spec, and <strong>trust</strong> them with
          a verified badge.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
          Without a central registry, every agent would need to know tool URLs in advance.
          With it, any agent can search for tools by name or tag — making the web a self-describing
          toolbox for AI.
        </p>
      </div>

      <input
        type="search"
        placeholder="Search tools by name, description, or tag..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: "0.75rem" }}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
        >
          <option value="">All risk levels</option>
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>
        <select
          value={pricingFilter}
          onChange={(e) => setPricingFilter(e.target.value)}
          style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
        >
          <option value="">All pricing</option>
          <option value="free">Free</option>
          <option value="per_call">Per call</option>
          <option value="subscription">Subscription</option>
        </select>
        <select
          value={authFilter}
          onChange={(e) => setAuthFilter(e.target.value)}
          style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
        >
          <option value="">Any auth</option>
          <option value="false">No auth required</option>
          <option value="true">Auth required</option>
        </select>
      </div>

      {loading && <p className="muted">Searching...</p>}

      {results.map((r, i) => (
        <Link
          key={`${r.origin.origin}-${r.tool.name}-${i}`}
          href={`/origin/${encodeURIComponent(r.origin.origin)}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="card" style={{ cursor: "pointer" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.4rem",
              }}
            >
              <strong>{r.tool.name}</strong>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span
                  style={{
                    background: r.score >= 70 ? "var(--green)" : r.score >= 40 ? "var(--amber)" : "var(--red)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontWeight: 600,
                  }}
                >
                  {r.score}
                </span>
                <span className={`status status-${r.origin.status}`}>{r.origin.status}</span>
              </div>
            </div>
            <p className="muted" style={{ marginBottom: "0.5rem" }}>{r.tool.description}</p>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", color: "var(--text-dim)", flexWrap: "wrap" }}>
              <span className={`status risk-${r.tool.risk_level}`} style={{ background: "transparent", padding: 0, fontSize: "0.78rem" }}>
                {r.tool.risk_level}
              </span>
              {r.tool.pricing_model && (
                <span>{r.tool.pricing_model}{r.tool.pricing_price_usd != null ? ` $${r.tool.pricing_price_usd}` : ""}</span>
              )}
              {!r.tool.pricing_model && <span>free</span>}
              {r.tool.tags.map((tag) => (
                <span key={tag} style={{ color: "var(--accent)", background: "var(--accent-bg)", padding: "1px 8px", borderRadius: "9999px" }}>
                  {tag}
                </span>
              ))}
              <span className="muted" style={{ marginLeft: "auto" }}>{r.origin.origin}</span>
            </div>
          </div>
        </Link>
      ))}

      {!loading && results.length === 0 && (
        <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
          No tools found.{" "}
          <Link href="/submit">Submit an origin</Link> to get started.
        </p>
      )}
    </div>
  );
}
