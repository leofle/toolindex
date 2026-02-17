import type { WebMcpManifest } from "./schema/types.js";

export type VerificationStatus = "verified" | "invalid" | "stale";

export interface VerificationResult {
  status: VerificationStatus;
  manifest?: WebMcpManifest;
  error?: string;
}

function isValidManifest(data: unknown): data is WebMcpManifest {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.manifest_version === "string" &&
    typeof obj.origin === "string" &&
    Array.isArray(obj.tools) &&
    obj.tools.length > 0 &&
    typeof obj.auth === "object" &&
    obj.auth !== null
  );
}

export async function fetchAndVerify(
  origin: string,
): Promise<VerificationResult> {
  const url = `${origin.replace(/\/+$/, "")}/.well-known/webmcp.json`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { status: "invalid", error: `Failed to fetch ${url}` };
  }

  if (!response.ok) {
    return {
      status: "invalid",
      error: `HTTP ${response.status} from ${url}`,
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { status: "invalid", error: "Response is not valid JSON" };
  }

  if (!isValidManifest(data)) {
    return {
      status: "invalid",
      error: "JSON does not conform to WebMcpManifest schema",
    };
  }

  if (data.manifest_version !== "0.1") {
    return {
      status: "stale",
      manifest: data,
      error: `Unsupported manifest_version "${data.manifest_version}", expected "0.1"`,
    };
  }

  return { status: "verified", manifest: data };
}
