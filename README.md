# 🎯 Focus

[![Version](https://img.shields.io/badge/Version-v1.1.0-blue?style=for-the-badge)](https://github.com/YogaDharma21/focus)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Focus** is a modern, minimalist productivity suite designed to keep you in flow state. This monorepo houses the full ecosystem — from the flagship web app with customizable timers, task management, and ambient media, to planned backend services, CLI tools, desktop and mobile clients, and a browser extension.

![Focus Main Dashboard](./apps/website/public/screenshots/screenshot-main.png)

---

## ✨ Features

- **⏱️ Focus & Flow Timers** — Flexible Pomodoro and Flow (Stopwatch) modes.
- **🧮 Smart Flow Break Time** — Automatically calculates break duration as 1/5th of your Flow session length (e.g. 10 mins flow $\rightarrow$ 2 mins break).
- **🧘 Deep Focus Mode** — Distraction-free immersive view with custom session controls and keyboard shortcuts (`Esc` / `F`).
- **📝 Focus Session Custom Tasks** — Type custom focus goals directly into the timer and press `Enter` to instantly create and select new tasks.
- **✅ Task Management** — Organize tasks into groups, subtasks, estimated pomodoros, and recurring items.
- **📊 Stats & Productivity Trend** — Track daily focus minutes, completion rates, streak metrics, distraction breakdown, and weekly trend visualization.
- **💭 Mood & Notes** — Record your mood, thoughts, and reflections.
- **🎵 Ambient Media Player** — Background music player supporting YouTube playlists, Spotify embeds, and local focus tracks.
- **🎨 Custom Backgrounds** — Dynamic backgrounds including dark gradients, mountain scenes, cozy cafes, and anime rooms.

---

## 📸 Gallery

<details open>
<summary>Click to toggle screenshots</summary>

### ⏱️ Focus Session
![Main Dashboard](./apps/website/public/screenshots/screenshot-main.png)

### ✅ Task Management
![Task Management](./apps/website/public/screenshots/screenshot-tasks.png)

### 📊 Stats & Trend Analytics
![Stats & Journal](./apps/website/public/screenshots/screenshot-stats.png)

### 💭 Mood & Notes
![Mood Notes](./apps/website/public/screenshots/screenshot-mood.png)

</details>

---

## 📂 Project Structure

This is a **polyglot monorepo** — each app is fully independent with its own dependencies, build system, and configuration.

```
focus/
├── apps/
│   ├── website/       ✅ Next.js productivity web app (active)
│   ├── backend/       📦 Backend services (planned)
│   ├── cli/           📦 Command-line tools (planned)
│   ├── desktop/       📦 Desktop application (planned)
│   ├── extension/     📦 Browser extension (planned)
│   └── mobile/        📦 Mobile application (planned)
│
├── docker/            🐳 Docker configurations
├── docs/              📖 Architecture documentation
├── scripts/           🔧 Utility scripts
├── .github/           ⚙️ CI/CD workflows
├── LICENSE            📄 MIT License
└── README.md          📄 You are here
```

### Apps Overview

| App | Path | Status | Tech Stack |
|-----|------|--------|------------|
| **Website** | `apps/website/` | ✅ Active | Next.js, React, TypeScript, Tailwind CSS, Zustand, shadcn/ui |
| **Backend** | `apps/backend/` | 📦 Planned | TBD |
| **CLI** | `apps/cli/` | 📦 Planned | TBD |
| **Desktop** | `apps/desktop/` | 📦 Planned | TBD |
| **Extension** | `apps/extension/` | 📦 Planned | TBD |
| **Mobile** | `apps/mobile/` | 📦 Planned | TBD |

---

## 🛠️ Tech Stack (Website)

- **Framework**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with Persistence
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://motion.dev/)
- **Utilities**: [date-fns](https://date-fns.org/), [ReactPlayer](https://github.com/cookpete/react-player), [Sonner](https://sonner.emilkowal.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm / yarn / pnpm
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/YogaDharma21/focus.git
    cd focus
    ```

2. **Install dependencies (website):**

    ```bash
    cd apps/website
    npm install
    ```

3. **Run the development server:**

    ```bash
    npm run dev
    ```

4. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000) to start focusing.

### Running with Docker

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up

# Start only the website
docker-compose -f docker/docker-compose.yml up website
```

---

## ⚙️ CI/CD

This repository uses **GitHub Actions** with path-based filtering:

- Changes to `apps/website/**` trigger the website build pipeline
- Each app category has its own job with independent triggers
- CI runs on `ubuntu-latest` with Node.js 20

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
