import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

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
  plugins: [react(), tailwindcss(), copyExtensionAssets()],
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
        offscreen: path.resolve(__dirname, "src/offscreen/offscreen.html"),
        background: path.resolve(__dirname, "src/background/background.ts"),
        content: path.resolve(__dirname, "src/content/content.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background" || chunkInfo.name === "content") {
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
