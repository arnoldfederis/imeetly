import { Readable, Transform } from "node:stream";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { render } from "@react-email/components";
import {
  actionItems,
  externalMeetings,
  meetingFiles,
  meetingSummaries,
  meetings,
} from "@repo/db/schemas/app";
import { users } from "@repo/db/schemas/auth";
import { ApplicationFailure, Context } from "@temporalio/activity";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "./db";
import {
  ActionItemReminderEmail,
  OverdueActionItemsDigestEmail,
  WeeklyActionItemRecapEmail,
} from "./emails/action-items";
import { MeetingReadyEmail } from "./emails/meeting-ready";
import { env } from "./env";
import { extractMeetingData } from "./services/ai/extraction";
import { indexMeetingMemory } from "./services/ai/memory-indexer";
import { transcribeMeeting } from "./services/ai/transcription";
import {
  type ExtractionResult,
  ProviderError,
  type TranscriptionResult,
} from "./services/ai/types";
import { getWorkerAccessToken } from "./services/oauth";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function normalizeTaskTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDate(value: Date | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

async function sendOperationalEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (env.APP_ENV !== "production") {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST ?? "localhost",
      port: Number(env.SMTP_PORT ?? 1025),
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
      tls: { rejectUnauthorized: false },
    });
    await transport.sendMail({
      from: "imeetly <notifications@imeetly.app>",
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return;
  }

  if (!env.RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "imeetly <notifications@imeetly.app>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });
}

// --- Types ---

export interface MeetingInput {
  meetingId: string;
  userId: string;
  sourceType: "text" | "audio" | "video";
  transcriptText?: string | null;
  storageKey?: string | null;
  bucketName?: string | null;
  language?: string | null;
}

export interface ProcessingResult {
  transcript: string;
  summary: string;
  decisions: string;
  blockers: string;
  followups: string;
  actionItems: Array<{
    title: string;
    ownerName?: string;
    assigneeEmail?: string | null;
    dueDate?: string | null;
    priority?: "low" | "normal" | "high" | "urgent";
    status?: "open" | "in_progress" | "blocked" | "done" | "canceled";
    confidence?: number | null;
  }>;
  transcriptionProvider?: string;
  extractionProvider?: string;
  extractionModel?: string;
}

// --- DB activities ---

export async function updateMeetingStatus(
  meetingId: string,
  status: string,
  processingStatus: string,
  failureReason: string | null,
): Promise<void> {
  await db
    .update(meetings)
    .set({ status, processingStatus, failureReason })
    .where(eq(meetings.id, meetingId));

  console.log(
    `[${meetingId}] Status: ${status}, Processing: ${processingStatus}${failureReason ? `, Reason: ${failureReason}` : ""}`,
  );
}

export async function loadMeetingInput(
  meetingId: string,
): Promise<MeetingInput> {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: { files: true },
  });

  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }

  const file = meeting.files?.[0];

  return {
    meetingId: meeting.id,
    userId: meeting.userId,
    sourceType: meeting.sourceType as "text" | "audio" | "video",
    transcriptText: meeting.transcriptText,
    storageKey: file?.storageKey ?? null,
    bucketName: file?.bucketName ?? null,
    language: meeting.language ?? null,
  };
}

