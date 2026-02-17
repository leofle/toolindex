import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { fetchAndVerify } from "@toolindex/shared";
import { renderBadge } from "./badge.js";

const app = new Hono();

app.get("/badge", async (c) => {
  const origin = c.req.query("origin");

  if (!origin) {
    return c.text("Missing required query parameter: origin", 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return c.text("Invalid origin URL", 400);
  }

  if (parsed.protocol !== "https:") {
    return c.text("Origin must use HTTPS", 400);
  }

  const result = await fetchAndVerify(origin);
  const svg = renderBadge(result.status);

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=300, s-maxage=600");
  return c.body(svg);
});

const port = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port }, () => {
  console.log(`@toolindex/api listening on http://localhost:${port}`);
});
