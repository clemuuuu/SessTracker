import { useMemo } from 'react';
import { useTreeCanvas } from '../../../hooks/useTreeCanvas';

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

    const canvasRef = useTreeCanvas(options);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                zIndex: 0,
                filter: 'blur(0.5px)'
            }}
        />
    );
}
