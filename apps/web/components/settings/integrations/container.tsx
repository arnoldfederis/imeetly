"use client";

import { useMutation, type UseMutationResult, useQuery, useQueryClient, } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  FileVideoIcon,
  FolderOpenIcon,
  InfoIcon,
  LinkIcon,
  LoaderIcon,
  ProjectorIcon,
  RefreshCwIcon,
  Unlink2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FormattedDate } from "@/components/common/formatted-date";
import { MeetingListRow } from "@/components/meetings/list-row";
import { detectMeetingProvider, getMeetingProviderMeta, } from "@/components/meetings/provider-icon";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle, } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";
import { useGoogleDrivePicker } from "./google-drive-picker";

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

type SelectedDriveFile = {
  id: string;
  name: string;
};

type Provider = "google" | "zoom" | "microsoft";

const PROVIDER_META: Record<
  Provider,
  { name: string; description: string; icon: React.ReactNode }
> = {
  google: {
    name: "Google Meet",
    description:
      "Sync Google Meet calendar events, then select a Drive recording to import",
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
          router.replace("/settings/integrations");
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
                  {provider === "microsoft" && !connected && (
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      Enterprise accounts may require{" "}
                      <a
                        className="underline underline-offset-2 hover:text-foreground"
                        href="mailto:support@imeetly.app?subject=MS%20Teams%20enterprise%20setup"
                        rel="noopener noreferrer"
                      >
                        admin approval
                      </a>
                      .
                    </p>
                  )}
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
          <ExternalMeetingsList
            integrationId={selectedIntegrationId}
            isSyncing={syncMutation.isPending}
          />
        </>
      )}
    </div>
  );
}

