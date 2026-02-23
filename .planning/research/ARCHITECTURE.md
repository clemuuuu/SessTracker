# Architecture Patterns: Interactive Canvas2D Tree Visualization

**Domain:** Study tracker with procedural tree visualization
**Researched:** 2026-02-23
**Confidence:** HIGH (existing codebase analysis + Canvas2D best practices)

## Recommended Architecture

### Current Architecture (Already Implemented)

```
┌─────────────────────────────────────────────────────────┐
│                      App.tsx                             │
│  - Timer tick (setInterval 1s)                          │
│  - Undo/redo keyboard shortcuts                          │
│  - Scroll navigation controller                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ├──────────────────┬─────────────────┐
                         ▼                  ▼                 ▼
              ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
              │   MainTree.tsx   │  │ RootsView    │  │ CalendarView │
              │  (Tree Editor)   │  │  (Stats)     │  │  (Schedule)  │
              └──────────────────┘  └──────────────┘  └──────────────┘
                     │                     │
                     ▼                     ▼
         ┌────────────────────┐  ┌──────────────────┐
         │ BackgroundTree.tsx │  │ RootsBackground  │
         │  (Upward fractal)  │  │ (Downward)       │
         └────────────────────┘  └──────────────────┘
                     │                     │
                     └──────────┬──────────┘
                                ▼
                    ┌──────────────────────┐
                    │   useTreeCanvas.ts   │
                    │  - DPR-aware setup   │
                    │  - Recursive draw    │
                    │  - Active branch     │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Canvas2D Context    │
                    │  - drawBranch()      │
                    │  - quadraticCurveTo  │
                    │  - shadowBlur glow   │
                    └──────────────────────┘
```

### Enhanced Architecture (New Features)

```
┌─────────────────────────────────────────────────────────┐
│                    useTreeCanvas                         │
│  Core Hook (Extended)                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Resize Effect (DPR-aware) — UNCHANGED           │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Animation Loop Effect (NEW)                      │   │
│  │  - requestAnimationFrame                         │   │
│  │  - Delta-time accumulator                        │   │
│  │  - Interpolation state management                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Tree Layer  │  │ Particle FX  │  │ Environment  │
│              │  │  Layer       │  │  Layer       │
│ - Branches   │  │ - Confetti   │  │ - Ground     │
│ - Thickness  │  │ - Sparkles   │  │ - Sky        │
│ - Glow       │  │ - Leaves     │  │ - Distant    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With | State Management |
|-----------|---------------|-------------------|------------------|
| **useTreeCanvas** | Core rendering hook, manages canvas lifecycle, DPR setup | Canvas context, RevisionStore (nodes/edges/activeNodeId) | Internal: animationFrameId ref |
| **BackgroundTree** | Configuration wrapper, visibility optimization | useTreeCanvas, IntersectionObserver | Local: isVisible state |
| **RootsBackground** | Mirror configuration for downward tree | useTreeCanvas | None (pure configuration) |
| **AnimationController** (NEW) | Interpolation state, easing functions | useTreeCanvas, RevisionStore (totalTime changes) | Internal: Map<nodeId, AnimState> |
| **ParticleSystem** (NEW) | Particle lifecycle, physics simulation | Canvas context, milestone events | Internal: Particle[] array |
| **EnvironmentLayer** (NEW) | Static/slow-changing decorative elements | Canvas context, theme state (seasonal) | Local: cached canvas ref |

## Data Flow

### Current: Static Tree Rendering

```
RevisionStore (nodes/edges change)
  → useTreeCanvas useEffect triggers
    → Clear canvas
    → Build childrenMap (O(n))
    → Recursive drawBranch()
      → For each node: draw curved line
      → If active: apply gold glow
      → Recurse to children
```

**Trigger frequency:** Only on nodes/edges/activeNodeId change (manual actions, not timer ticks)

### Enhanced: Animated Tree Rendering

```
App.tsx timer tick (1s)
  → RevisionStore tickCallback()
    → Updates node.totalTime
    → Triggers subscribers

useTreeCanvas animation loop (60fps)
  → Read current state (nodes, totalTime)
  → Interpolate branch widths
    → currentWidth += (targetWidth - currentWidth) * lerpFactor
  → Interpolate colors (if milestone reached)
  → Clear canvas
  → drawBranch() with interpolated values
  → Draw particles (if active)

Milestone event (e.g., node reaches 10 hours)
  → ParticleSystem.spawn(x, y, count)
  → Particles added to active pool
  → Rendered in next animation frame
```

**Trigger frequency:** 60fps (requestAnimationFrame), but only while animated properties are transitioning.

## Architecture Patterns

### Pattern 1: Interpolation State Management

**What:** Track current and target values for animated properties, lerp between them over time.

**When:** Any property that changes based on data (branch thickness, glow intensity, color).

**Example:**
```typescript
// In useTreeCanvas or new useAnimatedTree hook
interface AnimatedBranchState {
  currentWidth: number;
  targetWidth: number;
  currentGlowIntensity: number;
  targetGlowIntensity: number;
}

