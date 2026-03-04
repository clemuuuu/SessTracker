import { spring } from 'popmotion';

// Verified API shape (popmotion 11.0.5):
// spring({ from, to, stiffness, damping, mass }) returns { next(elapsedMs) => { value, done }, flipTarget() }
// next() takes ELAPSED time from animation start (not absolute timestamp).

interface ActiveSpring {
    iterator: ReturnType<typeof spring>;
    elapsed: number;
    current: number;
    done: boolean;
}

export function createSpringManager() {
    const springs = new Map<string, ActiveSpring>();

    return {
        /** Start or retarget a named spring animation */
        set(key: string, from: number, to: number, config?: { stiffness?: number; damping?: number; mass?: number }) {
            springs.set(key, {
                iterator: spring({
                    from,
                    to,
                    stiffness: config?.stiffness ?? 80,
                    damping: config?.damping ?? 15,
                    mass: config?.mass ?? 1,
                }),
                elapsed: 0,
                current: from,
                done: false,
            });
        },

        /** Advance all springs by deltaMs, return current values */
        tick(deltaMs: number): Map<string, number> {
            const values = new Map<string, number>();
            for (const [key, s] of springs) {
                if (s.done) {
                    values.set(key, s.current);
                    continue;
                }
                s.elapsed += deltaMs;
                const result = s.iterator.next(s.elapsed);
                s.current = result.value;
                s.done = result.done;
                values.set(key, result.value);
            }
            return values;
        },

        /** Get current value for a spring, or undefined if not found */
        get(key: string): number | undefined {
            return springs.get(key)?.current;
        },

        /** Check if a spring exists */
        has(key: string): boolean {
            return springs.has(key);
        },

        /** Remove a specific spring */
        remove(key: string) {
            springs.delete(key);
        },

        /** Clear all springs */
        clear() {
            springs.clear();
        },
    };
}
