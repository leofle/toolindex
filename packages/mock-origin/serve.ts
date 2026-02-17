import { Hono } from "hono";
import { serve } from "@hono/node-server";

const manifest = {
  manifest_version: "0.1",
  origin: "https://localhost:4000",
  tools: [
    {
      name: "search_docs",
      description: "Search the documentation for a given query and return matching pages.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results to return" },
        },
        required: ["query"],
      },
      output_schema: {
        type: "object",
        properties: {
          results: {
            type: "array",
            description: "Matching documents",
          },
        },
        required: ["results"],
      },
      risk_level: "low",
      requires_user_confirm: false,
      pricing: { model: "free" },
      tags: ["search", "docs"],
      version: "1.0.0",
    },
    {
      name: "create_issue",
      description: "Create a new issue in the project tracker.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Issue title" },
          body: { type: "string", description: "Issue body in markdown" },
          priority: { type: "string", description: "low | medium | high" },
        },
        required: ["title"],
      },
      output_schema: {
        type: "object",
        properties: {
          id: { type: "number", description: "Created issue ID" },
          url: { type: "string", description: "URL of the new issue" },
        },
        required: ["id", "url"],
      },
      risk_level: "medium",
      requires_user_confirm: true,
      pricing: { model: "freemium", cost_estimate: "$0.01 per call" },
      tags: ["issues", "write"],
      version: "2.1.0",
    },
    {
      name: "delete_account",
      description: "Permanently delete the authenticated user's account and all associated data.",
      input_schema: {
        type: "object",
        properties: {
          confirm: { type: "boolean", description: "Must be true to proceed" },
        },
        required: ["confirm"],
      },
      output_schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
        required: ["success"],
      },
      risk_level: "critical",
      requires_user_confirm: true,
      pricing: { model: "free" },
      tags: ["account", "destructive"],
      version: "1.0.0",
    },
  ],
  auth: {
    requires_login: true,
    oauth_scopes: ["read", "write", "admin"],
  },
  attestation: {
    algo: "ES256",
    public_key_jwk: {
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
    },
    signature: "MEUCIQDGmQ2MOy4Fv7bDasB-dE3k5CbEzSLfH6x0kp1a5AJlIAIgY2gMzk3ghLI0pEGRME3LYH9tlQjAs8cCcNPCqoMSKo",
    signed_fields: ["manifest_version", "origin", "tools", "auth"],
  },
};

const app = new Hono();

app.get("/.well-known/webmcp.json", (c) => {
  return c.json(manifest);
});

const port = 4000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`Mock origin serving manifest on http://localhost:${port}`);
});
