# Monorepo Utility Scripts

This folder contains node utility scripts to automate builds, inspections, and workspace maintenance.

## Available Scripts

### 1. Build All Apps (`scripts/build-all.js`)
Builds production output for active monorepo applications (`website`, `landing`, `desktop`, `extension`).

```bash
node scripts/build-all.js
```

### 2. Clean Workspace (`scripts/clean.js`)
Removes `.next`, `dist`, `out`, `.turbo`, and temporary build outputs across all apps.

```bash
node scripts/clean.js
```

### 3. Check App Statuses (`scripts/check-apps.js`)
Inspects and lists all app folders under `/apps` with their package names and version information.

```bash
node scripts/check-apps.js
```
