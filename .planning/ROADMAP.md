# Roadmap: SessTracker v1.0 Main Tree Update

## Overview

This milestone transforms the static fractal tree background into an interactive, animated visual environment that responds to study activity. Starting with the animation foundation and RAF loop, we build up through dynamic branch thickness, polished organic visuals, rich environmental details, and finally extend the same quality to the roots background and statistics panel. Each phase delivers observable improvements to the user's visual experience while maintaining the existing architecture and performance.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Animation Foundation** - Integrate popmotion/bezier-easing, RAF loop, layer separation
- [x] **Phase 2: Branch Thickness System** - Dynamic thickness based on cumulative time
- [ ] **Phase 3: Tree Visual Rework** - Organic curves, polished style, lighting system
- [ ] **Phase 4: Environment** - Ground, decorative elements, particles, ambiance
- [ ] **Phase 5: Roots Symmetry** - Apply tree rework to roots background
- [ ] **Phase 6: Stats Rework** - Remove todo list, active revision stats, sub-graphs

## Phase Details

### Phase 1: Animation Foundation
**Goal**: Animation infrastructure is ready for all visual features
**Depends on**: Nothing (first phase)
**Requirements**: TREE-03
**Success Criteria** (what must be TRUE):
  1. The canvas rendering uses a requestAnimationFrame loop with delta-time accumulation
  2. Animation utilities (popmotion interpolation, bezier-easing) are integrated and testable
  3. The tree canvas supports layered rendering (static background layer + animated overlay layer)
  4. RAF loop cleanup properly handles unmounting without memory leaks
  5. Zustand store is NOT called inside RAF loop (state changes trigger re-renders, RAF reads cached values)
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Animation utilities (spring manager, easing, interpolation) + RAF loop hook + useTreeCanvas conversion
- [x] 01-02-PLAN.md — Three-layer canvas stack (background gradient, animated tree, particle overlay) with visual effects

### Phase 2: Branch Thickness System
**Goal**: Branches visually represent cumulative study time through thickness
**Depends on**: Phase 1
**Requirements**: TREE-02, TREE-05
**Success Criteria** (what must be TRUE):
  1. Each branch's thickness is calculated from its node's cumulative totalTime value
  2. Branch thickness smoothly interpolates when study time increases (animated transition)
  3. The tree dynamically rebuilds when nodes are added or removed in ReactFlow
  4. Parent branches are thicker than child branches (ancestor accumulation is visible)
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Data pipeline: buildCumulativeTimeMap utility + revised timeToThickness/thicknessToColor interpolations + TDD tests
- [x] 02-02-PLAN.md — TreeLayer integration: data-driven thickness rendering, tapered branches, color gradient, sprout/wither animations + visual checkpoint

### Phase 3: Tree Visual Rework
**Goal**: The tree has a polished organic appearance with rich lighting
**Depends on**: Phase 2
**Requirements**: TREE-01, TREE-04
**Success Criteria** (what must be TRUE):
  1. Tree branches are drawn with smooth Bezier curves instead of straight lines
  2. The visual style feels organic and polished (curved, natural-looking branches)
  3. The active branch and its ancestors have animated pulsing glow with radial gradients
  4. The lighting system uses composite operations for depth (not just shadowBlur)
  5. Branch transitions (color, glow intensity) are smoothly animated
**Plans**: TBD

Plans:

### Phase 4: Environment
**Goal**: The tree exists in a rich 2D environment with decorative details
**Depends on**: Phase 3
**Requirements**: ENV-01, ENV-02, ENV-03, ENV-04
**Success Criteria** (what must be TRUE):
  1. A ground/horizon is drawn beneath the tree with gradient or texture
  2. Decorative 2D elements (vegetation, visual details) surround the tree
  3. Floating particles (sparkles, leaves) appear around the active branch and animate smoothly
  4. The overall visual ambiance is cohesive (gradients, depth, layering work together)
**Plans**: TBD

Plans:

### Phase 5: Roots Symmetry
**Goal**: The roots background matches the quality of the new main tree
**Depends on**: Phase 2, Phase 3, Phase 4 (reuses code)
**Requirements**: ROOT-01, ROOT-02, ROOT-03, ROOT-04
**Success Criteria** (what must be TRUE):
  1. The roots background is redrawn with organic curves matching the main tree style
  2. Root thickness is proportional to cumulative time (same mechanic as main tree)
  3. Active roots have the same pulsing glow and radial gradient lighting as the main tree
  4. The roots environment has cohesive gradients and ambiance matching the main tree
**Plans**: TBD

Plans:

### Phase 6: Stats Rework
**Goal**: The stats panel focuses on active revision information with sub-section breakdown
**Depends on**: Nothing (independent)
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04
**Success Criteria** (what must be TRUE):
  1. The todo list is removed from RootsView or relocated to a different screen
  2. The stats panel displays active node name, total time, and days studied
  3. Sub-graphs are displayed for each direct child of the active node
  4. The existing cumulative time chart (Recharts area chart) is preserved and visible in the new layout
**Plans**: TBD

Plans:

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Animation Foundation | 2/2 | Complete | 2026-03-04 |
| 2. Branch Thickness System | 2/2 | Complete    | 2026-03-06 |
| 3. Tree Visual Rework | 0/TBD | Not started | - |
| 4. Environment | 0/TBD | Not started | - |
| 5. Roots Symmetry | 0/TBD | Not started | - |
| 6. Stats Rework | 0/TBD | Not started | - |
