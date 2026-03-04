import { useMemo } from 'react';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { TreeLayer } from './layers/TreeLayer';

/**
 * BackgroundTree - Orchestrates the three-layer animated canvas stack.
 *
 * Layer 0 (z-0): BackgroundLayer - warm gradient that shifts with timer activity
 * Layer 1 (z-1): TreeLayer - animated fractal tree with sway, glow, activation wave
 * Layer 2 (z-2): OverlayLayer - floating particles (light motes + falling leaves)
 *
 * Each layer uses useAnimationLoop for independent RAF rendering with
 * IntersectionObserver-based visibility optimization.
 */
export function BackgroundTree() {
    const options = useMemo(() => ({
        direction: 'up' as const,
        startPosition: 'bottom-center' as const,
        curveFactor: 0.1,
        spreadFactor: 1.5,
        lengthDecay: 0.8,
        widthDecay: 0.65,
        initialLengthFactor: 0.3,
        initialWidth: 40,
        getBranchStyle: (isActive: boolean) => isActive
            ? { stroke: '#FCD34D', shadow: '#F59E0B', blur: 20, lineWidth: 40 } // Gold
            : { stroke: 'rgba(51, 65, 85, 0.4)', shadow: 'transparent', blur: 0, lineWidth: 40 } // Slate-700
    }), []);

    return (
        <div className="absolute inset-0">
            <BackgroundLayer />
            <TreeLayer options={options} />
            {/* OverlayLayer added in Task 2 */}
        </div>
    );
}
