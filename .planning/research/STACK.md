# Stack Research — Interactive Canvas2D Tree Visualization

**Domain:** Interactive Canvas2D visualization with procedural tree rendering
**Researched:** 2026-02-23
**Confidence:** MEDIUM (based on training data through January 2025, web verification unavailable)

## Context

This is a **subsequent milestone** adding interactive tree visualization features to an existing React 19 + TypeScript application. The existing stack already handles:
- Canvas2D rendering via custom hooks (`useTreeCanvas`, `useCanvas`)
- DPR-aware canvas setup
- Deterministic pseudo-random positioning
- Framer Motion for UI animations (already installed)

**New requirements:**
- Procedural 2D tree branch growth with dynamic thickness (based on cumulative study time)
- Rich interactive canvas effects (lighting, particles, environmental elements)
- Smooth animations for branch growth and state transitions
- Sub-graph rendering for nested statistics

## Recommended Stack Additions

### Core Animation & Easing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Stay with raw Canvas2D** | N/A | Core rendering | Existing hooks work well; adding a canvas framework would conflict with custom DPR handling and ReactFlow integration |
| **popmotion** | ^11.0.5 | Easing functions, spring physics, interpolation | Lightweight (11kb), tree-shakeable, provides professional easing curves. Already have Framer Motion (built on popmotion), so this adds minimal overhead |
| **bezier-easing** | ^2.1.0 | Custom cubic-bezier easing | Industry standard for custom easing curves, zero dependencies, pure function (3kb) |

### Animation Loop Management

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **NO library needed** | N/A | requestAnimationFrame loop | Raw rAF is sufficient; existing code already uses `setInterval` for timer ticks. Canvas animations can use same pattern |
| **@react-spring/rafz** | ^9.7.4 | Shared rAF loop (optional) | Only if you need multiple independent animations sharing a single rAF loop for performance. Likely **NOT needed** for this project |

### Particle Systems

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **NO library recommended** | N/A | Particle effects | Canvas particle systems are simple to implement in 50-100 lines. Library overhead not justified for custom tree effects |

### Procedural Generation Utilities

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **NO library needed** | N/A | Tree generation | Existing `pseudoRandom` function provides deterministic generation. Recursive tree drawing already implemented in `useTreeCanvas` |

### TypeScript Type Definitions

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **@types/bezier-easing** | ^2.1.2 | TypeScript definitions | Only if using `bezier-easing` |

## Installation

```bash
# Recommended minimal additions
npm install popmotion bezier-easing

# TypeScript types (only if needed)
npm install -D @types/bezier-easing
```

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **PixiJS** | WebGL-based, massive bundle size (400kb+), conflicts with Canvas2D hooks | Raw Canvas2D with existing hooks |
| **three.js / react-three-fiber** | 3D library, complete overkill for 2D trees | Raw Canvas2D |
| **canvas-sketch** | Generative art framework, conflicts with React lifecycle | Existing `useCanvas` + `useTreeCanvas` hooks |
| **anime.js** | DOM-focused, poor Canvas2D support | popmotion (better Canvas integration) |
| **GSAP** | Commercial license required for paid products, heavyweight (50kb+) | popmotion (free, lighter) |
| **Konva / react-konva** | Scene graph library, conflicts with ReactFlow, heavy (500kb) | Raw Canvas2D |
| **p5.js** | Global mode conflicts with React, imperative API | Existing hooks |
| **Paper.js** | Vector graphics abstraction, unnecessary overhead | Raw Canvas2D |

## Integration with Existing Codebase

### Existing Canvas Architecture

```typescript
// Current pattern in useTreeCanvas.ts
useEffect(() => {
  const ctx = canvas.getContext('2d');
  // Static drawing, re-renders on state change
  drawBranch(/*...*/);
}, [nodes, edges, activeNodeId]);
```

### Animation Enhancement Pattern

```typescript
// NEW pattern for animated branch growth
import { animate, linear, easeInOut } from 'popmotion';
import BezierEasing from 'bezier-easing';

// In component or hook
useEffect(() => {
  const ctx = canvas.getContext('2d');

  // Custom easing for organic tree growth
  const treeGrowthEasing = BezierEasing(0.25, 0.1, 0.25, 1.0);

  // Animate branch thickness based on totalTime
  const animation = animate({
    from: currentThickness,
    to: targetThickness,
    duration: 800,
    ease: treeGrowthEasing,
    onUpdate: (latest) => {
      // Redraw with interpolated values
      drawBranch(/*...*/, latest);
    }
  });

  return () => animation.stop();
}, [targetThickness]);
```

### Particle System Pattern (No Library)

