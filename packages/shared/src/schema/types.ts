// ============================================================================
// WebMCP Manifest Spec v0.1 — TypeScript Types
// Mirrors: webmcp.schema.json (JSON Schema draft 2020-12)
// ============================================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type PricingModel = "free" | "freemium" | "paid" | "per_call";

export type SigningAlgorithm = "ES256" | "RS256" | "EdDSA";

export type SignableField = "manifest_version" | "origin" | "tools" | "auth";

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface Pricing {
  /** The pricing model for invoking the tool. */
  model: PricingModel;
  /** Optional human-readable cost hint, e.g. "$0.01 per call". */
  cost_estimate?: string;
}

// ---------------------------------------------------------------------------
// Inline JSON Schema object (tool input/output shapes)
// ---------------------------------------------------------------------------

export interface JsonSchemaObject {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties?: boolean;
}

// ---------------------------------------------------------------------------
// Tool
// ---------------------------------------------------------------------------

export interface Tool {
  /**
   * Unique snake_case identifier for the tool.
   * Pattern: ^[a-z][a-z0-9_]{0,63}$
   */
  name: string;
  /** Human- and agent-readable description (1–1024 chars). */
  description: string;
  /** JSON Schema object describing the tool's input parameters. */
  input_schema: JsonSchemaObject;
  /** JSON Schema object describing the tool's successful response. */
  output_schema: JsonSchemaObject;
  /**
   * Risk tier of the tool.
   * - low: read-only / informational
   * - medium: writes data the user owns
   * - high: financial transactions or irreversible mutations
   * - critical: security-sensitive operations
   */
  risk_level: RiskLevel;
  /** When true, agents MUST present invocation to the user for approval. */
  requires_user_confirm: boolean;
  /** Cost model for invoking this tool. */
  pricing: Pricing;
  /** Freeform lowercase tags for discovery and categorization. */
  tags: string[];
  /** Semver version of this individual tool (e.g. "1.0.0"). */
  version: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface Auth {
  /** Whether invoking any tool requires an authenticated session. */
  requires_login: boolean;
  /** OAuth 2.0 scopes the agent should request. */
  oauth_scopes?: string[];
}

// ---------------------------------------------------------------------------
// Attestation (optional)
// ---------------------------------------------------------------------------

export interface PublicKeyJwk {
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  n?: string;
  e?: string;
}

export interface Attestation {
  /** Signing algorithm used. */
  algo: SigningAlgorithm;
  /** Public key in JWK (RFC 7517) format. */
  public_key_jwk: PublicKeyJwk;
  /** Base64url-encoded signature over the canonical JSON of signed_fields. */
  signature: string;
  /** Top-level manifest fields included in the signature (RFC 8785 order). */
  signed_fields: SignableField[];
}

// ---------------------------------------------------------------------------
// WebMCP Manifest (top-level)
// ---------------------------------------------------------------------------

export interface WebMcpManifest {
  /** Must be "0.1". */
  manifest_version: "0.1";
  /** Canonical HTTPS origin (must match where /.well-known/webmcp.json is served). */
  origin: string;
  /** Tools exposed by this origin. At least one required. */
  tools: Tool[];
  /** Authentication requirements for the tools. */
  auth: Auth;
  /** Optional cryptographic attestation for manifest integrity. */
  attestation?: Attestation;
}
