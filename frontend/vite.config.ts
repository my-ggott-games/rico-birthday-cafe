import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const frameworkPackagePattern =
  /\/node_modules\/(react|react-dom|scheduler|zustand|use-sync-external-store)\//;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("@dnd-kit")) {
            return "dnd";
          }

          if (id.includes("react-router")) {
            return "router";
          }

          if (frameworkPackagePattern.test(id)) {
            return "framework";
          }
        },
      },
    },
  },
});
