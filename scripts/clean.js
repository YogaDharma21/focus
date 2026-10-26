import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appsDir = path.join(rootDir, "apps");
const packagesDir = path.join(rootDir, "packages");

const targetsToClean = [".next", "dist", "out", ".turbo", "tsconfig.tsbuildinfo"];

console.log("Cleaning build artifacts across monorepo...\n");

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  - Removed: ${path.relative(rootDir, dirPath)}`);
  }
}

// Clean root targets
for (const target of targetsToClean) {
  removeDir(path.join(rootDir, target));
}

function cleanEntries(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    if (fs.statSync(entryPath).isDirectory()) {
      for (const target of targetsToClean) {
        removeDir(path.join(entryPath, target));
      }
    }
  }
}

cleanEntries(appsDir);
cleanEntries(packagesDir);

console.log("\nCleanup complete!");
