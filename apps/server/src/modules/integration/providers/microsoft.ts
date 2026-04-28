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

const MS_AUTH_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_GRAPH_URL = "https://graph.microsoft.com/v1.0";

const MS_SCOPES = [
  "offline_access",
  "User.Read",
  "Calendars.Read",
  "OnlineMeetings.Read",
].join(" ");

export class MicrosoftIntegrationProvider
  implements IMeetingIntegrationProvider
{
  readonly type = "microsoft" as const;

  async getAuthorizationUrl(
    userId: string,
    redirectUri: string,
  ): Promise<{ url: string; state: string }> {
    if (!env.MICROSOFT_CLIENT_ID)
      throw new Error("Microsoft integration not configured");
    const nonce = randomBytes(16).toString("hex");
    const state = signState({
      userId,
      provider: "microsoft",
      nonce,
      iat: Date.now(),
    });
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: MS_SCOPES,
      response_mode: "query",
      state,
    });
    return { url: `${MS_AUTH_URL}?${params}`, state };
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{ tokens: OAuthTokens; accountId: string; accountEmail: string }> {
    const res = await fetch(MS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID ?? "",
        client_secret: env.MICROSOFT_CLIENT_SECRET ?? "",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok)
      throw new Error(`Microsoft token exchange failed: ${await res.text()}`);
    const data = (await res.json()) as MsTokenResponse;

    const userRes = await fetch(`${MS_GRAPH_URL}/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = (await userRes.json()) as {
      id: string;
      mail?: string;
      userPrincipalName?: string;
    };

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scopes: data.scope.split(" "),
      },
      accountId: user.id,
      accountEmail: user.mail ?? user.userPrincipalName ?? user.id,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(MS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID ?? "",
        client_secret: env.MICROSOFT_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: MS_SCOPES,
      }),
    });
    if (!res.ok)
      throw new Error(`Microsoft token refresh failed: ${await res.text()}`);
    const data = (await res.json()) as MsTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: data.scope.split(" "),
    };
  }

  async listMeetings(
    accessToken: string,
    options?: { from?: Date; to?: Date },
  ): Promise<{ meetings: ExternalMeetingShape[]; nextPageToken?: string }> {
    const now = new Date();
    const from =
      options?.from ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = options?.to ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      startDateTime: from.toISOString(),
      endDateTime: to.toISOString(),
      $select: "id,subject,start,end,isOnlineMeeting,onlineMeeting,attendees",
      $top: "50",
      $orderby: "start/dateTime",
    });

    const res = await fetch(`${MS_GRAPH_URL}/me/calendarView?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Microsoft Graph API error: ${res.status}`);

    const data = (await res.json()) as {
      value?: MsCalendarEvent[];
      "@odata.nextLink"?: string;
    };

    const meetings = (data.value ?? [])
      .filter(
        (e) =>
          e.isOnlineMeeting &&
          e.onlineMeeting?.joinUrl?.includes("teams.microsoft.com"),
      )
      .map((e) => this._mapCalendarEvent(e));

    return {
      meetings,
      nextPageToken: data["@odata.nextLink"] ? "next" : undefined,
    };
  }

  async getMeeting(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalMeetingShape | null> {
    const res = await fetch(
      `${MS_GRAPH_URL}/me/events/${encodeURIComponent(externalMeetingId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 404 || !res.ok) return null;
    return this._mapCalendarEvent((await res.json()) as MsCalendarEvent);
  }

  async getRecording(
    _accessToken: string,
    _externalMeetingId: string,
  ): Promise<ExternalRecording | null> {
    // TODO: GET /me/onlineMeetings/{id}/recordings via Graph beta API.
    // Requires Teams Premium or specific licensing, and OnlineMeetingRecording.Read.All scope.
    console.log(
      "[microsoft] Recording discovery via Graph API not yet implemented",
    );
    return null;
  }

  async listParticipants(
    _accessToken: string,
    _externalMeetingId: string,
  ): Promise<ExternalParticipantShape[]> {
    // TODO: Implement via meeting transcript attendees
    return [];
  }

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{
    eventType: string;
    externalEventId: string | null;
    data: Record<string, unknown>;
  }> {
    // TODO: Implement Microsoft Graph change notifications
    return {
      eventType: "graph.notification",
      externalEventId: null,
      data: payload as Record<string, unknown>,
    };
  }

  verifyWebhook(
    _payload: string | Buffer,
    _headers: Record<string, string>,
  ): boolean {
    // TODO: Compare clientState header against the value set during subscription registration
    return true;
  }

  private _mapCalendarEvent(event: MsCalendarEvent): ExternalMeetingShape {
    const attendees = (event.attendees ?? []).map((a) => ({
      name: a.emailAddress?.name ?? a.emailAddress?.address ?? "",
      email: a.emailAddress?.address ?? null,
      role: a.type === "required" ? "attendee" : "optional",
      metadata: {},
    }));
    return {
      provider: "microsoft",
      externalMeetingId: event.id,
      title: event.subject ?? "Teams Meeting",
      startsAt: event.start?.dateTime ? new Date(event.start.dateTime) : null,
      endsAt: event.end?.dateTime ? new Date(event.end.dateTime) : null,
      joinUrl: event.onlineMeeting?.joinUrl ?? null,
      recordingUrl: null,
      status: "imported",
      metadata: { attendees },
    };
  }
}

interface MsTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface MsCalendarEvent {
  id: string;
  subject?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
  isOnlineMeeting?: boolean;
  onlineMeeting?: { joinUrl?: string };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    type?: string;
  }>;
}
