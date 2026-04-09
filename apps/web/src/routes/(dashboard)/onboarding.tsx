import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { BrainCircuitIcon, ClipboardListIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { client, server } from "@/lib/orpc";

// Runs on the server: if the user already has meetings, redirect to dashboard
// before any HTML is sent to the client.
const checkIsNewUser = createServerFn({ method: "GET" }).handler(async () => {
  const data = await server.meeting.dashboard();

  const hasMeetings =
    (data.stats?.meetingsThisMonth ?? 0) > 0 ||
    (data.stats?.completedMeetings ?? 0) > 0 ||
    (data.recent?.length ?? 0) > 0;

  if (hasMeetings) {
    throw redirect({ to: "/" });
  }
});

export const Route = createFileRoute("/(dashboard)/onboarding")({
  component: OnboardingPage,
  loader: () => checkIsNewUser(),
  head: () => ({
    meta: [{ title: "Get Started — imeetly" }],
  }),
});

function OnboardingPage() {
  const { isLoading } = useQuery({
    ...client.meeting.dashboard.queryOptions(),
    staleTime: 30_000,
  });

  if (isLoading) return <WelcomeViewSkeleton />;

  return <WelcomeView />;
}

// ── Welcome View ──

function WelcomeView() {
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
          Upload a recording or paste a transcript — imeetly will generate
          summaries, decisions, blockers, and action items automatically.
        </p>

        <Button
          className="mt-8"
          nativeButton={false}
          render={<Link to="/meetings/new" />}
          size="lg"
        >
          <UploadIcon data-icon="inline-start" />
          Upload your first meeting
        </Button>

        <p className="mt-3 text-muted-foreground text-xs">
          5 meetings per month on the free plan. No credit card required.
        </p>
      </div>

      <div className="mx-auto mt-16 grid w-full max-w-4xl gap-8 md:grid-cols-3">
        <StepCard
          description="Drop in an audio file, video recording, or paste your transcript. We support all major formats."
          icon={<UploadIcon className="size-5 text-primary" />}
          step="01"
          title="Upload recording or transcript"
        />
        <StepCard
          description="Our AI analyzes the full conversation and extracts summaries, decisions, blockers, and action items."
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

// ── Skeleton (mirrors WelcomeView layout) ──

function WelcomeViewSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex flex-col items-center gap-2 pt-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-5 w-80" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="mt-2 h-10 w-52 rounded-4xl" />
        <Skeleton className="h-3 w-56" />
      </div>

      <div className="mx-auto mt-16 grid w-full max-w-4xl gap-8 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="rounded-2xl border bg-card p-8" key={i}>
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1.5 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
