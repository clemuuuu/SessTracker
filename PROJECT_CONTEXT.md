# Project Context: SessTracker (Revision Tracker)

## Overview
SessTracker is a web application designed to track revision sessions using a visual, tree-based interface. It helps users organize subjects and topics hierarchically and track time spent on each.

![alt text](docs/image.png)

## Technology Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS v4 + Framer Motion (animations)
- **Visualization**: React Flow (@xyflow/react) for the node tree
- **State Management**: Zustand (with persistence middleware)
- **Icons**: Lucide React
- **Layout Engine**: Dagre (for auto-layout)


## Project Structure
/src
  /components
    /features
      /background
        BackgroundTree.tsx       # Canvas component for the Organic 3D Background
        RootsBackground.tsx      # Inverted organic tree for Roots view
      /controls
        FloatingControls.tsx     # Top-left controls
      /stats                     # Statistics and Roots view
        RootsView.tsx            # Bottom section container
        StatisticsPanel.tsx      # Charts and data visualization
      /tree                      # Main Tree view
        MainTree.tsx             # Top section container
    /nodes
      RevisionNode.tsx           # Custom Node component with Timer & Controls
    /ui
      (Reserved for generic UI components)
  /hooks
    useAutoLayout.ts             # Hook using Dagre to organize the tree
  /store
    /slices                      # Modular store logic (slices)
      historySlice.ts
      nodeSlice.ts
      timerSlice.ts
      types.ts
    useRevisionStore.ts          # Main Zustand store combining slices
  /types
    index.ts                     # Shared TypeScript interfaces
  /utils
    /__tests__                   # Unit tests
      graphHelpers.test.ts
    graphHelpers.ts              # Graph traversal utilities
  App.tsx                        # Main entry point
  main.tsx                       # React root
  index.css                      # Global styles

## Key Features
1.  **Visual Revision Tree**:
    -   Subjects and topics are nodes in a graph.
    -   Users can add root "Subjects" and child "Topics".
    -   **Recursive Deletion**: Deleting a node removes all its descendants.
    -   **Renaming**: Click on a node label to rename it (persisted on blur/enter).

2.  **Time Tracking**:
    -   Each node has an independent stopwatch.
    -   Only one timer can be active at a time (switching nodes pauses the previous one).
    -   Time determines the "Score" or progress (currently just displayed as HH:MM:SS).

3.  **Persistence**:
    -   State is automatically saved to `localStorage` via Zustand middleware.
    -   "Auto-saved" indicator provides visual feedback.

4.  **Auto-Layout**:
    -   "Auto Layout" button uses the Dagre algorithm to organize nodes in a top-down tree structure.

5.  **Motivational UI**:
    -   Dark mode with glassmorphism effects.
    -   Animated glows when timers are active.

## Setup & Commands
- **Install**: `npm install`
- **Run**: `npm run dev` (Forces port 5173 defined in `vite.config.ts`)
- **Test**: `npm test` (Runs Vitest unit tests)
- **Build**: `npm run build`

## New Features (v1.1)

### Recursive Time Tracking & Visuals
-   **Accumulation**: Time spent on a child node recursively updates all its ancestors.
-   **Optimization**: Ancestor path is calculated once when timer starts (stored in `activeAncestorIds`).
-   **Visual Feedback**:
    -   Active Node: Green border/glow.
    -   Ancestors: Blue border/glow + "(Accumulating)" badge.

### Background Fractal Tree (v1.2)
-   **Technology**: HTML5 Canvas + Recursive Function.
-   **Design**: "Organic 3D" style using:
    -   **Bezier Curves**: For natural, non-linear branches.
    -   **Variable Widths**: Tapering branches to simulate depth.
    -   **Gradient/Shadows**: Gold glow for active paths, Slate silhouette for inactive.
-   **Stability**: Replaced `Math.random()` with a **deterministic hash function** based on node IDs. This ensures the tree looks organic but remains pixel-perfectly static across re-renders (fixing the "jitter" issue).
-   **Logic**:
    -   A "Virtual Root" draws a main trunk from the bottom.
    -   It branches out to the user's "Root Subjects".
    -   Then recursively follows the React Flow edges (`activeAncestorIds` determines the glow).

## Known Implementation Details
- **Port**: Configured to strictly use port `5173` to prevent data "loss" (since localStorage is origin-bound).
- **Auto-Save**: The "Auto-saved" badge is purely visual feedback; saving happens synchronously on every state change.
- **Roots Background Opacity**: Implemented using **local component state** (`useState`) in `RootsView.tsx` rather than the global Zustand store. This decision was made to avoid circular dependency issues and to keep the UI-specific logic isolated and lightweight. The slider controls the opacity of the amber gradient overlay (0 to 1).

## Git Workflow (Reminder)

```bash
# 1. Add modified files
git add .

# 2. Commit
git commit -m "Your message"

# 3. Push
git push
```
