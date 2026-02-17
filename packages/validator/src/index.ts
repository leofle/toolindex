import Ajv from "ajv";
import addFormats from "ajv-formats";
import { webmcpSchema } from "@toolindex/spec";
import type { WebMcpManifest } from "@toolindex/spec";

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  manifest?: WebMcpManifest;
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate = ajv.compile(webmcpSchema);

export function validateManifest(data: unknown): ValidationResult {
  const valid = validate(data);

  if (valid) {
    return { valid: true, errors: [], manifest: data as WebMcpManifest };
  }

  const errors: ValidationError[] = (validate.errors ?? []).map((err) => ({
    path: err.instancePath || "/",
    message: err.message ?? "Unknown validation error",
  }));

  return { valid: false, errors };
}
