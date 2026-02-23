import React, { useMemo } from 'react';
import { pseudoRandom } from '../../../utils/canvasGeometricUtils';

export const ShootingStars: React.FC = React.memo(() => {
    // Generate a fixed number of shooting stars and randomize their properties once
    // This ensures no React state updates or JS animation loop overhead.
    const stars = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            top: `${pseudoRandom(`ss-top-${i}`) * 60}%`, // Start mostly in the upper half
            left: `${40 + pseudoRandom(`ss-left-${i}`) * 60}%`, // Start mostly from the right half
            delay: `${pseudoRandom(`ss-del-${i}`) * 5}s`, // Random staggering delay start
            duration: `${10 + pseudoRandom(`ss-dur-${i}`) * 15}s`, // Loop every 10 to 25s
            opacity: 0.2 + pseudoRandom(`ss-op-${i}`) * 0.8 // Random brightness
        }));
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute h-[2px] w-[60px] md:w-[100px] opacity-0"
                    style={{
                        top: star.top,
                        left: star.left,
                        animation: `shooting-star cubic-bezier(0.4, 0, 1, 1) infinite`,
                        animationDuration: star.duration,
                        animationDelay: star.delay,
                    }}
                >
                    {/* The tail gradient of the meteor */}
                    <div
                        className="w-full h-full rounded-full bg-gradient-to-r from-transparent via-white/50 to-white"
                        style={{ opacity: star.opacity }}
                    />
                    {/* The bright head of the meteor */}
                    <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-white rounded-full shadow-[0_0_8px_3px_rgba(255,255,255,0.8)]"
                        style={{ opacity: star.opacity }}
                    />
                </div>
            ))}
        </div>
    );
});
