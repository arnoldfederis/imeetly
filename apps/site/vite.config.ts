import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  server: {
    allowedHosts: true,
  },
  resolve: {
    dedupe: ["solid-js"],
    alias: {
      tslib: "tslib/tslib.es6.js",
      tsyringe: resolve(__dirname, "src/stubs/tsyringe.ts"),
    },
  },
  optimizeDeps: {
    include: ["solid-js", "solid-js/web"],
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          external: ["bun"],
        },
      },
    },
  },
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: "bun",
      rollupConfig: {
        external: ["bun"],
      },
    }),
    viteReact(),
  ],
});

export default config;
