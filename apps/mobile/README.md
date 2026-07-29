# Focus Mobile App

[![Version](https://img.shields.io/badge/Version-v1.2.0-blue?style=for-the-badge)](https://github.com/YogaDharma21/focus)
[![Expo](https://img.shields.io/badge/Expo-v52.0.0-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-v0.76.7-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Focus Mobile** is the React Native / Expo companion application for the Focus productivity suite. Currently in active development, it provides focus tracking, task management, dynamic flow break calculations, ambient audio playback, and productivity stats for iOS and Android.

---

## Screenshots Gallery

<details>
<summary>View Mobile Application Screenshots</summary>

<div align="center">

| Focus & Flow Mode | Task Management |
| :---: | :---: |
| ![Focus Mode](./assets/images/screenshot-focus.jpeg) | ![Task Management](./assets/images/screenshot-tasks.jpeg) |

| Stats & Analytics | Mood Notes |
| :---: | :---: |
| ![Stats & Analytics](./assets/images/screenshot-stats.jpeg) | ![Mood Notes](./assets/images/screenshot-mood.jpeg) |

</div>

</details>

---

## Key Features

- **Focus & Flow Timers** — Flexible Pomodoro (Work/Break) and Flow (Stopwatch) modes.
- **Dynamic Flow Break Math** — Elapsed Flow session duration is dynamically divided by 5 to calculate break time. Remembers previous mode to return to Flow after breaks.
- **Task Session Estimation & Auto-Finish** — Track estimated vs. completed sessions per task. Tasks automatically mark as finished when completed sessions reach the estimate.
- **Focus on Task Redirection** — One-tap redirection from task list or detail view straight into an active focus session linked to the task.
- **Deep Focus Mode Overlay** — Immersive full-screen focus view with Log Distraction and Complete Session controls.
- **Sound Player** — Native audio player for local ambient focus sounds with backdrop tap-to-close behavior.
- **Stats Dashboard** — Comprehensive stats with Day Progress percentage & remaining time, 3-card metrics row, and streak / completion rate metrics.
- **Squircle Design System** — Modern squircle (rounded square) border radiuses for buttons and cards across light and dark themes.

---

## Tech Stack

- **Framework**: Expo SDK 52 (Expo Router file-based routing)
- **Core Library**: React Native
- **Language**: TypeScript
- **Icons**: Lucide React Native
- **State Management**: Zustand with persistence

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm / yarn / pnpm
- Expo Go app on mobile OR Android Studio / Xcode for emulators.

### Development Setup

1. **Navigate to the mobile directory:**

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
   - Press `a` for **Android Emulator**.
   - Press `i` for **iOS Simulator**.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
