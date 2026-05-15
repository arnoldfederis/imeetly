import { PlusIcon } from "lucide-react";
import { Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const EXAMPLE_PROMPTS = [
  "What decisions came out of my meetings?",
  "Show me my open action items",
  "What blockers were mentioned recently?",
  "Summarize my latest processed meeting",
];

export function DashboardSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex min-w-full flex-col justify-between gap-1 sm:min-w-0">
          <h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Your meeting memory, at a glance
          </p>
        </div>
        <Button className="w-full shrink-0 sm:w-auto" disabled>
          <PlusIcon data-icon="inline-start" />
          <span>New Meeting</span>
        </Button>
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-2.5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex justify-between gap-2 sm:items-center">
            <Skeleton className="h-5 w-56 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-10 rounded-lg" />
        </div>
        <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
          <Skeleton className="h-4 w-52 rounded-lg" />
          <Skeleton className="h-6 w-32 rounded-md" />
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col-reverse gap-4 lg:col-span-2 lg:flex-col">
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-3 w-44 rounded-lg" />
              </div>
              <Skeleton className="h-3 w-16 rounded-lg" />
            </div>
            <div className="divide-y px-4 py-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  key={i}
                >
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-14" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-5 w-60" />
              </div>
            </div>
            <Suggestions className="w-full items-center">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <Skeleton
                  className="inline-flex h-8 w-full items-center gap-1 border border-secondary px-4 font-medium text-sm"
                  key={prompt}
                >
                  <span className="opacity-0">{prompt}</span>
                </Skeleton>
              ))}
            </Suggestions>

            <Skeleton className="h-10.5 w-full" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col-reverse gap-4 lg:flex-col">
          <div className="rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="divide-y px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="flex items-start gap-2.5 py-2.5" key={i}>
                  <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-[17.5px] w-full rounded-lg" />
                    <Skeleton className="h-4 w-2/3 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center border-t px-4 py-2.5">
              <Skeleton className="h-4 w-16 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.75 rounded-xl border p-4">
              <Skeleton className="h-5 rounded-lg xl:w-24" />
              <Skeleton className="mt-0.5 h-7 w-16 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.75 rounded-xl border p-4">
              <Skeleton className="h-5 rounded-lg xl:w-24" />
              <Skeleton className="mt-0.5 h-7 w-16 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.75 rounded-xl border p-4">
              <Skeleton className="h-5 rounded-lg xl:w-24" />
              <Skeleton className="mt-0.5 h-7 w-16 rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.75 rounded-xl border p-4">
              <Skeleton className="h-5 rounded-lg xl:w-24" />
              <Skeleton className="mt-0.5 h-7 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
