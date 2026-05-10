"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ActionItemModel,
  actionItemModel,
} from "@repo/server/modules/action-item/model";
import { CalendarIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export type ActionItemStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "done"
  | "canceled";

export type ActionItemPriority = "low" | "normal" | "high" | "urgent";

export type ActionItemFormValues = {
  title: string;
  ownerName: string | null;
  assigneeEmail: string | null;
  dueDate: string | null;
  priority: ActionItemPriority;
  reminderAt: string | null;
  status: ActionItemStatus;
};

export type ActionItemDialogItem = {
  title: string;
  ownerName?: string | null;
  assigneeEmail?: string | null;
  dueDate?: Date | string | null;
  priority?: string | null;
  reminderAt?: Date | string | null;
  status?: string | null;
};

type ActionItemDialogProps = {
  mode: "create" | "edit";
  item?: ActionItemDialogItem;
  trigger: React.ReactElement;
  isPending?: boolean;
  onSubmit: (values: ActionItemFormValues) => void;
};

type ActionItemDialogForm = ActionItemModel["dialogForm"];

export function ActionItemDialog({
  mode,
  item,
  trigger,
  isPending,
  onSubmit,
}: ActionItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  const [reminderDatePickerOpen, setReminderDatePickerOpen] = useState(false);
  const form = useForm<ActionItemDialogForm>({
    mode: "onChange",
    defaultValues: {
      title: "",
      ownerName: "",
      assigneeEmail: "",
      dueDate: null,
      reminderDate: null,
      priority: "normal",
      status: "open",
    },
    resolver: zodResolver(actionItemModel.dialogForm),
  });
  const dueDate = useWatch({ control: form.control, name: "dueDate" });
  const reminderDate = useWatch({
    control: form.control,
    name: "reminderDate",
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: item?.title ?? "",
      ownerName: item?.ownerName ?? "",
      assigneeEmail: item?.assigneeEmail ?? "",
      dueDate: toDialogDate(item?.dueDate),
      reminderDate: toDialogDate(item?.reminderAt),
      priority: toPriority(item?.priority),
      status: toStatus(item?.status),
    });
  }, [form, item, open]);

  useEffect(() => {
    if (!open || !dueDate || !reminderDate) return;
    if (reminderDate.getTime() <= subtractMinutes(dueDate, 5).getTime()) return;

    form.setValue("reminderDate", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [dueDate, form, open, reminderDate]);

  function handleSubmit(values: ActionItemDialogForm) {
    onSubmit({
      title: values.title,
      ownerName: emptyToNull(values.ownerName),
      assigneeEmail: emptyToNull(values.assigneeEmail),
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      priority: values.priority,
      reminderAt: values.reminderDate
        ? values.reminderDate.toISOString()
        : null,
      status: values.status,
    });
    setOpen(false);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add action item" : "Edit action item"}
          </DialogTitle>
          <DialogDescription>
            Track owner, due date, due time, priority, status, and reminders
            from one place.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Action item name</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoFocus
                    disabled={isPending}
                    id={field.name}
                    placeholder="Follow up with the customer"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <Controller
                control={form.control}
                name="ownerName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Owner name</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                      id={field.name}
                      placeholder="imeetly"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="assigneeEmail"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Assignee email</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      disabled={isPending}
                      id={field.name}
                      placeholder="me@imeetly.com"
                      type="email"
                      value={field.value ?? ""}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <DateTimePicker
                control={form.control}
                dateName="dueDate"
                datePickerOpen={dueDatePickerOpen}
                disabled={isPending}
                label="Due date & time"
                onDatePickerOpenChange={setDueDatePickerOpen}
              />
              <DateTimePicker
                control={form.control}
                dateName="reminderDate"
                datePickerOpen={reminderDatePickerOpen}
                disabled={isPending}
                label="Reminder date & time"
                onDatePickerOpenChange={setReminderDatePickerOpen}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Controller
                control={form.control}
                name="priority"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Urgency</FieldLabel>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue>{priorityLabel(field.value)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue>{statusLabel(field.value)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">
                            In progress
                          </SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => setOpen(false)}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending || !form.formState.isValid}
              type="submit"
            >
              {isPending ? (
                <Spinner className="size-3.5" />
              ) : mode === "create" ? (
                "Add item"
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteActionItemDialog({
  title,
  trigger,
  isPending,
  onDelete,
}: {
  title: string;
  trigger: React.ReactElement;
  isPending?: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete action item?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{title}". This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={onDelete}
            variant="destructive"
          >
            {isPending ? <Spinner className="size-3.5" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DateTimePicker({
  control,
  dateName,
  label,
  disabled,
  datePickerOpen,
  onDatePickerOpenChange,
}: {
  control: ReturnType<typeof useForm<ActionItemDialogForm>>["control"];
  dateName: "dueDate" | "reminderDate";
  label: string;
  disabled?: boolean;
  datePickerOpen: boolean;
  onDatePickerOpenChange: (open: boolean) => void;
}) {
  const dueDate = useWatch({ control, name: "dueDate" });
  const reminderLimit =
    dateName === "reminderDate" && dueDate
      ? subtractMinutes(dueDate, 5)
      : undefined;

  return (
    <Controller
      control={control}
      name={dateName}
      render={({ field, fieldState }) => {
        const handleDateSelect = (date: Date | undefined) => {
          if (!date) {
            field.onChange(null);
            return;
          }

          const currentDate = field.value ?? defaultPickerDate();
          const nextDate = new Date(date);
          nextDate.setHours(
            currentDate.getHours(),
            currentDate.getMinutes(),
            0,
            0,
          );

          const minTime = isToday(nextDate) ? nextSelectableTime() : undefined;
          if (minTime && nextDate.getTime() < minTime.getTime()) {
            nextDate.setHours(minTime.getHours(), minTime.getMinutes(), 0, 0);
          }

          if (
            reminderLimit &&
            dateName === "reminderDate" &&
            isSameDay(nextDate, reminderLimit) &&
            nextDate.getTime() > reminderLimit.getTime()
          ) {
            nextDate.setHours(
              reminderLimit.getHours(),
              reminderLimit.getMinutes(),
              0,
              0,
            );
          }

          field.onChange(nextDate);
        };

        const handleTimeChange = (
          type: "hour" | "minute" | "ampm",
          value: string,
        ) => {
          if (!field.value) return;

          const currentDate = field.value || new Date();
          const newDate = new Date(currentDate);

          if (type === "hour") {
            const hour = parseInt(value, 10);
            const isPm = newDate.getHours() >= 12;
            let nextHour = hour % 12;
            if (isPm) nextHour += 12;
            newDate.setHours(nextHour);
          } else if (type === "minute") {
            newDate.setMinutes(parseInt(value, 10));
          } else if (type === "ampm") {
            const hours = newDate.getHours();
            if (value === "AM" && hours >= 12) {
              newDate.setHours(hours - 12);
            } else if (value === "PM" && hours < 12) {
              newDate.setHours(hours + 12);
            }
          }

          field.onChange(newDate);
        };

        const isDateDisabled = (date: Date) => {
          if (isBeforeToday(date)) return true;
          if (
            reminderLimit &&
            isToday(date) &&
            isSameDay(date, reminderLimit) &&
            nextSelectableTime().getTime() > reminderLimit.getTime()
          ) {
            return true;
          }
          if (!reminderLimit) return false;
          return isAfterDay(date, reminderLimit);
        };

        const isTimeSelectionDisabled = (
          type: "hour" | "minute" | "ampm",
          value: string,
        ) => {
          if (!field.value) return false;

          const candidate = new Date(field.value);
          const hasReminderUpperLimit =
            reminderLimit && isSameDay(field.value, reminderLimit);
          const hasTodayLowerLimit = isToday(candidate);

          if (type === "hour") {
            const hour = parseInt(value, 10);
            const isPm = candidate.getHours() >= 12;
            let nextHour = hour % 12;
            if (isPm) nextHour += 12;
            candidate.setHours(nextHour);
          } else if (type === "minute") {
            candidate.setMinutes(parseInt(value, 10));
          } else {
            const hours = candidate.getHours();
            if (value === "AM" && hours >= 12) {
              candidate.setHours(hours - 12);
            } else if (value === "PM" && hours < 12) {
              candidate.setHours(hours + 12);
            }
          }

          if (
            hasTodayLowerLimit &&
            candidate.getTime() < nextSelectableTime().getTime()
          ) {
            return true;
          }

          if (
            hasReminderUpperLimit &&
            candidate.getTime() > reminderLimit.getTime()
          ) {
            return true;
          }

          return false;
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{label}</FieldLabel>
            <Popover
              onOpenChange={onDatePickerOpenChange}
              open={datePickerOpen}
            >
              <PopoverTrigger
                disabled={disabled}
                render={
                  <Button
                    className="h-9 w-full justify-start rounded-3xl border-transparent bg-input/50 px-3 text-left font-normal hover:bg-input/50"
                    type="button"
                    variant="secondary"
                  >
                    {field.value ? (
                      format(field.value, "MM/dd/yyyy hh:mm aa")
                    ) : (
                      <span className="line-clamp-1 text-ellipsis">
                        MM/DD/YYYY hh:mm aa
                      </span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-auto p-0" side="bottom">
                <div className="h=[320px] flex border-b">
                  <Calendar
                    className="flex w-full items-start justify-center border-r"
                    disabled={isDateDisabled}
                    initialFocus
                    mode="single"
                    onSelect={handleDateSelect}
                    selected={field.value ?? undefined}
                  />
                  <div className="flex h-[320px] flex-row divide-x">
                    <ScrollArea className="w-auto">
                      <div className="flex flex-col p-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1)
                          .reverse()
                          .map((hour) => (
                            <Button
                              className="aspect-square shrink-0 sm:w-full"
                              disabled={
                                !field.value ||
                                isTimeSelectionDisabled("hour", hour.toString())
                              }
                              key={hour}
                              onClick={() =>
                                handleTimeChange("hour", hour.toString())
                              }
                              size="icon"
                              type="button"
                              variant={
                                field.value &&
                                field.value.getHours() % 12 === hour % 12
                                  ? "default"
                                  : "ghost"
                              }
                            >
                              {hour}
                            </Button>
                          ))}
                      </div>
                      <ScrollBar
                        className="sm:hidden"
                        orientation="horizontal"
                      />
                    </ScrollArea>
                    <ScrollArea className="w-auto">
                      <div className="flex flex-col p-2">
                        {Array.from({ length: 12 }, (_, i) => i * 5).map(
                          (minute) => (
                            <Button
                              className="aspect-square shrink-0 sm:w-full"
                              disabled={
                                !field.value ||
                                isTimeSelectionDisabled(
                                  "minute",
                                  minute.toString(),
                                )
                              }
                              key={minute}
                              onClick={() =>
                                handleTimeChange("minute", minute.toString())
                              }
                              size="icon"
                              type="button"
                              variant={
                                field.value &&
                                field.value.getMinutes() === minute
                                  ? "default"
                                  : "ghost"
                              }
                            >
                              {minute.toString().padStart(2, "0")}
                            </Button>
                          ),
                        )}
                      </div>
                      <ScrollBar
                        className="sm:hidden"
                        orientation="horizontal"
                      />
                    </ScrollArea>
                    <ScrollArea className="">
                      <div className="flex flex-col p-2">
                        {["AM", "PM"].map((ampm) => (
                          <Button
                            className="aspect-square shrink-0 sm:w-full"
                            disabled={
                              !field.value ||
                              isTimeSelectionDisabled("ampm", ampm)
                            }
                            key={ampm}
                            onClick={() => handleTimeChange("ampm", ampm)}
                            size="icon"
                            type="button"
                            variant={
                              field.value &&
                              ((ampm === "AM" && field.value.getHours() < 12) ||
                                (ampm === "PM" && field.value.getHours() >= 12))
                                ? "default"
                                : "ghost"
                            }
                          >
                            {ampm}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pr-4 pb-4">
                  <Button
                    onClick={() => onDatePickerOpenChange(false)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => onDatePickerOpenChange(false)}
                    size="sm"
                    type="button"
                  >
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

function format(value: Date, pattern: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  return pattern
    .replace("yyyy", String(year))
    .replace("MM", month)
    .replace("dd", day)
    .replace("hh", String(hours).padStart(2, "0"))
    .replace("mm", minutes)
    .replace("aa", ampm);
}

function toPriority(value?: string | null): ActionItemPriority {
  if (value === "low" || value === "high" || value === "urgent") return value;
  return "normal";
}

function toStatus(value?: string | null): ActionItemStatus {
  if (
    value === "in_progress" ||
    value === "blocked" ||
    value === "done" ||
    value === "canceled"
  ) {
    return value;
  }
  return "open";
}

function priorityLabel(value: ActionItemPriority) {
  if (value === "urgent") return "Urgent";
  if (value === "high") return "High";
  if (value === "low") return "Low";
  return "Normal";
}

function statusLabel(value: ActionItemStatus) {
  if (value === "in_progress") return "In progress";
  if (value === "blocked") return "Blocked";
  if (value === "done") return "Done";
  if (value === "canceled") return "Canceled";
  return "Open";
}

function emptyToNull(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toDialogDate(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function defaultPickerDate() {
  return nextSelectableTime();
}

function subtractMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

function nextSelectableTime() {
  const date = new Date();
  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  date.setSeconds(0, 0);
  date.setMinutes(roundedMinutes);
  return date;
}

function isToday(value: Date) {
  return isSameDay(value, new Date());
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isAfterDay(left: Date, right: Date) {
  const leftDay = new Date(left);
  leftDay.setHours(0, 0, 0, 0);

  const rightDay = new Date(right);
  rightDay.setHours(0, 0, 0, 0);

  return leftDay.getTime() > rightDay.getTime();
}

function isBeforeToday(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() < today.getTime();
}
