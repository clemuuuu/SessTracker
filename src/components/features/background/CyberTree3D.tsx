import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
    position: [number, number, number];
    isActive: boolean;
}

// ─── Leaf profile: 0=tip, 1=base ───
function leafRadius(t: number, maxR: number): number {
    const peak = 0.33;
    if (t <= peak) return maxR * Math.pow(t / peak, 0.5);
    return maxR * Math.pow((1 - t) / (1 - peak), 0.45);
}

// ─── Full tree as LineSegments geometry ───
function buildTree(detail: 'high' | 'med'): THREE.BufferGeometry {
    const hi = detail === 'high';
    const crownH = 5.2;
    const trunkH = 0.9;
    const maxR = 0.85;
    const zScale = 0.32; // leaf flattening (front view = wide, side = thin)
    const tiers = hi ? 22 : 14;
    const radial = hi ? 12 : 8;

    // Pre-compute ring points
    const rings: THREE.Vector3[][] = [];
    for (let ti = 0; ti <= tiers; ti++) {
        const t = ti / tiers;
        const r = leafRadius(t, maxR);
        const y = trunkH + (1 - t) * crownH;
        const ring: THREE.Vector3[] = [];
        for (let ai = 0; ai < radial; ai++) {
            const a = (ai / radial) * Math.PI * 2;
            ring.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a) * zScale));
        }
        rings.push(ring);
    }

    const pos: number[] = [];
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const seg6 = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) =>
        pos.push(x1, y1, z1, x2, y2, z2);

    // 1. Horizontal rings
    for (const ring of rings) {
        for (let i = 0; i < ring.length; i++) seg(ring[i], ring[(i + 1) % ring.length]);
    }

    // 2. Vertical struts (ring to ring)
    for (let ti = 0; ti < rings.length - 1; ti++) {
        for (let ai = 0; ai < radial; ai++) seg(rings[ti][ai], rings[ti + 1][ai]);
    }

    // 3. Radial veins (center axis → ring points)
    const veinStep = hi ? 2 : 3;
    for (let ti = 0; ti <= tiers; ti += veinStep) {
        const t = ti / tiers;
        const y = trunkH + (1 - t) * crownH;
        const ring = rings[ti];
        for (let ai = 0; ai < radial; ai += 2) seg6(0, y, 0, ring[ai].x, ring[ai].y, ring[ai].z);
    }

    // 4. Central spine
    for (let ti = 0; ti < rings.length - 1; ti++) {
        const t1 = ti / tiers, t2 = (ti + 1) / tiers;
        seg6(0, trunkH + (1 - t1) * crownH, 0, 0, trunkH + (1 - t2) * crownH, 0);
    }

    // 5. Diagonal cross-bracing (ring[i][j] → ring[i+1][j+1])
    if (hi) {
        for (let ti = 0; ti < rings.length - 1; ti += 2) {
            for (let ai = 0; ai < radial; ai += 2) {
                seg(rings[ti][ai], rings[ti + 1][(ai + 1) % radial]);
            }
        }
    }

    // 6. Trunk
    const tw = 0.06;
    seg6(0, 0, 0, 0, trunkH, 0);
    seg6(-tw, 0, 0, -tw * 0.4, trunkH, 0);
    seg6(tw, 0, 0, tw * 0.4, trunkH, 0);
    // V detail
    seg6(-tw * 0.7, 0, 0, 0, trunkH * 0.6, 0);
    seg6(tw * 0.7, 0, 0, 0, trunkH * 0.6, 0);

    // 7. Roots
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        const sp = 0.35 + (i % 3) * 0.12;
        const dp = 0.25 + (i % 2) * 0.15;
        const mx = Math.cos(a) * sp * 0.5, mz = Math.sin(a) * sp * 0.5 * zScale;
        const ex = Math.cos(a) * sp, ez = Math.sin(a) * sp * zScale;
        seg6(0, 0, 0, mx, -dp * 0.35, mz);
        seg6(mx, -dp * 0.35, mz, ex, -dp, ez);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return geo;
}

export const CyberTree3D: React.FC<Props> = ({ position, isActive }) => {
    const animRef = useRef<THREE.Group>(null);
    const geo = useMemo(() => buildTree(isActive ? 'high' : 'med'), [isActive]);

    const color = useMemo(
        () => (isActive ? new THREE.Color(3.5, 1.3, 0.2) : new THREE.Color(0.08, 0.65, 1.6)),
        [isActive],
    );

    const s = isActive ? 1.35 : 1;

    useFrame(({ clock }) => {
        if (isActive && animRef.current) {
            animRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.04;
        }
    });

    return (
        <group position={position} scale={[s, s, s]}>
            <group ref={animRef}>
                <lineSegments geometry={geo}>
                    <lineBasicMaterial color={color} transparent opacity={isActive ? 1 : 0.55} />
                </lineSegments>

                {isActive && (
                    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[1.4, 32]} />
                        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
                    </mesh>
                )}
            </group>
        </group>
    );
};
