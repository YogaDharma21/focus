import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🚀 Building all Focus monorepo applications and packages via Turborepo...\n");

try {
  execSync("pnpm turbo run build", { cwd: rootDir, stdio: "inherit" });
  console.log("\n✨ All applications and packages built successfully!");
} catch (err) {
  console.error("❌ Build failed:", err.message);
  process.exit(1);
}
