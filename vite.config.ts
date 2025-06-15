import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Using top-level await for dynamic imports
export default defineConfig(async () => {
  const replitPlugins = process.env.NODE_ENV !== 'production' && process.env.REPL_ID
    ? [(await import("@replit/vite-plugin-cartographer")).cartographer()]
    : [];

  return {
    plugins: [
      react(),
      ...(process.env.NODE_ENV !== 'production' ? [runtimeErrorOverlay()] : []),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./client/src"),
        "@shared": path.resolve(process.cwd(), "./shared"),
        "@assets": path.resolve(process.cwd(), "./attached_assets"),
      },
    },
    root: "./client",
    publicDir: "./public",
    build: {
      outDir: path.resolve(process.cwd(), "dist/public"),
      emptyOutDir: true,
      rollupOptions: {
        input: "./client/index.html"
      }
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
