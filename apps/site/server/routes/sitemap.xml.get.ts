import { defineEventHandler, setResponseHeader } from "h3";

const SITE_URL = "https://imeetly.app";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/features", priority: "0.8", changefreq: "monthly" },
  { path: "/pricing", priority: "0.8", changefreq: "weekly" },
  { path: "/how-it-works", priority: "0.7", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/support", priority: "0.5", changefreq: "monthly" },
  { path: "/docs", priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

interface PublicMeetingEntry {
  token: string;
  updatedAt: string;
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Content-Type", "application/xml; charset=utf-8");
  setResponseHeader(
    event,
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );

  const SERVER_URL =
    process.env.SERVER_URL ?? process.env.VITE_APP_SERVER_URL ?? "";
  let publicMeetings: PublicMeetingEntry[] = [];

  if (SERVER_URL) {
    try {
      const res = await fetch(`${SERVER_URL}/public/meetings`);
      if (res.ok) {
        publicMeetings = (await res.json()) as PublicMeetingEntry[];
      }
    } catch {
      // serve sitemap without dynamic entries on error
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const staticEntries = STATIC_ROUTES.map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  ).join("\n");

  const meetingEntries = publicMeetings
    .map(
      (m) => `  <url>
    <loc>${SITE_URL}/meet/${m.token}</loc>
    <lastmod>${m.updatedAt.split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${meetingEntries}
</urlset>`;
});
