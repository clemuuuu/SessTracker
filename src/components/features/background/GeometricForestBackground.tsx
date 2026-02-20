// src/components/features/background/GeometricForestBackground.tsx
import React, { useRef, useEffect, useState } from 'react';
import { draw2DHorizon, draw2DFlatTree, pseudoRandom } from '../../../utils/canvasGeometricUtils';

interface GeometricForestBackgroundProps {
    currentDayIndex: number;
}

export const GeometricForestBackground: React.FC<GeometricForestBackgroundProps> = React.memo(({ currentDayIndex }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Gestion du redimensionnement
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const { clientWidth, clientHeight } = canvasRef.current;
                setDimensions({ width: clientWidth, height: clientHeight });

                // Ajustement DPI pour netteté
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = clientWidth * dpr;
                canvasRef.current.height = clientHeight * dpr;

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Init

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Boucle de dessin
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        // 1. Dessiner l'horizon
        const horizonY = dimensions.height * 0.85; // Ligne de sol
        draw2DHorizon(ctx, dimensions.width, horizonY);

        // 2. Dessiner les 7 arbres
        const numDays = 7;
        const segmentWidth = dimensions.width / numDays;

        for (let i = 0; i < numDays; i++) {
            // Position X centrée dans le segment
            const x = (i + 0.5) * segmentWidth;

            // État Actif
            const isActive = i === currentDayIndex;

            // Dimensions basées sur l'écran
            // Arbre actif un peu plus grand
            const baseScale = isActive ? 1.2 : 1.0;
            const randomH = (pseudoRandom(`h-${i}`) - 0.5) * 40; // Variation aléatoire

            const treeHeight = (dimensions.height * 0.4 + randomH) * baseScale;
            // Width proportionnel
            const treeWidth = (segmentWidth * 0.6) * baseScale;

            draw2DFlatTree({
                ctx,
                x,
                y: horizonY,
                height: treeHeight, // Hauteur totale (tronc + feuillage)
                width: treeWidth,
                color: '', // Non utilisé car géré par le gradient dans la fonction
                glowColor: isActive ? 'rgba(251, 146, 60, 0.5)' : 'rgba(45, 212, 191, 0.3)',
                isActive
            });
        }

    }, [dimensions, currentDayIndex]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
        />
    );
});
