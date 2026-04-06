import { useCallback, useRef, useState } from "react";
import { server } from "@/lib/orpc";

const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONCURRENCY = 4;
const MAX_RETRIES = 3;
const PART_URL_BATCH_SIZE = 8;

type UploadState = "idle" | "preparing" | "uploading" | "completing" | "done";

export function useMultipartUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const abortedRef = useRef(false);
  const xhrsRef = useRef<XMLHttpRequest[]>([]);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    abortedRef.current = false;
    xhrsRef.current = [];
  }, []);

  const abort = useCallback(() => {
    abortedRef.current = true;
    for (const xhr of xhrsRef.current) {
      xhr.abort();
    }
    xhrsRef.current = [];
    reset();
  }, [reset]);

  const uploadPart = useCallback(
    (
      url: string,
      blob: Blob,
      onProgress: (loaded: number) => void,
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrsRef.current.push(xhr);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) onProgress(e.loaded);
        });

        xhr.addEventListener("load", () => {
          xhrsRef.current = xhrsRef.current.filter((x) => x !== xhr);
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader("ETag");
            if (!etag) {
              reject(new Error("Missing ETag in response"));
              return;
            }
            resolve(etag);
          } else {
            reject(new Error(`Part upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          xhrsRef.current = xhrsRef.current.filter((x) => x !== xhr);
          reject(new Error("Network error"));
        });

        xhr.addEventListener("abort", () => {
          xhrsRef.current = xhrsRef.current.filter((x) => x !== xhr);
          reject(new Error("Upload cancelled"));
        });

        xhr.open("PUT", url);
        xhr.send(blob);
      });
    },
    [],
  );

  const uploadPartWithRetry = useCallback(
    async (
      url: string,
      blob: Blob,
      onProgress: (loaded: number) => void,
    ): Promise<string> => {
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (abortedRef.current) throw new Error("Upload cancelled");
        try {
          return await uploadPart(url, blob, onProgress);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (lastError.message === "Upload cancelled") throw lastError;
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }
      throw lastError!;
    },
    [uploadPart],
  );

  const singleUpload = useCallback(
    async (meetingId: string, file: File): Promise<{ fileId: string }> => {
      setState("preparing");
      setProgress(0);

      const uploadInfo = await server.meeting.requestUpload({
        meetingId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      setState("uploading");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrsRef.current.push(xhr);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          xhrsRef.current = xhrsRef.current.filter((x) => x !== xhr);
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });

        xhr.addEventListener("error", () => {
          xhrsRef.current = xhrsRef.current.filter((x) => x !== xhr);
          reject(new Error("Upload failed — check your connection"));
        });

        xhr.addEventListener("abort", () => {
          xhrsRef.current = xhrsRef.current.filter((x) => x !== xhr);
          reject(new Error("Upload cancelled"));
        });

        xhr.open("PUT", uploadInfo.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setState("completing");
      await server.meeting.completeUpload({
        meetingId,
        fileId: uploadInfo.fileId,
      });

      setState("done");
      return { fileId: uploadInfo.fileId };
    },
    [],
  );

  const multipartUpload = useCallback(
    async (meetingId: string, file: File): Promise<{ fileId: string }> => {
      setState("preparing");
      setProgress(0);

      const totalParts = Math.ceil(file.size / CHUNK_SIZE);

      const { fileId } =
        await server.meeting.initiateMultipartUpload({
          meetingId,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          totalParts,
        });

      setState("uploading");

      const completedParts: Array<{ partNumber: number; etag: string }> = [];
      const bytesPerPart = new Map<number, number>();
      let lastReportedProgress = 0;

      const updateProgress = () => {
        let totalLoaded = 0;
        for (const loaded of bytesPerPart.values()) {
          totalLoaded += loaded;
        }
        const pct = Math.round((totalLoaded / file.size) * 100);
        if (pct !== lastReportedProgress) {
          lastReportedProgress = pct;
          setProgress(pct);
        }
      };

      // Build queue of part numbers
      const queue = Array.from({ length: totalParts }, (_, i) => i + 1);
      let queueIdx = 0;

      const worker = async () => {
        while (queueIdx < queue.length) {
          if (abortedRef.current) return;

          // Grab next batch of part numbers for URL signing
          const batchStart = queueIdx;
          const batchEnd = Math.min(queueIdx + PART_URL_BATCH_SIZE, queue.length);
          const batchPartNumbers = queue.slice(batchStart, batchEnd);
          queueIdx = batchEnd;

          const urls = await server.meeting.getPartUrls({
            meetingId,
            fileId,
            partNumbers: batchPartNumbers,
          });

          for (const { partNumber, url } of urls) {
            if (abortedRef.current) return;

            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const blob = file.slice(start, end);

            bytesPerPart.set(partNumber, 0);

            const etag = await uploadPartWithRetry(url, blob, (loaded) => {
              bytesPerPart.set(partNumber, loaded);
              updateProgress();
            });

            bytesPerPart.set(partNumber, end - start);
            updateProgress();

            completedParts.push({ partNumber, etag });
          }
        }
      };

      try {
        // Launch concurrent workers
        const concurrency = Math.min(MAX_CONCURRENCY, totalParts);
        await Promise.all(
          Array.from({ length: concurrency }, () => worker()),
        );

        if (abortedRef.current) {
          await server.meeting.abortMultipartUpload({ meetingId, fileId });
          throw new Error("Upload cancelled");
        }

        setState("completing");
        await server.meeting.completeMultipartUpload({
          meetingId,
          fileId,
          parts: completedParts,
        });

        setState("done");
        return { fileId };
      } catch (err) {
        if (!abortedRef.current) {
          // Best-effort abort on unexpected failure
          server.meeting
            .abortMultipartUpload({ meetingId, fileId })
            .catch(() => {});
        }
        throw err;
      }
    },
    [uploadPartWithRetry],
  );

  const upload = useCallback(
    async (meetingId: string, file: File): Promise<{ fileId: string }> => {
      abortedRef.current = false;
      if (file.size < MULTIPART_THRESHOLD) {
        return singleUpload(meetingId, file);
      }
      return multipartUpload(meetingId, file);
    },
    [singleUpload, multipartUpload],
  );

  return { upload, abort, state, progress, reset };
}
