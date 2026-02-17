import Fastify from "fastify";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });

const manifest = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../packages/spec/examples/ecommerce.json"),
    "utf-8"
  )
);

// Override origin to match localhost
manifest.origin = "http://localhost:5555";

app.get("/.well-known/webmcp.json", async (_req, reply) => {
  return reply.send(manifest);
});

app.listen({ port: 5555, host: "0.0.0.0" }).then(() => {
  console.log("Mock origin serving on http://localhost:5555");
});
