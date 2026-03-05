# Phase 2: Branch Thickness System - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Branches visually represent cumulative study time through thickness. Each branch's width is derived from its node's totalTime value, with parent branches accumulating descendants' time. Thickness smoothly animates on change. Tree rebuilds dynamically when nodes are added/removed. Organic curves and glow effects are Phase 3 — this phase focuses on the thickness data pipeline and basic visual rendering.

</domain>

<decisions>
## Implementation Decisions

### Thickness mapping
- Logarithmic curve: early study time produces visible growth quickly, diminishing returns at high values
- Full accumulation: parent branches sum all descendants' totalTime (trunk is always thickest)
- Thickness updates trigger every minute while timer is running (not per-second)

### Growth animation
- Spring-based transitions when thickness changes (matches Phase 1 spring system)
- Every-minute update cadence creates a noticeable "growth pulse" — rewarding without being distracting
- Spring parameters should feel organic: slight overshoot, gentle settle

### Visual hierarchy
- Dramatic contrast between trunk and leaf branches — clear hierarchy at a glance, like a real oak
- Color deepens with thickness: light gold (new/thin) to deep amber (mature/thick)
- Branches taper toward the tip — thick at base, thin at end, like real branches

### New branch appearance
- New branches (0 time) are visible but light: ~2-3px, pale gold — clearly present without squinting
- Add animation: branch grows outward from parent to its position (spring-based sprouting)
- Delete animation: branch withers/retracts back toward parent (reverse of grow)

### Claude's Discretion
- Exact thickness range (min/max pixel values) — pick what looks good with the fractal tree
- Logarithmic cap point — choose a cumulative time where thickness maxes out
- Growth propagation style (cascade upward with delay vs simultaneous) — pick whichever looks more organic
- Node add/remove thickness transition (animate vs instant) — pick what feels natural
- Whether first-study-minute gets a special pulse effect — judge if it adds value or is noise

</decisions>

<specifics>
## Specific Ideas

- Color progression: light gold to deep amber (warm, like wood aging)
- Trunk should feel substantial — the visual anchor of the tree
- Growth pulse every minute should feel rewarding, like watching a plant grow in time-lapse
- Taper gives each branch segment a natural direction (base to tip)
- Sprouting animation should feel like a real twig extending — spring overshoot, organic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-branch-thickness-system*
*Context gathered: 2026-03-05*
