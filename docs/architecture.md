# Architecture Documentation

## Monorepo Project Structure

The Focus repository is organized as an independent polyglot monorepo containing frontends, mobile, desktop, extensions, backend services, and CLI tools.

```
focus/
├── apps/
│   ├── website/       # Next.js web application
│   ├── landing/       # Next.js promotional landing page & interactive demo
│   ├── mobile/        # Expo / React Native mobile application
│   ├── desktop/       # Electron + Vite desktop client
│   ├── extension/     # Browser Extension (Manifest V3)
│   ├── backend/       # Backend API services
│   └── cli/           # Focus Command Line Interface
├── docker/            # Docker containers & Compose orchestration
├── docs/              # Monorepo architecture & developer guides
├── scripts/           # Monorepo utility scripts
└── .github/           # CI/CD workflows, PR templates, issue templates
```

## Application Matrix

| App | Path | Framework | Key Technologies |
|---|---|---|---|
| **Website** | `apps/website/` | Next.js 16 | React 19, TypeScript, Tailwind CSS, Zustand |
| **Landing** | `apps/landing/` | Next.js 16 | React 19, TypeScript, Tailwind CSS, Lucide Icons |
| **Mobile** | `apps/mobile/` | Expo / React Native | React Native, TypeScript, Zustand |
| **Desktop** | `apps/desktop/` | Electron + Vite | React, TypeScript, Tailwind CSS, Electron |
| **Extension** | `apps/extension/` | Vite MV3 | React, TypeScript, Chrome Extension API |
| **Backend** | `apps/backend/` | Planned | Node.js / Go microservices |
| **CLI** | `apps/cli/` | Planned | TypeScript / Rust CLI |

## Architectural Principles

1. **Independent Apps**: Each project inside `/apps/*` manages its own dependencies, scripts, and build tools.
2. **Path-Filtered CI**: Workflows run strictly for modified applications using path-filtering actions.
3. **Containerized Deployment**: Applications are containerized independently via Docker configurations in `/docker`.
