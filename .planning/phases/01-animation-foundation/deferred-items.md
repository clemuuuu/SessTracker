# Deferred Items - Phase 01

## Pre-existing Issues (Out of Scope)

### 1. timerSlice.test.ts missing UndergroundSlice properties
- **File:** `src/store/__tests__/timerSlice.test.ts`
- **Issue:** After UndergroundSlice was added to RevisionState, the timer test's type assertion (`create<RevisionState>()`) is missing the `undergroundNotes`, `addUndergroundNote`, `updateUndergroundNote`, `deleteUndergroundNote` properties.
- **Impact:** `tsc -b` (strict build) fails on this file. Tests still pass via Vitest (which uses its own transform).
- **Fix:** Add UndergroundSlice to the test store setup, or use `create<any>()` pattern as other tests do.
- **Found during:** 01-01 Task 2 build verification
- **Cause:** Pre-existing uncommitted changes to `types.ts` and `useRevisionStore.ts` that added UndergroundSlice without updating the timer test.

### 2. undergroundSlice.ts TypeScript errors
- **File:** `src/store/slices/undergroundSlice.ts`
- **Issue:** Multiple implicit `any` type errors and type assignment issues. This is uncommitted WIP code.
- **Impact:** Contributes to `tsc -b` failure.
- **Found during:** 01-01 Task 2 build verification
- **Cause:** Pre-existing uncommitted WIP file with incomplete TypeScript types.
