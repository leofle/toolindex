import type { VerificationStatus } from "@toolindex/shared";

const COLORS: Record<VerificationStatus, string> = {
  verified: "#22c55e",
  invalid: "#ef4444",
  stale: "#eab308",
};

const LABELS: Record<VerificationStatus, string> = {
  verified: "verified",
  invalid: "invalid",
  stale: "stale",
};

export function renderBadge(status: VerificationStatus): string {
  const color = COLORS[status];
  const label = LABELS[status];
  const leftText = "WebMCP";
  const rightText = label;

  const leftWidth = 58;
  const rightWidth = leftText.length + rightText.length > 12 ? 70 : 62;
  const totalWidth = leftWidth + rightWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${leftWidth / 2}" y="14">${leftText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">${rightText}</text>
  </g>
</svg>`;
}
