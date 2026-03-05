# Phase 2: Branch Thickness System - Research

**Researched:** 2026-03-05
**Domain:** Canvas2D rendering, spring-animated thickness, tree data mapping
**Confidence:** HIGH

## Summary

Phase 2 connects the existing `totalTime` data on each node to the visual branch width in the canvas tree. The key challenge is computing a **cumulative thickness** (each parent sums all descendants' time), mapping it through a logarithmic-feeling curve, and smoothly animating transitions with the spring system established in Phase 1.

The existing codebase already provides nearly everything needed. `timeToThickness` from `src/animation/interpolation.ts` was pre-built in Phase 1 but is unused. The `springManager` supports named springs per node for animated transitions. The `TreeLayer.tsx` draw callback already receives `deltaMs` for spring ticking and has full access to nodes/edges via refs. The `popmotion` `interpolate` function handles color strings natively (verified: hex input, rgba output), enabling the light-gold-to-deep-amber color progression without custom code.

**Primary recommendation:** Compute a `cumulativeTime` map (node ID -> total subtree time) once per frame in the draw callback, feed each value through a revised `timeToThickness` interpolation for width and a new `thicknessToColor` interpolation for stroke color, and animate changes via per-node springs in the existing `springManagerRef`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Logarithmic curve: early study time produces visible growth quickly, diminishing returns at high values
- Full accumulation: parent branches sum all descendants' totalTime (trunk is always thickest)
- Thickness updates trigger every minute while timer is running (not per-second)
- Spring-based transitions when thickness changes (matches Phase 1 spring system)
- Every-minute update cadence creates a noticeable "growth pulse" -- rewarding without being distracting
- Spring parameters should feel organic: slight overshoot, gentle settle
- Dramatic contrast between trunk and leaf branches -- clear hierarchy at a glance, like a real oak
- Color deepens with thickness: light gold (new/thin) to deep amber (mature/thick)
- Branches taper toward the tip -- thick at base, thin at end, like real branches
- New branches (0 time) are visible but light: ~2-3px, pale gold -- clearly present without squinting
- Add animation: branch grows outward from parent to its position (spring-based sprouting)
- Delete animation: branch withers/retracts back toward parent (reverse of grow)

### Claude's Discretion
- Exact thickness range (min/max pixel values) -- pick what looks good with the fractal tree
- Logarithmic cap point -- choose a cumulative time where thickness maxes out
- Growth propagation style (cascade upward with delay vs simultaneous) -- pick whichever looks more organic
- Node add/remove thickness transition (animate vs instant) -- pick what feels natural
- Whether first-study-minute gets a special pulse effect -- judge if it adds value or is noise

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TREE-02 | Branches grow thicker proportionally to cumulative study time on each node | Cumulative time map + `timeToThickness` interpolation + per-node spring animation. Already have `timeToThickness` in `interpolation.ts` (unused). `popmotion` `interpolate` clamps beyond range. |
| TREE-05 | The tree dynamically builds according to nodes added in ReactFlow | Sprouting/withering animations via spring-driven `extensionProgress` per node (0 = retracted at parent, 1 = fully extended). Triggered on node add/delete detection in draw callback. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| popmotion | 11.0.5 | `interpolate` for thickness/color mapping, `spring` for physics animations | Already in project. `interpolate` handles both numeric and color string inputs natively. Clamps at range boundaries. |
| bezier-easing | 2.1.0 | Custom easing curves for organic animations | Already in project via `src/animation/easing.ts`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All requirements met by existing stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| popmotion interpolate for color | Manual RGB lerp | popmotion already handles hex/rgba strings natively -- verified. No reason to hand-roll. |
| Per-node springs | CSS transitions | Not applicable -- rendering is canvas-based, not DOM. Springs are the correct approach. |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Changes to Existing Structure
```
src/
├── animation/
│   └── interpolation.ts    # MODIFY: revise timeToThickness, add timeToColor, add thicknessMinMax constants
├── components/features/background/layers/
│   └── TreeLayer.tsx        # MODIFY: main implementation target — cumulative time, thickness, color, taper, sprout/wither
├── hooks/
│   └── useTreeCanvas.ts     # MODIFY: apply same thickness logic for RootsBackground (single-canvas path)
└── utils/
    └── graphHelpers.ts      # MODIFY: add buildCumulativeTimeMap utility
```

### Pattern 1: Cumulative Time Computation (per-frame, inside draw callback)
**What:** Bottom-up traversal computing each node's subtree total time.
**When to use:** Every frame in the draw callback, before rendering branches.
**Example:**
```typescript
// In graphHelpers.ts (new utility)
function buildCumulativeTimeMap(
    nodes: RevisionNode[],
    childrenMap: Map<string, RevisionNode[]>
): Map<string, number> {
    const cumulativeMap = new Map<string, number>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    function computeSubtreeTime(nodeId: string): number {
        if (cumulativeMap.has(nodeId)) return cumulativeMap.get(nodeId)!;
        const node = nodeMap.get(nodeId);
        if (!node) return 0;

        let total = node.data.totalTime || 0;
        const children = childrenMap.get(nodeId) || [];
        for (const child of children) {
            total += computeSubtreeTime(child.id);
        }
        cumulativeMap.set(nodeId, total);
        return total;
    }

    for (const node of nodes) {
        computeSubtreeTime(node.id);
    }
    return cumulativeMap;
}
```
**Confidence:** HIGH -- standard recursive memoized traversal. O(n) with memoization.

### Pattern 2: Thickness from Cumulative Time via Interpolation
**What:** Map cumulative seconds to pixel width using logarithmic-feeling piecewise interpolation.
**When to use:** Per branch segment when computing lineWidth.
**Example:**
```typescript
// In interpolation.ts (revised)
import { interpolate } from 'popmotion';

// Thickness in pixels based on cumulative study time
// Logarithmic feel: rapid early growth, diminishing returns
// Cap at 10 hours (36000s) cumulative
export const MIN_THICKNESS = 2.5;  // New branches clearly visible
export const MAX_THICKNESS = 28;   // Trunk maximum (dramatic but not overwhelming)

export const timeToThickness = interpolate(
    [0,   60,   300,  1800,  7200,  36000],
    [2.5, 4,    7,    13,    20,    28]
    // 0s   1min  5min  30min  2hr    10hr
);
```
**Confidence:** HIGH -- verified `popmotion` `interpolate` clamps at boundaries (returns 28 for any value >= 36000). Tested with actual library.

### Pattern 3: Color from Thickness via Interpolation
**What:** Map thickness multiplier to branch stroke color (light gold -> deep amber).
**When to use:** Per branch segment when setting strokeStyle.
**Example:**
```typescript
// In interpolation.ts (new)
// Color deepens with thickness: light gold (new/thin) -> deep amber (mature/thick)
export const thicknessToColor = interpolate(
    [2.5,      7,        13,       20,       28],
    ['#FDE68A', '#FCD34D', '#F59E0B', '#D97706', '#B45309']
    // amber-200  amber-300  amber-500  amber-600  amber-700
);
```
**Confidence:** HIGH -- verified `popmotion` `interpolate` handles hex color strings and outputs rgba strings. Tested: `interpolate([0,1],['#FDE68A','#B45309'])(0.5)` returns valid rgba.

### Pattern 4: Per-Node Thickness Springs (animate transitions)
**What:** Use the existing `springManagerRef` in TreeLayer to animate thickness per node when cumulative time changes (every-minute cadence).
**When to use:** In the draw callback, detect when a node's target thickness changes and retarget its spring.
**Example:**
```typescript
// Inside TreeLayer draw callback
const targetThickness = timeToThickness(cumulativeTime);
const springKey = `thickness-${nodeId}`;

if (!mgr.has(springKey)) {
    // First appearance: set immediately (no animation)
    mgr.set(springKey, targetThickness, targetThickness);
} else {
    const current = mgr.get(springKey)!;
    // Only retarget if thickness changed significantly (every-minute cadence)
    if (Math.abs(targetThickness - lastTargetRef.get(nodeId)) > 0.1) {
        mgr.set(springKey, current, targetThickness, {
            stiffness: 60,
            damping: 14,
            mass: 1.2,  // Slight overshoot for organic feel
        });
    }
}
const animatedThickness = mgr.get(springKey) ?? targetThickness;
```
**Confidence:** HIGH -- `springManager` verified to handle 50+ concurrent springs with negligible overhead (<5ms for 50 springs x 125 frames). API matches existing usage in TreeLayer and BackgroundLayer.

### Pattern 5: Branch Taper (thick at base, thin at tip)
**What:** Within a single branch segment, linearly interpolate width from thick (start) to thin (end).
**When to use:** When drawing each branch segment in the draw callback.
**Example:**
```typescript
// Instead of uniform lineWidth, draw the branch as a filled polygon
function drawTaperedBranch(
    ctx: CanvasRenderingContext2D,
    startX: number, startY: number,
    endX: number, endY: number,
    startWidth: number, endWidth: number,
    color: string
) {
    const angle = Math.atan2(endY - startY, endX - startX);
    const perpAngle = angle + Math.PI / 2;

    // Compute the 4 corners of the tapered shape
    const halfStartW = startWidth / 2;
    const halfEndW = endWidth / 2;

    const x1 = startX + Math.cos(perpAngle) * halfStartW;
    const y1 = startY + Math.sin(perpAngle) * halfStartW;
    const x2 = startX - Math.cos(perpAngle) * halfStartW;
    const y2 = startY - Math.sin(perpAngle) * halfStartW;
    const x3 = endX - Math.cos(perpAngle) * halfEndW;
    const y3 = endY - Math.sin(perpAngle) * halfEndW;
    const x4 = endX + Math.cos(perpAngle) * halfEndW;
    const y4 = endY + Math.sin(perpAngle) * halfEndW;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    // Use quadratic curves for smooth edges
    ctx.quadraticCurveTo(
        (x1 + x4) / 2 + Math.cos(perpAngle) * startWidth * 0.05,
        (y1 + y4) / 2 + Math.sin(perpAngle) * startWidth * 0.05,
        x4, y4
    );
    ctx.lineTo(x3, y3);
    ctx.quadraticCurveTo(
        (x2 + x3) / 2 - Math.cos(perpAngle) * startWidth * 0.05,
        (y2 + y3) / 2 - Math.sin(perpAngle) * startWidth * 0.05,
        x2, y2
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}
```
**Confidence:** MEDIUM -- the general approach is standard Canvas2D, but the exact curve math for smooth tapered branches needs visual tuning. The simpler alternative is to use `ctx.lineWidth` with `lineCap: 'round'` and accept uniform width per segment, reserving taper for Phase 3's organic curves. Recommendation: implement taper as a filled shape for more organic look, but fall back to `lineWidth` stroke if visual quality is poor.

### Pattern 6: Sprouting and Withering Animations
**What:** When a node is added, its branch grows from zero length to full length. When deleted, it retracts. Tracked via a per-node `extensionProgress` spring (0 = retracted, 1 = full).
**When to use:** Detect node set changes between frames. New node IDs get a spring from 0->1. Removed node IDs get a spring from current->0 and are cleaned up when done.
**Example:**
```typescript
// Track known node set to detect adds/removes
const knownNodeIdsRef = useRef(new Set<string>());

// In draw callback:
const currentIds = new Set(currentNodes.map(n => n.id));

// Detect new nodes
for (const id of currentIds) {
    if (!knownNodeIdsRef.current.has(id)) {
        mgr.set(`ext-${id}`, 0, 1, { stiffness: 50, damping: 12, mass: 1 });
    }
}

// Detect removed nodes (need to keep rendering during wither)
for (const id of knownNodeIdsRef.current) {
    if (!currentIds.has(id)) {
        const current = mgr.get(`ext-${id}`) ?? 1;
        mgr.set(`ext-${id}`, current, 0, { stiffness: 70, damping: 16, mass: 0.8 });
        // Add to "withering" set; remove from set + cleanup spring when done
    }
}

knownNodeIdsRef.current = currentIds;
```
**Confidence:** MEDIUM -- the sprout animation is straightforward (multiply branch length by extensionProgress). Wither is trickier because the node is already deleted from the store when we need to animate. Solution: cache the last-known node data (position, edges) for withering nodes so they can still be drawn during the retraction animation. This is the main complexity risk of the phase.

### Anti-Patterns to Avoid
- **Recomputing cumulative time per-node via tree traversal on every branch draw call:** Build the map once per frame, look up per node. The recursive traversal is O(n) with memoization but O(n^2) without.
- **Storing animated thickness in Zustand:** This would trigger React re-renders on every spring tick. Thickness animation is purely visual and must stay in the RAF loop via refs.
- **Using `ctx.lineWidth` for tapered branches:** `lineWidth` is uniform along a path. Taper requires either a filled polygon or multiple short segments with decreasing width.
- **Animating every tick (per-second):** User decision is every-minute cadence. Throttle thickness target updates to once per minute while timer runs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Logarithmic-feeling time-to-thickness curve | Custom Math.log formula | `popmotion` `interpolate` with piecewise breakpoints | Breakpoint interpolation gives precise control over the shape of the curve. Logarithmic formula needs careful tuning of base/scale. Piecewise is easier to adjust visually. |
| Color interpolation (gold -> amber) | Manual RGB lerp | `popmotion` `interpolate` with hex color strings | Verified: popmotion handles hex/rgb/rgba interpolation natively, including perceptually correct color blending. |
| Spring physics for thickness animation | Custom damped oscillation | `springManager` (already exists) wrapping `popmotion` `spring` | Already battle-tested in Phase 1 (BackgroundLayer warmth, TreeLayer activation wave). |
| Subtree time accumulation | Inline recursive calls in draw | Extracted utility in `graphHelpers.ts` | Testable, reusable for roots view (Phase 5), and keeps the draw callback focused on rendering. |

**Key insight:** This phase is a data-pipeline-to-visual-mapping problem. The hard parts (spring physics, easing, interpolation, RAF loop, Zustand-ref boundary) are already solved by Phase 1. The new work is: (1) compute cumulative time, (2) map to thickness/color, (3) wire springs, (4) handle node lifecycle animations.

## Common Pitfalls

### Pitfall 1: Cumulative Time Recalculation Cost
**What goes wrong:** Computing subtree sums inside each `drawBranch` call (nested in recursion) creates O(n^2) work.
**Why it happens:** It's natural to compute a node's subtree time when you're already visiting it during branch drawing.
**How to avoid:** Pre-compute the entire `cumulativeTimeMap` once per frame before the `drawBranch` recursion begins. O(n) with memoized recursive descent.
**Warning signs:** Frame drops when tree has 15+ nodes.

### Pitfall 2: Spring Explosion (Too Many Active Springs)
**What goes wrong:** Creating a new spring for every node on every frame when the target hasn't actually changed.
**Why it happens:** Checking `if (targetThickness !== mgr.get(key))` can trigger on float precision differences.
**How to avoid:** Store the last target thickness per node in a separate ref map. Only retarget the spring when the difference exceeds a threshold (e.g., 0.5px). Also limit to once per minute as per user decision.
**Warning signs:** Spring manager has hundreds of entries, memory grows over time.

### Pitfall 3: Wither Animation Loses Node Data
**What goes wrong:** When a node is deleted from the store, its position/edge data is gone, so the draw callback can't render the withering branch.
**Why it happens:** Zustand store deletion is immediate; canvas animation needs to continue rendering the branch briefly.
**How to avoid:** Cache the last-known state of every node (position within the tree, parent, children) in a ref inside the draw callback. When a node disappears from the store, use cached data to render the wither animation. Clean up cache when the spring reaches 0.
**Warning signs:** Branches disappear instantly on delete instead of animating out.

### Pitfall 4: Thickness Affects Sway and Glow Incorrectly
**What goes wrong:** Thicker branches sway the same amount as thin ones, looking unnatural. Or glow blur doesn't scale with branch width.
**Why it happens:** Sway amplitude and glow blur were hardcoded in Phase 1 without thickness awareness.
**How to avoid:** Scale sway amplitude inversely with thickness (thick branches sway less). Scale glow blur proportionally with thickness (thick branches have wider glow). These are small multiplier adjustments in the existing draw code.
**Warning signs:** Fat trunk swaying wildly; thin branches having invisible glow.

### Pitfall 5: RootsBackground Diverges from TreeLayer
**What goes wrong:** The `useTreeCanvas.ts` (used by RootsBackground) doesn't get the thickness system, so roots render differently from the main tree.
**Why it happens:** Phase 1 left `useTreeCanvas.ts` as a simplified single-canvas path separate from the three-layer TreeLayer.
**How to avoid:** Apply the same cumulative time computation and thickness mapping to `useTreeCanvas.ts`. The core logic (cumulativeTimeMap, timeToThickness, thicknessToColor) should be in shared utilities so both paths use it. However, full parity with roots is Phase 5 scope -- this phase should focus on TreeLayer but keep the utilities reusable.
**Warning signs:** Main tree has thick branches, roots view still has uniform-width branches.

## Code Examples

### Cumulative Time Map (utility, goes in graphHelpers.ts)
```typescript
// Source: Custom utility for this project, standard memoized tree traversal
import type { RevisionNode } from '../types';

export function buildCumulativeTimeMap(
    nodes: RevisionNode[],
    childrenMap: Map<string, RevisionNode[]>,
): Map<string, number> {
    const result = new Map<string, number>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    function compute(nodeId: string): number {
        if (result.has(nodeId)) return result.get(nodeId)!;
        const node = nodeMap.get(nodeId);
        if (!node) return 0;

        let total = node.data.totalTime || 0;
        for (const child of (childrenMap.get(nodeId) || [])) {
            total += compute(child.id);
        }
        result.set(nodeId, total);
        return total;
    }

    for (const node of nodes) compute(node.id);
    return result;
}
```

### Revised Interpolation Mappings (goes in interpolation.ts)
```typescript
// Source: popmotion 11.0.5 interpolate API (verified)
import { interpolate } from 'popmotion';

// Thickness: logarithmic feel via piecewise breakpoints
// Min 2.5px (new/empty), max 28px (10hr+ cumulative)
export const MIN_THICKNESS = 2.5;
export const MAX_THICKNESS = 28;

export const timeToThickness = interpolate(
    [0,    60,   300,  1800,  7200,  36000],
    [2.5,  4,    7,    13,    20,    28]
);

// Color: light gold (thin) -> deep amber (thick)
export const thicknessToColor = interpolate(
    [2.5,      7,        13,       20,       28],
    ['#FDE68A', '#FCD34D', '#F59E0B', '#D97706', '#B45309']
);

// Inactive branch color: same progression but desaturated/muted
export const thicknessToInactiveColor = interpolate(
    [2.5,      7,        13,       20,       28],
    ['rgba(148,163,184,0.3)', 'rgba(100,116,139,0.35)', 'rgba(71,85,105,0.4)', 'rgba(51,65,85,0.45)', 'rgba(30,41,59,0.5)']
);
```

### Every-Minute Throttle for Thickness Updates
```typescript
// Inside TreeLayer draw callback
const lastThicknessUpdateRef = useRef(0);
const targetThicknessMapRef = useRef(new Map<string, number>());

// In draw:
const now = Date.now();
const shouldUpdateThickness = (now - lastThicknessUpdateRef.current) > 60000 || !lastThicknessUpdateRef.current;

if (shouldUpdateThickness || cumulativeMapChanged) {
    lastThicknessUpdateRef.current = now;
    // Recompute cumulative time map and update spring targets
    for (const [nodeId, cumTime] of cumulativeMap) {
        const target = timeToThickness(cumTime);
        const prevTarget = targetThicknessMapRef.current.get(nodeId) ?? target;
        if (Math.abs(target - prevTarget) > 0.3) {
            const current = mgr.get(`thick-${nodeId}`) ?? target;
            mgr.set(`thick-${nodeId}`, current, target, {
                stiffness: 60, damping: 14, mass: 1.2
            });
            targetThicknessMapRef.current.set(nodeId, target);
        }
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed `widthDecay` multiplier per depth | Data-driven thickness from cumulative time | This phase | Branches reflect actual study effort instead of tree structure |
| Uniform color per active/inactive | Gradient color tied to thickness | This phase | Visual richness, clear hierarchy at a glance |
| Uniform `lineWidth` stroke | Tapered filled polygon (thick base, thin tip) | This phase | More organic, natural branch appearance |
| Instant appearance/disappearance | Spring-based sprout and wither animations | This phase | Smooth, living tree feeling |

**Deprecated/outdated:**
- The current `widthDecay` and fixed `initialWidth` in `TreeCanvasOptions` will be replaced by the data-driven thickness system. These options should be removed or repurposed as fallback defaults.
- The `getBranchStyle` callback's `lineWidth` property is unused since each branch now computes its own width. The callback can focus on shadow/blur configuration.

## Open Questions

1. **Taper implementation: filled polygon vs. multi-segment stroke?**
   - What we know: `ctx.lineWidth` is uniform along a path, so true taper requires either a filled polygon or breaking the branch into many short segments with decreasing `lineWidth`.
   - What's unclear: Which approach looks better at the project's scale. Filled polygon gives precise control but changes the rendering from stroke to fill (affects glow/shadow behavior). Multi-segment is simpler but may show visible joints.
   - Recommendation: Start with filled polygon for the body, add a thin stroke outline for the glow effect. If visual quality is poor, fall back to multi-segment stroke. This is a discretion area -- can be decided during implementation.

2. **Wither animation data caching strategy**
   - What we know: Deleted nodes are removed from Zustand immediately. The canvas needs their position/parent data during the wither animation (~300-500ms).
   - What's unclear: Whether to cache full node objects or just the minimal rendering data (position in tree, parent endpoint, thickness).
   - Recommendation: Cache minimal data -- just the start/end points and thickness of the branch segment as rendered in its last frame. This avoids stale references to full node objects.

3. **Virtual root thickness**
   - What we know: The trunk segment (VIRTUAL_ROOT) doesn't correspond to a real node. Its thickness should be the sum of all root nodes' cumulative times.
   - What's unclear: Whether the trunk should use the same interpolation curve or have a separate, wider range.
   - Recommendation: Use the same `timeToThickness` curve but with the sum of all root cumulative times. This naturally makes the trunk the thickest element. If it feels too thin relative to first-level branches, add a small multiplier (1.2x).

## Sources

### Primary (HIGH confidence)
- **popmotion 11.0.5** -- `interpolate` API verified via direct execution: handles numeric arrays with clamping at boundaries, and color string interpolation (hex input, rgba output). Spring API `next(elapsedMs)` confirmed working with springManager.
- **Existing codebase** -- `src/animation/interpolation.ts` already has `timeToThickness` (unused), `src/animation/springManager.ts` confirmed for multi-spring management, `src/components/features/background/layers/TreeLayer.tsx` confirmed as primary modification target.
- **Canvas2D API** -- `ctx.lineWidth`, `ctx.lineCap`, `ctx.beginPath/fill` for tapered branch rendering. Standard API, HIGH confidence.

### Secondary (MEDIUM confidence)
- **Taper via filled polygon** -- Common pattern in Canvas2D tree rendering. Multiple implementations exist in creative coding libraries. The specific quadratic curve approach for smooth edges is a refinement that may need visual tuning.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all APIs verified via execution
- Architecture: HIGH -- extends patterns established in Phase 1 (spring manager, Zustand-ref boundary, draw callback structure)
- Pitfalls: HIGH -- identified from direct code analysis of current implementation
- Sprout/wither animations: MEDIUM -- wither animation's data caching introduces novel complexity not present in Phase 1

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- no external dependencies changing)
