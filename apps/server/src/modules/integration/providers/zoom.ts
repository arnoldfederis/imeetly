import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@repo/env";
import { signState } from "../encrypt";
import type {
  ExternalMeetingShape,
  ExternalParticipantShape,
  ExternalRecording,
  IMeetingIntegrationProvider,
  OAuthTokens,
} from "../types";

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_URL = "https://api.zoom.us/v2";

export class ZoomIntegrationProvider implements IMeetingIntegrationProvider {
  readonly type = "zoom" as const;

  async getAuthorizationUrl(
    userId: string,
    redirectUri: string,
  ): Promise<{ url: string; state: string }> {
    if (!env.ZOOM_CLIENT_ID) throw new Error("Zoom integration not configured");
    const nonce = randomBytes(16).toString("hex");
    const state = signState({
      userId,
      provider: "zoom",
      nonce,
      iat: Date.now(),
    });
    const params = new URLSearchParams({
      response_type: "code",
      client_id: env.ZOOM_CLIENT_ID,
      redirect_uri: redirectUri,
      state,
    });
    return { url: `${ZOOM_AUTH_URL}?${params}`, state };
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{ tokens: OAuthTokens; accountId: string; accountEmail: string }> {
    const credentials = Buffer.from(
      `${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch(
      `${ZOOM_TOKEN_URL}?grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    if (!res.ok)
      throw new Error(`Zoom token exchange failed: ${await res.text()}`);
    const data = (await res.json()) as ZoomTokenResponse;

    const userRes = await fetch(`${ZOOM_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = (await userRes.json()) as { id: string; email: string };

    return {
      tokens: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scopes: data.scope.split(" "),
      },
      accountId: user.id,
      accountEmail: user.email,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(
      `${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch(
      `${ZOOM_TOKEN_URL}?grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Zoom token refresh failed: ${await res.text()}`);
    }

    const data = (await res.json()) as ZoomTokenResponse;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: data.scope.split(" "),
    };
  }

  async listMeetings(
    accessToken: string,
    options?: { from?: Date; to?: Date },
  ): Promise<{ meetings: ExternalMeetingShape[]; nextPageToken?: string }> {
    const from =
      options?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = options?.to ?? new Date();
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);

    const params = new URLSearchParams({
      from: fromDate,
      to: toDate,
      page_size: "50",
    });

    const res = await fetch(`${ZOOM_API_URL}/users/me/recordings?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Zoom API error: ${res.status}`);
    }

    const data = (await res.json()) as ZoomRecordingList;

    return {
      meetings: (data.meetings ?? []).map((m) => this._mapZoomMeeting(m)),
    };
  }

  async getMeeting(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalMeetingShape | null> {
    const res = await fetch(
      `${ZOOM_API_URL}/meetings/${encodeURIComponent(externalMeetingId)}/recordings`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Zoom API error: ${res.status}`);
    return this._mapZoomMeeting((await res.json()) as ZoomMeetingRecording);
  }

  async getRecording(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalRecording | null> {
    const res = await fetch(
      `${ZOOM_API_URL}/meetings/${encodeURIComponent(externalMeetingId)}/recordings`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.status === 404 || !res.ok) return null;

    const data = (await res.json()) as ZoomMeetingRecording;
    const videoFile =
      (data.recording_files ?? []).find(
        (f) =>
          f.recording_type === "shared_screen_with_speaker_view" ||
          f.recording_type === "speaker_view",
      ) ?? (data.recording_files ?? [])[0];

    if (!videoFile?.download_url) return null;

    return {
      externalMeetingId,
      // Zoom requires access_token as query param for download
      downloadUrl: `${videoFile.download_url}?access_token=${accessToken}`,
      mimeType: "video/mp4",
      sizeBytes: videoFile.file_size ?? null,
      durationSeconds: data.duration ? data.duration * 60 : null,
      expiresAt: null,
    };
  }

  async listParticipants(
    accessToken: string,
    externalMeetingId: string,
  ): Promise<ExternalParticipantShape[]> {
    const res = await fetch(
      `${ZOOM_API_URL}/past_meetings/${encodeURIComponent(externalMeetingId)}/participants`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { participants?: ZoomParticipant[] };
    return (data.participants ?? []).map((p) => ({
      name: p.name,
      email: p.user_email ?? null,
      role: null,
      metadata: {},
    }));
  }

  async handleWebhook(
    payload: unknown,
    _headers: Record<string, string>,
  ): Promise<{
    eventType: string;
    externalEventId: string | null;
    data: Record<string, unknown>;
  }> {
    const event = payload as ZoomWebhookEvent;
    return {
      eventType: event.event ?? "unknown",
      externalEventId: event.payload?.object?.uuid ?? null,
      data: (event.payload ?? {}) as Record<string, unknown>,
    };
  }

  verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
  ): boolean {
    const secret = env.ZOOM_WEBHOOK_SECRET_TOKEN;
    if (!secret) return false;
    const timestamp = headers["x-zm-request-timestamp"];
    const signature = headers["x-zm-signature"];
    if (!timestamp || !signature) return false;
    const message = `v0:${timestamp}:${payload.toString()}`;
    const expected = `v0=${createHmac("sha256", secret).update(message).digest("hex")}`;
    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  private _mapZoomMeeting(m: ZoomMeetingRecording): ExternalMeetingShape {
    const hasRecording = (m.recording_files ?? []).length > 0;
    return {
      provider: "zoom",
      externalMeetingId: m.uuid ?? String(m.id ?? ""),
      title: m.topic ?? "Zoom Meeting",
      startsAt: m.start_time ? new Date(m.start_time) : null,
      endsAt:
        m.start_time && m.duration
          ? new Date(new Date(m.start_time).getTime() + m.duration * 60 * 1000)
          : null,
      joinUrl: m.share_url ?? null,
      recordingUrl: hasRecording ? (m.share_url ?? null) : null,
      status: hasRecording ? "recording_available" : "imported",
      metadata: { meetingId: m.id, uuid: m.uuid, duration: m.duration },
    };
  }
}

interface ZoomTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface ZoomRecordingList {
  meetings?: ZoomMeetingRecording[];
  next_page_token?: string;
}

interface ZoomMeetingRecording {
  id?: number;
  uuid?: string;
  topic?: string;
  start_time?: string;
  duration?: number;
  share_url?: string;
  recording_files?: ZoomRecordingFile[];
}

interface ZoomRecordingFile {
  recording_type?: string;
  file_size?: number;
  download_url?: string;
}

interface ZoomParticipant {
  name: string;
  user_email?: string;
}

interface ZoomWebhookEvent {
  event?: string;
  payload?: {
    object?: { uuid?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
}