export async function downloadIntegrationRecordingIfNeeded(
  meetingId: string,
): Promise<void> {
  const [extMeeting] = await db
    .select()
    .from(externalMeetings)
    .where(
      sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
    )
    .limit(1);

  if (!extMeeting) return;

  const meta = extMeeting.metadata as Record<string, unknown>;
  const pending = meta.pendingDownload as
    | {
        integrationId: string;
        downloadUrl: string;
        mimeType: string;
        sizeBytes: number | null;
        durationSeconds: number | null;
      }
    | undefined;

  if (!pending) return;

  const { integrationId, downloadUrl, mimeType, sizeBytes, durationSeconds } =
    pending;
  const downloadSummary = `${mimeType}${sizeBytes != null ? `, ${Math.round(sizeBytes / 1024 / 1024)} MB` : ""}`;

  // Always get a fresh token — refreshes automatically if within 5 min of expiry
  const accessToken = await getWorkerAccessToken(integrationId);

  // Abort only on inactivity. Large imports can run for hours, but they
  // should not sit idle indefinitely without receiving any bytes.
  // Keep stall timeout under heartbeat timeout (2 min) so the activity exits
  // cleanly before Temporal reschedules a retry, avoiding concurrent downloads.
  const stallTimeoutMs = 90 * 1000;
  const controller = new AbortController();
  let abortTimer: ReturnType<typeof setTimeout> | null = null;
  const refreshAbortTimer = () => {
    if (abortTimer) clearTimeout(abortTimer);
    abortTimer = setTimeout(() => controller.abort(), stallTimeoutMs);
  };
  const clearAbortTimer = () => {
    if (!abortTimer) return;
    clearTimeout(abortTimer);
    abortTimer = null;
  };

  const startedAt = new Date().toISOString();
  await db
    .update(externalMeetings)
    .set({
      metadata: {
        ...meta,
        pendingDownload: {
          ...pending,
          startedAt,
          lastProgressAt: startedAt,
          bytesDownloaded: 0,
          phase: "starting",
          lastError: null,
        },
      },
    })
    .where(
      sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
    );

  console.log(
    `[${meetingId}] Starting integration download (${downloadSummary}) from provider=${extMeeting.provider}`,
  );

  let downloadRes: Response;
  try {
    refreshAbortTimer();
    console.log(`[${meetingId}] Requesting source media from provider`);
    downloadRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
  } finally {
    clearAbortTimer();
  }

  console.log(
    `[${meetingId}] Source response status=${downloadRes.status} content-length=${downloadRes.headers.get("content-length") ?? "unknown"}`,
  );

  if (downloadRes.status === 401 || downloadRes.status === 403) {
    throw ApplicationFailure.nonRetryable(
      `Recording download rejected (${downloadRes.status}). Re-import the meeting.`,
      "DOWNLOAD_AUTH_FAILED",
    );
  }
  if (!downloadRes.ok) {
    throw new Error(
      `Failed to download recording: ${downloadRes.status} ${downloadRes.statusText}`,
    );
  }

  const storageKey = `${meetingId}/recording${mimeType === "audio/mp4" ? ".m4a" : ".mp4"}`;
  const [, fileName = storageKey] = storageKey.split("/");

  let fileSize: number;
  if (sizeBytes != null && downloadRes.body) {
    let bytesDownloaded = 0;
    let lastPersistedBytes = 0;
    let lastPersistedAt = Date.now();
    const persistThresholdBytes = 64 * 1024 * 1024;
    const persistIntervalMs = 15 * 1000;
    const multipartThresholdBytes = 100 * 1024 * 1024;
    const multipartPartSizeBytes = 64 * 1024 * 1024;

    const persistProgress = async (force = false) => {
      const now = Date.now();
      if (
        !force &&
        bytesDownloaded - lastPersistedBytes < persistThresholdBytes &&
        now - lastPersistedAt < persistIntervalMs
      ) {
        return;
      }

      lastPersistedBytes = bytesDownloaded;
      lastPersistedAt = now;

      await db
        .update(externalMeetings)
        .set({
          metadata: {
            ...meta,
            pendingDownload: {
              ...pending,
              startedAt,
              lastProgressAt: new Date(now).toISOString(),
              bytesDownloaded,
              phase: "downloading",
              lastError: null,
            },
          },
        })
        .where(
          sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
        );
    };

    fileSize = sizeBytes;
    refreshAbortTimer();

    if (sizeBytes >= multipartThresholdBytes) {
      console.log(
        `[${meetingId}] Using multipart upload to R2 (part size ${Math.round(multipartPartSizeBytes / 1024 / 1024)} MB)`,
      );
      const createResponse = await s3.send(
        new CreateMultipartUploadCommand({
          Bucket: env.S3_BUCKET,
          Key: storageKey,
          ContentType: mimeType,
        }),
      );

      if (!createResponse.UploadId) {
        throw new Error("R2 did not return an upload ID for multipart upload");
      }

      const uploadId = createResponse.UploadId;
      console.log(
        `[${meetingId}] Multipart upload started uploadId=${uploadId}`,
      );
      const parts: Array<{ ETag: string; PartNumber: number }> = [];
      let partNumber = 1;

      // Close the initial streaming connection — use bounded Range requests per chunk
      // to avoid Google Drive CDN stalling long-lived streams on large files.
      downloadRes.body.cancel().catch(() => {});

      const totalParts = Math.ceil(sizeBytes / multipartPartSizeBytes);
      console.log(
        `[${meetingId}] Fetching ${totalParts} chunks via Range requests`,
      );

      try {
        for (let chunkIndex = 0; chunkIndex < totalParts; chunkIndex++) {
          const startByte = chunkIndex * multipartPartSizeBytes;
          const endByte = Math.min(
            (chunkIndex + 1) * multipartPartSizeBytes - 1,
            sizeBytes - 1,
          );
          const rangeHeader = `bytes=${startByte}-${endByte}`;

          refreshAbortTimer();
          Context.current().heartbeat({
            bytesDownloaded,
            sizeBytes,
            phase: "downloading_chunk",
            chunkIndex,
          });

          console.log(
            `[${meetingId}] Fetching chunk ${chunkIndex + 1}/${totalParts} (${rangeHeader})`,
          );

          let chunkRes: Response;
          try {
            chunkRes = await fetch(downloadRes.url, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Range: rangeHeader,
              },
              signal: controller.signal,
            });
          } catch (err) {
            console.error(
              `[${meetingId}] Failed to fetch chunk ${chunkIndex + 1}:`,
              err instanceof Error ? err.message : err,
            );
            throw err;
          }

          if (chunkRes.status !== 206 && chunkRes.status !== 200) {
            throw new Error(
              `Unexpected status ${chunkRes.status} for Range request (chunk ${chunkIndex + 1})`,
            );
          }

          clearAbortTimer();
          refreshAbortTimer();

          let chunkBuffer: Buffer;
          try {
            const ab = await chunkRes.arrayBuffer();
            chunkBuffer = Buffer.from(ab);
          } catch (err) {
            console.error(
              `[${meetingId}] Failed reading chunk ${chunkIndex + 1} body:`,
              err instanceof Error ? err.message : err,
            );
            throw err;
          }

          clearAbortTimer();

          bytesDownloaded += chunkBuffer.byteLength;

          void persistProgress().catch((err) => {
            console.warn(
              `[${meetingId}] Failed to persist download progress:`,
              err instanceof Error ? err.message : err,
            );
          });

          const currentPart = partNumber;
          console.log(
            `[${meetingId}] Uploading R2 part ${currentPart} (${Math.round(chunkBuffer.byteLength / 1024 / 1024)} MB)`,
          );

          Context.current().heartbeat({
            bytesDownloaded,
            sizeBytes,
            phase: "uploading_part",
            partNumber: currentPart,
          });

          let uploadResponse: { ETag?: string } | undefined;
          try {
            uploadResponse = await s3.send(
              new UploadPartCommand({
                Bucket: env.S3_BUCKET,
                Key: storageKey,
                UploadId: uploadId,
                PartNumber: currentPart,
                Body: chunkBuffer,
                ContentLength: chunkBuffer.byteLength,
              }),
            );
          } catch (err) {
            console.error(
              `[${meetingId}] Failed uploading R2 part ${currentPart}:`,
              err instanceof Error ? err.message : err,
            );
            throw err;
          }

          if (!uploadResponse.ETag) {
            throw new Error(
              `R2 did not return an ETag for part ${currentPart}`,
            );
          }

          parts.push({ ETag: uploadResponse.ETag, PartNumber: currentPart });
          partNumber++;
          console.log(`[${meetingId}] Uploaded R2 part ${currentPart}`);
        }

        await persistProgress(true);

        console.log(
          `[${meetingId}] Completing multipart upload with ${parts.length} parts`,
        );
        await s3.send(
          new CompleteMultipartUploadCommand({
            Bucket: env.S3_BUCKET,
            Key: storageKey,
            UploadId: uploadId,
            MultipartUpload: {
              Parts: parts,
            },
          }),
        );
        console.log(`[${meetingId}] Multipart upload completed`);
      } catch (err) {
        await db
          .update(externalMeetings)
          .set({
            metadata: {
              ...meta,
              pendingDownload: {
                ...pending,
                startedAt,
                lastProgressAt: new Date().toISOString(),
                bytesDownloaded,
                phase: "failed",
                lastError:
                  err instanceof Error ? err.message : "Unknown transfer error",
              },
            },
          })
          .where(
            sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
          );
        console.error(
          `[${meetingId}] Multipart transfer failed:`,
          err instanceof Error ? err.message : err,
        );
        await s3
          .send(
            new AbortMultipartUploadCommand({
              Bucket: env.S3_BUCKET,
              Key: storageKey,
              UploadId: uploadId,
            }),
          )
          .catch(() => {});
        throw err;
      } finally {
        clearAbortTimer();
      }
    } else {
      console.log(`[${meetingId}] Using single-part upload to R2`);
      const body = Readable.fromWeb(downloadRes.body).pipe(
        new Transform({
          transform(chunk, _encoding, callback) {
            bytesDownloaded += Buffer.isBuffer(chunk)
              ? chunk.byteLength
              : Buffer.byteLength(chunk);
            refreshAbortTimer();
            Context.current().heartbeat({ bytesDownloaded, sizeBytes });
            void persistProgress().catch((err) => {
              console.warn(
                `[${meetingId}] Failed to persist download progress:`,
                err instanceof Error ? err.message : err,
              );
            });
            callback(null, chunk);
          },
          final(callback) {
            clearAbortTimer();
            void persistProgress(true)
              .then(() => callback())
              .catch((err) => callback(err as Error));
          },
        }),
      );

      try {
        console.log(`[${meetingId}] Starting single-part upload to R2`);
        await s3.send(
          new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: storageKey,
            Body: body,
            ContentType: mimeType,
            ContentLength: sizeBytes,
          }),
        );
        console.log(`[${meetingId}] Single-part upload completed`);
      } catch (err) {
        await db
          .update(externalMeetings)
          .set({
            metadata: {
              ...meta,
              pendingDownload: {
                ...pending,
                startedAt,
                lastProgressAt: new Date().toISOString(),
                bytesDownloaded,
                phase: "failed",
                lastError:
                  err instanceof Error ? err.message : "Unknown transfer error",
              },
            },
          })
          .where(
            sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
          );
        console.error(
          `[${meetingId}] Single-part upload failed:`,
          err instanceof Error ? err.message : err,
        );
        throw err;
      } finally {
        clearAbortTimer();
      }
    }
  } else {
    const buf = Buffer.from(await downloadRes.arrayBuffer());
    fileSize = buf.byteLength;
    await db
      .update(externalMeetings)
      .set({
        metadata: {
          ...meta,
          pendingDownload: {
            ...pending,
            startedAt,
            lastProgressAt: new Date().toISOString(),
            bytesDownloaded: fileSize,
            phase: "uploading",
            lastError: null,
          },
        },
      })
      .where(
        sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
      );

    console.log(`[${meetingId}] Uploading buffered source to R2`);
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: buf,
        ContentType: mimeType,
        ContentLength: fileSize,
      }),
    );
    console.log(`[${meetingId}] Buffered upload completed`);
  }

  await db.insert(meetingFiles).values({
    meetingId,
    bucketName: env.S3_BUCKET,
    storageKey,
    fileName,
    mimeType,
    fileSize,
    durationSeconds: durationSeconds ?? null,
    uploadStatus: "completed",
    processingStatus: "queued",
  });

  const { pendingDownload: _pd, ...restMeta } = meta;
  await db
    .update(externalMeetings)
    .set({ metadata: restMeta })
    .where(
      sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
    );
  console.log(`[${meetingId}] Integration recording stored at ${storageKey}`);
}

