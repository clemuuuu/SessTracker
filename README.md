# SessTracker (Revision Tracker)

A visual, tree-based revision tracking application. Organize your subjects, break them down into topics, and track your study time with a hierarchical timer system.

![Visual Path Highlighting](/home/clem/.gemini/antigravity/brain/2d449b41-0200-4f8d-b7b2-fa0ef03d960d/verification_success_1771286083610.png)

## Features

### 🌳 Visual Revision Tree
- **Hierarchical Organization**: Create root "Subjects" and child "Topics".
- **Infinite Nesting**: Break down topics into sub-topics as deep as you need.
- **Auto-Layout**: "Auto Layout" button organizes your tree instantly using the Dagre algorithm.

### ⏱️ Smart Time Tracking
- **Individual Timers**: Each node has its own stopwatch.
- **Recursive Accumulation**: Time spent on a child topic **automatically adds up** to all its parent subjects.
- **Visual Feedback**:
    -   🟢 **Active Node**: Glows Green.
    -   🔵 **Accumulating Parents**: Glow Blue to show the "active path".

### 💾 Persistence & Safety
- **Auto-Save**: All progress is saved to `localStorage` in real-time.
- **Data Safety**: Server configured to strict port `5173` to prevent data loss perception.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## Technologies
- **React 18** + **TypeScript** + **Vite**
- **React Flow** (Visualization)
- **Zustand** (State Management & Persistence)
- **TailwindCSS** (Styling)
- **Framer Motion** (Animations)
