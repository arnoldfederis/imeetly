import { useState } from "react";
import { toast } from "sonner";
import { server } from "@/lib/orpc";

export interface UploadedFile {
  key: string;
  name: string;
  mimeType: string;
  size: number;
}

export type DisplayFileStatus =
  | "existing"
  | "pending"
  | "uploading"
  | "done"
  | "error";

export interface DisplayFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: DisplayFileStatus;
  error: string | null;
}

interface SelectedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error: string | null;
  result: UploadedFile | null;
}

export const FEEDBACK_ACCEPTED_TYPES =
  "image/*,video/*,text/plain,application/pdf";
export const FEEDBACK_MAX_FILES = 5;
export const FEEDBACK_MAX_SIZE_MB = 100;

export function useFeedbackFiles(initial: UploadedFile[] = []) {
  const [existing, setExisting] = useState<UploadedFile[]>(initial);
  const [selected, setSelected] = useState<SelectedFile[]>([]);

  function reset(uploaded: UploadedFile[] = []) {
    setExisting(uploaded);
    setSelected([]);
  }

  function addFiles(incoming: File[]) {
    const currentCount = existing.length + selected.length;
    const allowed = FEEDBACK_MAX_FILES - currentCount;
    if (allowed <= 0) {
      toast.error(`Max ${FEEDBACK_MAX_FILES} attachments`);
      return;
    }
    const toAdd = incoming.slice(0, allowed).filter((f) => {
      if (f.size > FEEDBACK_MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name} exceeds ${FEEDBACK_MAX_SIZE_MB}MB`);
        return false;
      }
      return true;
    });
    setSelected((prev) => [
      ...prev,
      ...toAdd.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        status: "pending" as const,
        error: null,
        result: null,
      })),
    ]);
  }

  function removeFile(id: string) {
    if (existing.some((f) => f.key === id)) {
      setExisting((prev) => prev.filter((f) => f.key !== id));
    } else {
      setSelected((prev) => prev.filter((f) => f.id !== id));
    }
  }

  async function uploadAll(feedbackId: string): Promise<UploadedFile[]> {
    const pending = selected.filter((f) => f.status === "pending");
    if (pending.length === 0) return existing;

    const results = await Promise.all(
      pending.map(async (pf) => {
        setSelected((prev) =>
          prev.map((f) =>
            f.id === pf.id ? { ...f, status: "uploading" as const } : f,
          ),
        );
        try {
          const { uploadUrl, key } = await server.feedback.getUploadUrl({
            feedbackId,
            fileName: pf.file.name,
            mimeType: pf.file.type || "application/octet-stream",
            size: pf.file.size,
          });
          await fetch(uploadUrl, {
            method: "PUT",
            body: pf.file,
            headers: {
              "Content-Type": pf.file.type || "application/octet-stream",
            },
          });
          const result: UploadedFile = {
            key,
            name: pf.file.name,
            mimeType: pf.file.type || "application/octet-stream",
            size: pf.file.size,
          };
          setSelected((prev) =>
            prev.map((f) =>
              f.id === pf.id ? { ...f, status: "done" as const, result } : f,
            ),
          );
          return result;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setSelected((prev) =>
            prev.map((f) =>
              f.id === pf.id
                ? { ...f, status: "error" as const, error: msg }
                : f,
            ),
          );
          toast.error(`Failed to upload ${pf.file.name}`);
          return null;
        }
      }),
    );

    const newUploaded = results.filter(Boolean) as UploadedFile[];
    return [...existing, ...newUploaded];
  }

  const displayFiles: DisplayFile[] = [
    ...existing.map(
      (f): DisplayFile => ({
        id: f.key,
        name: f.name,
        size: f.size,
        mimeType: f.mimeType,
        status: "existing",
        error: null,
      }),
    ),
    ...selected.map(
      (f): DisplayFile => ({
        id: f.id,
        name: f.file.name,
        size: f.file.size,
        mimeType: f.file.type,
        status: f.status,
        error: f.error,
      }),
    ),
  ];

  const isUploading = selected.some((f) => f.status === "uploading");
  const hasPending = selected.some((f) => f.status === "pending");

  return {
    displayFiles,
    addFiles,
    removeFile,
    reset,
    uploadAll,
    isUploading,
    hasPending,
    existing,
  };
}
