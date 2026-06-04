import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import {
  actionItems,
  externalMeetings,
  meetingFiles,
  meetingSummaries,
  meetings,
} from "@repo/db/schemas/app";
import { env } from "@repo/env";
import {
  abortR2MultipartUpload,
  completeR2MultipartUpload,
  createPresignedPartUrl,
  createPresignedUploadUrl,
  deleteObject,
  initiateMultipartUpload,
} from "@repo/server/lib/s3";
import {
  startMeetingProcessing,
  terminateMeetingWorkflow,
} from "@repo/server/lib/temporal";
import { getPlanLimits } from "@repo/server/modules/billing/plans";
import { BillingService } from "@repo/server/modules/billing/service";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

export abstract class MeetingService {
  private static async getIntegrationDownloadState(
    userId: string,
    meetingId: string,
  ) {
    const [extMeeting] = await db
      .select({
        provider: externalMeetings.provider,
        status: externalMeetings.status,
        metadata: externalMeetings.metadata,
      })
      .from(externalMeetings)
      .where(
        and(
          eq(externalMeetings.userId, userId),
          sql`${externalMeetings.metadata}->>'imeetlyMeetingId' = ${meetingId}`,
        ),
      )
      .limit(1);

    if (!extMeeting) return null;

    const metadata = extMeeting.metadata as Record<string, unknown>;
    const pending = metadata.pendingDownload as
      | {
          sizeBytes?: number | null;
          durationSeconds?: number | null;
          bytesDownloaded?: number | null;
          startedAt?: string | null;
          lastProgressAt?: string | null;
          phase?: string | null;
          lastError?: string | null;
        }
      | undefined;

    if (!pending) return null;

    const sizeBytes =
      typeof pending.sizeBytes === "number" ? pending.sizeBytes : null;
    const bytesDownloaded =
      typeof pending.bytesDownloaded === "number" ? pending.bytesDownloaded : 0;

    return {
      provider: extMeeting.provider,
      externalStatus: extMeeting.status,
      sizeBytes,
      durationSeconds:
        typeof pending.durationSeconds === "number"
          ? pending.durationSeconds
          : null,
      bytesDownloaded,
      progressPercent:
        sizeBytes && sizeBytes > 0
          ? Math.max(
              0,
              Math.min(100, Math.round((bytesDownloaded / sizeBytes) * 100)),
            )
          : null,
      startedAt: pending.startedAt ?? null,
      lastProgressAt: pending.lastProgressAt ?? null,
      phase: typeof pending.phase === "string" ? pending.phase : null,
      lastError:
        typeof pending.lastError === "string" ? pending.lastError : null,
    };
  }

  static async checkUsageLimit(userId: string) {
    const { plan, currentPeriodStart, currentPeriodEnd } =
      await BillingService.resolveUserPlan(userId);
    const { meetingsPerMonth: limit } = getPlanLimits(plan);

    if (limit === -1) return; // unlimited

    const { count } = await BillingService.getUserUsage(
      userId,
      "meetings_created",
      { start: currentPeriodStart, end: currentPeriodEnd },
    );

    if (count >= limit) {
      throw new ORPCError("FORBIDDEN", {
        message: `Monthly meeting limit reached (${count}/${limit}). Upgrade your plan for more.`,
        data: { code: "PLAN_LIMIT_REACHED", plan, used: count, limit },
      });
    }
  }

  static async create(
    userId: string,
    input: {
      title: string;
      meetingDate: string;
      participantsText?: string;
      sourceType: string;
      transcriptText?: string;
      language?: string;
    },
  ) {
    await MeetingService.checkUsageLimit(userId);

    const [meeting] = await db
      .insert(meetings)
      .values({
        userId,
        title: input.title,
        meetingDate: new Date(input.meetingDate),
        participantsText: input.participantsText,
        sourceType: input.sourceType,
        transcriptText: input.transcriptText,
        language: input.language || null,
        status:
          input.sourceType === "text" && input.transcriptText
            ? "pending"
            : "draft",
      })
      .returning();

    return meeting;
  }

