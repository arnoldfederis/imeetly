import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      SKIP_ENV_VALIDATION: "true",
    },
  },
});
