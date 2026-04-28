"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MeetingProviderIcon } from "@/components/meetings/provider-icon";
import { cn } from "@/lib/utils";

type MeetingSourceType = "text" | "audio" | "video" | string;

interface MeetingListRowProps {
  title: string;
  subtitle: ReactNode;
  provider?: string | null;
  sourceType?: MeetingSourceType;
  meetingUrl?: string | null;
  href?: string;
  trailing?: ReactNode;
  actionButtons?: ReactNode;
}

function MeetingListRowContent({
  title,
  subtitle,
  provider,
  sourceType,
  meetingUrl,
  trailing,
  actionButtons,
}: Omit<MeetingListRowProps, "href">) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex w-full min-w-0 items-center justify-between gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors",
              actionButtons ? "" : "group-hover:bg-muted/70",
            )}
          >
            <MeetingProviderIcon
              meetingUrl={meetingUrl}
              provider={provider}
              sourceType={sourceType}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{title}</p>
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          </div>

          {trailing}
        </div>
      </div>
      {actionButtons ? (
        <div className="flex flex-wrap gap-2">{actionButtons}</div>
      ) : null}
    </div>
  );
}

export function MeetingListRow({ href, ...props }: MeetingListRowProps) {
  const className = `group flex items-center gap-3 rounded-xl border p-4 transition-colors ${props.actionButtons ? "" : "hover:opacity-80"}`;

  if (href) {
    return (
      <Link className={className} href={href}>
        <MeetingListRowContent {...props} />
      </Link>
    );
  }

  return (
    <div className={className}>
      <MeetingListRowContent {...props} />
    </div>
  );
}