  static async list(
    userId: string,
    query: {
      search?: string;
      status?: string;
      limit: number;
      offset: number;
    },
  ) {
    const conditions = [eq(meetings.userId, userId)];

    if (query.status) {
      conditions.push(eq(meetings.status, query.status));
    }

    if (query.search) {
      const pattern = `%${query.search}%`;
      const searchCondition = or(
        ilike(meetings.title, pattern),
        ilike(meetings.participantsText, pattern),
        ilike(meetings.transcriptText, pattern),
        sql`exists (
          select 1
          from ${meetingSummaries}
          where ${meetingSummaries.meetingId} = ${meetings.id}
            and (
              ${meetingSummaries.summaryMd} ilike ${pattern}
              or ${meetingSummaries.decisionsMd} ilike ${pattern}
              or ${meetingSummaries.blockersMd} ilike ${pattern}
              or ${meetingSummaries.followupsMd} ilike ${pattern}
            )
        )`,
        sql`exists (
          select 1
          from ${actionItems}
          where ${actionItems.meetingId} = ${meetings.id}
            and (
              ${actionItems.title} ilike ${pattern}
              or ${actionItems.ownerName} ilike ${pattern}
            )
        )`,
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(meetings)
        .where(where)
        .orderBy(desc(meetings.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(meetings)
        .where(where),
    ]);

    return { items, total: count };
  }

  static async getById(userId: string, meetingId: string) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
      with: {
        files: true,
        summary: true,
        actionItems: {
          orderBy: [asc(actionItems.createdAt)],
        },
      },
    });

    if (!meeting) return null;

