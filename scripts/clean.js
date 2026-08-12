import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appsDir = path.join(rootDir, "apps");

const targetsToClean = [".next", "dist", "out", ".turbo", "tsconfig.tsbuildinfo"];

console.log("🧹 Cleaning build artifacts across monorepo...\n");

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  - Removed: ${path.relative(rootDir, dirPath)}`);
  }
}

if (fs.existsSync(appsDir)) {
  const apps = fs.readdirSync(appsDir);
  for (const app of apps) {
    const appPath = path.join(appsDir, app);
    if (fs.statSync(appPath).isDirectory()) {
      for (const target of targetsToClean) {
        removeDir(path.join(appPath, target));
      }
    }
  }
}

console.log("\n✨ Cleanup complete!");
