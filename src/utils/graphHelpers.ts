import { type Edge } from '@xyflow/react';
import type { RevisionNode } from '../types';

/**
 * Build a child→parent lookup map from edges.
 * O(n) build, O(1) parent lookup afterwards.
 */
export function buildParentMap(edges: Edge[]): Map<string, string> {
    const parentMap = new Map<string, string>();
    for (const edge of edges) {
        parentMap.set(edge.target, edge.source);
    }
    return parentMap;
}

/**
 * Get all ancestor IDs of a node (ordered from direct parent to root).
 * Uses a parentMap for O(depth) traversal instead of O(n) per step.
 */
export function getAncestorIds(startId: string, edges: Edge[]): string[] {
    const parentMap = buildParentMap(edges);
    const ancestors: string[] = [];
    let currentId = startId;

    while (true) {
        const parentId = parentMap.get(currentId);
        if (!parentId) break;
        ancestors.push(parentId);
        currentId = parentId;
    }

    return ancestors;
}

/**
 * Same as getAncestorIds but returns a Set (includes the startId).
 * Useful for tickCallback where we need fast .has() checks.
 */
export function getAncestorSet(startId: string, edges: Edge[]): Set<string> {
    const ancestors = getAncestorIds(startId, edges);
    const set = new Set(ancestors);
    set.add(startId);
    return set;
}

/**
 * Get the depth of a node in the tree (root = 0).
 */
export function getNodeDepth(nodeId: string, edges: Edge[]): number {
    const parentMap = buildParentMap(edges);
    let depth = 0;
    let currentId = nodeId;

    while (true) {
        const parentId = parentMap.get(currentId);
        if (!parentId) break;
        depth++;
        currentId = parentId;
    }

    return depth;
}

/**
 * Build a map of node ID -> cumulative time (own totalTime + all descendants' totalTime).
 * Uses memoized recursive descent — each node computed exactly once, O(n) overall.
 *
 * @param nodes - Array of RevisionNode objects (need .id and .data.totalTime)
 * @param childrenMap - Map of nodeId -> array of child nodeIds (parent -> children)
 * @returns Map<string, number> where value = cumulative subtree time in seconds
 */
export function buildCumulativeTimeMap(
    nodes: RevisionNode[],
    childrenMap: Map<string, string[]>
): Map<string, number> {
    const result = new Map<string, number>();

    function getCumulativeTime(nodeId: string, timeByNode: Map<string, number>): number {
        const cached = result.get(nodeId);
        if (cached !== undefined) return cached;

        const ownTime = timeByNode.get(nodeId) ?? 0;
        const children = childrenMap.get(nodeId);

        let total = ownTime;
        if (children) {
            for (const childId of children) {
                total += getCumulativeTime(childId, timeByNode);
            }
        }

        result.set(nodeId, total);
        return total;
    }

    // Build a quick lookup of nodeId -> own totalTime
    const timeByNode = new Map<string, number>();
    for (const node of nodes) {
        timeByNode.set(node.id, node.data.totalTime ?? 0);
    }

    // Compute cumulative time for every node (memoization ensures O(n))
    for (const node of nodes) {
        getCumulativeTime(node.id, timeByNode);
    }

    return result;
}
