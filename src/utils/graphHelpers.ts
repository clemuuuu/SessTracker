import { type Edge } from '@xyflow/react';

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
