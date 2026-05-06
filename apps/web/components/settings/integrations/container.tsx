"use client";

import { env } from "@repo/env";
import {
  type UseMutationResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  LinkIcon,
  LoaderIcon,
  ProjectorIcon,
  SearchIcon,
  Unlink2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormattedDate } from "@/components/common/formatted-date";
import { MeetingListRow } from "@/components/meetings/list-row";
import { detectMeetingProvider } from "@/components/meetings/provider-icon";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { MicrosoftTeamsIcon } from "@/components/svgs/microsoft-teams-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";
import { getLandingPageUrl } from "@/lib/utils";

type Integration = {
  id: string;
  provider: string;
  providerAccountId: string;
  status: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
};

type ExternalMeeting = {
  id: string;
  title: string;
  provider: string;
  startsAt: Date | null;
  endsAt: Date | null;
  joinUrl: string | null;
  status: string;
  metadata: Record<string, unknown>;
};

type Provider = "google" | "zoom" | "microsoft";

const PROVIDER_META: Record<
  Provider,
  { name: string; description: string; icon: React.ReactNode }
> = {
  google: {
    name: "Google Meet",
    description:
      "Sync Google Calendar events, find Meet recording artifacts, and import available recordings automatically",
    icon: <GoogleMeetIcon className="size-6" />,
  },
  zoom: {
    name: "Zoom",
    description: "Automatically import Zoom cloud recordings",
    icon: <ZoomIcon className="size-6" />,
  },
  microsoft: {
    name: "Microsoft Teams",
    description:
      "Sync Outlook calendar meetings and manually import Teams recordings",
    icon: <MicrosoftTeamsIcon className="size-6" />,
  },
};

const ALL_PROVIDERS: Provider[] = ["google", "zoom", "microsoft"];
const CONTACT_URL = `${getLandingPageUrl(env.NEXT_PUBLIC_APP_BASE_URL)}/contact`;
const PAGE_SIZE = 20;

const EXTERNAL_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "imported", label: "Calendar Synced" },
  { value: "recording_available", label: "Recording Ready" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "no_recording", label: "No Recording" },
] as const;

function isProvider(value: string | null): value is Provider {
  return value === "google" || value === "zoom" || value === "microsoft";
}

interface IntegrationsContainerProps {
  initialIntegrations: Integration[];
}

