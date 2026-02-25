import React, { useMemo } from 'react';
import { useCanvas } from '../../../hooks/useCanvas';
import { pseudoRandom } from '../../../utils/canvasGeometricUtils';

export const UndergroundBackground: React.FC = React.memo(() => {
    const drawUnderground = useMemo(() => {
        return (ctx: CanvasRenderingContext2D, width: number, height: number) => {
            // Clear background
            ctx.fillStyle = '#0B0F19';
            ctx.fillRect(0, 0, width, height);

            const layerHeights = [
                height * 0.15, // Layer 1: Dirt
                height * 0.40, // Layer 2: Rocky Dirt
                height * 0.70, // Layer 3: Rocks
                height * 1.00  // Layer 4: Deep Rock
            ];

            const colors = [
                '#8B5A2B', // Dirt
                '#6b4423', // Rocky Dirt
                '#4a3626', // Rocks
                '#2E2A2F'  // Deep Rock
            ];

            // Helper to draw an irregular wavy line
            const drawWavyPath = (yBase: number, amplitude: number, frequency: number, phase: number) => {
                ctx.beginPath();
                ctx.moveTo(0, layerHeights[3]); // Start from bottom-left
                ctx.lineTo(0, yBase);
                for (let x = 0; x <= width; x += 20) {
                    const noise = pseudoRandom(`underground_noise_${x}_${yBase}`) * amplitude * 0.5;
                    const y = yBase + Math.sin(x * frequency + phase) * amplitude + noise;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, layerHeights[3]); // Down to bottom-right
                ctx.closePath();
            };

            // Draw layers back-to-front (actually top-to-bottom works if we draw bottom-most first and overlay? No, draw from back/bottom to front/top if we want waves to overlap correctly, but wait, filling down to height covers everything below!)
            // So we draw from the top-most layer to bottom? Wait, if we fill from the wavy line DOWN to the bottom of the canvas, the first layer (top) will cover EVERYTHING.
            // Oh, so we should draw Layer 4 first, then 3, then 2, then 1? No! If we draw 1 first, it covers [y1...height]. Then drawing 2 covers [y2...height], overlapping the bottom part of 1. This is correct!

            // Draw Layer 1 (Dirt) - reaches from y=0 (wait, y=0 to y1)
            ctx.fillStyle = colors[0];
            ctx.fillRect(0, 0, width, layerHeights[0]);

            // For the ones below, we draw from their top bound down to the bottom
            for (let i = 1; i < 4; i++) {
                drawWavyPath(layerHeights[i - 1], 15, 0.01 + i * 0.005, i * 10);
                ctx.fillStyle = colors[i];
                ctx.fill();
            }

            // Draw details per layer

            // Layer 2 Details: Rocky Dirt (small pebbles)
            ctx.fillStyle = '#5a381c';
            for (let i = 0; i < 150; i++) {
                const x = pseudoRandom(`pebble_x_${i}`) * width;
                const yBase = layerHeights[0];
                const yRange = layerHeights[1] - layerHeights[0];
                const y = yBase + pseudoRandom(`pebble_y_${i}`) * yRange;
                const r = 2 + pseudoRandom(`pebble_r_${i}`) * 4;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Layer 3 Details: Rocks (larger blocky shapes)
            ctx.fillStyle = '#3a2a1d';
            for (let i = 0; i < 80; i++) {
                const x = pseudoRandom(`rock_x_${i}`) * width;
                const yBase = layerHeights[1];
                const yRange = layerHeights[2] - layerHeights[1];
                const y = yBase + pseudoRandom(`rock_y_${i}`) * yRange;
                const rw = 15 + pseudoRandom(`rock_rw_${i}`) * 30;
                const rh = 10 + pseudoRandom(`rock_rh_${i}`) * 20;
                ctx.beginPath();
                ctx.ellipse(x, y, rw, rh, pseudoRandom(`rock_rot_${i}`) * Math.PI, 0, Math.PI * 2);
                ctx.fill();

                // Highlight
                ctx.fillStyle = '#5c4533';
                ctx.beginPath();
                ctx.ellipse(x - 2, y - 2, rw * 0.4, rh * 0.4, pseudoRandom(`rock_rot_${i}`) * Math.PI, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#3a2a1d'; // Reset
            }

            // Layer 4 Details: Deep Rock with Diamonds
            for (let i = 0; i < 40; i++) {
                const x = pseudoRandom(`diamond_x_${i}`) * width;
                const yBase = layerHeights[2];
                const yRange = layerHeights[3] - layerHeights[2];
                const y = yBase + pseudoRandom(`diamond_y_${i}`) * yRange;
                const size = 3 + pseudoRandom(`diamond_s_${i}`) * 6;

                // Diamond glow
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#00FFFF';

                ctx.beginPath();
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size * 0.7, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size * 0.7, y);
                ctx.closePath();
                ctx.fill();

                ctx.shadowBlur = 0; // reset
                // Inner white center
                ctx.fillStyle = '#E0FFFF';
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.5);
                ctx.lineTo(x + size * 0.35, y);
                ctx.lineTo(x, y + size * 0.5);
                ctx.lineTo(x - size * 0.35, y);
                ctx.closePath();
                ctx.fill();
            }

            // Draw Galleries (caves for future notes)
            // Distribute a few dark, hollowed-out shapes across layers 2, 3, 4
            ctx.fillStyle = '#110d14'; // Very dark cave color
            const numGalleries = 6;
            for (let i = 0; i < numGalleries; i++) {
                const x = width * (0.15 + pseudoRandom(`gal_x_${i}`) * 0.7); // Keep away from edges
                const y = height * (0.3 + pseudoRandom(`gal_y_${i}`) * 0.6); // Between 30% and 90% height
                const rW = 80 + pseudoRandom(`gal_rw_${i}`) * 60; // 80 to 140 width
                const rH = 50 + pseudoRandom(`gal_rh_${i}`) * 40; // 50 to 90 height

                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                // Draw irregular blob for cave
                ctx.ellipse(x, y, rW, rH, pseudoRandom(`gal_rot_${i}`) * 0.5, 0, Math.PI * 2);
                ctx.fill();

                // Inner darker depth
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#08050a';
                ctx.beginPath();
                ctx.ellipse(x, y + 10, rW * 0.8, rH * 0.7, pseudoRandom(`gal_rot_${i}`) * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#110d14'; // reset limit
            }
        };
    }, []);

    const canvasRef = useCanvas(drawUnderground);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
    );
});

UndergroundBackground.displayName = 'UndergroundBackground';
