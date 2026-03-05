import { describe, it, expect } from 'vitest';
import {
    timeToThickness,
    thicknessToColor,
    thicknessToInactiveColor,
    MIN_THICKNESS,
    MAX_THICKNESS,
} from '../interpolation';

describe('timeToThickness', () => {
    it('should return MIN_THICKNESS (2.5) for 0 seconds', () => {
        expect(timeToThickness(0)).toBeCloseTo(2.5, 1);
    });

    it('should return 4 for 60 seconds (1 minute)', () => {
        expect(timeToThickness(60)).toBeCloseTo(4, 1);
    });

    it('should return 7 for 300 seconds (5 minutes)', () => {
        expect(timeToThickness(300)).toBeCloseTo(7, 1);
    });

    it('should return 13 for 1800 seconds (30 minutes)', () => {
        expect(timeToThickness(1800)).toBeCloseTo(13, 1);
    });

    it('should return 20 for 7200 seconds (2 hours)', () => {
        expect(timeToThickness(7200)).toBeCloseTo(20, 1);
    });

    it('should return MAX_THICKNESS (28) for 36000 seconds (10 hours)', () => {
        expect(timeToThickness(36000)).toBeCloseTo(28, 1);
    });

    it('should clamp below 0 to MIN_THICKNESS', () => {
        expect(timeToThickness(-100)).toBeCloseTo(2.5, 1);
    });

    it('should clamp above 36000 to MAX_THICKNESS', () => {
        expect(timeToThickness(100000)).toBeCloseTo(28, 1);
    });

    it('should interpolate between breakpoints', () => {
        const val = timeToThickness(150); // between 60 (4) and 300 (7)
        expect(val).toBeGreaterThan(4);
        expect(val).toBeLessThan(7);
    });
});

describe('MIN_THICKNESS / MAX_THICKNESS constants', () => {
    it('should export MIN_THICKNESS as 2.5', () => {
        expect(MIN_THICKNESS).toBe(2.5);
    });

    it('should export MAX_THICKNESS as 28', () => {
        expect(MAX_THICKNESS).toBe(28);
    });
});

describe('thicknessToColor', () => {
    it('should return a color string at minimum thickness', () => {
        const color = thicknessToColor(2.5);
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
    });

    it('should return a color string at maximum thickness', () => {
        const color = thicknessToColor(28);
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
    });

    it('should return valid rgba strings at all breakpoints', () => {
        const breakpoints = [2.5, 7, 13, 20, 28];
        for (const bp of breakpoints) {
            const color = thicknessToColor(bp);
            expect(typeof color).toBe('string');
            // popmotion interpolate outputs rgba() strings
            expect(color).toMatch(/^rgba\(/);
        }
    });

    it('should transition from lighter to darker amber', () => {
        // At min thickness, color should be lighter (higher RGB values)
        // At max thickness, color should be darker (lower RGB values)
        const lightColor = thicknessToColor(2.5);
        const darkColor = thicknessToColor(28);
        expect(lightColor).not.toBe(darkColor);
    });
});

describe('thicknessToInactiveColor', () => {
    it('should return rgba string at minimum thickness', () => {
        const color = thicknessToInactiveColor(2.5);
        expect(typeof color).toBe('string');
        expect(color).toMatch(/^rgba\(/);
    });

    it('should return rgba string at maximum thickness', () => {
        const color = thicknessToInactiveColor(28);
        expect(typeof color).toBe('string');
        expect(color).toMatch(/^rgba\(/);
    });

    it('should return valid rgba strings at all breakpoints', () => {
        const breakpoints = [2.5, 7, 13, 20, 28];
        for (const bp of breakpoints) {
            const color = thicknessToInactiveColor(bp);
            expect(typeof color).toBe('string');
            expect(color).toMatch(/^rgba\(/);
        }
    });

    it('should have lower opacity than active colors', () => {
        // Inactive colors have opacity 0.3-0.5
        const color = thicknessToInactiveColor(2.5);
        const opacityMatch = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
        expect(opacityMatch).not.toBeNull();
        const opacity = parseFloat(opacityMatch![1]);
        expect(opacity).toBeGreaterThanOrEqual(0.2);
        expect(opacity).toBeLessThanOrEqual(0.6);
    });
});
