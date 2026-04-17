import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import { actionItems, meetingFiles, meetings, meetingSummaries, } from "@repo/db/schemas/app";
import { env } from "@repo/env";
import {
  abortR2MultipartUpload,
  completeR2MultipartUpload,
  createPresignedPartUrl,
  createPresignedUploadUrl,
  initiateMultipartUpload,
} from "@repo/server/lib/s3";
import { startMeetingProcessing } from "@repo/server/lib/temporal";
import { getPlanLimits } from "@repo/server/modules/billing/plans";
import { BillingService } from "@repo/server/modules/billing/service";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

export abstract class MeetingService {
  static async checkUsageLimit(userId: string) {
    const {plan, currentPeriodStart, currentPeriodEnd} =
      await BillingService.resolveUserPlan(userId);
    const {meetingsPerMonth: limit} = getPlanLimits(plan);

    if (limit === -1) return; // unlimited

    const {count} = await BillingService.getUserUsage(
      userId,
      "meetings_created",
      {start: currentPeriodStart, end: currentPeriodEnd},
    );

    if (count >= limit) {
      throw new ORPCError("FORBIDDEN", {
        message: `Monthly meeting limit reached (${count}/${limit}). Upgrade your plan for more.`,
        data: {code: "PLAN_LIMIT_REACHED", plan, used: count, limit},
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

    const [items, [{count}]] = await Promise.all([
      db
        .select()
        .from(meetings)
        .where(where)
        .orderBy(desc(meetings.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db
        .select({count: sql<number>`count(*)::int`})
        .from(meetings)
        .where(where),
    ]);

    return {items, total: count};
  }

  static async getById(userId: string, meetingId: string) {
    return (
      (await db.query.meetings.findFirst({
        where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
        with: {
          files: true,
          summary: true,
          actionItems: {
            orderBy: [asc(actionItems.createdAt)],
          },
        },
      })) ?? null
    );
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
        ...(input.title && {title: input.title}),
        ...(input.meetingDate && {meetingDate: new Date(input.meetingDate)}),
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

    const {plan} = await BillingService.resolveUserPlan(userId);
    const {priorityProcessing} = getPlanLimits(plan);

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

    return {meetingId, status: "queued" as const};
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
      columns: {id: true},
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
      columns: {id: true},
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
      throw new ORPCError("NOT_FOUND", {message: "Meeting not found"});
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
      headers: {"Content-Type": input.mimeType},
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
      throw new ORPCError("NOT_FOUND", {message: "Meeting not found"});
    }

    await db
      .update(meetingFiles)
      .set({uploadStatus: "completed"})
      .where(eq(meetingFiles.id, input.fileId));

    return MeetingService._triggerProcessing(userId, input.meetingId);
  }

  private static async _triggerProcessing(userId: string, meetingId: string) {
    const {plan} = await BillingService.resolveUserPlan(userId);
    const {priorityProcessing} = getPlanLimits(plan);

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
      throw new ORPCError("NOT_FOUND", {message: "Meeting not found"});
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
      throw new ORPCError("NOT_FOUND", {message: "Meeting not found"});
    }

    const file = await db.query.meetingFiles.findFirst({
      where: and(
        eq(meetingFiles.id, input.fileId),
        eq(meetingFiles.meetingId, input.meetingId),
      ),
    });
    if (!file?.uploadId) {
      throw new ORPCError("NOT_FOUND", {message: "Upload not found"});
    }
    if (file.uploadStatus !== "pending" && file.uploadStatus !== "uploading") {
      throw new ORPCError("BAD_REQUEST", {
        message: `Upload is already ${file.uploadStatus}`,
      });
    }

    if (file.uploadStatus === "pending") {
      await db
        .update(meetingFiles)
        .set({uploadStatus: "uploading"})
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
      throw new ORPCError("NOT_FOUND", {message: "Meeting not found"});
    }

    const file = await db.query.meetingFiles.findFirst({
      where: and(
        eq(meetingFiles.id, input.fileId),
        eq(meetingFiles.meetingId, input.meetingId),
      ),
    });
    if (!file?.uploadId) {
      throw new ORPCError("NOT_FOUND", {message: "Upload not found"});
    }

    await completeR2MultipartUpload(
      file.storageKey,
      file.uploadId,
      input.parts,
    );

    await db
      .update(meetingFiles)
      .set({uploadStatus: "completed"})
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
      throw new ORPCError("NOT_FOUND", {message: "Meeting not found"});
    }

    const file = await db.query.meetingFiles.findFirst({
      where: and(
        eq(meetingFiles.id, input.fileId),
        eq(meetingFiles.meetingId, input.meetingId),
      ),
    });
    if (!file?.uploadId) {
      throw new ORPCError("NOT_FOUND", {message: "Upload not found"});
    }

    await abortR2MultipartUpload(file.storageKey, file.uploadId);

    await db
      .update(meetingFiles)
      .set({uploadStatus: "failed"})
      .where(eq(meetingFiles.id, input.fileId));

    return {success: true};
  }

  static async getUsage(userId: string) {
    const {plan, currentPeriodStart, currentPeriodEnd} =
      await BillingService.resolveUserPlan(userId);
    const limits = getPlanLimits(plan);

    const {count} = await BillingService.getUserUsage(
      userId,
      "meetings_created",
      {start: currentPeriodStart, end: currentPeriodEnd},
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
      .select({count: sql<number>`count(*)::int`})
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          sql`${meetings.createdAt} >= ${startOfMonth}`,
        ),
      );

    const [processingNow] = await db
      .select({count: sql<number>`count(*)::int`})
      .from(meetings)
      .where(
        and(
          eq(meetings.userId, userId),
          or(eq(meetings.status, "pending"), eq(meetings.status, "processing")),
        ),
      );

    const [completedMeetings] = await db
      .select({count: sql<number>`count(*)::int`})
      .from(meetings)
      .where(
        and(eq(meetings.userId, userId), eq(meetings.status, "completed")),
      );

    const [openActions] = await db
      .select({count: sql<number>`count(*)::int`})
      .from(actionItems)
      .where(
        and(eq(actionItems.userId, userId), eq(actionItems.status, "open")),
      );

    return {
      meetingsThisMonth: meetingsThisMonth.count,
      processingNow: processingNow.count,
      completedMeetings: completedMeetings.count,
      openActionItems: openActions.count,
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
}
