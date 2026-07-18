import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5000";

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon.svg", "icon-192.png", "icon-512.png"],
        manifest: {
          name: "Interis",
          short_name: "Interis",
          description:
            "Interis is a social movie journal — log watches, write reviews, follow friends, and browse a cinema and TV archive.",
          theme_color: "#171420",
          background_color: "#171420",
          display: "standalone",
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // App-shell only — /api/* must never be served from the service
          // worker cache (auth state, feed, movie data are all dynamic).
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
              return "react-vendor";
            }
            if (id.includes("/@tanstack/")) {
              return "tanstack-vendor";
            }
            if (
              id.includes("/@radix-ui/") ||
              id.includes("/radix-ui/") ||
              id.includes("/lucide-react/") ||
              id.includes("/class-variance-authority/") ||
              id.includes("/clsx/") ||
              id.includes("/tailwind-merge/")
            ) {
              return "ui-vendor";
            }
            if (id.includes("/zod/")) {
              return "zod-vendor";
            }
          },
        },
      },
    },
    server: {
      // Without this, Node's "localhost" resolution can bind Vite to IPv6
      // ::1 only, depending on the host's DNS/getaddrinfo order - anything
      // checking readiness against 127.0.0.1 specifically (e.g. Playwright's
      // webServer health check) then times out even though Vite is up.
      // Binding all interfaces sidesteps that regardless of environment.
      host: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
