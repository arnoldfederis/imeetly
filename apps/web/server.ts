// @ts-expect-error - @tanstack/react-start/server-entry lacks type declarations
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  fetch(request: Request) {
    return handler.fetch(request);
  },
});