const animStateMap = useRef<Map<string, AnimatedBranchState>>(new Map());

// In animation loop
useEffect(() => {
  let lastTime = performance.now();
  let animationId: number;

  const animate = (time: number) => {
    const delta = (time - lastTime) / 1000; // seconds
    lastTime = time;

    // Update interpolated values
    for (const [nodeId, state] of animStateMap.current) {
      const targetWidth = calculateTargetWidth(nodeId); // from totalTime
      state.currentWidth += (targetWidth - state.currentWidth) * 0.1; // lerp factor
    }

    drawTree();
    animationId = requestAnimationFrame(animate);
  };

  if (isVisible) animationId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationId);
}, [isVisible, nodes, edges]);
```

**Why:** Smooth transitions without blocking main thread, no setTimeout chains, easy to debug.

### Pattern 2: Lazy Animation Activation

**What:** Only run animation loop when values are actively transitioning.

**When:** Performance optimization for static trees (no active timer).

**Example:**
```typescript
const [isAnimating, setIsAnimating] = useState(false);

// Check if any values need interpolation
useEffect(() => {
  const needsAnimation = Array.from(animStateMap.current.values()).some(
    state => Math.abs(state.currentWidth - state.targetWidth) > 0.5
  );
  setIsAnimating(needsAnimation);
}, [/* trigger on state changes */]);

