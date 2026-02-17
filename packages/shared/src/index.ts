export function greet(name: string): string {
  return `Hello from toolindex, ${name}!`;
}

export type {
  WebMcpManifest,
  Tool,
  Pricing,
  PricingModel,
  RiskLevel,
  Auth,
  Attestation,
  PublicKeyJwk,
  SigningAlgorithm,
  SignableField,
  JsonSchemaObject,
} from "./schema/index.js";

export { fetchAndVerify } from "./verify.js";
export type { VerificationStatus, VerificationResult } from "./verify.js";
