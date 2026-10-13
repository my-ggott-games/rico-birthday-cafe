import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const frameworkPackagePattern =
  /\/node_modules\/(react|react-dom|scheduler|zustand|use-sync-external-store)\//;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Runtime cache only: no precache, so a first visit on a slow connection
    // downloads nothing extra. Revisits serve images and code from the device.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      manifest: false,
      workbox: {
        globPatterns: [],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Hashed build output never changes under the same URL.
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && /^\/assets\/[^/]+-[\w-]{8}\.(js|css|woff2?)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "build-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Public images keep their names when replaced, so refresh in the
            // background while serving the cached copy.
            urlPattern: ({ sameOrigin, url }) =>
              sameOrigin && /\.(webp|png|jpe?g|gif)$/.test(url.pathname),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
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
          // Keep Vite's lazy-import helper out of the pixi chunk; otherwise the
          // entry imports it from there and the landing page downloads Pixi.
          if (id.includes("vite/preload-helper")) {
            return "framework";
          }

          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("pixi.js") || id.includes("@pixi/")) {
            return "pixi";
          }

          if (id.includes("html2canvas") || id.includes("modern-screenshot")) {
            return "screenshot";
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
