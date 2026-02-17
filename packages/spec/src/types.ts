export interface ToolPricing {
  model: "free" | "per_call" | "subscription";
  price_usd?: number;
  notes?: string;
}

export interface Tool {
  name: string;
  description: string;
  version: string;
  tags: string[];
  risk_level: "low" | "medium" | "high";
  requires_user_confirm: boolean;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  pricing?: ToolPricing;
}

export interface Auth {
  requires_login: boolean;
  oauth_scopes?: string[];
}

export interface Attestation {
  algo: "ed25519";
  public_key_jwk: Record<string, unknown>;
  signature: string;
  signed_fields: string[];
}

export interface WebMcpManifest {
  manifest_version: "0.1";
  origin: string;
  updated_at: string;
  tools: Tool[];
  auth?: Auth;
  attestation?: Attestation;
}