    return {
      ...meeting,
      integrationDownload: await MeetingService.getIntegrationDownloadState(
        userId,
        meetingId,
      ),
    };
  }

  static async update(
    userId: string,
    input: {
      id: string;
      title?: string;
      meetingDate?: string;
      participantsText?: string;
      transcriptText?: string;
    },
  ) {
    const [updated] = await db
      .update(meetings)
      .set({
        ...(input.title && { title: input.title }),
        ...(input.meetingDate && { meetingDate: new Date(input.meetingDate) }),
        ...(input.participantsText !== undefined && {
          participantsText: input.participantsText,
        }),
        ...(input.transcriptText !== undefined && {
          transcriptText: input.transcriptText,
        }),
      })
      .where(and(eq(meetings.id, input.id), eq(meetings.userId, userId)))
      .returning();

    return updated ?? null;
  }

  static async remove(userId: string, meetingId: string) {
    await terminateMeetingWorkflow(meetingId).catch((err) =>
      console.warn(
        `[meeting.remove] Temporal terminate failed: ${err instanceof Error ? err.message : err}`,
      ),
    );

    const files = await db.query.meetingFiles.findMany({
      where: eq(meetingFiles.meetingId, meetingId),
    });

    for (const file of files) {
      if (file.retentionStatus === "deleted") continue;
      try {
        await deleteObject(file.storageKey);
      } catch (err) {
        console.warn(
          `[meeting.remove] S3 delete failed for ${file.storageKey}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    const [deleted] = await db
      .delete(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
      .returning();

    return deleted ?? null;
  }

  static async process(userId: string, meetingId: string) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) return null;

    const { plan } = await BillingService.resolveUserPlan(userId);
    const { priorityProcessing } = getPlanLimits(plan);

    await db
      .update(meetings)
      .set({
        status: "pending",
        processingStatus: "queued",
        failureReason: null,
      })
      .where(eq(meetings.id, meetingId));

    try {
      await startMeetingProcessing(meetingId, {
        priority: priorityProcessing,
      });
    } catch (err) {
      // Revert status so user can retry
      const reason =
        err instanceof Error ? err.message : "Failed to start processing";
      await db
        .update(meetings)
        .set({
          status: "failed",
          processingStatus: "failed",
          failureReason: reason,
        })
        .where(eq(meetings.id, meetingId));

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          "Failed to start meeting processing. Please try again. This attempt was not counted towards your monthly quota.",
      });
    }

    // Only count usage after processing successfully starts
    await BillingService.incrementUsage(userId, "meetings_created");

    return { meetingId, status: "queued" as const };
  }

  static async getStatus(userId: string, meetingId: string) {
    return (
      (await db.query.meetings.findFirst({
        where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
        columns: {
          id: true,
          status: true,
          processingStatus: true,
        },
      })) ?? null
    );
  }

  static async getSummary(userId: string, meetingId: string) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
      columns: { id: true },
    });
    if (!meeting) return null;

    return (
      (await db.query.meetingSummaries.findFirst({
        where: eq(meetingSummaries.meetingId, meetingId),
      })) ?? null
    );
  }

  static async updateSummary(
    userId: string,
    input: {
      meetingId: string;
      summaryMd?: string;
      decisionsMd?: string;
      blockersMd?: string;
      followupsMd?: string;
    },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
      columns: { id: true },
    });
    if (!meeting) return null;

    const existing = await db.query.meetingSummaries.findFirst({
      where: eq(meetingSummaries.meetingId, input.meetingId),
    });

    if (existing) {
      const [updated] = await db
        .update(meetingSummaries)
        .set({
          summaryMd: input.summaryMd,
          decisionsMd: input.decisionsMd,
          blockersMd: input.blockersMd,
          followupsMd: input.followupsMd,
        })
        .where(eq(meetingSummaries.meetingId, input.meetingId))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(meetingSummaries)
      .values({
        meetingId: input.meetingId,
        summaryMd: input.summaryMd,
        decisionsMd: input.decisionsMd,
        blockersMd: input.blockersMd,
        followupsMd: input.followupsMd,
      })
      .returning();
    return created;
  }

  static async requestUpload(
    userId: string,
    input: {
      meetingId: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
    },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    // Storage key: userId/yyyy/mm/meetingId/original-filename
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const storageKey = `${userId}/${yyyy}/${mm}/${input.meetingId}/${input.fileName}`;

    const [file] = await db
      .insert(meetingFiles)
      .values({
        meetingId: input.meetingId,
        bucketName: env.S3_BUCKET,
        storageKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadStatus: "pending",
      })
      .returning();

    const uploadUrl = await createPresignedUploadUrl(
      storageKey,
      input.mimeType,
    );

    return {
      fileId: file.id,
      storageKey,
      uploadUrl,
      method: "PUT" as const,
      headers: { "Content-Type": input.mimeType },
    };
  }

  static async completeUpload(
    userId: string,
    input: { meetingId: string; fileId: string },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    await db
      .update(meetingFiles)
      .set({ uploadStatus: "completed" })
      .where(eq(meetingFiles.id, input.fileId));

    return MeetingService._triggerProcessing(userId, input.meetingId);
  }

  private static async _triggerProcessing(userId: string, meetingId: string) {
    const { plan } = await BillingService.resolveUserPlan(userId);
    const { priorityProcessing } = getPlanLimits(plan);

    await db
      .update(meetings)
      .set({
        status: "pending",
        processingStatus: "queued",
        failureReason: null,
      })
      .where(eq(meetings.id, meetingId));

    try {
      const result = await startMeetingProcessing(meetingId, {
        priority: priorityProcessing,
      });

      await BillingService.incrementUsage(userId, "meetings_created");

      return {
        meetingId,
        status: "queued" as const,
        ...result,
      };
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Failed to start processing";
      await db
        .update(meetings)
        .set({
          status: "failed",
          processingStatus: "failed",
          failureReason: reason,
        })
        .where(eq(meetings.id, meetingId));

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          "Failed to start meeting processing. Please try again. This attempt was not counted towards your monthly quota.",
      });
    }
  }

  // --- Multipart upload ---

  static async initiateMultipartUpload(
    userId: string,
    input: {
      meetingId: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      totalParts: number;
    },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const storageKey = `${userId}/${yyyy}/${mm}/${input.meetingId}/${input.fileName}`;

    const uploadId = await initiateMultipartUpload(storageKey, input.mimeType);

    const [file] = await db
      .insert(meetingFiles)
      .values({
        meetingId: input.meetingId,
        bucketName: env.S3_BUCKET,
        storageKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadId,
        totalParts: input.totalParts,
        uploadStatus: "pending",
      })
      .returning();

    return {
      fileId: file.id,
      storageKey,
      uploadId,
    };
  }

  static async getPartUrls(
    userId: string,
    input: {
      meetingId: string;
      fileId: string;
      partNumbers: number[];
    },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    const file = await db.query.meetingFiles.findFirst({
      where: and(
        eq(meetingFiles.id, input.fileId),
        eq(meetingFiles.meetingId, input.meetingId),
      ),
    });
    if (!file?.uploadId) {
      throw new ORPCError("NOT_FOUND", { message: "Upload not found" });
    }
    if (file.uploadStatus !== "pending" && file.uploadStatus !== "uploading") {
      throw new ORPCError("BAD_REQUEST", {
        message: `Upload is already ${file.uploadStatus}`,
      });
    }

    if (file.uploadStatus === "pending") {
      await db
        .update(meetingFiles)
        .set({ uploadStatus: "uploading" })
        .where(eq(meetingFiles.id, input.fileId));
    }

    return await Promise.all(
      input.partNumbers.map(async (partNumber) => ({
        partNumber,
        url: await createPresignedPartUrl(
          file.storageKey,
          file.uploadId ?? "",
          partNumber,
        ),
      })),
    );
  }

  static async completeMultipartUpload(
    userId: string,
    input: {
      meetingId: string;
      fileId: string;
      parts: Array<{ partNumber: number; etag: string }>;
    },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    const file = await db.query.meetingFiles.findFirst({
      where: and(
        eq(meetingFiles.id, input.fileId),
        eq(meetingFiles.meetingId, input.meetingId),
      ),
    });
    if (!file?.uploadId) {
      throw new ORPCError("NOT_FOUND", { message: "Upload not found" });
    }

    await completeR2MultipartUpload(
      file.storageKey,
      file.uploadId,
      input.parts,
    );

    await db
      .update(meetingFiles)
      .set({ uploadStatus: "completed" })
      .where(eq(meetingFiles.id, input.fileId));

    return MeetingService._triggerProcessing(userId, input.meetingId);
  }

  static async abortMultipartUpload(
    userId: string,
    input: { meetingId: string; fileId: string },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
    });
    if (!meeting) {
      throw new ORPCError("NOT_FOUND", { message: "Meeting not found" });
    }

    const file = await db.query.meetingFiles.findFirst({
      where: and(
        eq(meetingFiles.id, input.fileId),
        eq(meetingFiles.meetingId, input.meetingId),
      ),
    });
    if (!file?.uploadId) {
      throw new ORPCError("NOT_FOUND", { message: "Upload not found" });
    }

    await abortR2MultipartUpload(file.storageKey, file.uploadId);

    await db
      .update(meetingFiles)
      .set({ uploadStatus: "failed" })
      .where(eq(meetingFiles.id, input.fileId));

    return { success: true };
  }

  static async getUsage(userId: string) {
    const { plan, currentPeriodStart, currentPeriodEnd } =
      await BillingService.resolveUserPlan(userId);
    const limits = getPlanLimits(plan);

    const { count } = await BillingService.getUserUsage(
      userId,
      "meetings_created",
      { start: currentPeriodStart, end: currentPeriodEnd },
    );

    return {
      plan,
      used: count,
      limit: limits.meetingsPerMonth,
      remaining:
        limits.meetingsPerMonth === -1
          ? -1
          : Math.max(0, limits.meetingsPerMonth - count),
    };
  }

  static async getDashboardStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [meetingsThisMonth] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          sql`${meetings.createdAt} >= ${startOfMonth}`,
        ),
      );

    const [processingNow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          or(eq(meetings.status, "pending"), eq(meetings.status, "processing")),
        ),
      );

    const [completedMeetings] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(meetings)
      .where(
        and(eq(meetings.userId, userId), eq(meetings.status, "completed")),
      );

    const [openActions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(actionItems)
      .where(
        and(eq(actionItems.userId, userId), eq(actionItems.status, "done")),
      );

    const [urgentActions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(actionItems)
      .where(
        and(
          eq(actionItems.userId, userId),
          eq(actionItems.priority, "urgent"),
          inArray(actionItems.status, ["open", "in_progress", "blocked"]),
        ),
      );

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [dueTodayActions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(actionItems)
      .where(
        and(
          eq(actionItems.userId, userId),
          inArray(actionItems.status, ["open", "in_progress", "blocked"]),
          sql`${actionItems.dueDate} >= ${todayStart} AND ${actionItems.dueDate} <= ${todayEnd}`,
        ),
      );

    return {
      meetingsThisMonth: meetingsThisMonth.count,
      processingNow: processingNow.count,
      completedMeetings: completedMeetings.count,
      doneActionItems: openActions.count,
      urgentActionItems: urgentActions.count,
      dueTodayActionItems: dueTodayActions.count,
    };
  }

  static async getRecentMeetings(userId: string, limit = 3) {
    return db
      .select()
      .from(meetings)
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.createdAt))
      .limit(limit);
  }

  static async generateShareToken(userId: string, meetingId: string) {
    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, meetingId),
        eq(meetings.userId, userId),
        eq(meetings.status, "completed"),
      ),
      columns: { id: true, shareToken: true },
    });
    if (!meeting) return null;

    if (meeting.shareToken) return meeting.shareToken;

    const token = crypto.randomUUID();
    await db
      .update(meetings)
      .set({ shareToken: token })
      .where(eq(meetings.id, meetingId));

    return token;
  }

  static async listPublicIndexed() {
    const rows = await db.query.meetings.findMany({
      where: and(
        eq(meetings.status, "completed"),
        eq(meetings.visibility, "public"),
      ),
      columns: {
        shareToken: true,
        title: true,
        updatedAt: true,
      },
    });
    return rows
      .filter((r) => r.shareToken)
      .map((r) => ({
        token: r.shareToken as string,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
      }));
  }

  static async setVisibility(
    userId: string,
    meetingId: string,
    visibility: "shared" | "public",
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, meetingId),
        eq(meetings.userId, userId),
        eq(meetings.status, "completed"),
      ),
      columns: { id: true, shareToken: true },
    });
    if (!meeting?.shareToken) return null;

    const [updated] = await db
      .update(meetings)
      .set({ visibility })
      .where(eq(meetings.id, meetingId))
      .returning();

    return updated?.visibility ?? null;
  }

  static async getByShareToken(token: string) {
    const meeting = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.shareToken, token),
        eq(meetings.status, "completed"),
      ),
      with: {
        summary: true,
        actionItems: {
          orderBy: [asc(actionItems.createdAt)],
        },
      },
    });
    if (!meeting) return null;

    const { transcriptText, shareToken, ...rest } = meeting;
    return rest;
  }
}
