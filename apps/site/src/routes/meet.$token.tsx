import { createFileRoute, notFound } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  ListChecksIcon,
  UsersIcon,
} from "lucide-react";
import posthog from "posthog-js";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/ui/container";
import { seo } from "@/lib/seo";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  title: string;
  ownerName: string | null;
  dueDate: string | null;
  status: string;
}

interface MeetingSummary {
  summaryMd: string | null;
  decisionsMd: string | null;
  blockersMd: string | null;
  followupsMd: string | null;
}

interface PublicMeeting {
  id: string;
  token: string;
  title: string;
  meetingDate: string;
  participantsText: string | null;
  sourceType: string;
  status: string;
  visibility: "shared" | "public";
  summary: MeetingSummary | null;
  actionItems: ActionItem[];
}

// ── Route ─────────────────────────────────────────────────────────────────────

const SERVER_URL = import.meta.env.VITE_APP_SERVER_URL as string;

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

export const Route = createFileRoute("/meet/$token")({
  loader: async ({ params }) => {
    const res = await fetch(`${SERVER_URL}/public/meetings/${params.token}`);
    if (res.status === 404) {
      throw notFound();
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch meeting: ${res.status}`);
    }
    const meeting = (await res.json()) as PublicMeeting;
    return { ...meeting, token: params.token };
  },
  head: ({ loaderData }) => {
    const isPublic = loaderData?.visibility === "public";
    const token = loaderData?.token ?? "";

    const rawDescription = loaderData?.summary?.summaryMd
      ? stripMarkdown(loaderData.summary.summaryMd).slice(0, 160)
      : loaderData
        ? `Meeting notes, decisions, and action items from: ${loaderData.title}`
        : "View meeting notes shared via imeetly.";

    const base = seo({
      title: loaderData
        ? `${loaderData.title} - Meeting Summary`
        : "Meeting Summary",
      description: rawDescription,
      path: `/meet/${token}`,
      noindex: !isPublic,
    });

    const ogImageUrl = `https://imeetly.app/og/meet/${token}`;

    const webPageJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: loaderData?.title ?? "Meeting Summary",
      description: rawDescription,
      url: `https://imeetly.app/meet/${token}`,
      isPartOf: {
        "@type": "WebSite",
        name: "imeetly",
        url: "https://imeetly.app",
      },
    };

    const baseWithOg = {
      ...base,
      meta: [
        ...(base.meta ?? []),
        { property: "og:image", content: ogImageUrl },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImageUrl },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(webPageJsonLd),
        },
      ],
    };

    if (!isPublic) {
      return baseWithOg;
    }

    return {
      ...baseWithOg,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(webPageJsonLd),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://imeetly.app",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Meeting",
                item: `https://imeetly.app/meet/${token}`,
              },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: loaderData?.title,
            description: rawDescription,
            image: ogImageUrl,
            publisher: {
              "@type": "Organization",
              name: "imeetly",
              url: "https://imeetly.app",
              logo: {
                "@type": "ImageObject",
                url: "https://imeetly.app/imeetly-icon.svg",
              },
            },
          }),
        },
      ],
    };
  },
  component: MeetPage,
});

// ── Component ─────────────────────────────────────────────────────────────────

