# Requirements: SessTracker

**Defined:** 2026-02-23
**Core Value:** The interactive visual tree that maps a student's revision structure and reacts to their active study

## v1.0 Requirements — Main Tree Update

### Tree Rendering

- [ ] **TREE-01**: The 2D tree is redrawn with organic curves and a polished visual style
- [ ] **TREE-02**: Branches grow thicker proportionally to cumulative study time on each node
- [ ] **TREE-03**: Branch size/color transitions are smoothly animated (requestAnimationFrame + interpolation)
- [ ] **TREE-04**: Active branch and ancestors have a rich lighting system (pulsing glow, radial gradients, not just shadowBlur)
- [ ] **TREE-05**: The tree dynamically builds according to nodes added in ReactFlow

### Environment

- [ ] **ENV-01**: A ground/horizon is drawn beneath the tree with gradients and textures
- [ ] **ENV-02**: Decorative 2D elements surround the tree (vegetation, visual details)
- [ ] **ENV-03**: Floating particles react to activity (sparkles/leaves around active branch)
- [ ] **ENV-04**: The overall visual ambiance is cohesive and polished (gradients, depth, layering)

### Roots

- [ ] **ROOT-01**: The roots background is redrawn with the same quality as the new main tree
- [ ] **ROOT-02**: Roots grow thicker proportionally to cumulative time (same mechanic as the tree)
- [ ] **ROOT-03**: Active roots have the same rich lighting system as the tree
- [ ] **ROOT-04**: The roots environment is cohesive with the main tree rework (gradients, ambiance)

### Statistics

- [ ] **STAT-01**: The todo list is removed from RootsView (or relocated)
- [ ] **STAT-02**: The stats panel displays active revision info: name, total time, days studied
- [ ] **STAT-03**: Sub-graphs are displayed for each sub-section of the active node
- [ ] **STAT-04**: The existing cumulative time chart is preserved and integrated in the new layout

## Future Requirements

### Seasonal Themes (deferred)
- **THEME-01**: Tree appearance changes based on total study time (spring/summer/autumn/winter)
- **THEME-02**: Seasonal particle effects (falling leaves, snow, blossoms)

### Interactive Tree (deferred)
- **INTER-01**: Hover on tree branch shows tooltip with node name and stats
- **INTER-02**: Click on tree branch navigates to that node in ReactFlow

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D rendering / WebGL | Staying 2D canvas, no extra complexity |
| Sky view rework | Not part of this milestone |
| Calendar view rework | Not part of this milestone |
| Sound effects | Distracting, accessibility concerns |
| New node types / tree structure changes | Tree logic stays the same |
| Mobile-specific layouts | Desktop-first for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TREE-01 | TBD | Pending |
| TREE-02 | TBD | Pending |
| TREE-03 | TBD | Pending |
| TREE-04 | TBD | Pending |
| TREE-05 | TBD | Pending |
| ENV-01 | TBD | Pending |
| ENV-02 | TBD | Pending |
| ENV-03 | TBD | Pending |
| ENV-04 | TBD | Pending |
| ROOT-01 | TBD | Pending |
| ROOT-02 | TBD | Pending |
| ROOT-03 | TBD | Pending |
| ROOT-04 | TBD | Pending |
| STAT-01 | TBD | Pending |
| STAT-02 | TBD | Pending |
| STAT-03 | TBD | Pending |
| STAT-04 | TBD | Pending |

**Coverage:**
- v1.0 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after initial definition*
