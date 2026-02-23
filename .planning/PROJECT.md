# SessTracker

## What This Is

SessTracker is a visual study session tracker where users build a hierarchical tree of Subjects > Topics, track time on each node with a stopwatch, and view cumulative statistics. The app has four full-screen views: a starry sky (spatial objectives), a tree editor (main workspace), a calendar scheduler, and a roots/stats view. Built with React 19, TypeScript, Vite, Zustand, ReactFlow, and Canvas2D rendering.

## Core Value

The interactive visual tree that maps a student's revision structure and reacts to their active study — making study time tangible and visually rewarding.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- Hierarchical Subject > Topic tree with ReactFlow editor
- Stopwatch timer with delta-time accuracy, time accumulates up ancestors
- Canvas2D fractal background tree (BackgroundTree) mirroring node structure
- Canvas2D fractal roots background (RootsBackground) as symmetry of main tree
- Star sky view with click-to-place objectives
- Calendar weekly scheduler with session CRUD
- Roots/stats view with cumulative session time chart (Recharts)
- Todo list panel (General Objectives)
- Undo/redo system (50 entries, deep-clone snapshots)
- Hyprland-like window management (snap, focus, z-index)
- DPR-aware canvas rendering, IntersectionObserver optimization

### Active

<!-- Current scope: Main Tree Update milestone -->

- [ ] Complete visual rework of the main tree background (2D, interactive, detailed environment)
- [ ] Branch growth proportional to cumulative study time
- [ ] Rich branch interaction (lighting, thickness, environmental effects — not just glow)
- [ ] Full environmental details around the tree (decorative elements, ambiance)
- [ ] Symmetrical rework of roots background to match new main tree quality
- [ ] Stats panel rework: remove todo list, focus on active revision stats
- [ ] Sub-graphs for all sub-sections of the active node
- [ ] Days studied display for active section

### Out of Scope

- Sky view rework — not part of this milestone
- Calendar rework — not part of this milestone
- New node types or tree structure changes — tree logic stays the same
- 3D rendering — staying 2D canvas
- Mobile-specific layouts — desktop-first

## Context

- Current background system: `useTreeCanvas` hook draws fractal branches recursively via Canvas2D. Simple glow on active branch, static width/style otherwise.
- BackgroundTree (upward, gold/slate) and RootsBackground (downward, indigo/slate) share the same hook with config options.
- StatisticsPanel shows only the active node's cumulative session chart. No sub-section breakdown.
- RootsView currently contains both a StatisticsPanel and a TodoListPanel in WindowFrames.
- All canvas rendering is DPR-aware and deterministic (sin-based pseudo-random, no Math.random for visuals).

## Constraints

- **Port**: Must use port 5173 (localStorage is origin-bound)
- **Tech stack**: React 19 + Canvas2D, no WebGL/3D libraries
- **Performance**: Canvas rendering must stay efficient for small-to-medium trees (< 100 nodes)
- **No breaking changes**: Timer system, node data structure, and store slices remain compatible
- **Language**: All UI text in English

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Canvas2D for backgrounds | Lightweight, no extra deps, DPR-aware already | Good |
| Zustand slices pattern | Clean separation, already 7 slices | Good |
| useTreeCanvas shared hook | Config-driven, reusable for up/down trees | Revisit — may need significant extension or replacement for new features |

---
*Last updated: 2026-02-23 after milestone "Main Tree Update" started*
