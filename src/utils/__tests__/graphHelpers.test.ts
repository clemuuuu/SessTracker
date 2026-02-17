import { describe, it, expect } from 'vitest';
import { type Edge } from '@xyflow/react';
import { buildParentMap, getAncestorIds, getAncestorSet, getNodeDepth } from '../graphHelpers';

describe('graphHelpers', () => {
    // A -> B -> C
    //      B -> D
    // E
    const edges: Edge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'C' },
        { id: 'e3', source: 'B', target: 'D' },
    ];

    describe('buildParentMap', () => {
        it('should build a map of child -> parent', () => {
            const map = buildParentMap(edges);
            expect(map.get('B')).toBe('A');
            expect(map.get('C')).toBe('B');
            expect(map.get('D')).toBe('B');
            expect(map.get('A')).toBeUndefined();
            expect(map.get('E')).toBeUndefined();
        });
    });

    describe('getAncestorIds', () => {
        it('should return ancestors ordered from parent to root', () => {
            // C -> B -> A
            const ancestors = getAncestorIds('C', edges);
            expect(ancestors).toEqual(['B', 'A']);
        });

        it('should return empty array for root node', () => {
            const ancestors = getAncestorIds('A', edges);
            expect(ancestors).toEqual([]);
        });

        it('should return empty array for isolated node', () => {
            const ancestors = getAncestorIds('E', edges);
            expect(ancestors).toEqual([]);
        });
    });

    describe('getAncestorSet', () => {
        it('should include ancestors AND the node itself', () => {
            const set = getAncestorSet('C', edges);
            expect(set.has('C')).toBe(true);
            expect(set.has('B')).toBe(true);
            expect(set.has('A')).toBe(true);
            expect(set.size).toBe(3);
        });
    });

    describe('getNodeDepth', () => {
        it('should return 0 for root', () => {
            expect(getNodeDepth('A', edges)).toBe(0);
        });

        it('should return 1 for direct child', () => {
            expect(getNodeDepth('B', edges)).toBe(1);
        });

        it('should return 2 for grandchild', () => {
            expect(getNodeDepth('C', edges)).toBe(2);
            expect(getNodeDepth('D', edges)).toBe(2);
        });

        it('should return 0 for isolated node', () => {
            expect(getNodeDepth('E', edges)).toBe(0);
        });
    });
});
