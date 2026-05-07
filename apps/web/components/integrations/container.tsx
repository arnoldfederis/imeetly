"use client";

import { env } from "@repo/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderIcon, Unlink2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalMeetingsList } from "@/components/settings/integrations/container";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { MicrosoftTeamsIcon } from "@/components/svgs/microsoft-teams-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc";
import { getLandingPageUrl } from "@/lib/utils";

type Provider = "google" | "zoom" | "microsoft";

const PROVIDER_META: Record<
  Provider,
  {
    name: string;
    description: string;
    icon: React.ReactNode;
    connectLabel: string;
  }
> = {
  google: {
    name: "Google Meet",
    description:
      "Sync Google Calendar events, find Meet recording artifacts, and import available recordings automatically",
    icon: <GoogleMeetIcon className="size-5" />,
    connectLabel: "Connect Google Meet",
  },
  zoom: {
    name: "Zoom",
    description: "Automatically import Zoom cloud recordings",
    icon: <ZoomIcon className="size-5" />,
    connectLabel: "Connect Zoom",
  },
  microsoft: {
    name: "Microsoft Teams",
    description:
      "Sync Outlook calendar meetings and manually import Teams recordings",
    icon: <MicrosoftTeamsIcon className="size-5" />,
    connectLabel: "Connect Microsoft Teams",
  },
};
const CONTACT_URL = `${getLandingPageUrl(env.NEXT_PUBLIC_APP_BASE_URL)}/contact`;

export function IntegrationProviderContainer({
  provider,
}: {
  provider: Provider;
}) {
  const meta = PROVIDER_META[provider];
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    if (error === "ms_admin_required") {
      toast.error("Admin approval required", {
        description:
          "Your organization requires an IT admin to approve this app. Contact your admin or reach out to us for enterprise setup.",
        duration: 10000,
      });
      return;
    }
    toast.error("Failed to connect integration", {
      description: "Please try again or contact support if the issue persists.",
    });
  }, [searchParams]);

  const { data: integrations = [], isLoading: isIntegrationLoading } = useQuery(
    client.integration.list.queryOptions({
      context: { cache: true },
    }),
  );

  const integration = integrations.find(
    (i) => i.status === "active" && i.provider === provider,
  );

  const connectMutation = useMutation(
    client.integration.getConnectUrl.mutationOptions({
      onSuccess: (url) => {
        window.location.href = url;
      },
    }),
  );

  if (isIntegrationLoading && integration) {
    return (
      <div className="flex flex-col gap-6">
        <ProviderHeader
          action={<DisconnectButton disabled />}
          meetingCount={null}
          meta={meta}
        />
        <ExternalMeetingListSkeleton />
      </div>
    );
  }

  if (integration) {
    return (
      <ConnectedProviderView
        connected={searchParams.get("connected") === "true"}
        integrationId={integration.id}
        meta={meta}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ProviderHeader meetingCount={0} meta={meta} />
      <Empty className="border">
        <EmptyHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted">
            {meta.icon}
          </div>
          <EmptyTitle>{meta.name} is not connected</EmptyTitle>
          <EmptyDescription>{meta.description}</EmptyDescription>
          {provider === "microsoft" && (
            <EmptyDescription>
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
            </EmptyDescription>
          )}
        </EmptyHeader>
        <Button
          className="w-full sm:w-auto"
          disabled={connectMutation.isPending}
          onClick={() => connectMutation.mutate({ provider })}
          size="sm"
          variant="secondary"
        >
          {connectMutation.isPending ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            meta.icon
          )}
          {meta.connectLabel}
        </Button>
      </Empty>
    </div>
  );
}

function ConnectedProviderView({
  connected,
  integrationId,
  meta,
}: {
  connected: boolean;
  integrationId: string;
  meta: { name: string };
}) {
  const queryClient = useQueryClient();
  const didAutoSyncRef = useRef(false);
  const [meetingsTotal, setMeetingsTotal] = useState<number | null>(null);

  const syncMutation = useMutation(
    client.integration.syncMeetings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: client.integration.listExternalMeetings.key(),
        });
      },
    }),
  );

  const disconnectMutation = useMutation(
    client.integration.disconnect.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          client.integration.list.queryOptions(),
        );
      },
    }),
  );

  useEffect(() => {
    if (didAutoSyncRef.current) return;
    didAutoSyncRef.current = true;
    if (connected) {
      toast.success(`${meta.name} connected successfully`);
    }
    syncMutation.mutate({ integrationId });
  }, [connected, integrationId, meta.name, syncMutation]);

  return (
    <div className="flex flex-col gap-6">
      <ProviderHeader
        action={
          <DisconnectButton
            disabled={disconnectMutation.isPending}
            disconnecting={disconnectMutation.isPending}
            onClick={() => disconnectMutation.mutate({ integrationId })}
          />
        }
        meetingCount={meetingsTotal}
        meta={meta}
      />
      <ExternalMeetingsList
        integrationId={integrationId}
        onTotalChange={setMeetingsTotal}
        showTitle={false}
      />
    </div>
  );
}

function DisconnectButton({
  disabled,
  disconnecting = false,
  onClick,
}: {
  disabled: boolean;
  disconnecting?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      className="w-full shrink-0 sm:w-auto"
      disabled={disabled}
      onClick={onClick}
      suppressHydrationWarning
      variant="destructive"
    >
      {disconnecting ? (
        <LoaderIcon className="size-4 animate-spin" />
      ) : (
        <Unlink2Icon className="size-4" />
      )}
      Disconnect
    </Button>
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
              <Skeleton className="h-5 w-[116.233px] shrink-0 rounded-full" />
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Skeleton className="h-8 w-full rounded-full sm:w-[155.917px]" />
              <Skeleton className="h-8 w-full rounded-full sm:w-[132.433px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProviderHeader({
  meta,
  meetingCount,
  action,
}: {
  meta: { name: string };
  meetingCount: number | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-col justify-between gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">{meta.name}</h1>
        {meetingCount === null ? (
          <Skeleton className="flex h-5 w-24 items-center justify-center" />
        ) : (
          <p className="text-muted-foreground text-sm">
            {meetingCount} meeting{meetingCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
