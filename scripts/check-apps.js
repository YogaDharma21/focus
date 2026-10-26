import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appsDir = path.join(rootDir, "apps");
const packagesDir = path.join(rootDir, "packages");

console.log("Inspecting monorepo workspace structure...\n");

function inspectDir(dir, label) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    if (fs.statSync(entryPath).isDirectory()) {
      const pkgPath = path.join(entryPath, "package.json");
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        console.log(`[${label}] ${entry.padEnd(12)} | Name: ${pkg.name.padEnd(18)} | Version: ${pkg.version}`);
      } else {
        console.log(`[${label}] ${entry.padEnd(12)} | Directory present (Placeholder/No package.json)`);
      }
    }
  }
}

inspectDir(appsDir, "App");
inspectDir(packagesDir, "Pkg");

console.log("\nMonorepo inspection complete!");
