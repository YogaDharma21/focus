const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function buildHelper() {
    if (process.platform !== "win32") {
        return;
    }

    const electronDir = __dirname;
    const src = path.join(electronDir, "win32-process-helper.cs");
    const out = path.join(electronDir, "win32-process-helper.exe");

    if (!fs.existsSync(src)) return;

    const candidates = [
        "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe",
        "C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe",
    ];

    let csc = candidates.find((c) => fs.existsSync(c));

    if (!csc) {
        try {
            const where = execFileSync("where", ["csc.exe"], { encoding: "utf8" });
            csc = where.split(/\r?\n/)[0].trim();
        } catch {}
    }

    if (!csc) {
        console.warn("csc.exe not found; skipping win32-process-helper compilation.");
        return;
    }

    try {
        execFileSync(csc, [
            "/nologo",
            "/optimize+",
            "/target:exe",
            `/out:${out}`,
            src,
        ]);
        console.log("Built win32-process-helper.exe successfully.");
    } catch (err) {
        console.error("Failed to build win32-process-helper.exe:", err);
    }
}

buildHelper();
