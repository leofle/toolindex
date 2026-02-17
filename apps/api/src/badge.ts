const COLORS: Record<string, { bg: string; text: string }> = {
  verified: { bg: "#22c55e", text: "#fff" },
  invalid: { bg: "#ef4444", text: "#fff" },
  stale: { bg: "#eab308", text: "#fff" },
  unknown: { bg: "#6b7280", text: "#fff" },
};

export function renderBadge(status: string): string {
  const label = "webmcp";
  const value = status;
  const c = COLORS[status] ?? COLORS.unknown;

  const labelWidth = label.length * 7 + 12;
  const valueWidth = value.length * 7 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${c.bg}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="${c.text}" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14" fill="#fff">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" fill="${c.text}">${value}</text>
  </g>
</svg>`;
}
