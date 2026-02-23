# Research Summary: Interactive Canvas2D Tree Visualization

**Domain:** Canvas2D procedural visualization with dynamic animations
**Researched:** 2026-02-23
**Overall confidence:** MEDIUM (training data only, web verification unavailable)

## Executive Summary

The SessTracker codebase already has a robust Canvas2D architecture with custom hooks (`useTreeCanvas`, `useCanvas`) that handle DPR-aware rendering, deterministic positioning, and IntersectionObserver optimization. For the new interactive tree visualization features, **minimal stack additions are needed**—the existing architecture can be extended rather than replaced.

The core recommendation is to **continue with raw Canvas2D** instead of adopting a canvas framework or library. The existing hooks provide exactly what's needed: DPR handling, React lifecycle integration, and performance optimization. Adding a framework like PixiJS or Konva would introduce conflicts with ReactFlow, increase bundle size dramatically, and provide capabilities (WebGL, scene graphs) that are unnecessary for 2D tree visualization.

For **animation and easing**, two lightweight libraries are recommended: **popmotion** (11kb, tree-shakeable) for interpolation and spring physics, and **bezier-easing** (3kb) for custom organic growth curves. These integrate cleanly with the existing architecture because they're pure JavaScript utilities that don't impose rendering opinions. Notably, Framer Motion (already installed) is built on popmotion, so adding popmotion directly adds minimal overhead.

For **particle systems**, no library is recommended. Canvas particle effects require only 50-100 lines of custom code (position + velocity + lifetime logic), and a library would add unnecessary abstraction. The existing `pseudoRandom` utility already provides deterministic placement.

The **animation loop** can use raw `requestAnimationFrame` following the same delta-time pattern already used in `App.tsx` for timer ticks. No animation loop library is needed unless profiling reveals rAF overhead (unlikely for this project).

## Key Findings

**Stack:** Continue with raw Canvas2D + existing hooks. Add popmotion + bezier-easing for animation/easing (15kb total).

**Architecture:** Extend existing `useTreeCanvas` hook with animation state in components (not hooks). Use `useRef` for animation instances, cleanup in `useEffect` returns.

**Critical pitfall:** Avoid canvas frameworks (PixiJS, Konva, canvas-sketch). They conflict with existing hooks, ReactFlow integration, and React lifecycle patterns.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Animation Foundation** - Integrate popmotion + bezier-easing, refactor `useTreeCanvas` to support animated properties
   - Addresses: Branch growth animation, smooth state transitions
   - Avoids: Premature framework adoption, conflicts with existing hooks

2. **Phase 2: Branch Dynamics** - Implement thickness-based-on-time calculation, animated interpolation
   - Addresses: Dynamic branch thickness, cumulative time visualization
   - Avoids: Performance issues (use delta-time accumulator pattern)

3. **Phase 3: Particle Effects** - Custom particle system for leaves, sparkles, environmental elements
   - Addresses: Rich visual effects, interactive feedback
   - Avoids: Library overhead (implement in <100 lines)

4. **Phase 4: Lighting & Polish** - Animated shadows, glows, composite operations for depth
   - Addresses: Visual depth, active state feedback
   - Avoids: Overusing `shadowBlur` (performance impact on mobile)

5. **Phase 5: Sub-graph Rendering** - Nested statistics visualization using recursive pattern
   - Addresses: Hierarchical data visualization
   - Avoids: Separate rendering system (reuse existing recursive logic)

**Phase ordering rationale:**
- Animation foundation must come first (all other phases depend on it)
- Branch dynamics before particles (core visualization before decoration)
- Lighting last (performance-heavy, can be scaled back if needed)
- Sub-graphs independent (can be developed in parallel with Phase 3-4)

**Research flags for phases:**
- Phase 1: Unlikely to need research (popmotion API is simple)
- Phase 2: May need performance profiling research if 60fps not achieved
- Phase 3: Standard patterns, unlikely to need research
- Phase 4: May need Canvas2D composite operation research for depth effects
- Phase 5: Likely needs deeper research (recursive canvas state management, clipping regions)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH for "no framework", MEDIUM for specific versions | Raw Canvas2D is proven in codebase; versions not verified |
| Features | HIGH | Requirements map directly to Canvas2D capabilities |
| Architecture | HIGH | Extends existing patterns successfully |
| Pitfalls | HIGH | Canvas framework conflicts are well-documented issues |

## Gaps to Address

**Version verification:** Could not verify current npm versions of popmotion (11.0.5) and bezier-easing (2.1.0) due to web tools being unavailable. These versions are from training data cutoff (January 2025). Check npm registry before installation.

**Performance benchmarking:** Research did not include device-specific performance testing. Phase 2 may need research into:
- Target framerate on mobile devices (may need to throttle particle count)
- Memory usage with 100+ animated branches
- Canvas layer caching strategies for complex trees

**Composite operations:** Phase 4 (lighting) may need research into specific Canvas2D `globalCompositeOperation` modes for depth effects. Training data covers basics but advanced layering may need official MDN docs.

**Sub-graph clipping:** Phase 5 may need research into canvas clipping regions and coordinate transformations for nested visualizations. This is a complex topic not fully covered by existing codebase patterns.

**TypeScript integration:** popmotion has built-in TypeScript definitions, but bezier-easing may need `@types/bezier-easing`. This should be verified during Phase 1 implementation.

---

**Research methodology note:** This research was conducted using training data (January 2025) and direct codebase analysis only. Web verification tools (Brave Search, WebSearch, WebFetch) were unavailable. Confidence levels reflect this limitation. All version numbers and external library claims should be verified against official sources before implementation.