function GoogleDriveImportDialog({
  meeting,
  open,
  onOpenChange,
  selectedDriveFile,
  pickerError,
  isOpeningPicker,
  isImporting,
  onChooseDriveFile,
  onImport,
}: {
  meeting: ExternalMeeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDriveFile: SelectedDriveFile | null;
  pickerError: string | null;
  isOpeningPicker: boolean;
  isImporting: boolean;
  onChooseDriveFile: () => void;
  onImport: () => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Google Meet recording</DialogTitle>
          <DialogDescription>
            {meeting?.title ?? "Choose a Drive recording for this meeting."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {pickerError && (
            <Alert variant="destructive">
              <InfoIcon />
              <AlertTitle>Google Picker could not open</AlertTitle>
              <AlertDescription>
                {pickerError === "Google Picker is not configured"
                  ? "Missing NEXT_PUBLIC_GOOGLE_PICKER_API_KEY or NEXT_PUBLIC_GOOGLE_PICKER_APP_ID."
                  : pickerError}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <InfoIcon />
            <AlertTitle>Drive access</AlertTitle>
            <AlertDescription>
              Google Drive grants imeetly access only to the recording you pick
              in the Google file chooser.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3 rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <FileVideoIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {selectedDriveFile?.name ?? "No recording selected"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selectedDriveFile
                    ? "Ready to import from Google Drive"
                    : "Supported files include MP4, WebM, M4A, and MP3."}
                </p>
              </div>
            </div>

            <Button
              disabled={isOpeningPicker || isImporting}
              onClick={onChooseDriveFile}
              variant="secondary"
            >
              {isOpeningPicker ? (
                <LoaderIcon className="animate-spin" data-icon="inline-start" />
              ) : (
                <FolderOpenIcon data-icon="inline-start" />
              )}
              Choose from Google Drive
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!selectedDriveFile || isImporting}
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

function ExternalMeetingsList({
  integrationId,
  isSyncing,
}: {
  integrationId: string;
  isSyncing: boolean;
}) {
  const { openPicker } = useGoogleDrivePicker();
  const [driveImportMeeting, setDriveImportMeeting] =
    useState<ExternalMeeting | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] =
    useState<SelectedDriveFile | null>(null);
  const [isOpeningDrivePicker, setIsOpeningDrivePicker] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const importMutation = useMutation(
    client.integration.importRecording.mutationOptions({
      onSuccess: ({ meetingId }) => {
        window.location.href = `/meetings/${meetingId}`;
      },
    }),
  );

  const getAccessTokenMutation = useMutation(
    client.integration.getGoogleAccessToken.mutationOptions(),
  );

  const importDriveMutation = useMutation(
    client.integration.importDriveFile.mutationOptions({
      onSuccess: ({ meetingId }) => {
        window.location.href = `/meetings/${meetingId}`;
      },
      onError: () => {
        toast.error("Failed to import recording from Drive");
      },
    }),
  );

  const handleChooseDriveFile = async () => {
    try {
      setPickerError(null);
      setIsOpeningDrivePicker(true);
      const { accessToken } = await getAccessTokenMutation.mutateAsync({
        integrationId,
      });
      await openPicker(accessToken, (fileId, fileName) => {
        setSelectedDriveFile({ id: fileId, name: fileName });
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to open Drive picker";
      setPickerError(message);
      toast.error("Failed to open Drive picker", {
        description:
          message === "Google Picker is not configured"
            ? "Set NEXT_PUBLIC_GOOGLE_PICKER_API_KEY and NEXT_PUBLIC_GOOGLE_PICKER_APP_ID."
            : "Please try again.",
      });
    } finally {
      setIsOpeningDrivePicker(false);
    }
  };

  const handleImportSelectedDriveFile = () => {
    if (!driveImportMeeting || !selectedDriveFile) return;
    importDriveMutation.mutate({
      externalMeetingId: driveImportMeeting.id,
      driveFileId: selectedDriveFile.id,
    });
  };

  const handleDriveDialogOpenChange = (open: boolean) => {
    if (importDriveMutation.isPending) return;
    if (!open) {
      setDriveImportMeeting(null);
      setSelectedDriveFile(null);
      setPickerError(null);
    }
  };

  const { data: meetings = [], isLoading } = useQuery(
    client.integration.listExternalMeetings.queryOptions({
      input: { integrationId, limit: 20, offset: 0 },
    }),
  );

  if (isLoading || isSyncing) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="-mt-3 h-7 w-48 rounded-lg" />
        <div className="flex items-center gap-3 rounded-xl border p-4">
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-5 w-2/5 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
              </div>
              <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="-mt-3 font-semibold text-lg">Synced meetings</h2>
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
            importDriveMutation={importDriveMutation}
            importMutation={importMutation}
            key={meeting.id}
            meeting={meeting}
            onSelectFromDrive={(selectedMeeting) => {
              setDriveImportMeeting(selectedMeeting);
              setSelectedDriveFile(null);
              setPickerError(null);
            }}
          />
        ))
      )}
      <GoogleDriveImportDialog
        isImporting={importDriveMutation.isPending}
        isOpeningPicker={
          isOpeningDrivePicker || getAccessTokenMutation.isPending
        }
        meeting={driveImportMeeting}
        onChooseDriveFile={handleChooseDriveFile}
        onImport={handleImportSelectedDriveFile}
        onOpenChange={handleDriveDialogOpenChange}
        open={!!driveImportMeeting}
        pickerError={pickerError}
        selectedDriveFile={selectedDriveFile}
      />
    </div>
  );
}

function MeetingRow({
  meeting,
  importMutation,
  importDriveMutation,
  onSelectFromDrive,
}: {
  meeting: ExternalMeeting;
  importMutation: UseMutationResult<
    { meetingId: string },
    Error,
    { externalMeetingId: string }
  >;
  importDriveMutation: UseMutationResult<
    { meetingId: string },
    Error,
    { externalMeetingId: string; driveFileId: string }
  >;
  onSelectFromDrive: (meeting: ExternalMeeting) => void;
}) {
  const isImporting =
    importMutation.isPending &&
    importMutation.variables?.externalMeetingId === meeting.id;
  const isImportingDriveFile =
    importDriveMutation.isPending &&
    importDriveMutation.variables?.externalMeetingId === meeting.id;
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
                disabled={isImportingDriveFile}
                onClick={() => onSelectFromDrive(meeting)}
                size="sm"
                variant="secondary"
              >
                {isImportingDriveFile ? (
                  <LoaderIcon className="size-4 animate-spin" />
                ) : (
                  <FolderOpenIcon className="size-4" />
                )}
                Select recording
              </Button>
            )}
          {meeting.provider !== "google" &&
            (meeting.status === "recording_available" ||
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
