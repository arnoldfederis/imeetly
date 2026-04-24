import { db } from "@repo/db";
import { meetingFiles, meetings, subscriptions } from "@repo/db/schemas/app";
import { users, verifications } from "@repo/db/schemas/auth";
import { polarClient } from "@repo/server/lib/polar-client";
import { deleteObject } from "@repo/server/lib/s3";
import { and, eq, ne, sql } from "drizzle-orm";

/**
 * Account lifecycle operations - deletion, data cleanup, and impact summary.
 *
 * Deletion strategy:
 * - Delete Polar customer (cancels subscriptions + revokes benefits)
 * - Delete remaining raw files from object storage (R2)
 * - Delete auth verifications by email (not FK-linked to users)
 * - Delete user row - all other data cascades via FK onDelete: "cascade":
 *   sessions, accounts, passkeys, members, teamMembers, invitations,
 *   meetings (→ meetingFiles, meetingSummaries), actionItems,
 *   subscriptions, usageTracking
 */
export abstract class AccountService {
  /**
   * Returns a summary of what will be affected by account deletion.
   */
  static async getDeletionImpact(userId: string) {
    const [meetingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(meetings)
      .where(eq(meetings.userId, userId));

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    // Count files still in storage (not yet deleted by processing cleanup)
    const activeFiles = await db
      .select({ storageKey: meetingFiles.storageKey })
      .from(meetingFiles)
      .innerJoin(meetings, eq(meetingFiles.meetingId, meetings.id))
      .where(
        and(
          eq(meetings.userId, userId),
          ne(meetingFiles.retentionStatus, "deleted"),
        ),
      );

    return {
      meetingCount: Number(meetingCount?.count ?? 0),
      hasActiveSubscription:
        sub?.status === "active" || sub?.status === "past_due",
      plan: sub?.plan ?? "free",
      activeFileCount: activeFiles.length,
    };
  }

  /**
   * Permanently deletes a user account and all associated data.
   *
   * Order of operations:
   * 1. Delete Polar customer (cancels subscriptions + revokes benefits)
   * 2. Delete remaining raw files from R2
   * 3. Delete email verifications
   * 4. Delete user row (cascades all relational data)
   *
   * This is intentionally synchronous (not a background job) because:
   * - The data volume per user is bounded
   * - S3 deletes are fast (individual object deletes)
   * - Immediate feedback is better UX for account deletion
   * - Avoids complexity of job state management for a rare operation
   */
  static async deleteAccount(userId: string, userEmail: string) {
    console.log(`[account] Starting account deletion for user ${userId}`);

    // 1. Delete Polar customer (cancels subscriptions + revokes benefits)
    await AccountService._deletePolarCustomer(userId);

    // 2. Delete remaining raw files from object storage
    await AccountService._deleteStorageFiles(userId);

    // 3. Delete email verifications (not FK-linked to users table)
    await db
      .delete(verifications)
      .where(eq(verifications.identifier, userEmail));
    console.log(`[account] Deleted verifications for email ${userEmail}`);

    // 4. Delete user row - cascades all relational data
    const result = await db.delete(users).where(eq(users.id, userId));

    if (result.rowCount === 0) {
      console.error(`[account] User ${userId} not found during deletion`);
      throw new Error("User not found");
    }

    console.log(`[account] Account deletion completed for user ${userId}`);
    return { deleted: true };
  }

  /**
   * Deletes the Polar customer by external ID (userId).
   * This automatically cancels active subscriptions and revokes benefits.
   * Best-effort: logs failures but does not block account deletion.
   */
  private static async _deletePolarCustomer(userId: string) {
    try {
      await polarClient.customers.deleteExternal({
        externalId: userId,
      });
      console.log(`[account] Deleted Polar customer for user ${userId}`);
    } catch (err) {
      // Log but don't block deletion - customer may not exist in Polar
      // (e.g. free user who never checked out).
      console.error(
        `[account] Failed to delete Polar customer for user ${userId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  /**
   * Deletes all remaining raw files from R2 for a user's meetings.
   * Only targets files not already cleaned up by processing (retentionStatus != "deleted").
   * Best-effort per file: individual failures are logged but don't block deletion.
   */
  private static async _deleteStorageFiles(userId: string) {
    const files = await db
      .select({
        id: meetingFiles.id,
        storageKey: meetingFiles.storageKey,
      })
      .from(meetingFiles)
      .innerJoin(meetings, eq(meetingFiles.meetingId, meetings.id))
      .where(
        and(
          eq(meetings.userId, userId),
          ne(meetingFiles.retentionStatus, "deleted"),
        ),
      );

    if (files.length === 0) {
      console.log(`[account] No storage files to clean up for user ${userId}`);
      return;
    }

    console.log(
      `[account] Deleting ${files.length} storage file(s) for user ${userId}`,
    );

    let deleted = 0;
    let failed = 0;

    for (const file of files) {
      try {
        await deleteObject(file.storageKey);
        deleted++;
      } catch (err) {
        failed++;
        console.error(
          `[account] Failed to delete S3 object ${file.storageKey}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    console.log(
      `[account] Storage cleanup: ${deleted} deleted, ${failed} failed`,
    );
  }
}
