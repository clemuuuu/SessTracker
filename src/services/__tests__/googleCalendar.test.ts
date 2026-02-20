import { describe, it, expect } from 'vitest';
import { mapLocalColorToGoogle, mapGoogleColorToLocal } from '../googleCalendar';

describe('mapLocalColorToGoogle', () => {
    it('should map all 6 local colors to Google colorIds', () => {
        expect(mapLocalColorToGoogle('bg-amber-500')).toBe('6');
        expect(mapLocalColorToGoogle('bg-cyan-500')).toBe('7');
        expect(mapLocalColorToGoogle('bg-emerald-500')).toBe('10');
        expect(mapLocalColorToGoogle('bg-rose-500')).toBe('11');
        expect(mapLocalColorToGoogle('bg-violet-500')).toBe('3');
        expect(mapLocalColorToGoogle('bg-indigo-500')).toBe('9');
    });

    it('should return undefined for unknown colors', () => {
        expect(mapLocalColorToGoogle('bg-red-500')).toBeUndefined();
        expect(mapLocalColorToGoogle('')).toBeUndefined();
    });
});

describe('mapGoogleColorToLocal', () => {
    it('should map Google event colorIds to local colors (exact matches)', () => {
        expect(mapGoogleColorToLocal('6')).toBe('bg-amber-500');
        expect(mapGoogleColorToLocal('7')).toBe('bg-cyan-500');
        expect(mapGoogleColorToLocal('10')).toBe('bg-emerald-500');
        expect(mapGoogleColorToLocal('11')).toBe('bg-rose-500');
        expect(mapGoogleColorToLocal('3')).toBe('bg-violet-500');
        expect(mapGoogleColorToLocal('9')).toBe('bg-indigo-500');
    });

    it('should map approximate Google event colorIds', () => {
        expect(mapGoogleColorToLocal('4')).toBe('bg-rose-500');    // Flamingo
        expect(mapGoogleColorToLocal('5')).toBe('bg-amber-500');   // Banana
        expect(mapGoogleColorToLocal('2')).toBe('bg-emerald-500'); // Sage
        expect(mapGoogleColorToLocal('1')).toBe('bg-violet-500');  // Lavender
        expect(mapGoogleColorToLocal('8')).toBe('bg-cyan-500');    // Graphite
    });

    it('should fall back to calendar colorId when event colorId is absent', () => {
        // Reds
        expect(mapGoogleColorToLocal(undefined, '1')).toBe('bg-rose-500');
        expect(mapGoogleColorToLocal(undefined, '22')).toBe('bg-rose-500');
        // Oranges/Yellows
        expect(mapGoogleColorToLocal(undefined, '5')).toBe('bg-amber-500');
        // Greens
        expect(mapGoogleColorToLocal(undefined, '7')).toBe('bg-emerald-500');
        // Blues
        expect(mapGoogleColorToLocal(undefined, '14')).toBe('bg-cyan-500');
        // Purples
        expect(mapGoogleColorToLocal(undefined, '17')).toBe('bg-violet-500');
        // Grays
        expect(mapGoogleColorToLocal(undefined, '19')).toBe('bg-slate-500');
    });

    it('should prioritize event colorId over calendar colorId', () => {
        // Event says Tangerine (amber), calendar says Red — event wins
        expect(mapGoogleColorToLocal('6', '1')).toBe('bg-amber-500');
    });

    it('should return cyan as ultimate fallback', () => {
        expect(mapGoogleColorToLocal(undefined, undefined)).toBe('bg-cyan-500');
        expect(mapGoogleColorToLocal(undefined, '999')).toBe('bg-cyan-500');
    });
});
