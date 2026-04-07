import {
  CircleDotIcon,
  FileAudioIcon,
  FileTextIcon,
  FileVideoIcon,
} from "lucide-react";
import { FadeIn } from "@/components/common/motion";

export function ProductPreviewSection() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
            A dashboard built for clarity
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See all your meetings, action items, and insights in one clean view.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="rounded-2xl border bg-card p-1 shadow-primary/5 shadow-xl">
            <div className="rounded-xl border bg-background p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard label="Meetings This Month" value="12" />
                <StatCard label="Processing Now" value="1" />
                <StatCard label="Open Action Items" value="8" />
                <StatCard label="Completed" value="47" />
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:mt-6 sm:gap-6 lg:grid lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="rounded-xl border p-3 sm:p-4">
                    <p className="mb-1 font-medium text-sm">Recent Meetings</p>
                    <p className="mb-4 text-muted-foreground text-xs">
                      Your latest meeting uploads
                    </p>
                    <div className="space-y-2">
                      <MeetingRow
                        date="Today, 2:30 PM"
                        status="Completed"
                        title="Q4 Planning — Product Sync"
                        type="audio"
                      />
                      <MeetingRow
                        date="Yesterday, 11:00 AM"
                        status="Completed"
                        title="Design Review: Dashboard v2"
                        type="video"
                      />
                      <MeetingRow
                        date="Mon, 3:00 PM"
                        status="Completed"
                        title="Sprint Retrospective"
                        type="text"
                      />
                      <MeetingRow
                        date="Mon, 10:15 AM"
                        status="Processing"
                        title="Client Onboarding — Acme Inc"
                        type="audio"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="rounded-xl border p-3 sm:p-4">
                    <p className="mb-3 font-medium text-sm">
                      Open Action Items
                    </p>
                    <div className="space-y-2.5">
                      <ActionRow
                        meeting="Q4 Planning"
                        text="Draft API v2 migration guide"
                      />
                      <ActionRow
                        meeting="Design Review"
                        text="Finalize dashboard wireframes"
                      />
                      <ActionRow
                        meeting="Client Onboarding"
                        text="Send onboarding docs"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border p-3 sm:p-4">
                    <p className="mb-3 font-medium text-sm">Plan & Usage</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                          Pro
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Meetings / mo
                        </span>
                        <span>12 / 50</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-full w-[24%] rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3 sm:p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-xl sm:text-2xl">{value}</p>
    </div>
  );
}

function MeetingRow({
  title,
  date,
  type,
  status,
}: {
  title: string;
  date: string;
  type: "audio" | "video" | "text";
  status: string;
}) {
  const Icon =
    type === "video"
      ? FileVideoIcon
      : type === "audio"
        ? FileAudioIcon
        : FileTextIcon;

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2 sm:gap-3 sm:p-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-xs sm:text-sm">{title}</p>
        <p className="text-muted-foreground text-xs">{date}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-xs ${
          status === "Processing"
            ? "bg-primary/10 text-primary"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function ActionRow({ text, meeting }: { text: string; meeting: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CircleDotIcon className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
      <div className="min-w-0">
        <p className="truncate font-medium">{text}</p>
        <p className="truncate text-muted-foreground text-xs">{meeting}</p>
      </div>
    </div>
  );
}
