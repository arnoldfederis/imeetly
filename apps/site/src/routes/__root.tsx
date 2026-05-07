import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { NotFound } from "@/components/common/not-found";
import { LandingHeader } from "@/components/landing/landing-header";
import { PosthogProvider } from "@/components/providers/posthog";
import { ThemeProvider } from "@/components/providers/theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/icons/icon-32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/icons/icon-16.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/icons/icon-128.png",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#7c3aed",
      },
      {
        name: "application-name",
        content: "imeetly",
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PosthogProvider>
          <ThemeProvider>
            <LandingHeader />
            {children}
          </ThemeProvider>
        </PosthogProvider>
        <Scripts />
      </body>
    </html>
  );
}
