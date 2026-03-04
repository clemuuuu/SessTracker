import { describe, it, expect } from 'vitest';
import { easeInOut, easeOut, easeIn, organicGrow, breathe, gentleSwing } from '../easing';

const easings = [
    { name: 'easeInOut', fn: easeInOut },
    { name: 'easeOut', fn: easeOut },
    { name: 'easeIn', fn: easeIn },
    { name: 'organicGrow', fn: organicGrow },
    { name: 'breathe', fn: breathe },
    { name: 'gentleSwing', fn: gentleSwing },
];

describe('easing presets', () => {
    for (const { name, fn } of easings) {
        describe(name, () => {
            it('should return approximately 0 for input 0', () => {
                expect(fn(0)).toBeCloseTo(0, 3);
            });

            it('should return approximately 1 for input 1', () => {
                expect(fn(1)).toBeCloseTo(1, 3);
            });

            it('should return a value between 0 and 1 for input 0.5', () => {
                const result = fn(0.5);
                expect(result).toBeGreaterThanOrEqual(0);
                expect(result).toBeLessThanOrEqual(1);
            });

            it('should be monotonically non-decreasing', () => {
                const inputs = [0, 0.25, 0.5, 0.75, 1];
                const outputs = inputs.map(fn);
                for (let i = 1; i < outputs.length; i++) {
                    expect(outputs[i]).toBeGreaterThanOrEqual(outputs[i - 1]);
                }
            });
        });
    }
});
