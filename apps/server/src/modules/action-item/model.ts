import type { UnwrapSchema } from "elysia";
import MailChecker from "mailchecker";
import { z } from "zod";

export const actionItemStatusSchema = z.enum([
  "open",
  "in_progress",
  "blocked",
  "done",
  "canceled",
]);

export const actionItemPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);

const _meridiemSchema = z.enum(["AM", "PM"]);
const _hourSchema = z.string().regex(/^(0?[1-9]|1[0-2])$/, "Invalid hour.");
const _minuteSchema = z.string().regex(/^([0-5][0-9])$/, "Invalid minute.");

function _composeDateTimeParts(input: {
  date: string;
  hour: string;
  minute: string;
  meridiem: "AM" | "PM";
}) {
  if (!input.date) return null;

  const [year, month, day] = input.date.split("-").map(Number);
  if (!year || !month || !day) return null;

  let hours = Number(input.hour);
  const minutes = Number(input.minute);

  if (input.meridiem === "AM") {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export const actionItemModel = {
  listQuery: z.object({
    status: actionItemStatusSchema.optional(),
    priority: actionItemPrioritySchema.optional(),
    assignee: z.enum(["all", "me", "unassigned"]).optional(),
    due: z.enum(["all", "overdue", "today", "week", "none"]).optional(),
    search: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
  createRequest: z.object({
    meetingId: z.string(),
    title: z.string().min(1),
    ownerName: z.string().optional(),
    assigneeUserId: z.string().nullable().optional(),
    assigneeEmail: z.string().email().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: actionItemPrioritySchema.optional(),
    reminderAt: z.string().nullable().optional(),
  }),
  updateRequest: z.object({
    id: z.string(),
    title: z.string().optional(),
    ownerName: z.string().nullable().optional(),
    assigneeUserId: z.string().nullable().optional(),
    assigneeEmail: z.string().email().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: actionItemPrioritySchema.optional(),
    reminderAt: z.string().nullable().optional(),
    status: actionItemStatusSchema.optional(),
  }),
  removeRequest: z.object({
    id: z.string(),
  }),
  dialogForm: z
    .object({
      title: z.string().trim().min(1, "Action item name is required."),
      ownerName: z.string(),
      assigneeEmail: z.string().nullable().optional(),
      dueDate: z.date().nullable().optional(),
      reminderDate: z.date().nullable().optional(),
      priority: actionItemPrioritySchema,
      status: actionItemStatusSchema,
    })
    .superRefine((values, ctx) => {
      const now = new Date();

      if (values.assigneeEmail) {
        if (!MailChecker.isValid(values.assigneeEmail)) {
          ctx.addIssue({
            code: "custom",
            message: "Invalid Email",
            path: ["assigneeEmail"],
          });
        }
      }

      if (values.dueDate && values.dueDate.getTime() < now.getTime()) {
        ctx.addIssue({
          code: "custom",
          message: "Due date and time cannot be in the past.",
          path: ["dueDate"],
        });
      }

      if (
        values.reminderDate &&
        values.reminderDate.getTime() < now.getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Reminder date and time cannot be in the past.",
          path: ["reminderDate"],
        });
      }

      if (
        values.dueDate &&
        values.reminderDate &&
        values.reminderDate.getTime() >
          subtractMinutes(values.dueDate, 5).getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          message:
            "Reminder must be at least 5 minutes earlier than the due date and time.",
          path: ["reminderDate"],
        });
      }
    }),
} as const;

function subtractMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

export type ActionItemModel = {
  [k in keyof typeof actionItemModel]: UnwrapSchema<
    (typeof actionItemModel)[k]
  >;
};
