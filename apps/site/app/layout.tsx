import type { Metadata } from "next";
import "./globals.css";
import { LandingHeader } from "@/components/landing/landing-header";
import { RootProvider } from "@/components/providers";
import { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://imeetly.app"),
  title: {
    default: "The memory layer for meetings - imeetly",
    template: "%s - imeetly",
  },
  description:
    "Never lose what happened in a meeting again. imeetly captures summary, decisions, action items, and follow-ups automatically and makes your entire meeting history searchable.",
  applicationName: "imeetly",
  authors: [{ name: "Arnolfo Laureta Federis" }],
  keywords: [
    "AI meeting notes",
    "meeting transcription",
    "meeting summarizer",
    "AI meeting assistant",
    "automatic meeting notes",
    "meeting minutes generator",
    "meeting action items",
    "meeting decisions tracker",
    "meeting recap",
    "meeting summary",
    "searchable meeting history",
    "Zoom meeting notes",
    "Google Meet notes",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/icon-128.png",
  },
  openGraph: {
    siteName: "imeetly",
    locale: "en_US",
    type: "website",
    images: [DEFAULT_OG_IMAGE_METADATA],
  },
  twitter: {
    card: "summary_large_image",
    site: "@imeetly",
    creator: "@arnoldfederis",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>
          <LandingHeader />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
