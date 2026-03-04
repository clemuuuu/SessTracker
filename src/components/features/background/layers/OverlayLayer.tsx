import { memo, useRef, useCallback } from 'react';
import { useAnimationLoop } from '../../../../hooks/useAnimationLoop';

/**
 * OverlayLayer - Animated particle canvas with floating light motes and falling leaves.
 *
 * Both particle types are ambient (always present, regardless of timer state).
 * Uses deterministic pseudoRandom initialization (no Math.random).
 * Light motes use additive blending for soft glow. Leaves use standard blending.
 */

interface Mote {
    x: number;  // fraction 0..1
    y: number;  // fraction 0..1
    size: number;  // px
    opacity: number;
    speed: number;
    phase: number;
    hue: number;  // warm gold range 30-60
}

interface Leaf {
    x: number;  // fraction 0..1
    y: number;  // fraction 0..1
    size: number;  // px
    rotation: number;
    rotationSpeed: number;
    fallSpeed: number;
    swayAmplitude: number;
    swayPhase: number;
    color: string;
}

// Deterministic pseudo-random from numeric seed (matches project convention)
function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function initMotes(count: number): Mote[] {
    const motes: Mote[] = [];
    for (let i = 0; i < count; i++) {
        const seed = i * 17 + 42;
        motes.push({
            x: pseudoRandom(seed),
            y: pseudoRandom(seed + 1),
            size: 2 + pseudoRandom(seed + 2) * 3,       // 2-5px
            opacity: 0.3 + pseudoRandom(seed + 3) * 0.5, // 0.3-0.8
            speed: 0.5 + pseudoRandom(seed + 4) * 1.5,   // drift speed multiplier
            phase: pseudoRandom(seed + 5) * Math.PI * 2,
            hue: 30 + pseudoRandom(seed + 6) * 30,        // 30-60 (warm gold)
        });
    }
    return motes;
}

function initLeaves(count: number): Leaf[] {
    const leaves: Leaf[] = [];
    const colors = [
        'rgba(34, 197, 94, 0.5)',   // green-500
        'rgba(250, 204, 21, 0.45)', // yellow-400
        'rgba(251, 146, 60, 0.4)',  // orange-400
        'rgba(163, 230, 53, 0.45)', // lime-400
        'rgba(217, 119, 6, 0.4)',   // amber-600
    ];
    for (let i = 0; i < count; i++) {
        const seed = i * 23 + 137;
        leaves.push({
            x: pseudoRandom(seed),
            y: pseudoRandom(seed + 1),
            size: 4 + pseudoRandom(seed + 2) * 4,           // 4-8px
            rotation: pseudoRandom(seed + 3) * Math.PI * 2,
            rotationSpeed: 0.5 + pseudoRandom(seed + 4) * 1.5, // rad/s
            fallSpeed: 0.5 + pseudoRandom(seed + 5) * 1.5,
            swayAmplitude: 0.3 + pseudoRandom(seed + 6) * 0.7,
            swayPhase: pseudoRandom(seed + 7) * Math.PI * 2,
            color: colors[Math.floor(pseudoRandom(seed + 8) * colors.length)],
        });
    }
    return leaves;
}

export const OverlayLayer = memo(function OverlayLayer() {
    // Stable particle arrays persisted across renders
    const motesRef = useRef<Mote[]>(initMotes(20));
    const leavesRef = useRef<Leaf[]>(initLeaves(10));

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, deltaMs: number, totalMs: number) => {
        ctx.clearRect(0, 0, width, height);

        const motes = motesRef.current;
        const leaves = leavesRef.current;

        // --- Draw Light Motes (additive blending for glow) ---
        ctx.globalCompositeOperation = 'lighter';

        for (const mote of motes) {
            // Animate position
            mote.x += Math.sin(totalMs / 3000 + mote.phase) * 0.0003 * deltaMs / 16;
            mote.y -= mote.speed * 0.00002 * deltaMs;

            // Wrap when drifting off top
            if (mote.y < -0.05) {
                mote.y = 1.05;
                // Deterministic re-position using current totalMs as seed
                mote.x = pseudoRandom(totalMs * 0.001 + mote.phase * 100);
            }
            // Wrap horizontal
            if (mote.x < -0.05) mote.x = 1.05;
            if (mote.x > 1.05) mote.x = -0.05;

            // Pulsing opacity
            const currentOpacity = mote.opacity * (0.7 + 0.3 * Math.sin(totalMs / 2000 + mote.phase));

            // Draw radial gradient circle
            const px = mote.x * width;
            const py = mote.y * height;
            const radius = mote.size;

            const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius * 2);
            gradient.addColorStop(0, `hsla(${mote.hue}, 80%, 70%, ${currentOpacity})`);
            gradient.addColorStop(0.5, `hsla(${mote.hue}, 70%, 60%, ${currentOpacity * 0.4})`);
            gradient.addColorStop(1, `hsla(${mote.hue}, 60%, 50%, 0)`);

            ctx.beginPath();
            ctx.arc(px, py, radius * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // --- Draw Falling Leaves (standard blending) ---
        ctx.globalCompositeOperation = 'source-over';

        for (const leaf of leaves) {
            // Animate position
            leaf.y += leaf.fallSpeed * 0.00003 * deltaMs;
            leaf.x += Math.sin(totalMs / 2500 + leaf.swayPhase) * leaf.swayAmplitude * 0.0002 * deltaMs / 16;
            leaf.rotation += leaf.rotationSpeed * deltaMs * 0.001;

            // Wrap when falling below bottom
            if (leaf.y > 1.05) {
                leaf.y = -0.05;
                leaf.x = pseudoRandom(totalMs * 0.001 + leaf.swayPhase * 50);
            }
            // Wrap horizontal
            if (leaf.x < -0.05) leaf.x = 1.05;
            if (leaf.x > 1.05) leaf.x = -0.05;

            const px = leaf.x * width;
            const py = leaf.y * height;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(leaf.rotation);

            // Draw leaf shape: pointed ellipse (leaf silhouette)
            ctx.beginPath();
            const halfSize = leaf.size / 2;
            // Leaf shape using bezier curves for pointed ends
            ctx.moveTo(-halfSize * 1.2, 0);
            ctx.quadraticCurveTo(0, -halfSize * 0.8, halfSize * 1.2, 0);
            ctx.quadraticCurveTo(0, halfSize * 0.8, -halfSize * 1.2, 0);
            ctx.closePath();

            ctx.fillStyle = leaf.color;
            ctx.fill();

            // Leaf vein (subtle center line)
            ctx.beginPath();
            ctx.moveTo(-halfSize * 0.8, 0);
            ctx.lineTo(halfSize * 0.8, 0);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.restore();
        }
    }, []);

    const canvasRef = useAnimationLoop(draw);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                pointerEvents: 'none',
            }}
        />
    );
});

OverlayLayer.displayName = 'OverlayLayer';
