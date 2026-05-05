"use client";

import { env } from "@repo/env";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        };
      };
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new () => GoogleDocsView;
        DocsViewMode: { LIST: string };
        Action: { PICKED: string; CANCEL: string };
      };
    };
  }
}

const GOOGLE_PICKER_SCOPES =
  "https://www.googleapis.com/auth/drive.file";

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleDocsView {
  setMimeTypes(types: string): GoogleDocsView;
  setIncludeFolders(include: boolean): GoogleDocsView;
  setMode(mode: string): GoogleDocsView;
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
  const pickerAccessToken = useRef<string | null>(null);

  const load = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loaded.current) {
        resolve();
        return;
      }

      const loadScript = (src: string, label: string) =>
        new Promise<void>((scriptResolve, scriptReject) => {
          const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${src}"]`,
          );
          if (existingScript) {
            if (existingScript.dataset.loaded === "true") {
              scriptResolve();
              return;
            }
            existingScript.addEventListener("load", () => scriptResolve(), {
              once: true,
            });
            existingScript.addEventListener(
              "error",
              () => scriptReject(new Error(`${label} script failed`)),
              { once: true },
            );
            return;
          }

          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onerror = () =>
            scriptReject(new Error(`${label} script failed`));
          script.onload = () => {
            script.dataset.loaded = "true";
            scriptResolve();
          };
          document.head.appendChild(script);
        });

      Promise.all([
        loadScript("https://apis.google.com/js/api.js", "Google API"),
        loadScript("https://accounts.google.com/gsi/client", "Google Identity"),
      ])
        .then(() => {
          window.gapi.load("picker", () => {
            loaded.current = true;
            resolve();
          });
        })
        .catch(reject);
    });
  }, []);

  const getPickerAccessToken = useCallback(
    async (clientId: string): Promise<string> => {
      if (pickerAccessToken.current) return pickerAccessToken.current;

      await load();

      const requestToken = (prompt: string) =>
        new Promise<string>((resolve, reject) => {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GOOGLE_PICKER_SCOPES,
            callback: (response) => {
              if (response.access_token) {
                pickerAccessToken.current = response.access_token;
                resolve(response.access_token);
                return;
              }
              reject(
                new Error(
                  response.error_description ??
                    response.error ??
                    "Google Drive authorization failed",
                ),
              );
            },
          });
          tokenClient.requestAccessToken({ prompt });
        });

      try {
        return await requestToken("");
      } catch {
        return requestToken("consent");
      }
    },
    [load],
  );

  const openPicker = useCallback(
    async (
      input: { pickerClientId: string },
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
      const accessToken = await getPickerAccessToken(input.pickerClientId);

      const view = new window.google.picker.DocsView()
        .setMimeTypes(
          "video/mp4,video/webm,audio/mp4,audio/mpeg,audio/m4a,audio/x-m4a",
        )
        .setIncludeFolders(true)
        .setMode(window.google.picker.DocsViewMode.LIST);

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
    [getPickerAccessToken, load],
  );

  return { openPicker };
}