// Animation loop only runs if isAnimating
useEffect(() => {
  if (!isAnimating) return; // Skip loop if static
  // ... requestAnimationFrame loop
}, [isAnimating]);
```

**Why:** Saves battery/CPU when tree is static, maintains 60fps when animating.

### Pattern 3: Multi-Layer Canvas Composition

**What:** Separate canvases for static (environment) and dynamic (tree, particles) content.

**When:** Complex scenes where redrawing everything is expensive.

**Example:**
```typescript
<div className="relative w-full h-full">
  {/* Layer 0: Environment (redraws only on theme change) */}
  <canvas ref={envCanvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />

  {/* Layer 1: Tree (redraws on node changes + animations) */}
  <canvas ref={treeCanvasRef} className="absolute inset-0" style={{ zIndex: 1 }} />

  {/* Layer 2: Particles (redraws every frame when active) */}
  <canvas ref={fxCanvasRef} className="absolute inset-0" style={{ zIndex: 2 }} />
</div>
```

**Why:** Environment layer can be cached, tree layer optimized separately, particles don't force full scene redraw.

**Tradeoff:** More canvas contexts = more memory, only use if profiling shows benefit.

### Pattern 4: Object Pooling for Particles

**What:** Reuse particle objects instead of creating/destroying on every spawn.

**When:** 100+ particles active simultaneously.

**Example:**
```typescript
class ParticlePool {
  private pool: Particle[] = Array(500).fill(0).map(() => new Particle());
  private activeIndices = new Set<number>();

  spawn(x: number, y: number, config: ParticleConfig) {
    const index = this.pool.findIndex((_, i) => !this.activeIndices.has(i));
    if (index !== -1) {
      this.pool[index].reset(x, y, config);
      this.activeIndices.add(index);
    }
  }

  update(delta: number) {
    for (const i of this.activeIndices) {
      if (!this.pool[i].update(delta)) {
        this.activeIndices.delete(i); // Particle died
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const i of this.activeIndices) {
      this.pool[i].draw(ctx);
    }
  }
}
```

**Why:** Eliminates GC pressure from particle creation/destruction, stable memory usage.

### Pattern 5: Deterministic Pseudo-Random (Already Used)

**What:** Seeded random function that produces same output for same input.

**When:** Positioning elements that should be stable across re-renders (branch angles, particle spawn).

**Example:**
```typescript
// From existing useTreeCanvas.ts
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Usage
const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
const angle = pseudoRandom(seed) * Math.PI * 2;
```

**Why:** Tree structure stable on re-render, no random jitter, easier to debug.

**Continue using:** Already implemented correctly, extend for new features.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Animation State in Zustand Store

**What goes wrong:** Storing 60fps animation state (currentWidth, particle positions) in Zustand.

**Why bad:**
- Triggers unnecessary re-renders in React components
- Zustand persist middleware tries to serialize animation state
- Performance bottleneck (60 updates/sec through store)

**Instead:** Store animation state in `useRef` or local component state, only read data state from Zustand.

```typescript
// BAD
const { currentBranchWidth, setCurrentBranchWidth } = useRevisionStore();
// Called 60 times per second, triggers re-renders

// GOOD
const currentWidthRef = useRef<number>(0);
const { nodes } = useRevisionStore(); // Only read source data
```

### Anti-Pattern 2: Creating New Animation Instances on Every Render

**What goes wrong:** Creating popmotion animations in render body without `useRef`.

**Why bad:** Memory leak (old animations not stopped), degrading performance over time.

**Instead:** Store animation in `useRef`, cleanup in `useEffect` return.

```typescript
// BAD
const animation = animate({ from: 0, to: 100, onUpdate: /* ... */ });

// GOOD
const animationRef = useRef<Animation | null>(null);
useEffect(() => {
  animationRef.current = animate({ /* ... */ });
  return () => animationRef.current?.stop();
}, [targetValue]);
```

### Anti-Pattern 3: Synchronous Canvas Operations in Event Handlers

**What goes wrong:** Drawing canvas directly in onClick, onTimerTick handlers.

**Why bad:** Blocks main thread, causes janky UI, misses requestAnimationFrame vsync timing.

**Instead:** Update state in handler, let animation loop handle drawing.

```typescript
// BAD
const handleTimerTick = () => {
  node.totalTime += 1;
  drawTree(); // Immediate redraw, blocks main thread
};

// GOOD
const handleTimerTick = () => {
  node.totalTime += 1; // Just update data
  // Animation loop will pick up change on next frame
};
```

### Anti-Pattern 4: Using `Math.random()` for Stable Elements

**What goes wrong:** Tree branch angles change on every re-render, causes flickering.

**Why bad:** Unpredictable visual output, hard to debug, fails visual regression tests.

**Instead:** Use existing `pseudoRandom` function with node ID as seed.

```typescript
// BAD
const angle = Math.random() * Math.PI * 2;

// GOOD (existing pattern)
const seed = nodeId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
const angle = pseudoRandom(seed) * Math.PI * 2;
```

## Scalability Considerations

| Concern | At 10 nodes | At 50 nodes | At 100 nodes |
|---------|-------------|-------------|--------------|
| **Canvas draw time** | <1ms | 3-5ms | 8-12ms |
| **Animation loop** | 60fps stable | 60fps stable | 50-60fps (consider throttling) |
| **Memory (tree only)** | <1MB | 2-3MB | 5-8MB |
| **Memory (+ particles)** | 2-3MB | 5-8MB | 10-15MB (enable pooling) |
| **Approach** | Default settings | Default settings | Enable lazy animation, multi-layer canvas |

### Performance Budgets

- **Target:** 60fps (16.67ms frame time) on desktop, 30fps (33ms) acceptable on mobile
- **Canvas draw budget:** <10ms per frame (leaves 6ms for JS/React)
- **Particle count:** Max 200 active particles simultaneously
- **Animation state updates:** Max 100 interpolated values per frame

### Optimization Triggers

**When to optimize:**
1. Dev console warns: "Slow frame: >16.67ms"
2. IntersectionObserver shows <30fps while visible
3. Memory profiler shows >50MB for tree rendering
4. User reports lag when tree has >50 nodes

**Optimization steps (in order):**
1. Enable lazy animation (skip loop when static)
2. Add multi-layer composition (separate static environment)
3. Throttle particle count (200 → 100 → 50)
4. Reduce shadow blur radius (20px → 10px → 5px)
5. Lower animation target framerate (60fps → 30fps)

## Integration Notes

### Extending useTreeCanvas Hook

**Current signature:**
```typescript
function useTreeCanvas(options: TreeCanvasOptions, isVisible: boolean): RefObject<HTMLCanvasElement>
```

**Enhanced signature (Phase 1):**
```typescript
interface AnimatedTreeCanvasOptions extends TreeCanvasOptions {
  enableAnimations?: boolean; // Default: false (backward compatible)
  animationSpeed?: number; // Lerp factor, 0-1, default: 0.1
  getNodeTargetWidth?: (node: RevisionNode) => number; // NEW: dynamic width
}

function useTreeCanvas(
  options: AnimatedTreeCanvasOptions,
  isVisible: boolean
): RefObject<HTMLCanvasElement>
```

**Backward compatibility:** Existing BackgroundTree/RootsBackground components continue working without changes (animations opt-in).

### Adding Particle System

**New component:**
```typescript
// src/components/features/background/ParticleLayer.tsx
export function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { milestoneEvents } = useRevisionStore(); // NEW: event subscription

  useEffect(() => {
    const particleSystem = new ParticlePool();
    // Subscribe to milestone events, spawn particles
    // Animation loop: update + draw
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}
```

**Integration in MainTree.tsx:**
```typescript
<div className="relative">
  <BackgroundTree /> {/* Existing */}
  <ParticleLayer />   {/* NEW */}
  <ReactFlow />       {/* Existing */}
</div>
```

## Sources

**Confidence:** HIGH

**Analyzed codebase files:**
- `useTreeCanvas.ts` — Current rendering architecture
- `BackgroundTree.tsx` — Component patterns
- `App.tsx` — Timer tick and state management patterns
- `RevisionNode.tsx` — "Previous prop comparison" pattern
- `useRevisionStore.ts` — Zustand slice composition

**Training data sources:**
- Canvas2D performance best practices (requestAnimationFrame, layer composition)
- React hooks patterns (useRef for animation instances, cleanup in useEffect)
- Game development patterns (object pooling, delta-time accumulators)

**Architecture validated against:**
- Existing codebase constraints (no useEffect for setState from props, DPR-aware canvas)
- Performance requirements (60fps target, IntersectionObserver optimization)
- Maintainability goals (backward compatibility, opt-in animations)
