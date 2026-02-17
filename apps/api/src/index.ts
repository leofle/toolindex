import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { registerRoutes } from "./routes";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.setErrorHandler((error: any, _req, reply) => {
    app.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? "Internal server error",
    });
  });

  await registerRoutes(app);

  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
