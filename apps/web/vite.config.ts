import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  server: {
    allowedHosts: true,
  },
  resolve: {
    dedupe: ["solid-js"],
  },
  optimizeDeps: {
    include: ["solid-js", "solid-js/web"],
  },
  ssr: {
    external: ["reflect-metadata", "tsyringe", "@peculiar/x509"],
  },
  plugins: [
    devtools(),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
