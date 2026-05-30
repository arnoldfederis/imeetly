"use client";

import { Fragment } from "react";

const audiences = [
  "Product teams",
  "Startups",
  "Agencies",
  "Founders",
  "Recruiters",
];

export function TrustBar() {
  return (
    <section className="border-b py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          <span className="mr-4 text-muted-foreground text-sm">Built for</span>
          {audiences.map((a, i) => (
            <Fragment key={a}>
              {i > 0 && <span className="select-none text-border">·</span>}
              <span className="font-medium text-foreground/70 text-sm">
                {a}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
