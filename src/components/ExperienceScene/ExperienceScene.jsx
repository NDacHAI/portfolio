import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BoxGeometry, EdgesGeometry, MathUtils } from "three";
import { prefersReducedMotion } from "../../utils/motion";

const COLOR = "#e2e8f0";
const LAYER_Y = [1.3, 0, -1.3]; // UI, API, Database
const LAYER_SIZE = [2.6, 0.18, 1.8];

// Small packets travelling between layers, like requests and responses
const packets = [
    { x: -0.8, z: 0.4, speed: 0.5, offset: 0 },
    { x: 0.6, z: -0.3, speed: 0.4, offset: 0.35 },
    { x: 0.1, z: 0.6, speed: 0.6, offset: 0.7 },
    { x: -0.3, z: -0.6, speed: 0.45, offset: 0.15 },
    { x: 0.9, z: 0.5, speed: 0.55, offset: 0.55 },
];

const Stack = ({ animate }) => {
    const group = useRef();
    const layers = useRef([]);
    const packetRefs = useRef([]);
    const edges = useMemo(() => new EdgesGeometry(new BoxGeometry(...LAYER_SIZE)), []);
    const top = LAYER_Y[0];
    const bottom = LAYER_Y[LAYER_Y.length - 1];

    useFrame(({ clock, pointer }, delta) => {
        if (!animate) return;
        const t = clock.getElapsedTime();
        group.current.rotation.y += delta * 0.25;
        group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, 0.35 + pointer.y * 0.15, 0.05);

        // Layers breathe apart slightly
        layers.current.forEach((layer, i) => {
            layer.position.y = LAYER_Y[i] * (1 + Math.sin(t * 0.8) * 0.06);
        });

        // Packets loop from top to bottom and back
        packetRefs.current.forEach((mesh, i) => {
            const p = packets[i];
            const phase = (t * p.speed + p.offset) % 2;
            const progress = phase < 1 ? phase : 2 - phase;
            mesh.position.y = MathUtils.lerp(top, bottom, progress);
        });
    });

    return (
        <group ref={group} rotation={[0.35, 0.6, 0]}>
            {LAYER_Y.map((y, i) => (
                <group key={y} ref={(el) => (layers.current[i] = el)} position={[0, y, 0]}>
                    <lineSegments geometry={edges}>
                        <lineBasicMaterial color={COLOR} />
                    </lineSegments>
                    <mesh>
                        <boxGeometry args={LAYER_SIZE} />
                        <meshBasicMaterial color={COLOR} transparent opacity={0.06} />
                    </mesh>
                </group>
            ))}

            {packets.map((p, i) => (
                <mesh key={i} ref={(el) => (packetRefs.current[i] = el)} position={[p.x, top, p.z]}>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshBasicMaterial color={COLOR} />
                </mesh>
            ))}

            {/* Vertical guide lines between layers */}
            {packets.map((p, i) => (
                <mesh key={`line-${i}`} position={[p.x, 0, p.z]}>
                    <cylinderGeometry args={[0.004, 0.004, top - bottom, 4]} />
                    <meshBasicMaterial color={COLOR} transparent opacity={0.2} />
                </mesh>
            ))}
        </group>
    );
};

const ExperienceScene = () => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    const animate = !prefersReducedMotion();

    // Only render frames while the section is on screen
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="h-full w-full">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true }}
                frameloop={animate && inView ? "always" : "demand"}
            >
                <Stack animate={animate} />
            </Canvas>
        </div>
    );
};

export default ExperienceScene;
