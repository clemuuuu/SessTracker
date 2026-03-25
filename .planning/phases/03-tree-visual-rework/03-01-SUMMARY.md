---
phase: 03-tree-visual-rework
plan: 01
subsystem: ui
tags: [canvas, animation, bezier, tree, organic, gradient]

# Dependency graph
requires:
  - phase: 02-branch-thickness-system
    provides: Tapered filled-polygon branches with sprout/wither animations and thickness springs
provides:
  - Cubic Bezier organic branch shapes with convex outward arc
  - Control-point sway (perpendicular displacement, not endpoint angle shift)
  - Inactive branch subtle linear gradient (lighter at base, normal at tip)
  - Leaf-node bud ellipse at branch tips
  - Withering branches also upgraded to cubic Bezier
affects:
  - 03-02-PLAN.md (glow/shadow rework builds on top of this rendering)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cubic Bezier polygon edges for branch shapes: bezierCurveTo with control points at 1/3 and 2/3 of branch length pushed outward perpendicularly (6% of length)"
    - "Control-point sway: swayPerp = effectiveLength * amplitude * sin(phase); modulates perpendicular offset of Bezier control points, keeping endpoints fixed for smooth junctions"
    - "Inactive gradient: createLinearGradient from base to tip, lighterBase with alpha+0.1 at stop 0"
    - "Leaf bud: ctx.ellipse() at tip with budRadiusX = max(1.5, endWidth * 0.7), rotated by branchAngle"

key-files:
  created: []
  modified:
    - src/components/features/background/layers/TreeLayer.tsx

key-decisions:
  - "swayedAngle = angle (not angle + offset): endpoints stay fixed, sway lives entirely in cubic Bezier control points for smooth junctions"
  - "curvePush = 6% of effectiveLength: subtle convex arc per user preference (botanically plausible, not dramatic)"
  - "Withering branches use Bezier with swayPerp=0 (static cached shape, no live sway)"
  - "fillStyle typed as string | CanvasGradient: inactive branches use gradient, active branches use solid color string"

patterns-established:
  - "Bezier convex branch: right edge bezierCurveTo(rcp1, rcp2, rightTip); lineTo leftTip; bezierCurveTo(lcp2, lcp1, leftBase) — reversed control points on return edge"

requirements-completed:
  - TREE-01

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 3 Plan 01: Organic Branch Rendering Summary

**Cubic Bezier branch polygons with control-point sway, inactive depth gradient, and leaf-node bud ellipses — replaces flat quadratic edges with botanically plausible organic curves**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T00:00:32Z
- **Completed:** 2026-03-25T00:03:09Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced `quadraticCurveTo` polygon edges with `bezierCurveTo` giving a convex outward arc (~6% of branch length) on both right and left edges
- Refactored ambient sway from endpoint-angle tilting (`swayedAngle = angle + offset`) to perpendicular control-point displacement (`swayPerp`), keeping branch endpoints and junctions fixed during sway
- Added subtle linear gradient fill on inactive branches: slightly lighter at base (alpha +0.1), normal color at tip
- Added small bud ellipse at leaf-node tips (proportional to tip width, rotated to branch angle)
- Updated withering branch draw section to also use cubic Bezier (no sway, static cached shape)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace quadratic polygon with cubic Bezier organic branches, refactor sway, add inactive gradient and leaf buds** - `3a9f8a2` (feat)

**Plan metadata:** *(to be committed with SUMMARY.md)*

## Files Created/Modified

- `src/components/features/background/layers/TreeLayer.tsx` - All changes: cubic Bezier edges, control-point sway, inactive gradient, leaf buds, Bezier withering

## Decisions Made

- `swayedAngle = angle` (not `angle + offset`): sway lives entirely in control points. This was the key architectural change — endpoints stay at fixed positions, so branch junctions remain seamless even during sway animation.
- `curvePush = 6% of effectiveLength`: subtle organic arc. The plan specified this value explicitly and the plan notes it as "per user decision".
- Withering branches use Bezier with `swayPerp = 0`: cached static shape, no live sway computation needed.
- `fillStyle: string | CanvasGradient`: the polygon uses `fillStyle`, junction knobs and bud use `color` (string) directly — gradient only applies to the main branch body.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript error in `timerSlice.test.ts` (UndergroundSlice type mismatch) — this is a known pre-existing issue documented in STATE.md, not caused by this plan's changes. No errors in TreeLayer.tsx.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Organic branch rendering complete, ready for Phase 3 Plan 02 (glow/shadow rework)
- Cubic Bezier shapes provide the geometry foundation that the next plan's shadow/glow system will render on top of
- All Phase 2 animations confirmed preserved: sprout, wither, thickness springs, activation wave, breathing glow

---
*Phase: 03-tree-visual-rework*
*Completed: 2026-03-25*
