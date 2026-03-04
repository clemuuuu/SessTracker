import BezierEasing from 'bezier-easing';

// Standard CSS easings
export const easeInOut = BezierEasing(0.42, 0, 0.58, 1);
export const easeOut = BezierEasing(0, 0, 0.58, 1);
export const easeIn = BezierEasing(0.42, 0, 1, 1);

// Organic/natural feel curves for tree animations
export const organicGrow = BezierEasing(0.22, 0.61, 0.36, 1);    // Gentle growth for branch extension
export const breathe = BezierEasing(0.45, 0.05, 0.55, 0.95);     // Symmetrical in/out for glow pulse
export const gentleSwing = BezierEasing(0.37, 0, 0.63, 1);       // Smooth oscillation base for branch sway
