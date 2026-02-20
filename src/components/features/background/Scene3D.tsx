import { Canvas, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CyberTree3D } from './CyberTree3D';

interface Props {
    currentDayIndex: number;
}

function CameraBreath() {
    useFrame(({ clock, camera }) => {
        const t = clock.elapsedTime;
        camera.position.x = Math.sin(t * 0.12) * 0.5;
        camera.position.y = 3.8 + Math.sin(t * 0.18) * 0.12;
        camera.lookAt(0, 2.8, 0);
    });
    return null;
}

const Scene3D: React.FC<Props> = ({ currentDayIndex }) => {
    const sp = 3.0;
    const ox = -3 * sp; // center 7 trees

    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 3.8, 14], fov: 38 }} gl={{ antialias: true }} dpr={[1, 1.5]}>
                <color attach="background" args={['#020611']} />
                <fog attach="fog" args={['#020611', 15, 40]} />

                <CameraBreath />

                <Grid
                    position={[0, -0.01, 0]}
                    args={[60, 60]}
                    cellSize={1}
                    cellThickness={0.3}
                    cellColor="#0a2540"
                    sectionSize={5}
                    sectionThickness={0.6}
                    sectionColor="#0e7490"
                    fadeDistance={28}
                    infiniteGrid
                />

                {Array.from({ length: 7 }).map((_, i) => (
                    <CyberTree3D key={i} position={[ox + i * sp, 0, 0]} isActive={i === currentDayIndex} />
                ))}

                <EffectComposer enableNormalPass={false}>
                    <Bloom luminanceThreshold={0.25} mipmapBlur intensity={1.4} radius={0.4} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default Scene3D;
