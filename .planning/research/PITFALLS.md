# Pitfalls: Adding Interactive Canvas2D Tree Visualization

**Domain:** Canvas2D animation + React integration pitfalls
**Researched:** 2026-02-23
**Confidence:** HIGH (based on detailed codebase analysis)

## Critical Pitfalls

### Pitfall 1: RAF Loop Memory Leak Without Cleanup

**What goes wrong:** `requestAnimationFrame` loop continues after component unmount, accumulating leaked loops.

**Current risk:** `useTreeCanvas` uses `useEffect` with static deps — no RAF loop yet. Adding RAF without proper cleanup creates memory leaks.

**Prevention:**
```typescript
useEffect(() => {
  let frameId: number;
  const animate = () => {
    draw();
    frameId = requestAnimationFrame(animate);
  };
  frameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameId);
}, [dependencies]);
```

**Phase:** 1 (Animation Foundation)

---

### Pitfall 2: setInterval Timer + RAF Timing Desync

**What goes wrong:** Timer updates `totalTime` every 1000ms via `setInterval`. RAF runs at 60fps. Growth animations see discrete jumps instead of smooth progression.

**Prevention:** Add interpolation layer:
```typescript
const timeSinceLastTick = Date.now() - lastTickTimestamp;
const interpolatedTime = currentTotalTime + (timeSinceLastTick / 1000);
```

**Phase:** 1 (Animation Foundation)

---

### Pitfall 3: useEffect Dependency on Draw Function Causes Infinite Loop

**What goes wrong:** Adding interactive state (hoveredNodeId) to `useCallback` deps for draw function causes 60fps re-renders.

**Prevention:** Use refs for frequently-changing state, not React state:
```typescript
const hoveredIdRef = useRef<string | null>(null);
```

**Phase:** 1 (Animation Foundation)

---

### Pitfall 4: Full Canvas Clear + Redraw Every Frame Bottleneck

**What goes wrong:** Current `useTreeCanvas` clears entire canvas and redraws all branches. At 60fps with growth effects, draw time exceeds 16ms frame budget.

**Prevention:** Layer separation — static tree on base canvas, animated effects on overlay canvas.

**Phase:** 2 (Growth Mechanics)

---

### Pitfall 5: Stats Panel Only Queries activeNode, Not Children

**What goes wrong:** `StatisticsPanel` shows only `activeNode.data.sessions`. Tree thickness represents cumulative time but stats show only direct sessions.

**Prevention:** Add `getDescendantIds` utility, collect all descendant sessions for stats.

**Phase:** 2 (Stats Rework)

---

### Pitfall 6: pseudoRandom Breaks With Animated Positions

**What goes wrong:** Adding frame count to pseudoRandom seed causes jittery branches instead of smooth interpolation.

**Prevention:** Separate deterministic layout from animated offsets (easing functions).

**Phase:** 2 (Growth Mechanics)

---

### Pitfall 7: Zustand State Updates in RAF Loop = Re-render Storm

**What goes wrong:** Storing animation state in Zustand triggers 60fps React re-renders across entire app.

**Prevention:** Animation state in `useRef`, Zustand only for persistent state.

**Phase:** 1 (Animation Foundation)

---

### Pitfall 8: Canvas Hit Testing O(n) Per Mouse Event

**What goes wrong:** Interactive tree needs mouse-to-node mapping with expensive per-event lookups.

**Prevention:** Build bounding box map during draw pass, query on mouse events.

**Phase:** 3+ (if interactive hover added)

## Pitfall-to-Phase Mapping

| Pitfall | Phase | Priority |
|---------|-------|----------|
| RAF leak without cleanup | Phase 1 | CRITICAL |
| Timer/RAF desync | Phase 1 | HIGH |
| Zustand state in RAF | Phase 1 | CRITICAL |
| Full redraw bottleneck | Phase 2 | MEDIUM |
| Stats missing descendants | Phase 2 | HIGH |
| pseudoRandom animation misuse | Phase 2 | MEDIUM |

---
*Pitfalls research for: Canvas2D Interactive Tree Visualization*
*Researched: 2026-02-23*
