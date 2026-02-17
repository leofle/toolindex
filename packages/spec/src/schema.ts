export const webmcpSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "WebMCP Manifest v0.1",
  type: "object",
  required: ["manifest_version", "origin", "updated_at", "tools"],
  additionalProperties: false,
  properties: {
    manifest_version: {
      type: "string",
      enum: ["0.1"],
    },
    origin: {
      type: "string",
      pattern: "^https?://",
    },
    updated_at: {
      type: "string",
      format: "date-time",
    },
    tools: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: [
          "name",
          "description",
          "version",
          "tags",
          "risk_level",
          "requires_user_confirm",
          "input_schema",
          "output_schema",
        ],
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            pattern: "^[a-z][a-z0-9_]*$",
          },
          description: { type: "string", minLength: 1 },
          version: { type: "string", minLength: 1 },
          tags: {
            type: "array",
            items: { type: "string" },
          },
          risk_level: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          requires_user_confirm: { type: "boolean" },
          input_schema: { type: "object" },
          output_schema: { type: "object" },
          pricing: {
            type: "object",
            required: ["model"],
            additionalProperties: false,
            properties: {
              model: {
                type: "string",
                enum: ["free", "per_call", "subscription"],
              },
              price_usd: { type: "number", minimum: 0 },
              notes: { type: "string" },
            },
          },
        },
      },
    },
    auth: {
      type: "object",
      required: ["requires_login"],
      additionalProperties: false,
      properties: {
        requires_login: { type: "boolean" },
        oauth_scopes: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
    attestation: {
      type: "object",
      required: ["algo", "public_key_jwk", "signature", "signed_fields"],
      additionalProperties: false,
      properties: {
        algo: { type: "string", enum: ["ed25519"] },
        public_key_jwk: { type: "object" },
        signature: { type: "string" },
        signed_fields: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
} as const;
