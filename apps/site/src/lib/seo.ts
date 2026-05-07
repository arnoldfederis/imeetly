/**
 * SEO utilities for apps/site.
 *
 * Usage in a route head():
 *   head: () => seo({ title: "Pricing", description: "..." })
 *
 * Or for the homepage with full defaults:
 *   head: () => seo({})
 */

const SITE_NAME = "imeetly";
const SITE_URL = "https://imeetly.app";
const DEFAULT_TITLE = "The memory layer for meetings - imeetly";
const DEFAULT_DESCRIPTION =
  "Never lose what happened in a meeting again. imeetly captures decisions, action items, and follow-ups automatically and makes your entire meeting history searchable. Start free.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoOptions {
  /** Page title. Appended with " - imeetly" unless it already contains it. */
  title?: string;
  /** Meta description. Falls back to site-wide default. */
  description?: string;
  /** Canonical URL path (e.g. "/pricing"). Defaults to "/". */
  path?: string;
  /** OG image URL. Defaults to site-wide OG image. */
  ogImage?: string;
  /** Override og:type. Defaults to "website". */
  ogType?: string;
  /** Prevent indexing for this specific page. */
  noindex?: boolean;
}

export function seo(options: SeoOptions = {}) {
  const {
    title: rawTitle,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    noindex = false,
  } = options;

  const title = rawTitle
    ? rawTitle.includes(SITE_NAME)
      ? rawTitle
      : `${rawTitle} - ${SITE_NAME}`
    : DEFAULT_TITLE;

  const canonicalUrl = `${SITE_URL}${path === "/" ? "" : path}`;

  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },

    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },

    // Twitter / X
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  const links: Record<string, string>[] = [
    { rel: "canonical", href: canonicalUrl },
  ];

  return { meta, links };
}

// ── JSON-LD helpers ──────────────────────────────────────────────

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-256.png`,
    description:
      "imeetly is the memory layer for meetings. Decisions, action items, and follow-ups captured automatically. Your entire meeting history, searchable forever.",
    sameAs: [],
  };
}

export function softwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: DEFAULT_DESCRIPTION,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        name: "Free",
        description: "5 meetings per month",
      },
      {
        "@type": "Offer",
        price: "15",
        priceCurrency: "USD",
        name: "Pro (Monthly)",
        description: "50 meetings per month",
      },
      {
        "@type": "Offer",
        price: "150",
        priceCurrency: "USD",
        name: "Pro (Yearly)",
        description: "50 meetings per month - save $30/year",
      },
      {
        "@type": "Offer",
        price: "39",
        priceCurrency: "USD",
        name: "Team (Monthly)",
        description: "150 meetings per month - coming soon",
      },
      {
        "@type": "Offer",
        price: "390",
        priceCurrency: "USD",
        name: "Team (Yearly)",
        description: "150 meetings per month - coming soon",
      },
    ],
  };
}

export function webPageJsonLd({
  path,
  name,
  description,
  type = "WebPage",
}: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;

  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
