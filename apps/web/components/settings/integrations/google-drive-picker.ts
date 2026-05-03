"use client";

import { env } from "@repo/env";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
    google: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new () => GoogleDocsView;
        Action: { PICKED: string; CANCEL: string };
      };
    };
  }
}

interface GoogleDocsView {
  setMimeTypes(types: string): GoogleDocsView;
  setIncludeFolders(include: boolean): GoogleDocsView;
}

interface GooglePickerBuilder {
  addView(view: GoogleDocsView): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setOrigin(origin: string): GooglePickerBuilder;
  setTitle(title: string): GooglePickerBuilder;
  setCallback(cb: (data: GooglePickerResponse) => void): GooglePickerBuilder;
  build(): { setVisible(v: boolean): void };
}

interface GooglePickerResponse {
  action: string;
  docs?: Array<{ id: string; name: string; mimeType: string }>;
}

export function useGoogleDrivePicker() {
  const loaded = useRef(false);

  const load = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loaded.current) {
        resolve();
        return;
      }

      if (!window.gapi) {
        const existingScript = document.querySelector<HTMLScriptElement>(
          'script[src="https://apis.google.com/js/api.js"]',
        );
        const script = existingScript ?? document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.async = true;
        script.onerror = () => reject(new Error("Google API script failed"));
        script.onload = () => {
          window.gapi.load("picker", () => {
            loaded.current = true;
            resolve();
          });
        };
        if (!existingScript) {
          document.head.appendChild(script);
        }
        return;
      }

      window.gapi.load("picker", () => {
        loaded.current = true;
        resolve();
      });
    });
  }, []);

  const openPicker = useCallback(
    async (
      accessToken: string,
      onPicked: (fileId: string, fileName: string) => void,
    ) => {
      if (
        !env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ||
        !env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID
      ) {
        throw new Error("Google Picker is not configured");
      }
      if (!env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY.startsWith("AIza")) {
        throw new Error(
          "NEXT_PUBLIC_GOOGLE_PICKER_API_KEY must be a Google API key, not an OAuth client ID",
        );
      }
      if (!/^\d+$/.test(env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID)) {
        throw new Error(
          "NEXT_PUBLIC_GOOGLE_PICKER_APP_ID must be the numeric Google Cloud project number",
        );
      }

      await load();

      const view = new window.google.picker.DocsView()
        .setMimeTypes(
          "video/mp4,video/webm,audio/mp4,audio/mpeg,audio/m4a,audio/x-m4a",
        )
        .setIncludeFolders(true);

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setDeveloperKey(env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY)
        .setAppId(env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.origin)
        .setTitle("Select a meeting recording")
        .setCallback((data: GooglePickerResponse) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs?.[0];
            if (doc) {
              onPicked(doc.id, doc.name);
            }
          }
        })
        .build();

      picker.setVisible(true);
    },
    [load],
  );

  return { openPicker };
}
