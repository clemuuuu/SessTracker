---
phase: 01-animation-foundation
plan: 01
subsystem: animation
tags: [popmotion, bezier-easing, spring-physics, raf, canvas, easing, interpolation]

# Dependency graph
requires: []
provides:
  - "createSpringManager factory for physics-based spring animations"
  - "6 bezier-easing presets (easeInOut, easeOut, easeIn, organicGrow, breathe, gentleSwing)"
  - "Interpolation utilities (timeToThickness, glowToOpacity, warmthToGradient)"
  - "useAnimationLoop RAF hook with delta-time clamping and IntersectionObserver"
  - "useTreeCanvas refactored to RAF-based rendering with Zustand-ref boundary pattern"
affects: [01-02-PLAN, branch-thickness, tree-visual-rework, environment, roots-symmetry]

# Tech tracking
tech-stack:
  added: [popmotion@11.0.5, bezier-easing@2.1.0]
  patterns: [zustand-raf-boundary, spring-iterator-manager, raf-delta-time-clamping]

key-files:
  created:
    - src/animation/springManager.ts
    - src/animation/easing.ts
    - src/animation/interpolation.ts
    - src/hooks/useAnimationLoop.ts
    - src/animation/__tests__/springManager.test.ts
    - src/animation/__tests__/easing.test.ts
  modified:
    - src/hooks/useTreeCanvas.ts
    - package.json

key-decisions:
  - "Verified popmotion spring API returns iterator with next(elapsedMs) -> {value, done} - elapsed time, not absolute timestamp"
  - "warmthToGradient implemented as pure function (not popmotion interpolate) because interpolate cannot return objects"
  - "useAnimationLoop updates previousTimeRef even when canvas is not visible to prevent delta spike on visibility change"

patterns-established:
  - "Zustand-RAF boundary: store values read via selectors, cached into useRef, RAF draw callback reads refs only with empty dependency array"
  - "Spring iterator manager: stateful spring instances created once, ticked per frame with delta-time accumulation"
  - "RAF delta-time clamping: Math.min(deltaMs, 100) prevents animation explosions after tab switch"

requirements-completed: [TREE-03]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 1 Plan 1: Animation Foundation Summary

**Spring physics manager, bezier-easing presets, interpolation utilities, and RAF-based tree canvas with Zustand-ref boundary pattern using popmotion and bezier-easing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04T22:39:07Z
- **Completed:** 2026-03-04T22:42:54Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Installed popmotion 11.0.5 and bezier-easing 2.1.0 as animation infrastructure foundations
- Created spring manager, 6 easing presets, and 3 interpolation utilities with 34 passing tests
- Converted useTreeCanvas from synchronous useEffect redraws to continuous RAF-based rendering via useAnimationLoop
- Established the Zustand-RAF boundary pattern (store values cached in refs, draw callback reads refs only)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create animation utility modules** - `643e6be` (feat)
2. **Task 2: Create useAnimationLoop hook and convert useTreeCanvas to RAF-based rendering** - `4c807a0` (feat)

## Files Created/Modified
- `src/animation/springManager.ts` - Spring instance manager with set/tick/get/has/remove/clear API using popmotion spring iterators
- `src/animation/easing.ts` - 6 bezier-easing presets for organic tree animations
- `src/animation/interpolation.ts` - Tree-specific value mappings (time->thickness, glow->opacity, warmth->gradient)
- `src/hooks/useAnimationLoop.ts` - DPR-aware RAF canvas hook with delta-time clamping (100ms) and IntersectionObserver
- `src/hooks/useTreeCanvas.ts` - Refactored to use useAnimationLoop with Zustand-ref boundary pattern
- `src/animation/__tests__/springManager.test.ts` - 10 tests for spring manager lifecycle
- `src/animation/__tests__/easing.test.ts` - 24 tests for easing preset boundary values and monotonicity
- `package.json` - Added popmotion and bezier-easing dependencies

## Decisions Made
- Verified popmotion spring API shape: `spring({...})` returns `{ next(elapsedMs) => { value, done } }` - takes elapsed time from animation start, not absolute timestamp
- Used pure function for `warmthToGradient` instead of popmotion `interpolate` because interpolate cannot return objects (only numbers)
- useAnimationLoop updates `previousTimeRef` even when not visible to prevent a large delta-time spike when the canvas becomes visible again

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run build` (`tsc -b`) fails due to pre-existing TypeScript errors in `src/store/slices/undergroundSlice.ts` and `src/store/__tests__/timerSlice.test.ts` (UndergroundSlice was added to RevisionState but not all files were updated). These are from uncommitted WIP code predating this plan. Logged to `deferred-items.md`. All new files compile cleanly -- only pre-existing errors remain.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Animation infrastructure ready for Plan 02: three-layer canvas stack with visual effects
- useAnimationLoop provides deltaMs/totalMs parameters ready for spring-driven animations
- Spring manager, easing presets, and interpolation utilities available for import
- Zustand-ref boundary pattern established and ready to follow in Plan 02 components

## Self-Check: PASSED

All 8 created/modified files verified present on disk. Both task commits (643e6be, 4c807a0) verified in git log. 88/88 tests passing.

---
*Phase: 01-animation-foundation*
*Completed: 2026-03-04*
