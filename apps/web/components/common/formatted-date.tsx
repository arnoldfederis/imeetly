"use client";

import { formatMeetingDate } from "@/lib/utils";

interface Props {
  date: Date | string;
  className?: string;
}

export function FormattedDate({ date, className }: Props) {
  return (
    <time
      className={className}
      dateTime={new Date(date).toISOString()}
      suppressHydrationWarning
    >
      {formatMeetingDate(date)}
    </time>
  );
}
