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

// drive.file — access only files user explicitly selects or app creates (not full Drive)
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export const GOOGLE_DRIVE_PICKER_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
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
    _accessToken: string,
    _externalMeetingId: string,
  ): Promise<ExternalRecording | null> {
    // drive.file scope only grants access to files the user explicitly selects
    // via Google Picker or files this app creates — it does not allow scanning
    // Drive by query. Auto-discovery of Meet recordings is not supported.
    // Recording import requires the user to select the file via the UI.
    return null;
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
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{
    eventType: string;
    externalEventId: string | null;
    data: Record<string, unknown>;
  }> {
    // TODO: Implement Google Calendar push notifications via /calendars/primary/events/watch
    return {
      eventType: "calendar.event",
      externalEventId: null,
      data: payload as Record<string, unknown>,
    };
  }

  verifyWebhook(
    _payload: string | Buffer,
    _headers: Record<string, string>,
  ): boolean {
    // TODO: Verify X-Goog-Channel-Token against the token set during channel registration
    return true;
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

  private _getMeetUrl(event: GoogleCalendarEvent): string | null {
    return (
      event.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video",
      )?.uri ?? null
    );
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
