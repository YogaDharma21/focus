import { defineConfig, build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

function buildContentScript() {
  return {
    name: "build-content-script",
    async closeBundle() {
      await build({
        configFile: false,
        plugins: [],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
        build: {
          emptyOutDir: false,
          outDir: "dist",
          lib: {
            entry: path.resolve(__dirname, "src/content/content.ts"),
            name: "content",
            formats: ["iife"],
            fileName: () => "content.js",
          },
          rollupOptions: {
            output: {
              extend: true,
            },
          },
        },
      });
    },
  };
}

function copyExtensionAssets() {
  return {
    name: "copy-extension-assets",
    closeBundle() {
      if (fs.existsSync("public/manifest.json")) {
        fs.copyFileSync("public/manifest.json", "dist/manifest.json");
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), buildContentScript(), copyExtensionAssets()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "popup.html"),
        blocked: path.resolve(__dirname, "blocked.html"),
        offscreen: path.resolve(__dirname, "offscreen.html"),
        background: path.resolve(__dirname, "src/background/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});

