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
const DEFAULT_OG_IMAGE_ALT = "imeetly - The memory layer for meetings";
const DEFAULT_KEYWORDS =
  "AI meeting notes, meeting transcription, meeting summarizer, AI meeting assistant, automatic meeting notes, meeting minutes generator, meeting action items, meeting decisions tracker, meeting recap, meeting summary, searchable meeting history, Zoom meeting notes, Google Meet notes, Microsoft Teams notes, meeting productivity, team meeting notes, meeting memory, meeting recorder, meeting transcription software, AI note taker, meeting intelligence, action item tracker, meeting follow-up, decision tracker, meeting highlights";

interface SeoOptions {
  /** Page title. Appended with " - imeetly" unless it already contains it. */
  title?: string;
  /** Meta description. Falls back to site-wide default. */
  description?: string;
  /** Canonical URL path (e.g. "/pricing"). Defaults to "/". */
  path?: string;
  /** OG image URL. Defaults to site-wide OG image. */
  ogImage?: string;
  /** OG image alt text. */
  ogImageAlt?: string;
  /** Override og:type. Defaults to "website". */
  ogType?: string;
  /** Additional page-specific keywords appended to the global list. */
  keywords?: string[];
  /** Prevent indexing for this specific page. */
  noindex?: boolean;
  /** Page author. Defaults to "Arnolfo Laureta Federis". */
  author?: string;
}

export function seo(options: SeoOptions = {}) {
  const {
    title: rawTitle,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    ogImage = DEFAULT_OG_IMAGE,
    ogImageAlt = DEFAULT_OG_IMAGE_ALT,
    ogType = "website",
    keywords: extraKeywords = [],
    noindex = false,
    author = "Arnolfo Laureta Federis",
  } = options;

  const title = rawTitle
    ? rawTitle.includes(SITE_NAME)
      ? rawTitle
      : `${rawTitle} - ${SITE_NAME}`
    : DEFAULT_TITLE;

  const canonicalUrl = `${SITE_URL}${path === "/" ? "" : path}`;

  const keywords =
    extraKeywords.length > 0
      ? `${DEFAULT_KEYWORDS}, ${extraKeywords.join(", ")}`
      : DEFAULT_KEYWORDS;

  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },
    { name: "author", content: author },
    { name: "keywords", content: keywords },

    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:alt", content: ogImageAlt },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },

    // Twitter / X
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@imeetly" },
    { name: "twitter:creator", content: "@arnoldfederis" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: ogImageAlt },
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
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@imeetly.app",
      contactType: "customer support",
    },
    sameAs: [
      "https://x.com/imeetly",
      "https://www.producthunt.com/products/imeetly",
    ],
    founder: {
      "@type": "Person",
      name: "Arnolfo Laureta Federis",
      sameAs: [
        "https://x.com/arnoldfederis",
        "https://www.linkedin.com/in/arnoldfederis",
        "https://github.com/arnoldfederis",
      ],
    },
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
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        name: "Free",
        description: "5 meetings per month with full AI processing",
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
        description: "50 meetings per month, billed annually",
      },
      {
        "@type": "Offer",
        price: "39",
        priceCurrency: "USD",
        name: "Team (Monthly)",
        description: "150 meetings per month for teams",
      },
      {
        "@type": "Offer",
        price: "390",
        priceCurrency: "USD",
        name: "Team (Yearly)",
        description: "150 meetings per month for teams, billed annually",
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    ],
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

export function howToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
