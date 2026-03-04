import { interpolate } from 'popmotion';

/**
 * Map total study time (seconds) to branch thickness multiplier.
 * Input range: [0, 300, 3600, 36000] (0s, 5min, 1hr, 10hr)
 * Output range: [1.0, 1.3, 2.0, 3.5]
 */
export const timeToThickness = interpolate(
    [0, 300, 3600, 36000],
    [1.0, 1.3, 2.0, 3.5]
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
