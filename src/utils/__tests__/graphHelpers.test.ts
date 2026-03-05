import { describe, it, expect } from 'vitest';
import { type Edge } from '@xyflow/react';
import { buildParentMap, getAncestorIds, getAncestorSet, getNodeDepth, buildCumulativeTimeMap } from '../graphHelpers';
import type { RevisionNode } from '../../types';

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

    describe('buildCumulativeTimeMap', () => {
        function makeNode(id: string, totalTime: number): RevisionNode {
            return {
                id,
                position: { x: 0, y: 0 },
                type: 'revision',
                data: { label: id, type: 'subject', totalTime, sessions: [], isRunning: false },
            };
        }

        function buildChildrenMap(edges: Edge[]): Map<string, string[]> {
            const map = new Map<string, string[]>();
            for (const edge of edges) {
                const children = map.get(edge.source) ?? [];
                children.push(edge.target);
                map.set(edge.source, children);
            }
            return map;
        }

        it('should return empty map for empty tree', () => {
            const result = buildCumulativeTimeMap([], new Map());
            expect(result.size).toBe(0);
        });

        it('should return own time for single node', () => {
            const nodes = [makeNode('A', 300)];
            const result = buildCumulativeTimeMap(nodes, new Map());
            expect(result.get('A')).toBe(300);
        });

        it('should accumulate child time into parent', () => {
            // Parent(100s) -> Child(200s)
            const nodes = [makeNode('P', 100), makeNode('C', 200)];
            const treeEdges: Edge[] = [{ id: 'e1', source: 'P', target: 'C' }];
            const childrenMap = buildChildrenMap(treeEdges);
            const result = buildCumulativeTimeMap(nodes, childrenMap);
            expect(result.get('P')).toBe(300);
            expect(result.get('C')).toBe(200);
        });

        it('should accumulate multiple children', () => {
            // Parent(0s) -> [ChildA(100s), ChildB(200s)]
            const nodes = [makeNode('P', 0), makeNode('A', 100), makeNode('B', 200)];
            const treeEdges: Edge[] = [
                { id: 'e1', source: 'P', target: 'A' },
                { id: 'e2', source: 'P', target: 'B' },
            ];
            const childrenMap = buildChildrenMap(treeEdges);
            const result = buildCumulativeTimeMap(nodes, childrenMap);
            expect(result.get('P')).toBe(300);
            expect(result.get('A')).toBe(100);
            expect(result.get('B')).toBe(200);
        });

        it('should accumulate through multiple levels', () => {
            // Root(50s) -> Mid(30s) -> Leaf(20s)
            const nodes = [makeNode('R', 50), makeNode('M', 30), makeNode('L', 20)];
            const treeEdges: Edge[] = [
                { id: 'e1', source: 'R', target: 'M' },
                { id: 'e2', source: 'M', target: 'L' },
            ];
            const childrenMap = buildChildrenMap(treeEdges);
            const result = buildCumulativeTimeMap(nodes, childrenMap);
            expect(result.get('R')).toBe(100);
            expect(result.get('M')).toBe(50);
            expect(result.get('L')).toBe(20);
        });

        it('should handle multiple roots independently', () => {
            const nodes = [makeNode('A', 10), makeNode('B', 20), makeNode('C', 30)];
            const treeEdges: Edge[] = [{ id: 'e1', source: 'A', target: 'B' }];
            const childrenMap = buildChildrenMap(treeEdges);
            const result = buildCumulativeTimeMap(nodes, childrenMap);
            expect(result.get('A')).toBe(30); // 10 + 20
            expect(result.get('B')).toBe(20);
            expect(result.get('C')).toBe(30); // standalone
        });

        it('should treat undefined or zero totalTime as 0', () => {
            const nodeWithZero = makeNode('Z', 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nodeWithUndefined = makeNode('U', undefined as any);
            const nodes = [nodeWithZero, nodeWithUndefined];
            const result = buildCumulativeTimeMap(nodes, new Map());
            expect(result.get('Z')).toBe(0);
            expect(result.get('U')).toBe(0);
        });
    });
});
