"use client";

import { env } from "@repo/env";

const siteUrl = env.NEXT_PUBLIC_APP_BASE_URL.replace("app.", "");

interface Props {
  type: "signIn" | "signUp";
}

export function PolicyTermsLinks({ type }: Props) {
  const label = {
    signIn: "signing in",
    signUp: "signing up",
  };

  return (
    <div className="text-muted-foreground text-xs">
      By {label[type]}, you accept imeetly{" "}
      <a
        className="font-bold underline"
        href={`${siteUrl}/privacy`}
        rel="noopener"
        target="_blank"
      >
        privacy policy
      </a>{" "}
      and{" "}
      <a
        className="font-bold underline"
        href={`${siteUrl}/terms`}
        rel="noopener"
        target="_blank"
      >
        terms of service
      </a>
    </div>
  );
}
