import { describe, it, expect, beforeEach } from 'vitest';
import { createSpringManager } from '../springManager';

describe('springManager', () => {
    let manager: ReturnType<typeof createSpringManager>;

    beforeEach(() => {
        manager = createSpringManager();
    });

    it('should create a spring and return the initial (from) value', () => {
        manager.set('glow', 0, 1);
        expect(manager.get('glow')).toBe(0);
    });

    it('should advance a spring after tick', () => {
        manager.set('glow', 0, 1);
        manager.tick(16);
        const value = manager.get('glow');
        expect(value).toBeDefined();
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(1);
    });

    it('should converge to target value after many ticks', () => {
        manager.set('glow', 0, 1);
        // ~3.2 seconds of 16ms frames
        for (let i = 0; i < 200; i++) {
            manager.tick(16);
        }
        const value = manager.get('glow');
        expect(value).toBeDefined();
        expect(value).toBeCloseTo(1, 1);
    });

    it('should report done springs in tick return value', () => {
        manager.set('glow', 0, 1);
        let values: Map<string, number> = new Map();
        for (let i = 0; i < 200; i++) {
            values = manager.tick(16);
        }
        expect(values.get('glow')).toBeCloseTo(1, 1);
    });

    it('should handle has correctly', () => {
        expect(manager.has('glow')).toBe(false);
        manager.set('glow', 0, 1);
        expect(manager.has('glow')).toBe(true);
    });

    it('should remove a spring', () => {
        manager.set('glow', 0, 1);
        manager.remove('glow');
        expect(manager.get('glow')).toBeUndefined();
        expect(manager.has('glow')).toBe(false);
    });

    it('should clear all springs', () => {
        manager.set('glow', 0, 1);
        manager.set('sway', 5, 10);
        manager.clear();
        expect(manager.has('glow')).toBe(false);
        expect(manager.has('sway')).toBe(false);
    });

    it('should support custom spring config', () => {
        manager.set('fast', 0, 100, { stiffness: 300, damping: 10, mass: 0.5 });
        manager.tick(16);
        const value = manager.get('fast');
        expect(value).toBeDefined();
        expect(value).toBeGreaterThan(0);
    });

    it('should handle retargeting (replacing an existing spring)', () => {
        manager.set('glow', 0, 1);
        manager.tick(100);
        const mid = manager.get('glow')!;
        expect(mid).toBeGreaterThan(0);

        // Retarget to new value
        manager.set('glow', mid, 2);
        expect(manager.get('glow')).toBe(mid);
        manager.tick(100);
        const newValue = manager.get('glow')!;
        expect(newValue).toBeGreaterThan(mid);
    });

    it('should handle multiple springs independently', () => {
        manager.set('a', 0, 10);
        manager.set('b', 100, 0);
        manager.tick(50);
        const a = manager.get('a')!;
        const b = manager.get('b')!;
        expect(a).toBeGreaterThan(0);
        expect(a).toBeLessThan(10);
        expect(b).toBeLessThan(100);
        expect(b).toBeGreaterThan(0);
    });
});