export function IntegrationsContainer({
  initialIntegrations,
}: IntegrationsContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<
    string | null
  >(null);
  const providerParam = searchParams.get("provider");
  const selectedProvider = isProvider(providerParam) ? providerParam : null;

  const { data: integrations = initialIntegrations } = useQuery(
    client.integration.list.queryOptions(),
  );

  const connectedByProvider = Object.fromEntries(
    integrations
      .filter((i) => i.status === "active")
      .map((i) => [i.provider, i]),
  ) as Partial<Record<Provider, Integration>>;

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected || error) {
      queryClient
        .invalidateQueries(client.integration.list.queryOptions())
        .then(() => {
          if (connected) {
            const name =
              PROVIDER_META[connected as Provider]?.name ?? connected;
            toast.success(`${name} connected successfully`);
          } else if (error === "ms_admin_required") {
            toast.error("Admin approval required", {
              description:
                "Your organization requires an IT admin to approve this app. Contact your admin or reach out to us for enterprise setup.",
              duration: 10000,
            });
          } else if (error) {
            toast.error("Failed to connect integration", {
              description:
                "Please try again or contact support if the issue persists.",
            });
          }
          router.replace(
            connected ? `/integrations/${connected}` : "/settings/integrations",
          );
        });
    }
  }, [searchParams, queryClient, router]);

  const connectMutation = useMutation(
    client.integration.getConnectUrl.mutationOptions({
      onSuccess: (url) => {
        window.location.href = url;
      },
    }),
  );

  const disconnectMutation = useMutation(
    client.integration.disconnect.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          client.integration.list.queryOptions(),
        );
        setSelectedIntegrationId(null);
      },
    }),
  );

  useEffect(() => {
    if (!selectedProvider) return;
    const integration = integrations.find(
      (i) => i.status === "active" && i.provider === selectedProvider,
    );
    setSelectedIntegrationId(integration?.id ?? null);
  }, [integrations, selectedProvider]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {ALL_PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
          const connected = connectedByProvider[provider];

          return (
            <div
              className="grid min-w-0 gap-4 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={provider}
            >
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{meta.name}</p>
                    {connected && (
                      <Badge className="h-5 shrink-0" variant="secondary">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="break-words text-muted-foreground text-xs">
                    {meta.description}
                  </p>
                  {provider === "microsoft" && !connected && (
                    <p className="mt-0.5 break-words text-muted-foreground text-xs">
                      Enterprise accounts may require admin approval.{" "}
                      <a
                        className="underline underline-offset-2 hover:text-foreground"
                        href={CONTACT_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Contact us
                      </a>{" "}
                      for help with setup.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
                {connected ? (
                  <>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => {
                        router.replace(`/integrations/${provider}`);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <LinkIcon className="size-4" />
                      View meetings
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      disabled={disconnectMutation.isPending}
                      onClick={() => {
                        disconnectMutation.mutate({
                          integrationId: connected.id,
                        });
                      }}
                      size="sm"
                      variant="destructive"
                    >
                      <Unlink2Icon className="size-4" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full sm:w-auto"
                    disabled={connectMutation.isPending}
                    onClick={() => connectMutation.mutate({ provider })}
                    size="sm"
                  >
                    {connectMutation.isPending ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : (
                      <LinkIcon className="size-4" />
                    )}
                    Connect
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* External meetings list for selected integration */}
      {selectedIntegrationId && (
        <>
          <Separator />
          <ExternalMeetingsList integrationId={selectedIntegrationId} />
        </>
      )}
    </div>
  );
}

function GoogleMeetRecordingImportDialog({
  meeting,
  open,
  onOpenChange,
  lookup,
  lookupError,
  isSearching,
  isImporting,
  onRetry,
  onImport,
}: {
  meeting: ExternalMeeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lookup:
    | {
        status: "found" | "not_ready" | "not_found";
        message: string;
        driveFile?: { name: string; mimeType: string };
      }
    | undefined;
  lookupError: string | null;
  isSearching: boolean;
  isImporting: boolean;
  onRetry: () => void;
  onImport: () => void;
}) {
  const status = isSearching
    ? "searching"
    : isImporting
      ? "importing"
      : lookup?.status;
  const isRecordingFound = lookup?.status === "found";

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pr-10">
          <DialogTitle className="leading-6">
            Import recording from Calendar event
          </DialogTitle>
          <DialogDescription className="wrap-break-word line-clamp-2">
            {meeting?.title ?? "Find the Google Meet recording for this event."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {lookupError === "google_meet_recording_scope_missing" ? (
            <Alert variant="destructive">
              <InfoIcon />
              <AlertTitle>Google Meet recording access required</AlertTitle>
              <AlertDescription>
                Please reconnect Google Meet so imeetly can request Calendar
                event, Meet conference, and Meet recording file access.
              </AlertDescription>
            </Alert>
          ) : lookupError ? (
            <Alert variant="destructive">
              <InfoIcon />
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>
                {lookupError.includes("does not have access")
                  ? "The recording must be available to the signed-in Google account, usually the meeting organizer or someone with access to the recording."
                  : "imeetly could not check this Google Meet recording. Please try again."}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {status === "searching" || status === "importing" ? (
                  <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
                ) : isRecordingFound ? (
                  <CheckCircleIcon className="size-4 text-muted-foreground" />
                ) : (
                  <InfoIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">
                  {status === "searching"
                    ? "Searching for recording"
                    : status === "importing"
                      ? "Importing"
                      : isRecordingFound
                        ? "Recording found"
                        : "Recording not ready yet"}
                </p>
                <p className="break-words text-muted-foreground text-xs">
                  {isRecordingFound && lookup?.driveFile
                    ? lookup.driveFile.name
                    : (lookup?.message ??
                      "Meet recordings may become available after the meeting ends.")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          {!isRecordingFound && (
            <Button
              disabled={isSearching || isImporting}
              onClick={onRetry}
              variant="secondary"
            >
              {isSearching ? (
                <LoaderIcon className="animate-spin" data-icon="inline-start" />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              Retry
            </Button>
          )}
          <Button
            disabled={!isRecordingFound || isSearching || isImporting}
            onClick={onImport}
          >
            {isImporting ? (
              <LoaderIcon className="animate-spin" data-icon="inline-start" />
            ) : (
              <CheckCircleIcon data-icon="inline-start" />
            )}
            Import recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExternalMeetingsList({
  integrationId,
  showTitle = true,
  onTotalChange,
}: {
  integrationId: string;
  showTitle?: boolean;
  onTotalChange?: (total: number | null) => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [googleImportMeeting, setGoogleImportMeeting] =
    useState<ExternalMeeting | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const importMutation = useMutation(
    client.integration.importRecording.mutationOptions({
      onSuccess: ({ meetingId }) => {
        window.location.href = `/meetings/${meetingId}`;
      },
    }),
  );

  const reconnectGoogleMutation = useMutation(
    client.integration.getConnectUrl.mutationOptions({
      onSuccess: (url) => {
        window.location.href = url;
      },
    }),
  );

  const recordingLookupMutation = useMutation(
    client.integration.checkGoogleMeetRecording.mutationOptions({
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to check Google Meet recording";
        const normalizedMessage = message.includes(
          "google_meet_recording_scope_missing",
        )
          ? "google_meet_recording_scope_missing"
          : message;
        setLookupError(normalizedMessage);
        if (normalizedMessage === "google_meet_recording_scope_missing") {
          reconnectGoogleMutation.mutate({ provider: "google" });
          return;
        }
        toast.error("Failed to check Google Meet recording", {
          description: message.includes("does not have access")
            ? "The recording must be available to the signed-in Google account."
            : "Please try again.",
        });
      },
    }),
  );

  const checkGoogleRecording = (meeting: ExternalMeeting) => {
    setLookupError(null);
    recordingLookupMutation.mutate({
      integrationId,
      externalMeetingId: meeting.id,
    });
  };

  const handleImportGoogleRecording = () => {
    if (!googleImportMeeting) return;
    importMutation.mutate({ externalMeetingId: googleImportMeeting.id });
  };

  const handleGoogleDialogOpenChange = (open: boolean) => {
    if (importMutation.isPending) return;
    if (!open) {
      setGoogleImportMeeting(null);
      setLookupError(null);
      recordingLookupMutation.reset();
    }
  };

  useEffect(() => {
    if (search.trim() === "") {
      setDebouncedSearch("");
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery(
      client.integration.listExternalMeetings.infiniteOptions({
        input: (pageParam) => ({
          integrationId,
          search: debouncedSearch || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: PAGE_SIZE,
          offset: pageParam as number,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
          return loaded < lastPage.total ? loaded : undefined;
        },
      }),
    );

  useEffect(() => {
    if (search !== debouncedSearch) {
      shouldRestoreFocusRef.current =
        document.activeElement === searchInputRef.current;
      return;
    }
    if (!isFetching && shouldRestoreFocusRef.current) {
      searchInputRef.current?.focus();
      shouldRestoreFocusRef.current = false;
    }
  }, [debouncedSearch, isFetching, search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  useEffect(() => {
    if (!onTotalChange) return;
    if (isLoading) {
      onTotalChange(null);
    } else {
      onTotalChange(data?.pages[0]?.total ?? 0);
    }
  }, [isLoading, data, onTotalChange]);

  const meetings = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-hidden">
      {showTitle ? (
        <h2 className="-mt-3 font-semibold text-lg">Synced meetings</h2>
      ) : null}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            onChange={(e) => {
              const nextValue = e.target.value;
              setSearch(nextValue);
              if (nextValue.trim() === "") {
                setDebouncedSearch("");
              }
            }}
            placeholder="Search synced meetings..."
            ref={searchInputRef}
            value={search}
          />
        </InputGroup>
        <Select
          onValueChange={(v) => setStatusFilter(v ?? "all")}
          value={statusFilter}
        >
          <SelectTrigger className="w-full sm:w-50">
            <SelectValue placeholder="All Statuses">
              {
                EXTERNAL_STATUS_OPTIONS.find((s) => s.value === statusFilter)
                  ?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXTERNAL_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground text-xs">
        Search synced meeting titles, provider IDs, and join links.
      </p>

      <div className="flex min-w-0 flex-col gap-2 overflow-hidden">
        {isLoading ? (
          <ExternalMeetingListSkeleton />
        ) : meetings.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted">
                <ProjectorIcon className="size-5 text-muted-foreground" />
              </div>
              <EmptyTitle>No meetings found</EmptyTitle>
              <EmptyDescription>
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Meetings sync automatically after you connect your calendar."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          meetings.map((meeting) => (
            <MeetingRow
              importMutation={importMutation}
              key={meeting.id}
              meeting={meeting}
              onImportGoogleRecording={(selectedMeeting) => {
                setGoogleImportMeeting(selectedMeeting);
                checkGoogleRecording(selectedMeeting);
              }}
            />
          ))
        )}
        <div ref={sentinelRef} />
        {isFetching && !isLoading && (
          <div className="flex justify-center py-4">
            <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <GoogleMeetRecordingImportDialog
        isImporting={
          importMutation.isPending &&
          importMutation.variables?.externalMeetingId ===
            googleImportMeeting?.id
        }
        isSearching={
          recordingLookupMutation.isPending || reconnectGoogleMutation.isPending
        }
        lookup={recordingLookupMutation.data}
        lookupError={lookupError}
        meeting={googleImportMeeting}
        onImport={handleImportGoogleRecording}
        onOpenChange={handleGoogleDialogOpenChange}
        onRetry={() => {
          if (googleImportMeeting) checkGoogleRecording(googleImportMeeting);
        }}
        open={!!googleImportMeeting}
      />
    </div>
  );
}

function ExternalMeetingListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="flex items-center gap-3 rounded-xl border p-4" key={i}>
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-5 w-2/5 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </div>
              <Skeleton className="h-5 w-[116.233px] shrink-0 rounded-3xl" />
            </div>
            <div className="flex w-full flex-col gap-2 lg:flex-row">
              <Skeleton className="h-8 w-full rounded-4xl lg:w-[155.917px]" />
              <Skeleton className="h-8 w-full rounded-4xl lg:w-[132.433px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MeetingRow({
  meeting,
  importMutation,
  onImportGoogleRecording,
}: {
  meeting: ExternalMeeting;
  importMutation: UseMutationResult<
    { meetingId: string },
    Error,
    { externalMeetingId: string }
  >;
  onImportGoogleRecording: (meeting: ExternalMeeting) => void;
}) {
  const isImporting =
    importMutation.isPending &&
    importMutation.variables?.externalMeetingId === meeting.id;
  const resolvedProvider = detectMeetingProvider({
    provider: meeting.provider,
    meetingUrl: meeting.joinUrl,
  });

  const statusColor: Record<string, string> = {
    imported: "secondary",
    recording_available: "default",
    processing: "secondary",
    completed: "secondary",
    failed: "destructive",
    no_recording: "outline",
  };

  const statusLabel: Record<string, string> = {
    imported: meeting.provider === "google" ? "Calendar synced" : "Imported",
    recording_available: "Recording ready",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    no_recording: "No recording",
  };

  return (
    <MeetingListRow
      actionButtons={
        <>
          {meeting.provider === "google" &&
            (meeting.status === "imported" ||
              meeting.status === "no_recording" ||
              meeting.status === "failed") && (
              <Button
                className="w-full min-w-0 max-w-full shrink overflow-hidden text-ellipsis lg:w-auto"
                disabled={isImporting}
                onClick={() => onImportGoogleRecording(meeting)}
                size="sm"
                variant="secondary"
              >
                {isImporting ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <SearchIcon className="size-4" />
                )}
                Import recording
              </Button>
            )}
          {meeting.provider !== "google" &&
            (meeting.status === "recording_available" ||
              meeting.status === "imported") && (
              <Button
                className="w-full min-w-0 max-w-full shrink overflow-hidden text-ellipsis lg:w-auto"
                disabled={isImporting}
                onClick={() =>
                  importMutation.mutate({ externalMeetingId: meeting.id })
                }
                size="sm"
                variant="secondary"
              >
                {isImporting ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="size-4" />
                )}
                Import
              </Button>
            )}
          {meeting.status === "completed" &&
            typeof meeting.metadata.imeetlyMeetingId === "string" && (
              <Button
                className="w-full min-w-0 max-w-full shrink overflow-hidden text-ellipsis lg:w-auto"
                nativeButton={false}
                render={
                  <Link
                    href={`/meetings/${meeting.metadata.imeetlyMeetingId}`}
                  />
                }
                size="sm"
                variant="secondary"
              >
                View notes
              </Button>
            )}
          {meeting.joinUrl && (
            <Button
              className="w-full min-w-0 max-w-full shrink overflow-hidden text-ellipsis lg:w-auto"
              nativeButton={false}
              render={
                <Link
                  href={meeting.joinUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                />
              }
              size="sm"
              variant="secondary"
            >
              <ExternalLinkIcon className="size-4" />
              Join meeting
            </Button>
          )}
        </>
      }
      meetingUrl={meeting.joinUrl}
      provider={resolvedProvider}
      subtitle={
        <>
          {meeting.startsAt ? (
            <FormattedDate date={meeting.startsAt} />
          ) : (
            "No start time"
          )}
        </>
      }
      title={meeting.title}
      trailing={
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 md:max-w-52 md:justify-end">
          <Badge
            className="max-w-full shrink truncate"
            variant={
              (statusColor[meeting.status] ?? "secondary") as
                | "secondary"
                | "default"
                | "destructive"
                | "outline"
            }
          >
            {statusLabel[meeting.status] ?? meeting.status}
          </Badge>
        </div>
      }
    />
  );
}
