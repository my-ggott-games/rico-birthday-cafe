import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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

          if (id.includes("pixi.js") || id.includes("@pixi/react")) {
            return "pixi";
          }

          if (id.includes("react") || id.includes("zustand")) {
            return "framework";
          }
        },
      },
    },
  },
});
