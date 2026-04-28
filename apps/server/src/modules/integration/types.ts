export const INTEGRATION_PROVIDERS = ["google", "zoom", "microsoft"] as const;
export type IntegrationProviderType = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = [
  "active",
  "disconnected",
  "expired",
  "error",
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const EXTERNAL_MEETING_STATUSES = [
  "imported",
  "recording_available",
  "processing",
  "completed",
  "failed",
  "no_recording",
] as const;
export type ExternalMeetingStatus = (typeof EXTERNAL_MEETING_STATUSES)[number];

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
}

export interface ExternalMeeting {
  id: string;
  userId: string;
  integrationId: string;
  provider: IntegrationProviderType;
  externalMeetingId: string;
  title: string;
  startsAt: Date | null;
  endsAt: Date | null;
  joinUrl: string | null;
  recordingUrl: string | null;
  status: ExternalMeetingStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExternalRecording {
  externalMeetingId: string;
  downloadUrl: string;
  mimeType: string;
  sizeBytes: number | null;
  durationSeconds: number | null;
  expiresAt: Date | null;
}

export interface ExternalParticipant {
  id: string;
  externalMeetingId: string;
  name: string;
  email: string | null;
  role: string | null;
  metadata: Record<string, unknown>;
}

export type ExternalMeetingShape = Omit<
  ExternalMeeting,
  "id" | "userId" | "integrationId" | "createdAt" | "updatedAt"
>;

export type ExternalParticipantShape = Omit<
  ExternalParticipant,
  "id" | "externalMeetingId"
>;

export interface IMeetingIntegrationProvider {
  readonly type: IntegrationProviderType;

  getAuthorizationUrl(
    userId: string,
    redirectUri: string,
  ): Promise<{ url: string; state: string }>;

  exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{ tokens: OAuthTokens; accountId: string; accountEmail: string }>;

  refreshToken(refreshToken: string): Promise<OAuthTokens>;

  listMeetings(
    accessToken: string,
    options?: { from?: Date; to?: Date; pageToken?: string },
  ): Promise<{ meetings: ExternalMeetingShape[]; nextPageToken?: string }>;

  getMeeting(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalMeetingShape | null>;

  getRecording(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalRecording | null>;

  listParticipants(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalParticipantShape[]>;

  handleWebhook(
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<{
    eventType: string;
    externalEventId: string | null;
    data: Record<string, unknown>;
  }>;

  verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
  ): boolean;
}
