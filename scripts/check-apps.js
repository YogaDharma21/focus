import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appsDir = path.join(rootDir, "apps");

console.log("🔍 Inspecting monorepo app structure...\n");

if (!fs.existsSync(appsDir)) {
  console.error("❌ apps directory not found!");
  process.exit(1);
}

const apps = fs.readdirSync(appsDir);

for (const app of apps) {
  const appPath = path.join(appsDir, app);
  if (fs.statSync(appPath).isDirectory()) {
    const pkgPath = path.join(appPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      console.log(`✅ App: ${app.padEnd(12)} | Name: ${pkg.name.padEnd(12)} | Version: ${pkg.version}`);
    } else {
      console.log(`📦 App: ${app.padEnd(12)} | Directory present (Placeholder/No package.json)`);
    }
  }
}

console.log("\n✨ Monorepo inspection complete!");
