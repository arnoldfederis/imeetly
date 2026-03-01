import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/health/live")({
  server: {
    handlers: { GET: () => new Response("Web is alive.", { status: 200 }) },
  },
});
