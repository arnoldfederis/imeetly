import { createClientOnlyFn } from "@tanstack/react-start";
import posthog from "posthog-js";
import { useEffect } from "react";

const initPosthog = createClientOnlyFn(() => {
  const token = import.meta.env.VITE_POSTHOG_TOKEN as string | undefined;
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
    "https://us.i.posthog.com";
  if (!token || posthog.__loaded) return;
  posthog.init(token, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });
});

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPosthog();
  }, []);
  return <>{children}</>;
}
