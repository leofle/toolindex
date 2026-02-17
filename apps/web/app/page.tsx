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
        WebMCP Registry
      </h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Discover and verify WebMCP tool manifests
      </p>

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