// --- AI activities (thin wrappers around provider layer) ---

export async function extractAudioFromVideo(
  storageKey: string,
): Promise<string> {
  // For MVP, pass video directly - Whisper handles common video formats
  console.log(
    `[extractAudio] Passing video through for transcription: ${storageKey}`,
  );
  return storageKey;
}

export async function transcribeAudio(
  audioKey: string,
  language?: string | null,
): Promise<TranscriptionResult> {
  try {
    return await transcribeMeeting(audioKey, language ?? undefined);
  } catch (err) {
    if (err instanceof ProviderError) {
      // Deterministic failures: same audio will produce the same result on retry.
      // Mark non-retryable so Temporal does not waste attempts.
      if (err.code === "EMPTY_TRANSCRIPT" || err.code === "MISSING_API_KEY") {
        throw ApplicationFailure.nonRetryable(err.message, err.code);
      }
    }
    // Infra/network errors stay retryable (default Temporal behaviour).
    throw err;
  }
}

export async function generateExtractionResult(
  transcript: string,
): Promise<ExtractionResult> {
  return extractMeetingData(transcript);
}

// Cloudflare R2 - worker downloads raw files for processing, then deletes them.
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

// --- Persistence ---

export async function saveProcessingResults(
  meetingId: string,
  userId: string,
  results: ProcessingResult,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(meetings)
      .set({ transcriptText: results.transcript })
      .where(eq(meetings.id, meetingId));

    const existing = await tx.query.meetingSummaries.findFirst({
      where: eq(meetingSummaries.meetingId, meetingId),
    });

    const summaryData = {
      summaryMd: results.summary,
      decisionsMd: results.decisions,
      blockersMd: results.blockers,
      followupsMd: results.followups,
      modelName: results.extractionModel ?? "unknown",
    };

    if (existing) {
      await tx
        .update(meetingSummaries)
        .set(summaryData)
        .where(eq(meetingSummaries.meetingId, meetingId));
    } else {
      await tx.insert(meetingSummaries).values({ meetingId, ...summaryData });
    }

    if (results.actionItems.length > 0) {
      const existingItems = await tx.query.actionItems.findMany({
        where: eq(actionItems.meetingId, meetingId),
        columns: { title: true },
      });
      const seenTitles = new Set(
        existingItems.map((item) => normalizeTaskTitle(item.title)),
      );
      const newItems = results.actionItems.filter((item) => {
        const key = normalizeTaskTitle(item.title);
        if (!key || seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });

      if (newItems.length > 0) {
        await tx.insert(actionItems).values(
          newItems.map((item) => ({
            meetingId,
            userId,
            title: item.title,
            ownerName: item.ownerName ?? null,
            assigneeEmail: normalizeEmail(item.assigneeEmail),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            priority: item.priority ?? "normal",
            status: item.status ?? "open",
            source: "ai",
            aiConfidence:
              typeof item.confidence === "number"
                ? String(Math.max(0, Math.min(1, item.confidence)))
                : null,
          })),
        );
      }
    }
  });

  console.log(
    `[${meetingId}] Saved results (${results.actionItems.length} action items, extraction: ${results.extractionProvider ?? "unknown"}, transcription: ${results.transcriptionProvider ?? "n/a"})`,
  );

  indexMeetingMemory(meetingId, userId).catch((err) => {
    console.error(`[${meetingId}] Memory indexing failed (non-fatal):`, err);
  });
}

