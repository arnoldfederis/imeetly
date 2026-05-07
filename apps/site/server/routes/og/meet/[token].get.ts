import { defineEventHandler, getRouterParam, setResponseHeader } from "h3";

interface PublicMeeting {
  title: string;
  actionItems?: Array<{ status: string }>;
  summary?: { summaryMd?: string | null } | null;
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  const SERVER_URL =
    process.env.SERVER_URL ?? process.env.VITE_APP_SERVER_URL ?? "";

  let title = "Meeting Summary";
  let actionItemCount = 0;

  if (token && SERVER_URL) {
    try {
      const res = await fetch(`${SERVER_URL}/public/meetings/${token}`);
      if (res.ok) {
        const data = (await res.json()) as PublicMeeting;
        title = data.title ?? title;
        actionItemCount =
          data.actionItems?.filter((i) => i.status !== "done").length ?? 0;
      }
    } catch {
      // fallback to defaults
    }
  }

  setResponseHeader(event, "Content-Type", "image/svg+xml");
  setResponseHeader(
    event,
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  return buildSvg(title, actionItemCount);
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars = 38): [string, string | null] {
  if (text.length <= maxChars) return [text, null];
  const breakAt = text.lastIndexOf(" ", maxChars);
  if (breakAt <= 0) return [`${text.slice(0, maxChars - 1)}…`, null];
  const line1 = text.slice(0, breakAt);
  const rest = text.slice(breakAt + 1);
  const line2 =
    rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest;
  return [line1, line2];
}

function buildSvg(title: string, actionItemCount: number): string {
  const [line1, line2] = wrapText(escapeXml(title));
  const titleY = line2 ? 280 : 310;
  const titleBlock = line2
    ? `<text x="60" y="${titleY}" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="700" fill="#f1f5f9">${line1}</text>
       <text x="60" y="${titleY + 70}" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="700" fill="#f1f5f9">${line2}</text>`
    : `<text x="60" y="${titleY}" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="700" fill="#f1f5f9">${line1}</text>`;

  const statsY = line2 ? 430 : 400;
  const statsBlock =
    actionItemCount > 0
      ? `<rect x="60" y="${statsY}" width="${actionItemCount > 9 ? 280 : 256}" height="44" rx="22" fill="#7c3aed" fill-opacity="0.18"/>
         <text x="90" y="${statsY + 30}" font-family="system-ui,-apple-system,sans-serif" font-size="22" fill="#a78bfa">${actionItemCount} open action item${actionItemCount !== 1 ? "s" : ""}</text>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="6" height="630" fill="#7c3aed"/>
  <text x="60" y="90" font-family="system-ui,-apple-system,sans-serif" font-size="34" font-weight="700" fill="#7c3aed" letter-spacing="-0.5">imeetly</text>
  <text x="60" y="180" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="500" fill="#475569" letter-spacing="2">MEETING SUMMARY</text>
  ${titleBlock}
  ${statsBlock}
  <text x="60" y="590" font-family="system-ui,-apple-system,sans-serif" font-size="22" fill="#334155">Generated with imeetly</text>
  <text x="1140" y="590" font-family="system-ui,-apple-system,sans-serif" font-size="22" fill="#475569" text-anchor="end">imeetly.app</text>
</svg>`;
}
