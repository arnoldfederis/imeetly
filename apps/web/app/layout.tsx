import "../lib/orpc.server";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RootProvider } from "@/components/providers";

const title = "Your meetings, summarized in seconds. Start free — imeetly";
const description =
  "AI meeting notes for fast-moving teams. Upload recordings or transcripts and instantly get summaries, decisions, blockers, and action items. Start free.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | imeetly",
  },
  description,
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
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
