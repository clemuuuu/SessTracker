import { interpolate } from 'popmotion';

/** Minimum branch thickness in pixels (new branches are still visible). */
export const MIN_THICKNESS = 2.5;

/** Maximum branch thickness in pixels (10+ hours of study). */
export const MAX_THICKNESS = 28;

/**
 * Map cumulative study time (seconds) to branch thickness in pixels.
 * Uses piecewise linear interpolation with logarithmic-feel breakpoints:
 *   0s -> 2.5px, 60s -> 4px, 300s -> 7px, 1800s -> 13px, 7200s -> 20px, 36000s -> 28px
 * Clamps at boundaries: values below 0 return MIN_THICKNESS, above 36000 return MAX_THICKNESS.
 */
export const timeToThickness = interpolate(
    [0, 60, 300, 1800, 7200, 36000],
    [MIN_THICKNESS, 4, 7, 13, 20, MAX_THICKNESS]
);

/**
 * Map branch thickness (pixels) to active branch stroke color.
 * Transitions from light gold (thin) to deep amber (thick).
 * Input: [2.5, 7, 13, 20, 28] -> amber-200 through amber-700.
 * Returns rgba() strings (popmotion interpolate color output format).
 */
export const thicknessToColor = interpolate(
    [MIN_THICKNESS, 7, 13, 20, MAX_THICKNESS],
    ['#FDE68A', '#FCD34D', '#F59E0B', '#D97706', '#B45309']
);

/**
 * Map branch thickness (pixels) to inactive (desaturated) branch stroke color.
 * Uses slate colors with low opacity for a muted, dormant appearance.
 * Input: [2.5, 7, 13, 20, 28] -> faint-to-medium slate with 0.3-0.5 opacity.
 */
export const thicknessToInactiveColor = interpolate(
    [MIN_THICKNESS, 7, 13, 20, MAX_THICKNESS],
    ['rgba(148,163,184,0.3)', 'rgba(100,116,139,0.35)', 'rgba(71,85,105,0.4)', 'rgba(51,65,85,0.45)', 'rgba(30,41,59,0.5)']
);

/**
 * Map breathing cycle progress (0..1) to glow opacity.
 * Creates a breathe-in/peak/breathe-out pattern over a 2-3 second cycle.
 * Input range: [0, 0.5, 1]
 * Output range: [0.3, 1.0, 0.3]
 */
export const glowToOpacity = interpolate(
    [0, 0.5, 1],
    [0.3, 1.0, 0.3]
);

/**
 * Map warmth value (0..1) to gradient top color RGB components.
 * 0 = idle cool tones, 1 = warm amber shift when studying.
 * Returns { r, g, b } for the warm gradient top color.
 */
export function warmthToGradient(warmth: number): { r: number; g: number; b: number } {
    const clamped = Math.max(0, Math.min(1, warmth));
    return {
        r: Math.round(180 + clamped * 40),   // 180..220
        g: Math.round(120 + clamped * 30),   // 120..150
        b: Math.round(60 - clamped * 20),    // 60..40
    };
}
