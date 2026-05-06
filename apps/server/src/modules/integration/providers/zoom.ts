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

function needsDoubleEncoding(uuid: string): boolean {
  return uuid.includes("/") || uuid.includes("+") || uuid.endsWith("==");
}

function encodeZoomUuid(uuid: string, double: boolean): string {
  return double
    ? encodeURIComponent(encodeURIComponent(uuid))
    : encodeURIComponent(uuid);
}

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

  async refreshToken(
    refreshToken: string,
    _options?: { previousScopes?: string[] },
  ): Promise<OAuthTokens> {
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
      const errorText = await res.text();
      let message = `Zoom recordings API error: ${res.status}`;

      try {
        const error = JSON.parse(errorText) as {
          code?: number;
          message?: string;
        };

        if (error.message) {
          message = `Zoom recordings API error: ${res.status} (${error.message})`;
        }

        if (error.message === "No permission.") {
          message =
            "Zoom recordings API error: 400 (No permission). The connected Zoom user must have cloud recording access, and the OAuth app must include recording read scopes.";
        }
      } catch {
        if (errorText) {
          message = `${message} (${errorText})`;
        }
      }

      throw new Error(message);
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
    const result = await this._fetchMeetingRecording(
      accessToken,
      externalMeetingId,
      { context: "getMeeting" },
    );
    if (!result) return null;
    return this._mapZoomMeeting(result);
  }

  async getRecording(
    accessToken: string,
    externalMeetingId: string,
    options?: {
      meetingId?: string;
      startsAt?: Date | null;
      endsAt?: Date | null;
    },
  ): Promise<ExternalRecording | null> {
    const data = await this._fetchMeetingRecording(
      accessToken,
      externalMeetingId,
      {
        context: "getRecording",
        meetingId: options?.meetingId,
        startsAt: options?.startsAt ?? null,
        endsAt: options?.endsAt ?? null,
      },
    );
    if (!data) return null;
    return this._extractRecording(data, externalMeetingId, accessToken);
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

  // --- Private helpers ---

  private async _fetchMeetingRecording(
    accessToken: string,
    uuid: string,
    ctx: {
      context: string;
      meetingId?: string;
      startsAt?: Date | null;
      endsAt?: Date | null;
    },
  ): Promise<ZoomMeetingRecording | null> {
    // 1. Try primary UUID with appropriate encoding
    const double = needsDoubleEncoding(uuid);
    const result = await this._tryFetchRecording(
      accessToken,
      uuid,
      double,
      ctx,
    );
    if (result) return result;

    // 2. If single-encode was used and it failed 400, retry with double-encode
    if (!double) {
      const retried = await this._tryFetchRecording(
        accessToken,
        uuid,
        true,
        ctx,
      );
      if (retried) return retried;
    }

    // 3. If uuid looks like it could be a recurring instance, try fetching instances
    if (ctx.meetingId) {
      const instanceResult = await this._tryRecurringInstances(
        accessToken,
        ctx.meetingId,
        uuid,
        ctx,
      );
      if (instanceResult) return instanceResult;
    }

    // 4. Fallback: search user-level recordings by date range
    if (ctx.startsAt) {
      const fallback = await this._fallbackUserRecordings(
        accessToken,
        uuid,
        ctx.meetingId ?? null,
        ctx.startsAt,
        ctx.endsAt ?? null,
        ctx,
      );
      if (fallback) return fallback;
    }

    console.warn("[zoom] All recording lookup strategies exhausted", {
      uuid,
      meetingId: ctx.meetingId,
      context: ctx.context,
    });
    return null;
  }

  private async _tryFetchRecording(
    accessToken: string,
    uuid: string,
    double: boolean,
    ctx: { context: string; meetingId?: string },
  ): Promise<ZoomMeetingRecording | null> {
    const encoded = encodeZoomUuid(uuid, double);
    const url = `${ZOOM_API_URL}/meetings/${encoded}/recordings`;

    console.log("[zoom] Fetching recording", {
      context: ctx.context,
      uuid,
      meetingId: ctx.meetingId,
      doubleEncoded: double,
      url,
    });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      const body = await res.text();
      console.warn("[zoom] Recording fetch failed", {
        context: ctx.context,
        uuid,
        meetingId: ctx.meetingId,
        doubleEncoded: double,
        url,
        status: res.status,
        body,
      });
      return null;
    }

    return (await res.json()) as ZoomMeetingRecording;
  }

  private async _tryRecurringInstances(
    accessToken: string,
    meetingId: string,
    originalUuid: string,
    ctx: { context: string; meetingId?: string },
  ): Promise<ZoomMeetingRecording | null> {
    console.log("[zoom] Fetching recurring instances", { meetingId });

    const res = await fetch(
      `${ZOOM_API_URL}/past_meetings/${encodeURIComponent(meetingId)}/instances`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { meetings?: Array<{ uuid: string }> };
    const instances = data.meetings ?? [];

    for (const instance of instances) {
      if (!instance.uuid || instance.uuid === originalUuid) continue;
      const double = needsDoubleEncoding(instance.uuid);
      const result = await this._tryFetchRecording(
        accessToken,
        instance.uuid,
        double,
        {
          ...ctx,
          context: `${ctx.context}:recurring-instance`,
        },
      );
      if (result) return result;
    }

    return null;
  }

  private async _fallbackUserRecordings(
    accessToken: string,
    uuid: string,
    meetingId: string | null,
    startsAt: Date,
    endsAt: Date | null,
    ctx: { context: string },
  ): Promise<ZoomMeetingRecording | null> {
    const from = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const to = (endsAt ?? new Date(startsAt.getTime() + 24 * 60 * 60 * 1000))
      .toISOString()
      .slice(0, 10);

    const params = new URLSearchParams({ from, to, page_size: "50" });
    const url = `${ZOOM_API_URL}/users/me/recordings?${params}`;

    console.log("[zoom] Fallback user recordings search", {
      context: ctx.context,
      uuid,
      meetingId,
      from,
      to,
      url,
    });

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as ZoomRecordingList;
    const meetings = data.meetings ?? [];

    // Match by UUID, numeric meeting ID, or start time proximity (within 5 min)
    const match = meetings.find((m) => {
      if (m.uuid === uuid) return true;
      if (meetingId && String(m.id) === String(meetingId)) return true;
      if (m.start_time && startsAt) {
        const diff = Math.abs(
          new Date(m.start_time).getTime() - startsAt.getTime(),
        );
        if (diff <= 5 * 60 * 1000) return true;
      }
      return false;
    });

    if (match) {
      console.log("[zoom] Fallback matched recording", {
        uuid,
        matchedUuid: match.uuid,
        matchedId: match.id,
      });
    }

    return match ?? null;
  }

  private _extractRecording(
    data: ZoomMeetingRecording,
    externalMeetingId: string,
    accessToken: string,
  ): ExternalRecording | null {
    const videoFile =
      (data.recording_files ?? []).find(
        (f) =>
          f.recording_type === "shared_screen_with_speaker_view" ||
          f.recording_type === "speaker_view",
      ) ?? (data.recording_files ?? [])[0];

    if (!videoFile?.download_url) return null;

    return {
      externalMeetingId,
      downloadUrl: `${videoFile.download_url}?access_token=${accessToken}`,
      mimeType: "video/mp4",
      sizeBytes: videoFile.file_size ?? null,
      durationSeconds: data.duration ? data.duration * 60 : null,
      expiresAt: null,
    };
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
      status: hasRecording ? "recording_available" : "no_recording",
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
