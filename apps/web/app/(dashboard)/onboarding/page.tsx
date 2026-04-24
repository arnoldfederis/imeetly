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
          Turn your meetings into clear, actionable notes
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Upload a recording or paste a transcript - imeetly will generate a
          summary, decisions, blockers, follow-ups and action items
          automatically.
        </p>

        <Button
          className="mt-8"
          nativeButton={false}
          render={<Link href="/meetings/new" />}
          size="lg"
        >
          <PlusIcon data-icon="inline-start" />
          Create your first meeting
        </Button>

        <p className="mt-3 text-muted-foreground text-xs">
          5 meetings per month on the free plan. No credit card required.
        </p>
      </div>

      <div className="mx-auto mt-16 grid w-full gap-8 lg:grid-cols-3">
        <StepCard
          description="Drop in an audio file, video recording, or paste your transcript. We support all major formats."
          icon={<UploadIcon className="size-5 text-primary" />}
          step="01"
          title="Upload recording or transcript"
        />
        <StepCard
          description="Our AI analyzes the full conversation and extracts summaries, decisions, blockers, follow-ups and action items."
          icon={<BrainCircuitIcon className="size-5 text-primary" />}
          step="02"
          title="AI processes your meeting"
        />
        <StepCard
          description="Get a clean summary with structured action items. Share with your team or export as needed."
          icon={<ClipboardListIcon className="size-5 text-primary" />}
          step="03"
          title="Review and take action"
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
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
