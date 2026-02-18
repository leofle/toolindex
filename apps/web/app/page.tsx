"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "./api-client";

interface SearchResult {
  origin: string;
  status: string;
  tool_count: number;
  top_tools: string[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

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
        placeholder="Search by origin, tool name, or tag..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: "1.5rem" }}
      />

      {loading && <p className="muted">Searching...</p>}

      {results.map((r) => (
        <Link
          key={r.origin}
          href={`/origin/${encodeURIComponent(r.origin)}`}
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
              <strong>{r.origin}</strong>
              <span className={`status status-${r.status}`}>{r.status}</span>
            </div>
            <p className="muted">
              {r.tool_count} tool{r.tool_count !== 1 ? "s" : ""}
              {r.top_tools.length > 0 && ` — ${r.top_tools.join(", ")}`}
            </p>
          </div>
        </Link>
      ))}

      {!loading && results.length === 0 && (
        <p className="muted" style={{ textAlign: "center", marginTop: "2rem" }}>
          No origins found.{" "}
          <Link href="/submit">Submit one</Link> to get started.
        </p>
      )}
    </div>
  );
}
