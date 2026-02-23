# Feature Landscape: Interactive 2D Tree Visualization

**Domain:** Study tracker with procedural tree visualization
**Researched:** 2026-02-23
**Confidence:** MEDIUM (based on training data + existing codebase analysis, web research unavailable)

## Table Stakes

Features users expect from an interactive tree visualization in a productivity/study app. Missing = product feels incomplete or low-quality.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Branch thickness scales with data** | Core feedback mechanism — visual weight = cumulative time investment | Medium | Already have `totalTime` in nodes; needs formula to map time → width multiplier |
| **Active branch highlighting** | Shows current focus, essential for multi-node trees | Low | **Already implemented** (gold glow on active branch) |
| **Smooth animations/transitions** | Static trees feel dead; growth animations = progress feedback | Medium | RequestAnimationFrame for width/color interpolation |
| **Responsive rendering (DPR-aware)** | Blurry on Retina = unprofessional | Low | **Already implemented** (useTreeCanvas scales by DPR) |
| **Performance at scale** | 50+ nodes should not lag; Canvas2D is chosen for this | Medium | **Already optimized** (IntersectionObserver, efficient childrenMap) |
| **Visual hierarchy** | Depth/importance must be readable at a glance | Low | Partially via position; can enhance with saturation/opacity |
| **Distinct visual states** | Inactive vs active vs completed nodes need clear differentiation | Medium | Currently binary (active/inactive); needs "completed milestone" state |

## Differentiators

Features that set this product apart. Not expected, but highly valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Procedural environmental details** | Tree feels part of a living world, not isolated | High | Ground texture, distant trees silhouette, sky gradient, weather transitions |
| **Particle effects on milestones** | Celebration micro-moments drive habit formation | Medium | Confetti/sparkles when node completes X hours threshold; Canvas2D particle system ~200 LOC |
| **Dynamic lighting system** | Time-of-day lighting + active node "glow aura" creates atmosphere | High | Radial gradients + shadow layers; 3-4 lighting modes (dawn/day/dusk/night) |
| **Branch "blooming" animation** | New nodes grow from parent with spring physics | Medium | CSS spring or Framer Motion for initial growth; one-time per node |
| **Seasonal visual themes** | Tree appearance changes with total study time (spring → summer → autumn → winter) | Medium | 4 color palettes + leaf/snow overlays; localStorage persistence |
| **Interactive leaves/details** | Hover shows node metadata tooltip on branch | Medium | Canvas hitbox detection via region coloring or quadtree; tooltip overlay |
| **Environmental ambience** | Subtle ambient animations (wind in leaves, fireflies at night) | High | 5-10 CSS keyframe animations + occasional particle bursts |
| **Progress "rings" on trunk** | Annual growth rings show historical data (days studied) | Low | Concentric circles at base, scales with `sessions.length` |
| **Symmetrical roots rework** | Roots mirror tree complexity, not just decorative | Medium | Reuse tree generation logic with flipped direction, scaled proportionally |
| **Branch texture/detail** | Bark texture, node bulges, organic curves vs geometric | High | Canvas patterns or SVG overlays; needs art direction |
| **Statistics sub-graphs embedded** | Sparklines on branches showing week-over-week trend | High | Recharts micro-charts or custom canvas mini-graphs per node |

## Anti-Features

Features to explicitly NOT build. Common traps in tree visualizations.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **3D perspective tree** | Performance cost, accessibility issues, harder to parse visually | Stick to 2D with depth via layering/parallax |
| **Physics-based interactive dragging** | Fun for 30 seconds, then annoying; tree structure is logical not spatial | Keep static procedural layout, no draggable branches |
| **Photorealistic rendering** | High asset cost, slow load times, doesn't match UI aesthetic | Stylized 2D with flat colors + subtle gradients |
| **Sound effects** | Distracting in work environments, accessibility concerns | Visual-only feedback (silent by default) |
| **Real-time multiplayer tree** | Scope creep, requires backend, unclear value for study tracker | Focus on personal progress visualization |
| **VR/AR tree viewing** | Niche hardware, massive complexity | Desktop/mobile 2D canvas is the target |
| **User-uploaded tree textures** | Quality control nightmare, performance unpredictable | Curated preset themes only |
| **AI-generated branch shapes** | Unnecessary latency, inconsistent results, overkill | Deterministic procedural generation (already using pseudoRandom) |

## Feature Dependencies

```
Branch thickness scales with data
  └─> Requires: totalTime data (✓ already available)
  └─> Blocks: None

Smooth animations/transitions
  └─> Requires: requestAnimationFrame loop + interpolation state
  └─> Enables: Branch blooming, particle effects, lighting transitions

Procedural environmental details
  └─> Requires: Scene composition system (layers for sky, ground, distant objects)
  └─> Independent of tree rendering

Particle effects on milestones
  └─> Requires: Smooth animations foundation
  └─> Requires: Milestone detection logic (not yet built)

Dynamic lighting system
  └─> Requires: Smooth animations foundation
  └─> Enhances: All visual features (applies globally)

Branch blooming animation
  └─> Requires: Smooth animations foundation
  └─> Requires: Node creation event hook

Seasonal visual themes
  └─> Requires: Total time calculation across all nodes
  └─> Independent rendering (color palette swap)

Interactive leaves/details
  └─> Requires: Canvas hitbox detection
  └─> Requires: Tooltip overlay component

Progress rings on trunk
  └─> Requires: Historical session data (✓ already available)
  └─> Independent rendering (trunk base decoration)

Symmetrical roots rework
  └─> Requires: Refactor useTreeCanvas to accept mirroring params
  └─> Currently: RootsBackground is separate, can reuse logic

Branch texture/detail
  └─> Independent of data (cosmetic enhancement)

Statistics sub-graphs embedded
  └─> Requires: Per-node time series data aggregation
  └─> Requires: Micro-chart rendering (new component or canvas primitive)
  └─> Blocks: None (can be added last)
```

