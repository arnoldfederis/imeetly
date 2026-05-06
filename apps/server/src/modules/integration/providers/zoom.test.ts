import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZoomIntegrationProvider } from "./zoom";

const provider = new ZoomIntegrationProvider();
const TOKEN = "test-access-token";
const API = "https://api.zoom.us/v2";

function makeRecording(uuid: string, id = 123456789) {
  return {
    id,
    uuid,
    topic: "Test Meeting",
    start_time: "2024-01-15T10:00:00Z",
    duration: 60,
    recording_files: [
      {
        recording_type: "speaker_view",
        download_url: "https://zoom.us/rec/download/abc",
        file_size: 1024,
      },
    ],
  };
}

function mockFetch(
  handler: (url: string) => { status: number; body: unknown },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const { status, body } = handler(url);
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
      });
    }),
  );
}

beforeEach(() => vi.stubEnv("SKIP_ENV_VALIDATION", "true"));
afterEach(() => vi.unstubAllGlobals());

describe("getRecording — UUID encoding", () => {
  it("plain numeric meeting ID — single encode", async () => {
    const id = "123456789";
    mockFetch((url) => {
      if (url === `${API}/meetings/${encodeURIComponent(id)}/recordings`) {
        return { status: 200, body: makeRecording("uuid-plain", 123456789) };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, id);
    expect(rec).not.toBeNull();
    expect(rec?.externalMeetingId).toBe(id);
  });

  it("UUID without special characters — single encode succeeds", async () => {
    const uuid = "abcdefghijklmnopqrstuvwxyz123456";
    mockFetch((url) => {
      if (url === `${API}/meetings/${encodeURIComponent(uuid)}/recordings`) {
        return { status: 200, body: makeRecording(uuid) };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, uuid);
    expect(rec).not.toBeNull();
  });

  it("UUID containing / — tries double encode", async () => {
    const uuid = "abc/def+ghi==";
    const singleEncoded = encodeURIComponent(uuid);
    const doubleEncoded = encodeURIComponent(encodeURIComponent(uuid));

    mockFetch((url) => {
      if (url === `${API}/meetings/${doubleEncoded}/recordings`) {
        return { status: 200, body: makeRecording(uuid) };
      }
      if (url === `${API}/meetings/${singleEncoded}/recordings`) {
        return { status: 400, body: { message: "Invalid UUID" } };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, uuid);
    expect(rec).not.toBeNull();
  });

  it("UUID containing + — tries double encode", async () => {
    const uuid = "abc+def";
    const doubleEncoded = encodeURIComponent(encodeURIComponent(uuid));

    mockFetch((url) => {
      if (url === `${API}/meetings/${doubleEncoded}/recordings`) {
        return { status: 200, body: makeRecording(uuid) };
      }
      return { status: 400, body: { message: "Invalid UUID" } };
    });

    const rec = await provider.getRecording(TOKEN, uuid);
    expect(rec).not.toBeNull();
  });

  it("UUID ending in == — tries double encode", async () => {
    const uuid = "somebase64paddedvalue==";
    const doubleEncoded = encodeURIComponent(encodeURIComponent(uuid));

    mockFetch((url) => {
      if (url === `${API}/meetings/${doubleEncoded}/recordings`) {
        return { status: 200, body: makeRecording(uuid) };
      }
      return { status: 400, body: { message: "Bad request" } };
    });

    const rec = await provider.getRecording(TOKEN, uuid);
    expect(rec).not.toBeNull();
  });

  it("single encode 400 without special chars — retries double encode", async () => {
    const uuid = "plainuuidthat400s";
    const singleEncoded = encodeURIComponent(uuid);
    const doubleEncoded = encodeURIComponent(encodeURIComponent(uuid));

    mockFetch((url) => {
      if (url === `${API}/meetings/${doubleEncoded}/recordings`) {
        return { status: 200, body: makeRecording(uuid) };
      }
      if (url === `${API}/meetings/${singleEncoded}/recordings`) {
        return { status: 400, body: { message: "Bad request" } };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, uuid);
    expect(rec).not.toBeNull();
  });
});

describe("getRecording — recurring meeting instance fallback", () => {
  it("fetches instance UUIDs when primary UUID fails", async () => {
    const primaryUuid = "primary-uuid";
    const instanceUuid = "instance-uuid-for-recurring";
    const meetingId = "987654321";

    mockFetch((url) => {
      // Primary UUID fails
      if (
        url.includes(`/meetings/${encodeURIComponent(primaryUuid)}/recordings`)
      ) {
        return { status: 400, body: { message: "Bad request" } };
      }
      // Double-encoded primary also fails
      if (
        url.includes(
          `/meetings/${encodeURIComponent(encodeURIComponent(primaryUuid))}/recordings`,
        )
      ) {
        return { status: 400, body: {} };
      }
      // Instances endpoint
      if (url === `${API}/past_meetings/${meetingId}/instances`) {
        return {
          status: 200,
          body: { meetings: [{ uuid: instanceUuid }] },
        };
      }
      // Instance UUID succeeds
      if (
        url.includes(`/meetings/${encodeURIComponent(instanceUuid)}/recordings`)
      ) {
        return { status: 200, body: makeRecording(instanceUuid) };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, primaryUuid, {
      meetingId,
      startsAt: new Date("2024-01-15T10:00:00Z"),
    });
    expect(rec).not.toBeNull();
  });
});

describe("getRecording — user-level recordings fallback", () => {
  it("falls back to /users/me/recordings when UUID lookup fails", async () => {
    const uuid = "unknown-uuid";
    const startsAt = new Date("2024-01-15T10:00:00Z");

    mockFetch((url) => {
      if (url.includes(`/meetings/`) && url.includes("/recordings")) {
        return { status: 400, body: { message: "Bad request" } };
      }
      if (url.includes("/users/me/recordings")) {
        return {
          status: 200,
          body: {
            meetings: [makeRecording(uuid)],
          },
        };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, uuid, { startsAt });
    expect(rec).not.toBeNull();
  });

  it("matches fallback recording by meeting ID when UUID differs", async () => {
    const uuid = "webhook-uuid";
    const meetingId = "111222333";
    const startsAt = new Date("2024-01-15T10:00:00Z");

    mockFetch((url) => {
      if (url.includes(`/meetings/`) && url.includes("/recordings")) {
        return { status: 404, body: {} };
      }
      if (url.includes("/users/me/recordings")) {
        return {
          status: 200,
          body: {
            meetings: [makeRecording("different-uuid", 111222333)],
          },
        };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, uuid, {
      meetingId,
      startsAt,
    });
    expect(rec).not.toBeNull();
  });

  it("returns null when no match found in fallback", async () => {
    const uuid = "no-match-uuid";
    // startsAt differs by 2 hours from the fallback recording — outside 5min window
    const startsAt = new Date("2024-01-15T10:00:00Z");

    mockFetch((url) => {
      if (url.includes("/users/me/recordings")) {
        return {
          status: 200,
          body: {
            // different uuid, different id, start_time 2h later — no match
            meetings: [
              {
                ...makeRecording("completely-different", 999),
                start_time: "2024-01-15T12:00:00Z",
              },
            ],
          },
        };
      }
      return { status: 404, body: {} };
    });

    const rec = await provider.getRecording(TOKEN, uuid, { startsAt });
    expect(rec).toBeNull();
  });
});
