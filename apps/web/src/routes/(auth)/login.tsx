import { clientEnv } from "@repo/env";
import { createFileRoute } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { LoginContainer } from "@/components/login/container";
import { LoginVisual } from "@/components/login/login-visual";

// Derive landing page URL by stripping the app subdomain
const siteUrl = (() => {
  const url = new URL(clientEnv.VITE_APP_BASE_URL);
  const parts = url.hostname.split(".");
  url.hostname = parts.slice(-2).join(".");
  return url.origin;
})();

export const Route = createFileRoute("/(auth)/login")({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Login — imeetly" }],
  }),
});

function RouteComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 bg-gradient-to-br from-background via-background to-primary/5 p-6 dark:to-primary/10 md:p-10">
        <div className="flex items-center justify-between">
          <a
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
            href={siteUrl}
          >
            <Image
              alt="imeetly"
              className="size-6"
              height={24}
              src="/imeetly-transparent.png"
              width={24}
            />
            imeetly
          </a>
          <ThemeSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginContainer />
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <LoginVisual />
      </div>
    </div>
  );
}
