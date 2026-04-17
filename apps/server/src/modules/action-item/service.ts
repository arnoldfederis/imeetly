import { db } from "@repo/db";
import { actionItems, meetings } from "@repo/db/schemas/app";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

export abstract class ActionItemService {
  static async update(
    userId: string,
    input: {
      id: string;
      title?: string;
      ownerName?: string;
      dueDate?: string | null;
      status?: string;
    },
  ) {
    const item = await db.query.actionItems.findFirst({
      where: and(eq(actionItems.id, input.id), eq(actionItems.userId, userId)),
    });
    if (!item) return null;

    const [updated] = await db
      .update(actionItems)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.ownerName !== undefined && { ownerName: input.ownerName }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
        ...(input.status !== undefined && { status: input.status }),
      })
      .where(eq(actionItems.id, input.id))
      .returning();

    return updated;
  }

  static async remove(userId: string, itemId: string) {
    const item = await db.query.actionItems.findFirst({
      where: and(eq(actionItems.id, itemId), eq(actionItems.userId, userId)),
    });
    if (!item) return null;

    const [deleted] = await db
      .delete(actionItems)
      .where(eq(actionItems.id, itemId))
      .returning();

    return deleted;
  }

  static async listForUser(
    userId: string,
    opts: { status?: string; search?: string; limit?: number; offset?: number } = {},
  ) {
    const { status, search, limit = 30, offset = 0 } = opts;

    const conditions = [eq(actionItems.userId, userId)];
    if (status) conditions.push(eq(actionItems.status, status));
    if (search) {
      conditions.push(
        or(
          ilike(actionItems.title, `%${search}%`),
          ilike(meetings.title, `%${search}%`),
          ilike(actionItems.ownerName, `%${search}%`),
        ) as ReturnType<typeof eq>,
      );
    }

    const where = and(...conditions);

    const [{ total }] = await db
      .select({ total: sql<number>`cast(${count()} as int)` })
      .from(actionItems)
      .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
      .where(where);

    const items = await db
      .select({
        id: actionItems.id,
        meetingId: actionItems.meetingId,
        title: actionItems.title,
        ownerName: actionItems.ownerName,
        dueDate: actionItems.dueDate,
        status: actionItems.status,
        createdAt: actionItems.createdAt,
        meetingTitle: meetings.title,
      })
      .from(actionItems)
      .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
      .where(where)
      .orderBy(desc(actionItems.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total };
  }
}
