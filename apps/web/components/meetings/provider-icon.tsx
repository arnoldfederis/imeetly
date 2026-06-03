"use client";

import { FileAudioIcon, FileTextIcon, FileVideoIcon } from "lucide-react";
import { GoogleMeetIcon } from "@/components/svgs/google-meet-icon";
import { ZoomIcon } from "@/components/svgs/zoom-icon";

export type MeetingProvider = string | null | undefined;
type MeetingSourceType = "text" | "audio" | "video" | string;

const PROVIDER_META = {
  google: {
    label: "Google Meet",
    icon: <GoogleMeetIcon className="size-6" />,
  },
  zoom: {
    label: "Zoom",
    icon: <ZoomIcon className="size-6" />,
  },
} as const;

export function getMeetingProviderMeta(provider: MeetingProvider) {
  if (!provider) return null;
  if (!(provider in PROVIDER_META)) return null;
  return PROVIDER_META[provider as keyof typeof PROVIDER_META];
}

export function detectMeetingProvider(input: {
  provider?: MeetingProvider;
  meetingUrl?: string | null;
}) {
  const normalizedProvider = input.provider?.toLowerCase();
  const explicitProvider = getMeetingProviderMeta(normalizedProvider);
  if (explicitProvider) return normalizedProvider;

  const meetingUrl = input.meetingUrl?.toLowerCase();
  if (!meetingUrl) return null;
  if (meetingUrl.includes("meet.google.com")) return "google";
  if (meetingUrl.includes("zoom.us")) return "zoom";

  return null;
}

export function MeetingProviderIcon({
  provider,
  meetingUrl,
  sourceType,
}: {
  provider: MeetingProvider;
  meetingUrl?: string | null;
  sourceType?: MeetingSourceType;
}) {
  const meta = getMeetingProviderMeta(
    detectMeetingProvider({ provider, meetingUrl }),
  );

  if (meta) {
    return meta.icon;
  }

  if (sourceType === "video") {
    return <FileVideoIcon className="size-5 font-bold text-primary" />;
  }

  if (sourceType === "audio") {
    return <FileAudioIcon className="size-5 font-bold text-primary" />;
  }

  return <FileTextIcon className="size-5 font-bold text-primary" />;
}
