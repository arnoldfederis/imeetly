import { ORPCError } from "@orpc/server";
import { db } from "@repo/db";
import { feedback } from "@repo/db/schemas/app";
import { createPresignedUploadUrl, deleteObject } from "@repo/server/lib/s3";
import { base, privateProcedure } from "@repo/server/procedure";
import { and, count, desc, eq, gt, ilike } from "drizzle-orm";
import { z } from "zod";

const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const fileSchema = z.object({
  key: z.string(),
  name: z.string().max(255),
  mimeType: z.string(),
  size: z.number().int().positive(),
});

export const feedbackController = base.router({
  get: privateProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .select()
        .from(feedback)
        .where(
          and(eq(feedback.id, input.id), eq(feedback.userId, context.user.id)),
        )
        .limit(1);
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Feedback not found." });
      }
      return row;
    }),

  list: privateProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: z.enum(["feedback", "bug", "feature"]).optional(),
        })
        .optional(),
    )
    .handler(async ({ input, context }) => {
      const conditions = [eq(feedback.userId, context.user.id)];
      if (input?.type) {
        conditions.push(eq(feedback.type, input.type));
      }
      if (input?.search?.trim()) {
        conditions.push(ilike(feedback.message, `%${input.search.trim()}%`));
      }
      return db
        .select()
        .from(feedback)
        .where(and(...conditions))
        .orderBy(desc(feedback.createdAt));
    }),

  getUploadUrl: privateProcedure
    .input(
      z.object({
        feedbackId: z.string(),
        fileName: z.string().max(255),
        mimeType: z.string(),
        size: z.number().int().positive(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (input.size > MAX_FILE_SIZE) {
        throw new ORPCError("BAD_REQUEST", {
          message: "File too large (max 100MB).",
        });
      }
      const [row] = await db
        .select({ id: feedback.id })
        .from(feedback)
        .where(
          and(
            eq(feedback.id, input.feedbackId),
            eq(feedback.userId, context.user.id),
          ),
        )
        .limit(1);
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Feedback not found." });
      }
      const key = `feedbacks/${input.feedbackId}/${input.fileName}`;
      const uploadUrl = await createPresignedUploadUrl(
        key,
        input.mimeType,
        300,
      );
      return { uploadUrl, key };
    }),

  update: privateProcedure
    .input(
      z.object({
        id: z.string(),
        message: z.string().min(1).max(2000),
        rating: z.number().int().min(1).max(5).optional(),
        files: z.array(fileSchema).max(5).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [row] = await db
        .select({ id: feedback.id, files: feedback.files })
        .from(feedback)
        .where(
          and(eq(feedback.id, input.id), eq(feedback.userId, context.user.id)),
        )
        .limit(1);
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Feedback not found." });
      }

      const newKeys = new Set((input.files ?? []).map((f) => f.key));
      const removedKeys = ((row.files ?? []) as Array<{ key: string }>)
        .map((f) => f.key)
        .filter((k) => !newKeys.has(k));
      if (removedKeys.length > 0) {
        await Promise.allSettled(removedKeys.map((k) => deleteObject(k)));
      }

      await db
        .update(feedback)
        .set({
          message: input.message.trim(),
          rating: input.rating ?? null,
          files: input.files?.length ? input.files : null,
        })
        .where(eq(feedback.id, input.id));
      return { ok: true };
    }),

  submit: privateProcedure
    .input(
      z.object({
        type: z.enum(["feedback", "bug", "feature"]).default("feedback"),
        message: z.string().min(1).max(2000),
        rating: z.number().int().min(1).max(5).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.user.id;
      const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

      const [{ value: recentCount }] = await db
        .select({ value: count() })
        .from(feedback)
        .where(and(eq(feedback.userId, userId), gt(feedback.createdAt, since)));

      if (recentCount >= RATE_LIMIT) {
        throw new ORPCError("TOO_MANY_REQUESTS", {
          message: "You can submit up to 3 feedback entries per day.",
        });
      }

      const [row] = await db
        .insert(feedback)
        .values({
          userId,
          type: input.type,
          message: input.message.trim(),
          rating: input.rating ?? null,
        })
        .returning({ id: feedback.id });

      return { id: row?.id };
    }),
});