## MVP Recommendation

**Prioritize in this order:**

### Phase 1: Core Data Visualization (Required)
1. **Branch thickness scales with data** — This is the minimum viable enhancement. Without it, the visual tree doesn't reflect progress data.
2. **Distinct visual states** — Add "milestone reached" or "completed goal" states so tree communicates achievement.
3. **Smooth animations/transitions** — Foundation for all dynamic features. Implement width interpolation on timer tick.

### Phase 2: Environmental Scene (High Impact)
4. **Procedural environmental details** — Ground, horizon, sky gradient. Makes tree feel situated, not floating.
5. **Symmetrical roots rework** — Currently roots are decorative; make them mirror tree structure for visual coherence.

### Phase 3: Rewarding Interactions (Engagement)
6. **Particle effects on milestones** — Celebration moments drive habit formation.
7. **Dynamic lighting system** — Ambient lighting (time-of-day) + active node spotlight effect.

### Phase 4: Polish & Depth (Optional)
8. **Seasonal visual themes** — Long-term engagement hook.
9. **Progress rings on trunk** — Historical context at a glance.
10. **Branch blooming animation** — Delightful micro-interaction.

**Defer until user feedback:**
- Interactive leaves/details (nice-to-have, not essential)
- Branch texture/detail (cosmetic, time-intensive)
- Statistics sub-graphs embedded (complex, unclear value until stats rework is scoped)

## Complexity Assessment

| Feature Category | Estimated Effort | Risk Areas |
|------------------|------------------|------------|
| Branch thickness scaling | 4-6 hours | Formula tuning (linear vs log vs sqrt), visual balance |
| Smooth animations | 8-12 hours | RequestAnimationFrame management, interpolation state |
| Environmental scene | 16-24 hours | Art direction, layer composition, parallax coordination |
| Particle effects | 8-12 hours | Performance at 200+ particles, particle pooling |
| Dynamic lighting | 12-16 hours | Multiple blend modes, shadow rendering performance |
| Seasonal themes | 6-8 hours | Color palette design, transition logic |
| Interactive hitboxes | 12-16 hours | Canvas region detection accuracy, tooltip positioning |
| Statistics sub-graphs | 16-24 hours | Data aggregation logic, micro-chart layout |

## Integration Notes: Existing Canvas2D System

**Current architecture strengths:**
- `useTreeCanvas` is already config-driven (direction, colors, spread, decay)
- DPR-aware rendering prevents blurriness
- IntersectionObserver optimization prevents off-screen waste
- Deterministic `pseudoRandom` ensures stable tree shapes
- `activeAncestorIds` tracking enables active branch highlighting

**What needs extension:**

1. **For branch thickness scaling:**
   - Add `getNodeTotalTime(nodeId)` accessor in store
   - Modify `drawBranch` to calculate `widthMultiplier = f(totalTime)`
   - Update `lineWidth = width * widthMultiplier` in drawing logic

2. **For smooth animations:**
   - Add animation state: `Map<nodeId, { currentWidth, targetWidth, currentColor, targetColor }>`
   - Replace useEffect draw trigger with `requestAnimationFrame` loop
   - Interpolate values over time (lerp function)

3. **For particle effects:**
   - Add parallel canvas layer above tree (z-index management)
   - Particle class with position, velocity, lifetime, color
   - Update loop removes dead particles, recycles via object pool

4. **For environmental details:**
   - Scene composition: multiple canvas layers or single canvas with z-ordered drawing
   - Ground layer: gradient fill + noise texture (can use `pseudoRandom` for consistency)
   - Sky layer: already have gradient in RootsView, extract to reusable `SkyGradient` component

5. **For dynamic lighting:**
   - Global lighting state in `uiSlice` (time-of-day enum)
   - Pass lighting config to `useTreeCanvas` options
   - Apply radial gradient overlay on active node branch (composite operation: 'lighter' or 'screen')

6. **For roots symmetry:**
   - Extract core tree generation logic from `useTreeCanvas` into pure function
   - RootsBackground calls same logic with mirrored data structure
   - Both BackgroundTree and RootsBackground share generation, differ only in rendering direction

**Performance considerations:**
- Branch thickness: No performance impact (calculation per frame already happens)
- Animations: RequestAnimationFrame is standard, 60fps target achievable
- Particles: 200 particles @ 60fps = 12k draws/sec, manageable with pooling
- Lighting: Radial gradients are fast, but limit to 2-3 active at once
- Environmental details: Memoize static layers (ground, distant trees), redraw only on theme change

## Sources

**Note:** This research is based on training data (knowledge cutoff January 2025) + analysis of existing SessTracker codebase. Web search was unavailable during research session. Confidence level: MEDIUM.

**Analyzed codebase files:**
- `/home/extra/SessTracker/src/hooks/useTreeCanvas.ts` — Current tree rendering implementation
- `/home/extra/SessTracker/src/components/features/background/BackgroundTree.tsx` — Tree configuration
- `/home/extra/SessTracker/src/components/features/background/RootsBackground.tsx` — Roots implementation
- `/home/extra/SessTracker/CLAUDE.md` — Architecture and constraints

**Training data sources (unverified):**
- Canvas2D performance best practices (MDN documentation patterns)
- Gamification in productivity apps (common patterns: streaks, visual growth, celebrations)
- Tree visualization libraries (D3.js, vis.js patterns)
- Procedural generation techniques (L-systems, recursive fractals)

**Recommendations for validation:**
- Test branch thickness formulas with real user data (need production metrics)
- Benchmark particle count limits on target devices
- User research on which visual effects feel "rewarding" vs "distracting"
