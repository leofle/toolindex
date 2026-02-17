# ToolIndex — WebMCP Manifest Registry

A minimal registry and directory for discovering and verifying [WebMCP](https://webmcp.org) tool manifests.

## Architecture

```
toolindex/
├── apps/
│   ├── api/          # Fastify API server (port 4000)
│   ├── web/          # Next.js App Router UI (port 3000)
│   └── mock-origin/  # Mock server for testing (port 5555)
├── packages/
│   ├── spec/         # WebMCP v0.1 JSON Schema + TS types + examples
│   └── validator/    # Manifest validation against schema
```

## Setup

```bash
pnpm install
pnpm build

# Initialize the database
cd apps/api
npx prisma db push
cd ../..

# Seed with demo data
pnpm db:seed
```

## Development

```bash
# Start all services (API + Web)
pnpm dev

# Or start individually
pnpm dev:api   # Fastify on http://localhost:4000
pnpm dev:web   # Next.js on http://localhost:3000
```

### Mock origin (for testing submit flow)

```bash
pnpm --filter @toolindex/mock-origin dev
# Serves a manifest on http://localhost:5555/.well-known/webmcp.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/submit` | Submit an origin for validation. Body: `{ "origin": "https://example.com" }` |
| `GET` | `/search?q=term` | Search by origin, tool name, or tag |
| `GET` | `/origin/:origin` | Get stored manifest, status, and tools for an origin |
| `GET` | `/verify?origin=...` | Check verification status of an origin |
| `GET` | `/badge?origin=...` | SVG status badge (verified/invalid/stale) |

## WebMCP Manifest Spec v0.1

Origins serve a manifest at `/.well-known/webmcp.json`:

```json
{
  "manifest_version": "0.1",
  "origin": "https://example.com",
  "updated_at": "2025-01-01T00:00:00Z",
  "tools": [
    {
      "name": "search_docs",
      "description": "Search documentation",
      "version": "1.0.0",
      "tags": ["search"],
      "risk_level": "low",
      "requires_user_confirm": false,
      "input_schema": { "type": "object", "properties": {} },
      "output_schema": { "type": "object", "properties": {} },
      "pricing": { "model": "free" }
    }
  ],
  "auth": {
    "requires_login": false
  }
}
```

See `packages/spec/examples/` for full examples.

## Embedding a Badge

```html
<img src="http://localhost:4000/badge?origin=https://example.com" alt="WebMCP status" />
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` (api) / `3000` (web) | Server port |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path (apps/api) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API base URL for web client |
| `WEB_ORIGIN` | `http://localhost:3000` | Allowed CORS origin for API |

## Full Flow

1. Submit: `curl -X POST http://localhost:4000/submit -H 'Content-Type: application/json' -d '{"origin":"http://localhost:5555"}'`
2. Search: `curl http://localhost:4000/search?q=product`
3. View: `curl http://localhost:4000/origin/http%3A%2F%2Flocalhost%3A5555`
4. Badge: open `http://localhost:4000/badge?origin=http://localhost:5555` in browser
5. Web UI: open `http://localhost:3000` in browser
