import { randomBytes } from "node:crypto";
import { env } from "@repo/env";
import { signState } from "../encrypt";
import type {
  ExternalMeetingShape,
  ExternalParticipantShape,
  ExternalRecording,
  IMeetingIntegrationProvider,
  OAuthTokens,
} from "../types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_MEET_API = "https://meet.googleapis.com/v2";
const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/drive.meet.readonly",
].join(" ");

export const GOOGLE_MEET_RECORDING_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/drive.meet.readonly",
] as const;

export class GoogleIntegrationProvider implements IMeetingIntegrationProvider {
  readonly type = "google" as const;

  async getAuthorizationUrl(
    userId: string,
    redirectUri: string,
  ): Promise<{ url: string; state: string }> {
    const nonce = randomBytes(16).toString("hex");
    const state = signState({
      userId,
      provider: "google",
      nonce,
      iat: Date.now(),
    });
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      access_type: "offline",
      prompt: "consent select_account",
      state,
    });
    return { url: `${GOOGLE_AUTH_URL}?${params}`, state };
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{ tokens: OAuthTokens; accountId: string; accountEmail: string }> {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok)
      throw new Error(`Google token exchange failed: ${await res.text()}`);
    const data = (await res.json()) as GoogleTokenResponse;

    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = (await userRes.json()) as { sub: string; email: string };

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scopes: parseGoogleScopes(data.scope),
      },
      accountId: user.sub,
      accountEmail: user.email,
    };
  }

  async refreshToken(
    refreshToken: string,
    options?: { previousScopes?: string[] },
  ): Promise<OAuthTokens> {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok)
      throw new Error(`Google token refresh failed: ${await res.text()}`);
    const data = (await res.json()) as GoogleTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken, // Google doesn't rotate refresh tokens
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: parseGoogleScopes(data.scope, options?.previousScopes),
    };
  }

  async listMeetings(
    accessToken: string,
    options?: { from?: Date; to?: Date; pageToken?: string },
  ): Promise<{ meetings: ExternalMeetingShape[]; nextPageToken?: string }> {
    const now = new Date();
    const from =
      options?.from ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = options?.to ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
      fields:
        "nextPageToken,items(id,summary,start,end,conferenceData,attendees,htmlLink)",
    });
    if (options?.pageToken) params.set("pageToken", options.pageToken);

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);

    const data = (await res.json()) as GoogleCalendarList;
    const meetings = (data.items ?? [])
      .filter((item) => this._hasMeetLink(item))
      .map((item) => this._mapCalendarEvent(item));

    return { meetings, nextPageToken: data.nextPageToken };
  }

  async getMeeting(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalMeetingShape | null> {
    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(externalMeetingId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
    return this._mapCalendarEvent((await res.json()) as GoogleCalendarEvent);
  }

  async getRecording(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalRecording | null> {
    const lookup = await this.findMeetRecording(accessToken, externalMeetingId);
    return lookup.status === "found" ? lookup.recording : null;
  }

  async findMeetRecording(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<GoogleMeetRecordingLookupResult> {
    const event = await this._getCalendarEvent(accessToken, externalMeetingId);
    if (!event) {
      return {
        status: "not_found",
        message: "Calendar event was not found.",
      };
    }

    const meetingCode = this._getMeetCode(event);
    if (!meetingCode) {
      return {
        status: "not_found",
        message: "This calendar event does not include a Google Meet link.",
        event: this._mapCalendarEvent(event),
      };
    }

    const conferenceRecord = await this._findConferenceRecord(
      accessToken,
      meetingCode,
      event,
    );
    if (!conferenceRecord) {
      return {
        status: "not_ready",
        message:
          "No completed Google Meet conference record is available for this event yet.",
        event: this._mapCalendarEvent(event),
        meetingCode,
      };
    }

    const recordings = await this._listRecordings(
      accessToken,
      conferenceRecord.name,
    );
    if (recordings.length === 0) {
      return {
        status: "not_ready",
        message:
          "Google Meet has not published a recording artifact for this event yet.",
        event: this._mapCalendarEvent(event),
        meetingCode,
        conferenceRecord: conferenceRecord.name,
      };
    }

    const generated = recordings.find(
      (recording) =>
        recording.state === "FILE_GENERATED" &&
        Boolean(recording.driveDestination?.file),
    );
    if (!generated) {
      return {
        status: "not_ready",
        message:
          "A recording exists, but Google Meet has not finished generating the Drive file.",
        event: this._mapCalendarEvent(event),
        meetingCode,
        conferenceRecord: conferenceRecord.name,
        recordingState: recordings[0]?.state ?? null,
      };
    }

    const driveFileId = generated.driveDestination?.file;
    if (!driveFileId) {
      return {
        status: "not_ready",
        message: "Google Meet has not attached a Drive file to the recording.",
        event: this._mapCalendarEvent(event),
        meetingCode,
        conferenceRecord: conferenceRecord.name,
        recordingState: generated.state,
      };
    }

    const fileMeta = await this._getDriveFileMetadata(accessToken, driveFileId);
    const mimeType = fileMeta.mimeType ?? "video/mp4";
    const parsedSize = fileMeta.size ? Number(fileMeta.size) : Number.NaN;
    const sizeBytes = Number.isFinite(parsedSize) ? parsedSize : null;
    const parsedDurationMillis = fileMeta.videoMediaMetadata?.durationMillis
      ? Number(fileMeta.videoMediaMetadata.durationMillis)
      : Number.NaN;
    const durationSeconds = Number.isFinite(parsedDurationMillis)
      ? Math.round(parsedDurationMillis / 1000)
      : null;

    return {
      status: "found",
      message: "Recording is ready to import.",
      event: this._mapCalendarEvent(event),
      meetingCode,
      conferenceRecord: conferenceRecord.name,
      recordingName: generated.name,
      recording: {
        externalMeetingId,
        downloadUrl: `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(driveFileId)}?alt=media`,
        downloadHeaders: { Authorization: `Bearer ${accessToken}` },
        mimeType,
        sizeBytes,
        durationSeconds,
        expiresAt: null,
      },
      driveFile: {
        id: driveFileId,
        name: fileMeta.name ?? "Google Meet recording",
        mimeType,
        webViewLink: generated.driveDestination?.exportUri ?? null,
      },
    };
  }

  async listParticipants(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalParticipantShape[]> {
    const meeting = await this.getMeeting(accessToken, externalMeetingId);
    if (!meeting) return [];
    return (meeting.metadata.attendees as ExternalParticipantShape[]) ?? [];
  }

  async handleWebhook(
    _payload: unknown,
    headers: Record<string, string>,
  ): Promise<{
    eventType: string;
    externalEventId: string | null;
    data: Record<string, unknown>;
  }> {
    const channelId = headers["x-goog-channel-id"] ?? null;
    const resourceState = headers["x-goog-resource-state"] ?? null;
    const messageNumber = headers["x-goog-message-number"] ?? null;
    const resourceId = headers["x-goog-resource-id"] ?? null;
    return {
      eventType: "calendar.push",
      externalEventId:
        channelId && messageNumber ? `${channelId}:${messageNumber}` : null,
      data: { channelId, resourceState, resourceId },
    };
  }

  verifyWebhook(
    _payload: string | Buffer,
    headers: Record<string, string>,
  ): boolean {
    const secret = env.GOOGLE_WEBHOOK_SECRET;
    if (!secret) return true;
    return headers["x-goog-channel-token"] === secret;
  }

  static async registerCalendarWatch(
    accessToken: string,
    channelId: string,
    webhookUrl: string,
    token: string,
  ): Promise<{ resourceId: string; expiresAt: Date }> {
    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          token,
          params: { ttl: "604800" }, // 7 days max
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Google calendar watch registration failed: ${res.status} ${body}`,
      );
    }
    const data = (await res.json()) as {
      resourceId: string;
      expiration: string;
    };
    return {
      resourceId: data.resourceId,
      expiresAt: new Date(Number(data.expiration)),
    };
  }

  static async stopCalendarWatch(
    accessToken: string,
    channelId: string,
    resourceId: string,
  ): Promise<void> {
    await fetch(`${GOOGLE_CALENDAR_API}/channels/stop`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: channelId, resourceId }),
    });
  }

  private _hasMeetLink(event: GoogleCalendarEvent): boolean {
    return (
      event.conferenceData?.conferenceSolution?.key?.type === "hangoutsMeet" ||
      (event.conferenceData?.entryPoints ?? []).some(
        (ep) =>
          ep.entryPointType === "video" && ep.uri.includes("meet.google.com"),
      )
    );
  }

  private async _getCalendarEvent(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<GoogleCalendarEvent | null> {
    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${encodeURIComponent(externalMeetingId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error("Google account does not have access to this event");
    }
    if (!res.ok) throw new Error(`Google Calendar API error: ${res.status}`);
    return (await res.json()) as GoogleCalendarEvent;
  }

  private _getMeetUrl(event: GoogleCalendarEvent): string | null {
    return (
      event.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video",
      )?.uri ?? null
    );
  }

  private _getMeetCode(event: GoogleCalendarEvent): string | null {
    const conferenceId = event.conferenceData?.conferenceId;
    if (conferenceId) return normalizeMeetCode(conferenceId);

    const meetUrl = this._getMeetUrl(event) ?? event.hangoutLink ?? null;
    if (!meetUrl) return null;
    return extractMeetCode(meetUrl);
  }

  private async _findConferenceRecord(
    accessToken: string,
    meetingCode: string,
    event: GoogleCalendarEvent,
  ): Promise<GoogleConferenceRecord | null> {
    const filters = [`space.meeting_code = "${meetingCode}"`];
    const startsAt = getEventDate(event.start);
    const endsAt = getEventDate(event.end);
    if (startsAt && endsAt) {
      const from = new Date(startsAt.getTime() - 6 * 60 * 60 * 1000);
      const to = new Date(endsAt.getTime() + 6 * 60 * 60 * 1000);
      filters.push(`start_time >= "${from.toISOString()}"`);
      filters.push(`start_time <= "${to.toISOString()}"`);
    }

    const params = new URLSearchParams({
      pageSize: "10",
      filter: filters.join(" AND "),
    });
    const res = await fetch(`${GOOGLE_MEET_API}/conferenceRecords?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Google account does not have access to this Meet conference record",
      );
    }
    if (!res.ok) throw new Error(`Google Meet API error: ${res.status}`);

    const data = (await res.json()) as {
      conferenceRecords?: GoogleConferenceRecord[];
    };
    const records = data.conferenceRecords ?? [];
    if (records.length === 0) return null;
    return pickClosestConferenceRecord(records, startsAt);
  }

  private async _listRecordings(
    accessToken: string,
    conferenceRecordName: string,
  ): Promise<GoogleMeetRecording[]> {
    const res = await fetch(
      `${GOOGLE_MEET_API}/${conferenceRecordName}/recordings?pageSize=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Google account does not have access to this Meet recording",
      );
    }
    if (!res.ok)
      throw new Error(`Google Meet recordings API error: ${res.status}`);
    const data = (await res.json()) as { recordings?: GoogleMeetRecording[] };
    return data.recordings ?? [];
  }

  private async _getDriveFileMetadata(
    accessToken: string,
    driveFileId: string,
  ): Promise<GoogleDriveFileMetadata> {
    const params = new URLSearchParams({
      fields: "id,name,size,mimeType,webViewLink,videoMediaMetadata",
    });
    const res = await fetch(
      `${GOOGLE_DRIVE_API}/files/${encodeURIComponent(driveFileId)}?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Google account does not have access to the Meet recording file in Drive",
      );
    }
    if (!res.ok) throw new Error(`Drive metadata fetch failed: ${res.status}`);
    return (await res.json()) as GoogleDriveFileMetadata;
  }

  private _mapCalendarEvent(item: GoogleCalendarEvent): ExternalMeetingShape {
    const startsAt = item.start?.dateTime
      ? new Date(item.start.dateTime)
      : item.start?.date
        ? new Date(item.start.date)
        : null;
    const endsAt = item.end?.dateTime
      ? new Date(item.end.dateTime)
      : item.end?.date
        ? new Date(item.end.date)
        : null;

    const attendees = (item.attendees ?? []).map((a) => ({
      name: a.displayName ?? a.email,
      email: a.email,
      role: a.organizer ? "organizer" : "attendee",
      metadata: {},
    }));

    return {
      provider: "google",
      externalMeetingId: item.id,
      title: item.summary ?? "Google Meet",
      startsAt,
      endsAt,
      joinUrl: this._getMeetUrl(item),
      recordingUrl: null,
      status: "imported",
      metadata: {
        htmlLink: item.htmlLink,
        conferenceId: item.conferenceData?.conferenceId,
        meetCode: this._getMeetCode(item),
        attendees,
      },
    };
  }
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

function parseGoogleScopes(scope: string | undefined, fallback: string[] = []) {
  const parsed = scope?.split(" ").filter(Boolean) ?? [];
  return parsed.length > 0 ? parsed : fallback;
}

interface GoogleCalendarList {
  nextPageToken?: string;
  items?: GoogleCalendarEvent[];
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { key: { type: string }; name: string };
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    organizer?: boolean;
  }>;
}

interface GoogleConferenceRecord {
  name: string;
  startTime?: string;
  endTime?: string;
  expireTime?: string;
  space?: string;
}

interface GoogleMeetRecording {
  name: string;
  state: "STATE_UNSPECIFIED" | "STARTED" | "ENDED" | "FILE_GENERATED";
  startTime?: string;
  endTime?: string;
  driveDestination?: {
    file?: string;
    exportUri?: string;
  };
}

interface GoogleDriveFileMetadata {
  id: string;
  name?: string;
  size?: string;
  mimeType?: string;
  webViewLink?: string;
  videoMediaMetadata?: { durationMillis?: string };
}

export type GoogleMeetRecordingLookupResult =
  | {
      status: "found";
      message: string;
      event: ExternalMeetingShape;
      meetingCode: string;
      conferenceRecord: string;
      recordingName: string;
      recording: ExternalRecording;
      driveFile: {
        id: string;
        name: string;
        mimeType: string;
        webViewLink: string | null;
      };
    }
  | {
      status: "not_ready" | "not_found";
      message: string;
      event?: ExternalMeetingShape;
      meetingCode?: string;
      conferenceRecord?: string;
      recordingState?: GoogleMeetRecording["state"] | null;
    };

function normalizeMeetCode(value: string) {
  return value.trim().toLowerCase();
}

function extractMeetCode(value: string): string | null {
  const match = value.match(
    /meet\.google\.com\/([a-z]{3}-?[a-z]{4}-?[a-z]{3})/i,
  );
  return match?.[1] ? normalizeMeetCode(match[1]) : null;
}

function getEventDate(value?: { dateTime?: string; date?: string }) {
  const raw = value?.dateTime ?? value?.date;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickClosestConferenceRecord(
  records: GoogleConferenceRecord[],
  startsAt: Date | null,
) {
  if (!startsAt) return records[0] ?? null;
  return (
    [...records].sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
      return (
        Math.abs(aTime - startsAt.getTime()) -
        Math.abs(bTime - startsAt.getTime())
      );
    })[0] ?? null
  );
}
