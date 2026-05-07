import {
  BrainCircuitIcon,
  ClipboardListIcon,
  PlusIcon,
  UploadIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Get Started" };
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <UploadIcon className="size-8 text-primary" />
        </div>

        <h1 className="mt-6 font-bold text-3xl tracking-tight">
          Never lose what happened in a meeting again
        </h1>
        <p className="mt-3 text-muted-foreground">
          Decisions, action items, and follow-ups captured automatically. Your
          entire meeting history, searchable from one place.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            nativeButton={false}
            render={<Link href="/meetings/new" />}
            size="lg"
          >
            <PlusIcon data-icon="inline-start" />
            Create your first meeting
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/settings/integrations" />}
            size="lg"
            variant="secondary"
          >
            Connect your tools
          </Button>
        </div>

        <p className="mt-3 text-muted-foreground text-xs">
          5 meetings per month on the free plan. No credit card required.
        </p>
      </div>

      <div className="mx-auto mt-16 grid w-full gap-4 xl:grid-cols-3">
        <StepCard
          description="Connect Zoom or Google Meet for automatic recording import. Link Microsoft Teams to sync your Outlook calendar and import recordings manually. Or upload audio, video, or paste a transcript directly."
          icon={<UploadIcon className="size-5 text-primary" />}
          step="01"
          title="Connect your meeting tools"
        />
        <StepCard
          description="imeetly analyzes the full conversation and extracts summaries, decisions, blockers, follow-ups, and action items."
          icon={<BrainCircuitIcon className="size-5 text-primary" />}
          step="02"
          title="AI extracts the signal"
        />
        <StepCard
          description="Review a clean summary with structured action items and follow-ups. Search your entire meeting history anytime."
          icon={<ClipboardListIcon className="size-5 text-primary" />}
          step="03"
          title="Review and follow up"
        />
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-8 transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <span className="font-bold text-primary text-sm">{step}</span>
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
