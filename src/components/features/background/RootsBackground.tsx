import { useMemo } from 'react';
import { useTreeCanvas } from '../../../hooks/useTreeCanvas';

export function RootsBackground() {
    const options = useMemo(() => ({
        direction: 'down' as const,
        startPosition: 'top-center' as const,
        curveFactor: 0.2,
        spreadFactor: 2, // PI / 2
        lengthDecay: 0.85,
        widthDecay: 0.6,
        initialLengthFactor: 0.25,
        initialWidth: 30,
        getBranchStyle: (isActive: boolean) => isActive
            ? { stroke: '#818CF8', shadow: '#6366F1', blur: 20, lineWidth: 30 } // Indigo-400
            : { stroke: 'rgba(71, 85, 105, 0.3)', shadow: 'transparent', blur: 0, lineWidth: 30 } // Slate-600
    }), []);

    const canvasRef = useTreeCanvas(options);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                zIndex: 0,
                filter: 'blur(0.5px)',
                opacity: 0.8
            }}
        />
    );
}
