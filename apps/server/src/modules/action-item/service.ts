import { db } from "@repo/db";
import { actionItems, meetings } from "@repo/db/schemas/app";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";

type ActionItemStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "done"
  | "canceled";
type ActionItemPriority = "low" | "normal" | "high" | "urgent";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function dateFromInput(value?: string | null) {
  return value ? new Date(value) : null;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

function sevenDaysFromNow() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

export abstract class ActionItemService {
  static async update(
    userId: string,
    input: {
      id: string;
      title?: string;
      ownerName?: string | null;
      assigneeUserId?: string | null;
      assigneeEmail?: string | null;
      dueDate?: string | null;
      priority?: ActionItemPriority;
      reminderAt?: string | null;
      status?: ActionItemStatus;
    },
  ) {
    const item = await db.query.actionItems.findFirst({
      where: and(eq(actionItems.id, input.id), eq(actionItems.userId, userId)),
    });
    if (!item) return null;

    const nextCompletedAt =
      input.status === "done"
        ? new Date()
        : input.status && item.status === "done"
          ? null
          : undefined;

    const [updated] = await db
      .update(actionItems)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.ownerName !== undefined && { ownerName: input.ownerName }),
        ...(input.assigneeUserId !== undefined && {
          assigneeUserId: input.assigneeUserId,
        }),
        ...(input.assigneeEmail !== undefined && {
          assigneeEmail: normalizeEmail(input.assigneeEmail),
        }),
        ...(input.dueDate !== undefined && {
          dueDate: dateFromInput(input.dueDate),
        }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.reminderAt !== undefined && {
          reminderAt: dateFromInput(input.reminderAt),
          reminderSentAt: null,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(nextCompletedAt !== undefined && { completedAt: nextCompletedAt }),
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

  static async create(
    userId: string,
    input: {
      meetingId: string;
      title: string;
      ownerName?: string;
      assigneeUserId?: string | null;
      assigneeEmail?: string | null;
      dueDate?: string | null;
      priority?: ActionItemPriority;
      reminderAt?: string | null;
    },
  ) {
    const meeting = await db.query.meetings.findFirst({
      where: and(eq(meetings.id, input.meetingId), eq(meetings.userId, userId)),
      columns: { id: true },
    });
    if (!meeting) return null;

    const [item] = await db
      .insert(actionItems)
      .values({
        meetingId: input.meetingId,
        userId,
        title: input.title,
        ownerName: input.ownerName ?? null,
        assigneeUserId: input.assigneeUserId ?? null,
        assigneeEmail: normalizeEmail(input.assigneeEmail),
        dueDate: dateFromInput(input.dueDate),
        priority: input.priority ?? "normal",
        reminderAt: dateFromInput(input.reminderAt),
        source: "manual",
      })
      .returning();

    return item;
  }

  static async listForUser(
    userId: string,
    opts: {
      status?: ActionItemStatus;
      priority?: ActionItemPriority;
      assignee?: "all" | "me" | "unassigned";
      due?: "all" | "overdue" | "today" | "week" | "none";
      search?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { status, search, limit = 30, offset = 0 } = opts;

    const conditions = [eq(actionItems.userId, userId)];
    if (status) conditions.push(eq(actionItems.status, status));
    if (opts.priority) conditions.push(eq(actionItems.priority, opts.priority));
    if (opts.assignee === "me") {
      conditions.push(eq(actionItems.assigneeUserId, userId));
    }
    if (opts.assignee === "unassigned") {
      conditions.push(isNull(actionItems.assigneeUserId));
      conditions.push(isNull(actionItems.assigneeEmail));
    }
    if (opts.due === "overdue") {
      conditions.push(lt(actionItems.dueDate, new Date()));
      conditions.push(
        sql`${actionItems.status} in ('open', 'in_progress', 'blocked')`,
      );
    }
    if (opts.due === "today") {
      conditions.push(gte(actionItems.dueDate, startOfToday()));
      conditions.push(lt(actionItems.dueDate, startOfTomorrow()));
    }
    if (opts.due === "week") {
      conditions.push(gte(actionItems.dueDate, startOfToday()));
      conditions.push(lte(actionItems.dueDate, sevenDaysFromNow()));
    }
    if (opts.due === "none") {
      conditions.push(isNull(actionItems.dueDate));
    }
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
        assigneeUserId: actionItems.assigneeUserId,
        assigneeEmail: actionItems.assigneeEmail,
        dueDate: actionItems.dueDate,
        status: actionItems.status,
        priority: actionItems.priority,
        reminderAt: actionItems.reminderAt,
        reminderSentAt: actionItems.reminderSentAt,
        completedAt: actionItems.completedAt,
        source: actionItems.source,
        aiConfidence: actionItems.aiConfidence,
        createdAt: actionItems.createdAt,
        meetingTitle: meetings.title,
      })
      .from(actionItems)
      .innerJoin(meetings, eq(actionItems.meetingId, meetings.id))
      .where(where)
      .orderBy(asc(actionItems.dueDate), desc(actionItems.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total };
  }
}