```typescript
// Lightweight custom particle system (50 lines)
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

function updateParticles(particles: Particle[], delta: number) {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * delta,
      y: p.y + p.vy * delta,
      life: p.life - delta
    }))
    .filter(p => p.life > 0);
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    const opacity = p.life / p.maxLife;
    ctx.fillStyle = `rgba(252, 211, 77, ${opacity})`; // Gold
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| popmotion | d3-ease | If you need D3-compatible easing (you don't, since you're not using D3) |
| Raw rAF | @react-spring/rafz | If you have 10+ simultaneous animations and profiling shows rAF overhead |
| Custom particles | pixi-particles | Never for this project (WebGL dependency) |
| bezier-easing | Custom implementation | If bundle size is ultra-critical (save 3kb) |

## Stack Patterns by Feature

### Feature: Branch Growth Animation
**Stack:**
- Raw Canvas2D for rendering
- popmotion `animate()` for interpolation
- bezier-easing for custom organic growth curves
- Existing `useTreeCanvas` hook as base

**Why:**
- Minimal API surface (just `animate()`)
- Spring physics available if needed for "bounce" effects
- Tree-shakeable (only import what you use)

### Feature: Particle Effects (leaves, sparkles)
**Stack:**
- Raw Canvas2D
- requestAnimationFrame loop
- Array of particle objects
- Existing `pseudoRandom` for deterministic placement

**Why:**
- Particles are simple: position + velocity + lifetime
- No library needed for <100 lines of code
- Full control over particle behavior

### Feature: Lighting Effects (glow, shadows)
**Stack:**
- Canvas2D `shadowBlur`, `shadowColor`, `globalCompositeOperation`
- popmotion for animated intensity changes
- Existing branch styles in `BackgroundTree.tsx`

**Why:**
- Canvas2D has built-in shadow/glow capabilities
- Already used in `useTreeCanvas` for active node glow
- No library needed

### Feature: Sub-graph Rendering
**Stack:**
- Existing `useTreeCanvas` recursive pattern
- Canvas2D layering with `save()` / `restore()`
- No new dependencies

**Why:**
- Already recursive (handles tree hierarchy)
- Canvas state stack handles nested contexts
- Just needs refactoring of existing code

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| popmotion@11.0.5 | React 19 | Framework-agnostic, pure JavaScript |
| bezier-easing@2.1.0 | React 19 | Pure function, no framework dependencies |
| Framer Motion@12.34.0 (existing) | popmotion@11.x | Built on popmotion, fully compatible |

## Architecture Recommendations

### DO:
- Keep existing `useTreeCanvas` and `useCanvas` hooks as base
- Add animation state to components, not hooks
- Use `useRef` for animation instances to prevent re-creation
- Cleanup animations in `useEffect` return functions
- Interpolate values in animation callbacks, not in render

### DON'T:
- Add a canvas framework (conflicts with existing architecture)
- Create separate hooks for each animation (causes coupling)
- Use DOM-focused animation libraries (anime.js, GSAP)
- Install particle libraries (custom implementation is simpler)
- Add WebGL libraries (2D canvas is sufficient)

## Performance Considerations

### Existing Performance Wins:
- DPR-aware rendering (no blurry text on Retina)
- IntersectionObserver pausing in `BackgroundTree.tsx`
- Memoized options objects to prevent effect re-triggers
- Deterministic pseudo-random (no layout thrashing)

### New Performance Strategies:
- **Throttle redraws:** Use delta-time accumulator pattern (already in timer tick)
- **Object pooling:** Reuse particle objects instead of creating new ones
- **Layer separation:** Animate only dynamic layers, keep static layers cached
- **Conditional animations:** Only animate visible canvas (existing IntersectionObserver)

### Benchmarking:
```typescript
// Measure canvas draw time
const start = performance.now();
drawBranch(/*...*/);
const drawTime = performance.now() - start;
if (drawTime > 16) console.warn('Slow draw:', drawTime);
```

## Sources

- **Training data** (January 2025) — MEDIUM confidence
  - popmotion usage patterns
  - bezier-easing API
  - Canvas2D animation best practices
  - requestAnimationFrame patterns
- **Existing codebase** (read directly) — HIGH confidence
  - Current canvas hook architecture
  - DPR handling patterns
  - Existing animation usage (Framer Motion)
  - Performance optimizations (IntersectionObserver)

**Note:** Web verification was unavailable (Brave Search API key not set, WebSearch permission denied). Version numbers are from training data cutoff (January 2025) and should be verified against npm registry before installation.

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Core recommendation (raw Canvas2D) | HIGH | Existing codebase already uses this pattern successfully |
| popmotion | MEDIUM | Widely used, but version not verified with npm |
| bezier-easing | MEDIUM | Standard library, but version not verified |
| No canvas framework needed | HIGH | Adding framework would conflict with existing hooks |
| No particle library needed | HIGH | Requirements are simple, custom code is <100 lines |
| Version compatibility | LOW | Could not verify current versions on npm registry |

---
*Stack research for: Interactive Canvas2D tree visualization*
*Researched: 2026-02-23*
*Limitation: Web verification unavailable; relied on training data (January 2025)*
