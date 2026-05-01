"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  LinkIcon,
  LoaderIcon,
  ProjectorIcon,
  RefreshCwIcon,
  Unlink2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormattedDate } from "@/components/common/formatted-date";
import { MeetingListRow } from "@/components/meetings/list-row";
import {
  detectMeetingProvider,
  getMeetingProviderMeta,
} from "@/components/meetings/provider-icon";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { MicrosoftTeamsIcon } from "@/components/svgs/microsoft-teams-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { client } from "@/lib/orpc";

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
      "Sync Google Meet events from Calendar and access recordings in Drive",
    icon: <GoogleMeetIcon className="size-6" />,
  },
  zoom: {
    name: "Zoom",
    description: "Automatically import Zoom cloud recordings",
    icon: <ZoomIcon className="size-6" />,
  },
  microsoft: {
    name: "Microsoft Teams",
    description: "Import Teams meetings from your Outlook calendar",
    icon: <MicrosoftTeamsIcon className="size-6" />,
  },
};

const ALL_PROVIDERS: Provider[] = ["google", "zoom", "microsoft"];

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

  const { data: integrations = initialIntegrations } = useQuery(
    client.integration.list.queryOptions(),
  );

  const connectedByProvider = Object.fromEntries(
    integrations
      .filter((i) => i.status === "active")
      .map((i) => [i.provider, i]),
  );

  // Show success/error toast based on query params after OAuth callback
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected || error) {
      queryClient
        .invalidateQueries(client.integration.list.queryOptions())
        .then(() => router.replace("/settings/integrations"));
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

  const syncMutation = useMutation(
    client.integration.syncMeetings.mutationOptions({
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries(
          client.integration.listExternalMeetings.queryOptions({
            input: {
              integrationId: variables.integrationId,
              limit: 20,
              offset: 0,
            },
          }),
        );
      },
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {ALL_PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
          const connected = connectedByProvider[provider];

          return (
            <div
              className="flex flex-col gap-4 rounded-xl border p-4 xl:flex-row xl:items-center"
              key={provider}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{meta.name}</p>
                    {connected && (
                      <Badge className="h-5 shrink-0" variant="secondary">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {meta.description}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 xl:w-auto xl:flex-row xl:flex-wrap xl:items-center">
                {connected ? (
                  <>
                    <Button
                      className="w-full xl:w-auto"
                      disabled={syncMutation.isPending}
                      onClick={() => {
                        setSelectedIntegrationId(connected.id);
                        syncMutation.mutate({ integrationId: connected.id });
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      {syncMutation.isPending &&
                      selectedIntegrationId === connected.id ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <RefreshCwIcon className="size-4" />
                      )}
                      Sync meetings
                    </Button>
                    <Button
                      className="w-full xl:w-auto"
                      onClick={() => setSelectedIntegrationId(connected.id)}
                      size="sm"
                      variant="secondary"
                    >
                      <LinkIcon className="size-4" />
                      View meetings
                    </Button>
                    <Button
                      className="w-full xl:w-auto"
                      disabled={disconnectMutation.isPending}
                      onClick={() => {
                        setSelectedIntegrationId(connected.id);
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
                    className="w-full xl:w-auto"
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

function ExternalMeetingsList({ integrationId }: { integrationId: string }) {
  const importMutation = useMutation(
    client.integration.importRecording.mutationOptions({
      onSuccess: ({ meetingId }) => {
        window.location.href = `/meetings/${meetingId}`;
      },
    }),
  );

  const { data: meetings = [], isLoading } = useQuery(
    client.integration.listExternalMeetings.queryOptions({
      input: { integrationId, limit: 20, offset: 0 },
    }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="-mt-3 font-semibold text-lg">Imported meetings</h2>
      {meetings.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted">
              <ProjectorIcon className="size-5 text-muted-foreground" />
            </div>
            <EmptyTitle>No meetings found</EmptyTitle>
            <EmptyDescription>
              Click &ldquo;Sync meetings&rdquo; to import from your calendar.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        meetings.map((meeting) => (
          <MeetingRow
            importMutation={importMutation}
            key={meeting.id}
            meeting={meeting}
          />
        ))
      )}
    </div>
  );
}

function MeetingRow({
  meeting,
  importMutation,
}: {
  meeting: ExternalMeeting;
  importMutation: ReturnType<
    typeof useMutation<
      { meetingId: string },
      Error,
      { externalMeetingId: string }
    >
  >;
}) {
  const isImporting =
    importMutation.isPending &&
    importMutation.variables?.externalMeetingId === meeting.id;
  const resolvedProvider = detectMeetingProvider({
    provider: meeting.provider,
    meetingUrl: meeting.joinUrl,
  });
  const providerMeta = getMeetingProviderMeta(resolvedProvider);

  const statusColor: Record<string, string> = {
    imported: "secondary",
    recording_available: "default",
    processing: "secondary",
    completed: "secondary",
    failed: "destructive",
    no_recording: "outline",
  };

  const statusLabel: Record<string, string> = {
    imported: "Imported",
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
          {(meeting.status === "recording_available" ||
            meeting.status === "imported") && (
            <Button
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
          {providerMeta?.label && ` · ${providerMeta.label}`}
        </>
      }
      title={meeting.title}
      trailing={
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Badge
            className="shrink-0"
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
