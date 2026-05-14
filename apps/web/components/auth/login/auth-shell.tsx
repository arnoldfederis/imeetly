import { env } from "@repo/env";
import Image from "next/image";
import { LoginVisual } from "@/components/auth/login/login-visual";
import { ThemeSwitcher } from "@/components/common/theme-switcher";

const siteUrl = (() => {
  const candidates = [env.APP_BASE_URL, env.NEXT_PUBLIC_APP_BASE_URL];

  for (const value of candidates) {
    if (!value) continue;

    try {
      const url = new URL(value);
      const parts = url.hostname.split(".");
      url.hostname = parts.slice(-2).join(".");
      return url.origin;
    } catch {}
  }

  return "/";
})();

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 bg-linear-to-br from-background via-background to-primary/5 p-6 md:p-10 dark:to-primary/10">
        <div className="flex items-center justify-between">
          <a
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
            href={siteUrl}
          >
            <Image
              alt="imeetly"
              className="size-6"
              height={24}
              loading={"eager"}
              src="/imeetly-transparent.png"
              width={24}
            />
            imeetly
          </a>
          <ThemeSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="hidden lg:block">
        <LoginVisual />
      </div>
    </div>
  );
}
