"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../api-client";

const exampleManifest = `{
  "manifest_version": "0.1",
  "origin": "https://yourdomain.com",
  "updated_at": "2025-01-01T00:00:00Z",
  "tools": [
    {
      "name": "my_tool",
      "description": "What this tool does",
      "version": "1.0.0",
      "tags": ["example"],
      "risk_level": "low",
      "requires_user_confirm": false,
      "input_schema": { "type": "object", "properties": {} },
      "output_schema": { "type": "object", "properties": {} }
    }
  ]
}`;

export default function SubmitPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin }),
      });
      const data = await res.json();

      if (data.errors?.length) {
        setError(data.errors.join("\n"));
        setLoading(false);
        return;
      }

      router.push(`/origin/${encodeURIComponent(data.origin)}`);
    } catch (err: any) {
      setError(err.message ?? "Submission failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Submit Origin
      </h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Enter an origin URL to fetch and validate its WebMCP manifest.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="https://example.com"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          required
          style={{ marginBottom: "1rem" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      <div className="card" style={{ marginTop: "2.5rem" }}>
        <p className="section-title">How to get listed</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
          Before submitting, your website needs to serve a WebMCP manifest at a
          well-known URL. Here&apos;s what to do:
        </p>

        <ol style={{ fontSize: "0.9rem", color: "var(--text-muted)", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <li>
            Create a JSON file at{" "}
            <code>https://yourdomain.com/.well-known/webmcp.json</code>
          </li>
          <li>
            The manifest must include <code>manifest_version</code>,{" "}
            <code>origin</code>, <code>updated_at</code>, and at least one tool
            in the <code>tools</code> array.
          </li>
          <li>
            Each tool needs: <code>name</code> (lowercase slug),{" "}
            <code>description</code>, <code>version</code>, <code>tags</code>,{" "}
            <code>risk_level</code> (low/medium/high),{" "}
            <code>requires_user_confirm</code>, <code>input_schema</code>, and{" "}
            <code>output_schema</code>.
          </li>
          <li>
            Make sure the file is publicly accessible and returns{" "}
            <code>Content-Type: application/json</code>.
          </li>
        </ol>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.25rem" }}>
          <p className="section-title" style={{ margin: 0 }}>
            Minimal example
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(exampleManifest);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{ fontSize: "0.78rem", padding: "0.3rem 0.8rem" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre style={{ fontSize: "0.78rem", marginTop: "0.5rem" }}>
          <code>{exampleManifest}</code>
        </pre>
      </div>

      {error && (
        <div className="error-card" style={{ marginTop: "1rem" }}>
          <strong style={{ color: "var(--red)", display: "block", marginBottom: "0.3rem" }}>
            Validation Error
          </strong>
          <pre style={{ whiteSpace: "pre-wrap", background: "transparent", border: "none", padding: 0, color: "inherit" }}>
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
