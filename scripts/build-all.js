import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appsDir = path.join(rootDir, "apps");

const targetApps = ["website", "landing", "desktop", "extension"];

console.log("🚀 Building all active Focus monorepo applications...\n");

for (const app of targetApps) {
  const appPath = path.join(appsDir, app);
  const pkgPath = path.join(appPath, "package.json");

  if (fs.existsSync(pkgPath)) {
    console.log(`📦 Building [${app}]...`);
    try {
      execSync("npm run build", { cwd: appPath, stdio: "inherit" });
      console.log(`✅ [${app}] built successfully!\n`);
    } catch (err) {
      console.error(`❌ Build failed for [${app}]:`, err.message);
      process.exit(1);
    }
  } else {
    console.log(`⚠️ Skipping [${app}] (no package.json found)`);
  }
}

console.log("✨ All applications built successfully!");
