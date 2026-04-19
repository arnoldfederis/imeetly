import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN ?? "", {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
  before_send: (event) => {
    // Filter out Chrome extension noise (password managers, autofill)
    const msg = event?.properties?.$exception_message ?? "";
    if (typeof msg === "string" && msg.includes("Object Not Found Matching Id:")) {
      return null;
    }
    return event;
  },
  loaded: (posthog) => {
    if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
  },
});
