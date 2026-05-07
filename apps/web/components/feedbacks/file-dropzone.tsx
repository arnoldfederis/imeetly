"use client";

import { PaperclipIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { type DragEvent, useCallback, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  type DisplayFile,
  FEEDBACK_ACCEPTED_TYPES,
  FEEDBACK_MAX_FILES,
  FEEDBACK_MAX_SIZE_MB,
} from "@/hooks/use-feedback-files";

interface Props {
  files: DisplayFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function FeedbackFileDropzone({ files, onAdd, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onAdd(Array.from(e.dataTransfer.files));
    },
    [onAdd],
  );

  return (
    <div className="flex flex-col gap-3">
      <button
        className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDrop={handleDrop}
        type="button"
      >
        <UploadCloudIcon className="size-7 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">Drop files or click to browse</p>
          <p className="text-muted-foreground text-xs">
            Images, videos, PDFs, text - up to {FEEDBACK_MAX_FILES} files,{" "}
            {FEEDBACK_MAX_SIZE_MB}MB each
          </p>
        </div>
        <input
          accept={FEEDBACK_ACCEPTED_TYPES}
          className="hidden"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              onAdd(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
          ref={fileInputRef}
          type="file"
        />
      </button>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <div
              className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
              key={f.id}
            >
              <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{f.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatSize(f.size)}
                  {f.status === "pending" && (
                    <span className="ml-1 text-muted-foreground">· Queued</span>
                  )}
                  {f.error && (
                    <span className="ml-1 text-destructive">· Failed</span>
                  )}
                </p>
              </div>
              {f.status === "uploading" ? (
                <Spinner className="size-4 shrink-0" />
              ) : (
                <button
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onRemove(f.id)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
