// Pure scoring functions — no DB imports

export interface OriginInfo {
  status: string;
  attested: boolean;
  requiresAuth: boolean;
  firstSeen: Date | string;
  lastChecked: Date | string;
  toolCount: number;
}

export interface CheckInfo {
  ok: boolean;
  latencyMs: number;
}

export interface ToolInfo {
  name: string;
  description: string;
  tags: string; // JSON array string
  riskLevel: string;
  pricingModel: string | null;
}

export interface SearchPreferences {
  risk?: string;
  pricing?: string;
}

export interface TrustBreakdown {
  verified: number;
  attested: number;
  uptime: number;
  latency: number;
  toolCount: number;
  freshness: number;
  longevity: number;
}

export interface RelevanceBreakdown {
  descriptionMatch: number;
  nameMatch: number;
  tagMatch: number;
  riskBonus: number;
  pricingBonus: number;
}

export function computeTrustScore(
  origin: OriginInfo,
  checks: CheckInfo[]
): { total: number; breakdown: TrustBreakdown } {
  // 30pts: verified status
  let verified = 0;
  if (origin.status === "verified") verified = 30;
  else if (origin.status === "stale") verified = 10;

  // 10pts: attested
  const attested = origin.attested ? 10 : 0;

  // 25pts: uptime ratio from checks
  let uptime = 0;
  if (checks.length > 0) {
    const okCount = checks.filter((c) => c.ok).length;
    uptime = Math.round((okCount / checks.length) * 25);
  }

  // 15pts: latency (linear scale, 0ms=15, >=3000ms=0)
  let latency = 0;
  if (checks.length > 0) {
    const okChecks = checks.filter((c) => c.ok);
    if (okChecks.length > 0) {
      const avgLatency =
        okChecks.reduce((sum, c) => sum + c.latencyMs, 0) / okChecks.length;
      latency = Math.round(Math.max(0, 15 * (1 - avgLatency / 3000)));
    }
  }

  // 10pts: tool count (2pts per tool, cap at 10)
  const toolCount = Math.min(10, origin.toolCount * 2);

  // 5pts: freshness (checked <24h=5, <72h=3, else 0)
  const lastChecked = new Date(origin.lastChecked);
  const hoursSinceCheck =
    (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);
  let freshness = 0;
  if (hoursSinceCheck < 24) freshness = 5;
  else if (hoursSinceCheck < 72) freshness = 3;

  // 5pts: longevity (days since firstSeen, cap at 180)
  const firstSeen = new Date(origin.firstSeen);
  const daysSinceFirst =
    (Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24);
  const longevity = Math.round(Math.min(5, (daysSinceFirst / 180) * 5));

  const breakdown: TrustBreakdown = {
    verified,
    attested,
    uptime,
    latency,
    toolCount,
    freshness,
    longevity,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total: Math.min(100, total), breakdown };
}

export function computeRelevanceScore(
  tool: ToolInfo,
  query: string,
  preferences?: SearchPreferences
): { total: number; breakdown: RelevanceBreakdown } {
  const q = query.toLowerCase().trim();

  // 40pts: description match
  let descriptionMatch = 0;
  if (q) {
    const desc = tool.description.toLowerCase();
    if (desc === q) {
      descriptionMatch = 40;
    } else if (desc.includes(q)) {
      // Partial: 20 base + up to 20 based on coverage ratio
      descriptionMatch = 20 + Math.round(20 * (q.length / desc.length));
    }
  }

  // 30pts: name match
  let nameMatch = 0;
  if (q) {
    const name = tool.name.toLowerCase();
    if (name === q) {
      nameMatch = 30;
    } else if (name.startsWith(q)) {
      nameMatch = 25;
    } else if (name.includes(q)) {
      nameMatch = 15;
    }
  }

  // 20pts: tag match
  let tagMatch = 0;
  if (q) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(tool.tags);
    } catch {
      tags = [];
    }
    const lowerTags = tags.map((t) => t.toLowerCase());
    if (lowerTags.some((t) => t === q)) {
      tagMatch = 20;
    } else if (lowerTags.some((t) => t.includes(q) || q.includes(t))) {
      tagMatch = 10;
    }
  }

  // 5pts: risk preference bonus
  let riskBonus = 0;
  if (preferences?.risk && tool.riskLevel === preferences.risk) {
    riskBonus = 5;
  }

  // 5pts: pricing preference bonus
  let pricingBonus = 0;
  if (
    preferences?.pricing &&
    tool.pricingModel &&
    tool.pricingModel === preferences.pricing
  ) {
    pricingBonus = 5;
  } else if (preferences?.pricing === "free" && !tool.pricingModel) {
    pricingBonus = 5;
  }

  const breakdown: RelevanceBreakdown = {
    descriptionMatch,
    nameMatch,
    tagMatch,
    riskBonus,
    pricingBonus,
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total: Math.min(100, total), breakdown };
}

export function combinedScore(relevance: number, trust: number): number {
  return Math.round(0.6 * relevance + 0.4 * trust);
}
