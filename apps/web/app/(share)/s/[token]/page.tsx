import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
  ListChecksIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormattedDate } from "@/components/common/formatted-date";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { server } from "@/lib/orpc";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const meeting = await server.meeting.getByShareToken({ token });
  return {
    title: meeting ? `${meeting.title} - Meeting Summary` : "Meeting Summary",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const meeting = await server.meeting.getByShareToken({ token });

  if (!meeting) {
    return notFound();
  }

  const openCount =
    meeting.actionItems?.filter((i) => i.status !== "done").length ?? 0;
  const doneCount =
    meeting.actionItems?.filter((i) => i.status === "done").length ?? 0;

  return (
    <Container
      className="flex w-full flex-1 flex-col gap-4 py-8"
      variant="constrainedPadded"
    >
      <div className="flex flex-col gap-4">
        {/* Meeting info card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-semibold text-xl tracking-tight sm:text-2xl">
                {meeting.title}
              </CardTitle>
              <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-emerald-500/10 px-2.5 font-medium text-emerald-600 text-xs capitalize dark:text-emerald-400">
                completed
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                <FormattedDate date={meeting.meetingDate} />
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

        {/* Summary sections */}
        {meeting.summary && (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            {meeting.summary.summaryMd && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileTextIcon className="size-4" />
                    </div>
                    <CardTitle className="text-base">Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <MarkdownContent
                    className="text-base text-foreground/90 [&_p]:text-base"
                    content={meeting.summary.summaryMd}
                  />
                </CardContent>
              </Card>
            )}

            {/* Decisions + Blockers */}
            {(meeting.summary.decisionsMd || meeting.summary.blockersMd) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {meeting.summary.decisionsMd && (
                  <Card className="bg-emerald-50/50 ring-1 ring-emerald-500/30 dark:bg-emerald-950/20 dark:ring-emerald-500/50">
                    <CardHeader>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2Icon className="size-3.5" />
                        </div>
                        <CardTitle className="font-semibold text-sm">
                          Key Decisions
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <MarkdownContent content={meeting.summary.decisionsMd} />
                    </CardContent>
                  </Card>
                )}
                {meeting.summary.blockersMd && (
                  <Card className="bg-orange-50/50 ring-1 ring-orange-500/30 dark:bg-orange-950/20 dark:ring-orange-500/50">
                    <CardHeader>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          <AlertTriangleIcon className="size-3.5" />
                        </div>
                        <CardTitle className="font-semibold text-sm">
                          Blockers & Risks
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <MarkdownContent content={meeting.summary.blockersMd} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Follow-ups */}
            {meeting.summary.followupsMd && (
              <Card className="bg-violet-50/50 ring-1 ring-violet-500/30 dark:bg-violet-950/20 dark:ring-violet-500/50">
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <CalendarClockIcon className="size-3.5" />
                    </div>
                    <CardTitle className="font-semibold text-sm">
                      Follow-ups
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <MarkdownContent content={meeting.summary.followupsMd} />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Action Items */}
        {(meeting.actionItems?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <ListChecksIcon className="size-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Action Items</CardTitle>
                    <CardDescription>
                      {openCount > 0
                        ? `${openCount} open · ${doneCount} done`
                        : `All ${doneCount} done`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {openCount > 0 && (
                    <span className="rounded-full bg-orange-500/10 px-2 py-0.5 font-medium text-orange-600 text-xs dark:text-orange-400">
                      {openCount} open
                    </span>
                  )}
                  {doneCount > 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
                      {doneCount} done
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                {meeting.actionItems?.map((item) => {
                  const done = item.status === "done";
                  return (
                    <div
                      className={`flex items-center gap-2 rounded-md border p-2 ${done ? "opacity-60" : ""}`}
                      key={item.id}
                    >
                      <div
                        className={`flex size-3.5 shrink-0 items-center justify-center rounded-sm border ${done ? "border-primary bg-primary" : "border-input"}`}
                      >
                        {done && (
                          <CheckIcon className="size-2.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs leading-snug ${done ? "text-muted-foreground line-through" : "font-medium"}`}
                        >
                          {item.title}
                        </span>
                        {item.ownerName && (
                          <div className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                            <UsersIcon className="size-3" />
                            {item.ownerName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold text-lg">
            Never lose what happened in a meeting again
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            imeetly captures decisions, action items, and follow-ups
            automatically. Start free.
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={<Link href="https://app.imeetly.app" />}
            size="lg"
          >
            Try imeetly free
          </Button>
          <p className="mt-3 text-muted-foreground text-xs">
            5 meetings per month, no credit card required
          </p>
        </div>

        <div className="text-center text-muted-foreground text-xs">
          Shared via{" "}
          <Link
            className="underline underline-offset-2 hover:text-foreground"
            href="https://imeetly.app"
          >
            imeetly
          </Link>
        </div>
      </div>
    </Container>
  );
}
