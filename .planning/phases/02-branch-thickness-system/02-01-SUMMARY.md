---
phase: 02-branch-thickness-system
plan: 01
subsystem: ui
tags: [canvas, interpolation, popmotion, tree-rendering, tdd]

# Dependency graph
requires:
  - phase: 01-animation-foundation
    provides: popmotion interpolation patterns, animation module structure
provides:
  - buildCumulativeTimeMap utility for subtree time aggregation
  - Revised timeToThickness with pixel-width output (2.5-28px)
  - thicknessToColor amber gradient interpolation
  - thicknessToInactiveColor slate/opacity interpolation
  - MIN_THICKNESS and MAX_THICKNESS constants
affects: [02-02 TreeLayer integration, 05 roots-symmetry]

# Tech tracking
tech-stack:
  added: []
  patterns: [memoized recursive descent for tree aggregation, piecewise interpolation for visual mapping]

key-files:
  created:
    - src/animation/__tests__/interpolation.test.ts
  modified:
    - src/utils/graphHelpers.ts
    - src/utils/__tests__/graphHelpers.test.ts
    - src/animation/interpolation.ts

key-decisions:
  - "buildCumulativeTimeMap uses closure-based memoization over a local Map rather than a class or external cache"
  - "timeToThickness outputs direct pixel widths (2.5-28) instead of multipliers, removing a multiplication step from the rendering pipeline"
  - "Color interpolation uses popmotion interpolate with hex/rgba strings for direct canvas consumption"

patterns-established:
  - "Subtree aggregation pattern: build childrenMap externally, pass to buildCumulativeTimeMap for O(n) computation"
  - "Visual mapping pipeline: cumulative seconds -> thickness pixels -> color string (two-step interpolation)"

requirements-completed: [TREE-02]

# Metrics
duration: 3min
completed: 2026-03-05
---

# Phase 2 Plan 1: Data Pipeline Summary

**Pure utility functions mapping cumulative study time to branch thickness (2.5-28px logarithmic) and color (amber gradient + inactive slate) via popmotion interpolation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T19:58:40Z
- **Completed:** 2026-03-05T20:01:26Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 4

## Accomplishments
- buildCumulativeTimeMap: O(n) memoized recursive descent aggregating subtree totalTime across any tree shape
- Revised timeToThickness: 6-point piecewise interpolation (0s->2.5px, 60s->4px, 300s->7px, 1800s->13px, 7200s->20px, 36000s->28px) with boundary clamping
- thicknessToColor: 5-point amber gradient from #FDE68A (thin) to #B45309 (thick) via popmotion interpolate
- thicknessToInactiveColor: 5-point slate gradient with 0.3-0.5 opacity for dormant branches
- 26 new tests (7 for buildCumulativeTimeMap + 19 for interpolation), all 114 total tests passing

## Task Commits

Each task was committed atomically:

1. **RED - Failing tests** - `37872ef` (test)
   - graphHelpers.test.ts: 7 new tests for buildCumulativeTimeMap (empty, single, parent-child, multi-level, multi-root, zero/undefined)
   - interpolation.test.ts: 19 new tests for timeToThickness, thicknessToColor, thicknessToInactiveColor
2. **GREEN - Implementation** - `5c866b0` (feat)
   - graphHelpers.ts: buildCumulativeTimeMap with memoized recursive descent
   - interpolation.ts: revised timeToThickness, new thicknessToColor, thicknessToInactiveColor, MIN/MAX constants

## Files Created/Modified
- `src/utils/graphHelpers.ts` - Added buildCumulativeTimeMap for O(n) subtree time aggregation
- `src/utils/__tests__/graphHelpers.test.ts` - 7 new tests for buildCumulativeTimeMap
- `src/animation/interpolation.ts` - Revised timeToThickness (pixel output), added thicknessToColor, thicknessToInactiveColor, MIN/MAX constants
- `src/animation/__tests__/interpolation.test.ts` - 19 tests for thickness/color interpolation functions

## Decisions Made
- buildCumulativeTimeMap uses closure-based memoization (local Map inside function scope) rather than class or external cache -- simplest pattern, garbage collected on function return
- timeToThickness now outputs direct pixel widths instead of multipliers -- eliminates a multiplication step in the rendering pipeline and makes the API more intuitive
- Color interpolation uses popmotion's interpolate which outputs rgba() strings -- these can be used directly as canvas strokeStyle values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four utility functions ready for TreeLayer consumption in Plan 02
- buildCumulativeTimeMap accepts the same childrenMap structure already built in TreeLayer's draw callback
- thicknessToColor and thicknessToInactiveColor return canvas-ready rgba strings
- MIN_THICKNESS and MAX_THICKNESS exported for use in canvas line width calculations

## Self-Check: PASSED

- All 5 files verified present on disk
- Commits `37872ef` (RED) and `5c866b0` (GREEN) confirmed in git log
- All 114 tests passing (0 regressions)

---
*Phase: 02-branch-thickness-system*
*Completed: 2026-03-05*
