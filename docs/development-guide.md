# Developer Setup & Workflow Guide

Welcome to the **Focus** development environment. Follow this guide to set up, build, and run applications locally.

## Prerequisites

- **Node.js**: v18.0.0 or higher (v22 recommended)
- **npm**: v9.0.0 or higher
- **Git**: For version control

## Quick Start

### 1. Landing Page Development (`apps/landing`)

```bash
cd apps/landing
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or specified port.

### 2. Main Web Application (`apps/website`)

```bash
cd apps/website
npm install
npm run dev
```

### 3. Desktop Application (`apps/desktop`)

```bash
cd apps/desktop
npm install
npm run dev
```

### 4. Browser Extension (`apps/extension`)

```bash
cd apps/extension
npm install
npm run build
```
Load the `apps/extension/dist` directory as an unpacked extension in Chrome / Edge (`chrome://extensions`).

## Utility Scripts

Run scripts from the monorepo root:

- **Build all applications**:
  ```bash
  node scripts/build-all.js
  ```

- **Clean build artifacts**:
  ```bash
  node scripts/clean.js
  ```

- **Check application statuses**:
  ```bash
  node scripts/check-apps.js
  ```
