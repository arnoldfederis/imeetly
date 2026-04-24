import type { RouterOutputs } from "@repo/server/types";
import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMeetingDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  const localDay = (dt: Date) =>
    dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (localDay(d) === localDay(now)) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (localDay(d) === localDay(yesterday)) return `Yesterday, ${time}`;

  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(now.getDate() - 6);
  if (d >= sixDaysAgo) {
    return `${d.toLocaleDateString(undefined, { weekday: "long" })}, ${time}`;
  }

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function downloadMeetingMarkdown(
  meeting: RouterOutputs["meeting"]["getById"],
) {
  if (!meeting) {
    return;
  }

  const date = new Date(meeting.meetingDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lines: string[] = [];
  lines.push(`# ${meeting.title}`);
  lines.push("");
  lines.push(`**Date:** ${date}`);
  if (meeting.participantsText) {
    lines.push(`**Participants:** ${meeting.participantsText}`);
  }
  lines.push(`**Source:** ${meeting.sourceType}`);
  lines.push("");

  if (meeting.summary?.summaryMd) {
    lines.push("## Summary");
    lines.push("");
    lines.push(meeting.summary.summaryMd);
    lines.push("");
  }

  if (meeting.summary?.decisionsMd) {
    lines.push("## Key Decisions");
    lines.push("");
    lines.push(meeting.summary.decisionsMd);
    lines.push("");
  }

  if (meeting.summary?.blockersMd) {
    lines.push("## Blockers & Risks");
    lines.push("");
    lines.push(meeting.summary.blockersMd);
    lines.push("");
  }

  if (meeting.summary?.followupsMd) {
    lines.push("## Follow-ups");
    lines.push("");
    lines.push(meeting.summary.followupsMd);
    lines.push("");
  }

  if (meeting.actionItems && meeting.actionItems.length > 0) {
    lines.push("## Action Items");
    lines.push("");
    for (const item of meeting.actionItems) {
      const checkbox = item.status === "done" ? "[x]" : "[ ]";
      const owner = item.ownerName ? ` (${item.ownerName})` : "";
      const due = item.dueDate
        ? ` - due ${new Date(item.dueDate).toLocaleDateString()}`
        : "";
      lines.push(`- ${checkbox} ${item.title}${owner}${due}`);
    }
    lines.push("");
  }

  if (meeting.transcriptText) {
    lines.push("## Transcript");
    lines.push("");
    lines.push(meeting.transcriptText);
    lines.push("");
  }

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meeting.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMeetingPdf(
  meeting: RouterOutputs["meeting"]["getById"],
) {
  if (!meeting) {
    return;
  }
  const date = new Date(meeting.meetingDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

  const sections: string[] = [];

  sections.push(`<h1>${escapeHtml(meeting.title)}</h1>`);
  sections.push(`<p><strong>Date:</strong> ${escapeHtml(date)}</p>`);
  if (meeting.participantsText) {
    sections.push(
      `<p><strong>Participants:</strong> ${escapeHtml(meeting.participantsText)}</p>`,
    );
  }
  sections.push(
    `<p><strong>Source:</strong> ${escapeHtml(meeting.sourceType)}</p>`,
  );

  if (meeting.summary?.summaryMd) {
    sections.push(
      `<h2>Summary</h2><pre>${escapeHtml(meeting.summary.summaryMd)}</pre>`,
    );
  }
  if (meeting.summary?.decisionsMd) {
    sections.push(
      `<h2>Key Decisions</h2><pre>${escapeHtml(meeting.summary.decisionsMd)}</pre>`,
    );
  }
  if (meeting.summary?.blockersMd) {
    sections.push(
      `<h2>Blockers &amp; Risks</h2><pre>${escapeHtml(meeting.summary.blockersMd)}</pre>`,
    );
  }
  if (meeting.summary?.followupsMd) {
    sections.push(
      `<h2>Follow-ups</h2><pre>${escapeHtml(meeting.summary.followupsMd)}</pre>`,
    );
  }

  if (meeting.actionItems && meeting.actionItems.length > 0) {
    const items = meeting.actionItems
      .map((item) => {
        const checkbox = item.status === "done" ? "&#9745;" : "&#9744;";
        const owner = item.ownerName ? ` (${escapeHtml(item.ownerName)})` : "";
        const due = item.dueDate
          ? ` - due ${new Date(item.dueDate).toLocaleDateString()}`
          : "";
        return `<li>${checkbox} ${escapeHtml(item.title)}${owner}${due}</li>`;
      })
      .join("\n");
    sections.push(`<h2>Action Items</h2><ul>${items}</ul>`);
  }

  if (meeting.transcriptText) {
    sections.push(
      `<h2>Transcript</h2><pre>${escapeHtml(meeting.transcriptText)}</pre>`,
    );
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(meeting.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 8px 0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    p { margin: 4px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Could not open print window. Please allow pop-ups.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.print();
  });
}
