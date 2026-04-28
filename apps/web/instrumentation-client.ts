import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN ?? "", {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  before_send: (event) => {
    // Filter Chrome extension noise - non-Error rejections from password managers / autofill
    const combined = Object.values(event?.properties ?? {})
      .filter((v) => typeof v === "string")
      .join(" ");
    if (
      combined.includes("Object Not Found Matching Id") ||
      combined.includes("Non-Error promise rejection captured")
    ) {
      return null;
    }
    return event;
  },
  loaded: (posthog) => {
    if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
  },
});