// --- Notifications ---

export async function notifyMeetingReady(meetingId: string): Promise<void> {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    columns: { id: true, title: true, userId: true },
    with: {
      actionItems: { columns: { status: true } },
    },
  });
  if (!meeting) return;

  const user = await db.query.users.findFirst({
    where: eq(users.id, meeting.userId),
    columns: { email: true, name: true },
  });
  if (!user?.email) return;

  const appUrl = env.APP_URL ?? "https://app.imeetly.app";
  const meetingUrl = `${appUrl}/meetings/${meeting.id}`;
  const subject = `Your meeting notes are ready: ${meeting.title}`;
  const openItemCount =
    meeting.actionItems?.filter((i) => i.status !== "done").length ?? 0;
  const html = await render(
    MeetingReadyEmail({
      userName: user.name ?? null,
      meetingTitle: meeting.title,
      meetingUrl,
      openItemCount,
    }),
  );

  try {
    await sendOperationalEmail({ to: user.email, subject, html });
    console.log(`[${meetingId}] Meeting ready email sent to ${user.email}`);
  } catch (err) {
    console.warn(
      `[${meetingId}] Failed to send meeting ready email:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function sendActionItemReminders(): Promise<void> {
  const now = new Date();
  const appUrl = env.APP_URL ?? "https://app.imeetly.app";
  const pending = await db
    .select({
      id: actionItems.id,
      title: actionItems.title,
      userId: actionItems.userId,
      assigneeEmail: actionItems.assigneeEmail,
      dueDate: actionItems.dueDate,
      priority: actionItems.priority,
      meetingTitle: meetings.title,
    })
    .from(actionItems)
    .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
    .where(
      and(
        lte(actionItems.reminderAt, now),
        isNull(actionItems.reminderSentAt),
        inArray(actionItems.status, ["open", "in_progress", "blocked"]),
      ),
    )
    .limit(100);

  for (const item of pending) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, item.userId),
      columns: { email: true, name: true },
    });
    const to = item.assigneeEmail ?? user?.email;
    if (!to) continue;

    const taskUrl = `${appUrl}/action-items`;
    const html = await render(
      ActionItemReminderEmail({
        userName: user?.name ?? null,
        title: item.title,
        meetingTitle: item.meetingTitle,
        dueDate: formatDate(item.dueDate),
        priority: item.priority,
        taskUrl,
      }),
    );
    await sendOperationalEmail({
      to,
      subject: `Action item reminder: ${item.title}`,
      html,
    });

    await db
      .update(actionItems)
      .set({ reminderSentAt: new Date() })
      .where(
        and(eq(actionItems.id, item.id), isNull(actionItems.reminderSentAt)),
      );
  }
}

export async function sendOverdueActionItemDigests(): Promise<void> {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appUrl = env.APP_URL ?? "https://app.imeetly.app";
  const overdue = await db
    .select({
      id: actionItems.id,
      title: actionItems.title,
      userId: actionItems.userId,
      dueDate: actionItems.dueDate,
      priority: actionItems.priority,
      meetingTitle: meetings.title,
    })
    .from(actionItems)
    .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
    .where(
      and(
        lt(actionItems.dueDate, now),
        inArray(actionItems.status, ["open", "in_progress", "blocked"]),
        or(
          isNull(actionItems.overdueDigestSentAt),
          lt(actionItems.overdueDigestSentAt, today),
        ),
      ),
    )
    .orderBy(desc(actionItems.dueDate))
    .limit(500);

  const byUser = new Map<string, typeof overdue>();
  for (const item of overdue) {
    byUser.set(item.userId, [...(byUser.get(item.userId) ?? []), item]);
  }

  for (const [userId, items] of byUser) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true, name: true },
    });
    if (!user?.email) continue;

    const taskUrl = `${appUrl}/action-items?due=overdue`;
    const html = await render(
      OverdueActionItemsDigestEmail({
        userName: user.name ?? null,
        items: items.map((item) => ({
          title: item.title,
          meetingTitle: item.meetingTitle,
          dueDate: formatDate(item.dueDate),
          priority: item.priority,
        })),
        taskUrl,
      }),
    );
    await sendOperationalEmail({
      to: user.email,
      subject: `${items.length} overdue action item${items.length === 1 ? "" : "s"}`,
      html,
    });

    await db
      .update(actionItems)
      .set({ overdueDigestSentAt: new Date() })
      .where(
        and(
          eq(actionItems.userId, userId),
          lt(actionItems.dueDate, now),
          inArray(actionItems.status, ["open", "in_progress", "blocked"]),
        ),
      );
  }
}

export async function sendWeeklyActionItemRecaps(): Promise<void> {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const appUrl = env.APP_URL ?? "https://app.imeetly.app";

  const usersWithTasks = await db
    .selectDistinct({ userId: actionItems.userId })
    .from(actionItems)
    .where(
      or(
        inArray(actionItems.status, ["open", "in_progress", "blocked"]),
        gte(actionItems.completedAt, weekAgo),
      ),
    );

  for (const row of usersWithTasks) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, row.userId),
      columns: { email: true, name: true },
    });
    if (!user?.email) continue;

    const items = await db.query.actionItems.findMany({
      where: eq(actionItems.userId, row.userId),
      columns: {
        title: true,
        dueDate: true,
        status: true,
        completedAt: true,
      },
    });
    const completed = items.filter(
      (item) => item.completedAt && item.completedAt >= weekAgo,
    );
    const overdue = items.filter(
      (item) =>
        item.dueDate &&
        item.dueDate < now &&
        ["open", "in_progress", "blocked"].includes(item.status),
    );
    const upcoming = items.filter(
      (item) =>
        item.dueDate &&
        item.dueDate >= now &&
        item.dueDate <= weekAhead &&
        ["open", "in_progress", "blocked"].includes(item.status),
    );
    if (
      completed.length === 0 &&
      overdue.length === 0 &&
      upcoming.length === 0
    ) {
      continue;
    }

    const html = await render(
      WeeklyActionItemRecapEmail({
        userName: user.name ?? null,
        completedCount: completed.length,
        overdueCount: overdue.length,
        upcomingCount: upcoming.length,
        taskUrl: `${appUrl}/action-items`,
      }),
    );
    await sendOperationalEmail({
      to: user.email,
      subject: "Your weekly imeetly task recap",
      html,
    });
  }
}

// --- Cleanup ---

export async function deleteSourceFile(meetingId: string): Promise<void> {
  const files = await db.query.meetingFiles.findMany({
    where: eq(meetingFiles.meetingId, meetingId),
  });

  for (const file of files) {
    if (file.retentionStatus === "deleted") continue;

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: file.bucketName,
          Key: file.storageKey,
        }),
      );

      await db
        .update(meetingFiles)
        .set({
          retentionStatus: "deleted",
          deletedAt: new Date(),
        })
        .where(eq(meetingFiles.id, file.id));

      console.log(`[${meetingId}] Deleted source file: ${file.storageKey}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[${meetingId}] Failed to delete source file ${file.storageKey}: ${msg}`,
      );
      // Mark as pending_deletion so a cleanup job can retry later
      await db
        .update(meetingFiles)
        .set({ retentionStatus: "pending_deletion" })
        .where(eq(meetingFiles.id, file.id));
    }
  }
}
