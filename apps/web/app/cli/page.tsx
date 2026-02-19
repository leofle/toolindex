export default function CLIPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        WebMCP CLI
      </h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Validate manifests, publish origins, and check status — from your
        terminal.
      </p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p className="section-title">Install</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Run commands directly with <code>npx</code> — no install needed:
        </p>
        <pre style={{ fontSize: "0.78rem" }}>
          <code>npx webmcpreg --help</code>
        </pre>
        <p
          style={{
            fontSize: "0.9rem",
            marginTop: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          Or install globally:
        </p>
        <pre style={{ fontSize: "0.78rem" }}>
          <code>npm install -g webmcpreg</code>
        </pre>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p className="section-title">Install via Homebrew</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          On macOS (or Linux with Homebrew), you can install with{" "}
          <code>brew</code>:
        </p>
        <pre style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }}>
          <code>{`brew tap nichochar/toolindex https://github.com/nichochar/toolindex
brew install webmcpreg`}</code>
        </pre>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p className="section-title">Validate a manifest</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Validate a local file or a remote URL. Defaults to{" "}
          <code>.well-known/webmcp.json</code> in the current directory.
        </p>
        <pre style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }}>
          <code>{`# Validate a local file
webmcpreg validate .well-known/webmcp.json

# Validate from a URL
webmcpreg validate https://example.com/.well-known/webmcp.json

# Default: validates .well-known/webmcp.json in cwd
webmcpreg validate`}</code>
        </pre>
        <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
          Exit code 0 on success, 1 on failure — CI-friendly.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p className="section-title">Publish to registry</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Submit your origin to the Web MCP Registry. The registry will fetch
          and validate your manifest automatically.
        </p>
        <pre style={{ fontSize: "0.78rem" }}>
          <code>webmcpreg publish https://example.com</code>
        </pre>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <p className="section-title">Check status</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Check whether an origin is registered and its current verification
          status.
        </p>
        <pre style={{ fontSize: "0.78rem" }}>
          <code>webmcpreg check https://example.com</code>
        </pre>
      </div>

      <div className="card">
        <p className="section-title">CI Integration</p>
        <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Add manifest validation to your CI pipeline to catch issues before
          deploying:
        </p>
        <pre style={{ fontSize: "0.78rem" }}>
          <code>{`# GitHub Actions example
- name: Validate WebMCP manifest
  run: npx webmcpreg validate .well-known/webmcp.json`}</code>
        </pre>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-dim)",
            marginTop: "0.75rem",
          }}
        >
          The CLI returns a non-zero exit code on validation failure, so your CI
          pipeline will fail if the manifest is invalid.
        </p>
      </div>
    </div>
  );
}
