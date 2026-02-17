"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../api-client";

export default function SubmitPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
