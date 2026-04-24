import "../lib/orpc.server";
import { env } from "@repo/env";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/providers";

const title = "Your meetings, summarized in seconds. Start free - imeetly";
const description =
  "AI meeting notes for fast-moving teams. Upload recordings or transcripts and instantly get summaries, decisions, blockers, and action items. Start free.";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

function resolveMetadataBase() {
  const candidates = [env.APP_BASE_URL, env.NEXT_PUBLIC_APP_BASE_URL];

  for (const value of candidates) {
    if (!value) continue;

    try {
      return new URL(value);
    } catch {}
  }

  return new URL("http://localhost:4001");
}

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | imeetly",
  },
  description,
  metadataBase: resolveMetadataBase(),
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/icon-128.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title,
    description,
    siteName: "imeetly",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6468f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable} lang="en" suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