function MeetPage() {
  const meeting = Route.useLoaderData();

  const openCount =
    meeting.actionItems?.filter((i) => i.status !== "done").length ?? 0;
  const doneCount =
    meeting.actionItems?.filter((i) => i.status === "done").length ?? 0;

  return (
    <Container
      className="flex w-full flex-1 flex-col gap-4 p-4 pt-6"
      variant="constrainedPadded"
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
        {/* ── Meeting info card ── */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="cn-font-heading font-semibold text-xl leading-snug tracking-tight sm:text-2xl">
                {meeting.title}
              </h1>
              <MeetingStatusBadge status={meeting.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                {new Date(meeting.meetingDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {meeting.participantsText && (
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="size-3.5" />
                  {meeting.participantsText}
                </span>
              )}
              <span className="flex items-center gap-1.5 capitalize">
                {meeting.sourceType === "video" ? (
                  <FileVideoIcon className="size-3.5" />
                ) : meeting.sourceType === "audio" ? (
                  <FileAudioIcon className="size-3.5" />
                ) : (
                  <FileTextIcon className="size-3.5" />
                )}
                {meeting.sourceType}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* ── Summary sections ── */}
        {meeting.summary && (
          <div className="flex flex-col gap-4">
            <SectionCard
              content={meeting.summary.summaryMd}
              title="Summary"
              variant="summary"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard
                content={meeting.summary.decisionsMd}
                title="Key Decisions"
                variant="decisions"
              />
              <SectionCard
                content={meeting.summary.blockersMd}
                title="Blockers & Risks"
                variant="blockers"
              />
            </div>
            <SectionCard
              content={meeting.summary.followupsMd}
              title="Follow-ups"
              variant="followups"
            />
          </div>
        )}

        {/* ── Action Items ── */}
        {meeting.status === "completed" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <ListChecksIcon className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="cn-font-heading font-medium text-base leading-snug">
                      Action Items
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {openCount > 0
                        ? `${openCount} open · ${doneCount} done`
                        : doneCount > 0
                          ? `All ${doneCount} done`
                          : "No action items found"}
                    </div>
                  </div>
                </div>
                {(meeting.actionItems?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                      {openCount} open
                    </span>
                    {doneCount > 0 && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                        {doneCount} done
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!meeting.actionItems || meeting.actionItems.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground text-sm">
                  No action items were found in this meeting.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {meeting.actionItems.map((item) => (
                    <ActionItemRow item={item} key={item.id} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── CTA ── */}
        <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold text-lg">
            Never lose what happened in a meeting again
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            imeetly captures summary, decisions, action items, and follow-ups
            automatically. Start free.
          </p>
          <a
            className="mt-6 inline-flex h-10 items-center justify-center rounded-4xl bg-primary px-4 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/80"
            href={`${import.meta.env.VITE_APP_BASE_URL}/login`}
            onClick={() =>
              posthog.capture("share_page_cta_clicked", {
                meeting_id: meeting.id,
              })
            }
          >
            Try imeetly free
          </a>
          <p className="mt-3 text-muted-foreground text-xs">
            5 meetings per month, no credit card required
          </p>
        </div>

        <div className="text-center text-muted-foreground text-xs">
          Shared via{" "}
          <a className="hover:text-foreground" href="https://imeetly.app">
            <Image
              alt="imeetly icon"
              className="inline-block"
              height={20}
              src="/imeetly-icon.svg"
              width={20}
            />{" "}
            imeetly
          </a>
        </div>
      </div>
    </Container>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

type SectionVariant = "summary" | "decisions" | "blockers" | "followups";

const SECTION_CONFIG: Record<
  SectionVariant,
  {
    icon: React.ReactNode;
    borderClass: string;
    bgClass: string;
    iconBgClass: string;
    iconColorClass: string;
    emptyText: string;
  }
> = {
  summary: {
    icon: <FileTextIcon className="size-4" />,
    borderClass: "",
    bgClass: "",
    iconBgClass: "bg-primary/10",
    iconColorClass: "text-primary",
    emptyText: "No summary generated yet.",
  },
  decisions: {
    icon: <CheckCircle2Icon className="size-3.5" />,
    borderClass: "ring-emerald-500/30 dark:ring-emerald-500/50",
    bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
    emptyText: "No decisions captured.",
  },
  blockers: {
    icon: <AlertTriangleIcon className="size-3.5" />,
    borderClass: "ring-orange-500/30 dark:ring-orange-500/50",
    bgClass: "bg-orange-50/50 dark:bg-orange-950/20",
    iconBgClass: "bg-orange-500/10",
    iconColorClass: "text-orange-600 dark:text-orange-400",
    emptyText: "No blockers or risks identified.",
  },
  followups: {
    icon: <CalendarClockIcon className="size-3.5" />,
    borderClass: "ring-violet-500/30 dark:ring-violet-500/50",
    bgClass: "bg-violet-50/50 dark:bg-violet-950/20",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-600 dark:text-violet-400",
    emptyText: "No follow-ups identified.",
  },
};

function SectionCard({
  title,
  content,
  variant = "summary",
}: {
  title: string;
  content: string | null;
  variant?: SectionVariant;
}) {
  const config = SECTION_CONFIG[variant];
  const isSummary = variant === "summary";

  return (
    <Card className={`${config.borderClass} ${config.bgClass}`}>
      <CardHeader className={isSummary ? "pb-3" : undefined}>
        <div className="flex items-center gap-2.5">
          <div
            className={`flex shrink-0 items-center justify-center rounded-md ${isSummary ? "size-7" : "size-6"} ${config.iconBgClass} ${config.iconColorClass}`}
          >
            {config.icon}
          </div>
          <div
            className={`cn-font-heading font-medium leading-snug ${isSummary ? "text-base" : "font-semibold text-sm"}`}
          >
            {title}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {content ? (
          <MarkdownContent
            className={
              isSummary ? "text-base text-foreground/90 [&_p]:text-base" : ""
            }
            content={content}
          />
        ) : (
          <p className={`text-sm italic ${config.iconColorClass} opacity-60`}>
            {config.emptyText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const done = item.status === "done";
  return (
    <div
      className={`flex items-center gap-2 rounded-md border p-2 ${done ? "opacity-60" : ""}`}
    >
      <div
        className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border ${done ? "border-primary bg-primary" : "border-input"}`}
      >
        {done && <CheckIcon className="size-2.5 text-primary-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`text-xs leading-snug ${done ? "text-muted-foreground line-through" : "font-medium"}`}
        >
          {item.title}
        </span>
        {(item.ownerName || item.dueDate) && (
          <div className="mt-0.5 flex items-center gap-3 text-muted-foreground text-xs">
            {item.ownerName && (
              <span className="flex items-center gap-1">
                <UsersIcon className="size-3" />
                {item.ownerName}
              </span>
            )}
            {item.dueDate && (
              <span className="flex items-center gap-1">
                <ClockIcon className="size-3" />
                {new Date(item.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingStatusBadge({ status }: { status: string }) {
  if (status === "processing" || status === "pending") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-primary/10 px-2.5 font-medium text-primary text-xs capitalize">
        {status}
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 font-medium text-emerald-600 text-xs capitalize dark:text-emerald-400">
        {status}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-destructive/10 px-2.5 font-medium text-destructive text-xs capitalize">
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full border px-2.5 font-medium text-xs capitalize">
      {status}
    </span>
  );
}

// ── Primitive card components (mirror apps/web Card) ─────────────────────────

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-card-foreground text-sm ring-1 ring-foreground/10 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid auto-rows-min items-start gap-1 px-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-4">{children}</div>;
}

// ── Markdown renderer (matches apps/web MarkdownContent exactly) ──────────────

const mdComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={`mt-5 mb-3 font-bold text-xl first:mt-0 ${className ?? ""}`}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={`mt-4 mb-2 font-semibold text-base first:mt-0 ${className ?? ""}`}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={`mt-3 mb-2 font-semibold text-sm first:mt-0 ${className ?? ""}`}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={`mb-3 leading-relaxed last:mb-0 ${className ?? ""}`}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={`mb-3 ml-4 list-disc space-y-1 last:mb-0 ${className ?? ""}`}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={`mb-3 ml-4 list-decimal space-y-1 last:mb-0 ${className ?? ""}`}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={`leading-relaxed ${className ?? ""}`} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={`font-semibold ${className ?? ""}`} {...props} />
  ),
  em: ({ className, ...props }) => (
    <em className={`italic ${className ?? ""}`} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={`mb-3 border-muted-foreground/30 border-l-2 pl-3 text-muted-foreground italic last:mb-0 ${className ?? ""}`}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={`rounded bg-muted px-1 py-0.5 font-mono text-xs ${className ?? ""}`}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={`mb-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs last:mb-0 ${className ?? ""}`}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={`my-4 border-border ${className ?? ""}`} {...props} />
  ),
};

function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={`text-sm ${className ?? ""}`}>
      <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
    </div>
  );
}
