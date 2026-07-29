# 📱 Focus Mobile App

[![Expo](https://img.shields.io/badge/Expo-v52.0.0-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-v0.76.7-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Focus Mobile** is the React Native / Expo companion app for the Focus productivity suite. Built with cross-platform performance and mobile UX best practices, it provides seamless focus tracking, task management, flow state break calculations, ambient audio playback, and productivity stats on iOS and Android.

---

## 📸 Screenshots

<div align="center">

| ⏱️ Focus & Flow Mode | ✅ Task Management |
| :---: | :---: |
| ![Focus Mode](./assets/images/screenshot-focus.jpeg) | ![Task Management](./assets/images/screenshot-tasks.jpeg) |

| 📊 Stats & Analytics | 💭 Mood Notes |
| :---: | :---: |
| ![Stats & Analytics](./assets/images/screenshot-stats.jpeg) | ![Mood Notes](./assets/images/screenshot-mood.jpeg) |

</div>

---

## ✨ Features

- **⏱️ Focus & Flow Timers** — Switch between Pomodoro (Work/Break) and Flow (Stopwatch) modes.
- **🧮 Dynamic Flow Break Math** — Elapsed Flow session duration is dynamically divided by 5 to calculate break time. Automatically remembers previous mode to seamlessly return to Flow after breaks.
- **🎯 Task Session Estimation & Auto-Finish** — Track estimated vs. completed sessions per task. Tasks automatically mark as finished when completed sessions reach the estimate.
- **🚀 "Focus on this task" Redirection** — One-tap redirection from task list or detail view straight into an active focus session linked to the task.
- **🧘 Deep Focus Mode Overlay** — Immersive full-screen focus view with Log Distraction and Complete Session controls.
- **🎵 Sound Player** — Native audio player for local ambient focus sounds with backdrop tap-to-close behavior.
- **📊 Stats Dashboard** — Comprehensive stats with Day Progress percentage & remaining time, 3-card grid (Minutes Today, Tasks Today, Pending Tasks), and 2-card grid (Streak Metrics & Completion Rate).
- **🎨 Squircle Design System** — Modern squircle (rounded square) border radiuses for buttons and cards across light and dark themes.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 52](https://expo.dev/) (Expo Router file-based routing)
- **Core Library**: [React Native](https://reactnative.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with `react-native-mmkv` / Async storage persistence
- **Safe Area & UI**: `react-native-safe-area-context`

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm / yarn / pnpm
- [Expo Go](https://expo.dev/go) app on your mobile device OR Android Studio / Xcode for emulators.

### Development Setup

1. **Navigate to the mobile app directory:**

   ```bash
   cd apps/mobile
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the Expo development server:**

   ```bash
   npx expo start
   ```

4. **Run on target platform:**
   - Scan the QR code with **Expo Go** (Android/iOS).
   - Press `a` to launch on **Android Emulator**.
   - Press `i` to launch on **iOS Simulator**.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](../../LICENSE) for more details.
