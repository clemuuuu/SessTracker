import React, { useCallback } from 'react';
import { pseudoRandom } from '../../../utils/canvasGeometricUtils';
import { useCanvas } from '../../../hooks/useCanvas';

export const SkyBackground: React.FC = React.memo(() => {
    const drawSky = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.clearRect(0, 0, width, height);

        // 1. Deep Blue Gradient Background
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#020617'); // slate-950 (Darkest at top)
        skyGradient.addColorStop(0.5, '#0f172a'); // slate-900
        skyGradient.addColorStop(1, '#0c4a6e'); // sky-900 (Lighter near clouds)

        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // 2. Aurora Borealis effect
        // Drawn using smooth overlapping waves with an intense blur filter to look like light curtains
        ctx.save();
        ctx.filter = 'blur(60px)';

        const createAuroraPath = (yCenter: number, amplitude: number, phase: number, colorStart: string, colorEnd: string) => {
            const gradient = ctx.createLinearGradient(0, yCenter - amplitude * 1.5, 0, yCenter + amplitude * 2);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.3, colorStart);
            gradient.addColorStop(0.8, colorEnd);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.moveTo(0, yCenter);
            for (let x = 0; x <= width + 50; x += 50) {
                const y = yCenter + Math.sin((x / width) * Math.PI * 2 + phase) * amplitude
                    + Math.sin((x / width) * Math.PI * 4) * (amplitude * 0.4);
                ctx.lineTo(x, y);
            }
            for (let x = width + 50; x >= 0; x -= 50) {
                const y = yCenter + 250 + Math.sin((x / width) * Math.PI * 2.5 + phase) * (amplitude * 0.6);
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        };

        // Draw a few aurora curtains (Green, Cyan, Purple mixed)
        createAuroraPath(height * 0.25, 140, 0, 'rgba(16, 185, 129, 0.45)', 'rgba(20, 184, 166, 0.1)'); // Emerald/Teal
        createAuroraPath(height * 0.15, 100, Math.PI / 3, 'rgba(14, 165, 233, 0.35)', 'rgba(99, 102, 241, 0.1)'); // Sky Blue/Indigo
        createAuroraPath(height * 0.35, 120, Math.PI / 1.5, 'rgba(52, 211, 153, 0.5)', 'rgba(16, 185, 129, 0.05)'); // Bright Green

        ctx.restore();

        // 3. Ambient Stars (Tiny static dots)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 200; i++) {
            const x = pseudoRandom(`ambient-star-x-${i}`) * width;
            const y = pseudoRandom(`ambient-star-y-${i}`) * height;
            const size = pseudoRandom(`ambient-star-s-${i}`) * 1.5;
            const opacity = 0.2 + pseudoRandom(`ambient-star-o-${i}`) * 0.8;

            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0; // reset

        // 4. Clouds at the bottom
        // Using layered sub-paths to simulate fluffy clouds and avoid winding-rule holes
        const drawCloudLayer = (yOffset: number, colorStart: string, colorEnd: string, numPuffs: number, seedBase: string, flattenX = 1, flattenY = 1, isFrontCloud = false) => {
            ctx.beginPath();

            // Solid base to prevent any gaps or transparency at the bottom
            ctx.rect(0, height - yOffset, width, yOffset + 150);

            const step = width / numPuffs;

            // Front cloud components are enlarged to perfectly seal any micro-gaps
            const radiusMultiplier = isFrontCloud ? 1.3 : 1;

            // Main puffs drawn as distinct full ellipses to prevent backtracking line holes
            for (let i = -1; i <= numPuffs + 2; i++) {
                const x = i * step + (pseudoRandom(`${seedBase}-x-${i}`) * step * 0.5 - step * 0.25);
                const y = height - yOffset - (pseudoRandom(`${seedBase}-y-${i}`) * 100);

                let radius = 50 + pseudoRandom(`${seedBase}-r-${i}`) * 100;
                radius *= radiusMultiplier;

                ctx.moveTo(x + radius * flattenX, y);
                ctx.ellipse(x, y, radius * flattenX, radius * flattenY, 0, 0, Math.PI * 2);
            }

            // Secondary smoothing pass for the front layer
            if (isFrontCloud) {
                for (let i = -1; i <= numPuffs + 1; i++) {
                    const x1 = i * step + (pseudoRandom(`${seedBase}-x-${i}`) * step * 0.5 - step * 0.25);
                    const x2 = (i + 1) * step + (pseudoRandom(`${seedBase}-x-${i + 1}`) * step * 0.5 - step * 0.25);

                    const midX = (x1 + x2) / 2;
                    const y = height - yOffset - 30;
                    const radius = 60 * flattenX * radiusMultiplier;

                    ctx.moveTo(midX + radius, y);
                    ctx.ellipse(midX, y, radius, radius * flattenY, 0, 0, Math.PI * 2);
                }
            }

            const cloudGradient = ctx.createLinearGradient(0, height - yOffset - 150, 0, height);
            cloudGradient.addColorStop(0, colorStart);
            cloudGradient.addColorStop(1, colorEnd);

            ctx.fillStyle = cloudGradient;
            ctx.fill();
        };

        // Back clouds (Darker, slightly flattened, pushed down with larger forms)
        drawCloudLayer(120, 'rgba(15, 23, 42, 0.8)', 'rgba(2, 6, 23, 1)', 10, 'cloud-back', 1.25, 1.0);
        // Middle clouds (Medium, same rounded shape)
        drawCloudLayer(80, 'rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 1)', 10, 'cloud-mid', 1.1, 0.9);
        // Front clouds (Lighter, cooler hue, naturally smoothed intersections, pushed down)
        drawCloudLayer(-20, 'rgba(51, 65, 85, 0.9)', 'rgba(30, 41, 59, 1)', 10, 'cloud-front', 1.1, 0.9, true);
    }, []);

    const canvasRef = useCanvas(drawSky);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
        />
    );
});
