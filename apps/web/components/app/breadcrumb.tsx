"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { client } from "@/lib/orpc";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(segment: string) {
  return UUID_RE.test(segment);
}

function formatSegment(segment: string): string {
  if (segment === "memory") return "imeetly Memory";
  if (segment === "action-items") return "Action Items";
  if (segment === "settings") return "Settings";
  if (segment === "meetings") return "Meetings";
  return segment;
}

function useDynamicLabel(segments: string[], index: number): string | null {
  const segment = segments[index];
  const parent = segments[index - 1];
  const isMeetingId = isUUID(segment) && parent === "meetings";
  const isThreadId = isUUID(segment) && parent === "memory";
  const isFeedbacks = isUUID(segment) && parent === "feedbacks";

  const { data: meeting } = useQuery({
    ...client.meeting.getById.queryOptions({ input: { id: segment } }),
    enabled: isMeetingId,
    staleTime: 60_000,
  });

  const { data: thread } = useQuery({
    ...client.memory.getThread.queryOptions({ input: { threadId: segment } }),
    enabled: isThreadId,
    staleTime: 60_000,
  });

  if (isMeetingId) return meeting?.title ?? null;
  if (isThreadId) return thread?.thread.title ?? null;
  if (isFeedbacks) return "Feedbacks Details";
  return null;
}

function BreadcrumbSegment({
  segments,
  index,
  href,
  isLast,
}: {
  segments: string[];
  index: number;
  href: string;
  isLast: boolean;
}) {
  const segment = segments[index];
  const dynamic = useDynamicLabel(segments, index);
  const label = dynamic ?? (isUUID(segment) ? "" : formatSegment(segment));

  if (isLast) {
    return (
      <BreadcrumbPage className="line-clamp-1 capitalize">
        {label}
      </BreadcrumbPage>
    );
  }

  return (
    <BreadcrumbLink className="capitalize" href={href}>
      {label}
    </BreadcrumbLink>
  );
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((s) => s);

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  if (segments.length === 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize">
              {formatSegment(segments[0])}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, i) => {
          const href = `/${segments.slice(0, i + 1).join("/")}`;
          const isLast = i === segments.length - 1;
          return (
            <Fragment key={`${segment}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbSegment
                  href={href}
                  index={i}
                  isLast={isLast}
                  segments={segments}
                />
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
