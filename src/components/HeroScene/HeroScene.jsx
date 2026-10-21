import { useContext, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { ThemeContext } from "../../context/ThemeContext";
import { prefersReducedMotion } from "../../utils/motion";

// Shards that orbit around the avatar
const shards = [
    { position: [-2.3, 1.3, -0.5], scale: 0.22, speed: 1.6 },
    { position: [2.4, 0.9, -0.3], scale: 0.16, speed: 2.1 },
    { position: [-2.1, -1.4, 0.2], scale: 0.14, speed: 1.8 },
    { position: [2.2, -1.5, -0.6], scale: 0.2, speed: 1.4 },
];

const Shapes = ({ color, animate }) => {
    const group = useRef();
    const ico = useRef();
    const ring = useRef();
    const shardRefs = useRef([]);
    const pointer = useRef({ x: 0, y: 0 });

    // Track the mouse over the whole window, the canvas sits behind the avatar
    useEffect(() => {
        const handleMove = (e) => {
            pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    useFrame(({ clock }, delta) => {
        if (!animate) return;
        const t = clock.getElapsedTime();
        ico.current.rotation.y += delta * 0.15;
        ico.current.rotation.x += delta * 0.05;
        ring.current.rotation.z += delta * 0.2;

        group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, pointer.current.x * 0.4, 0.05);
        group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, pointer.current.y * 0.3, 0.05);

        // Bob and spin each shard at its own speed
        shardRefs.current.forEach((mesh, i) => {
            const s = shards[i];
            mesh.position.y = s.position[1] + Math.sin(t * s.speed + i) * 0.15;
            mesh.rotation.x += delta * s.speed * 0.4;
            mesh.rotation.y += delta * s.speed * 0.3;
        });
    });

    return (
        <group ref={group}>
            <mesh ref={ico}>
                <icosahedronGeometry args={[2.25, 1]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
            </mesh>

            <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
                <torusGeometry args={[2.05, 0.012, 16, 128]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>

            {shards.map((s, i) => (
                <mesh
                    key={i}
                    ref={(el) => (shardRefs.current[i] = el)}
                    position={s.position}
                    scale={s.scale}
                >
                    <octahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial color={color} wireframe />
                </mesh>
            ))}
        </group>
    );
};

const HeroScene = () => {
    const { theme } = useContext(ThemeContext);
    const color = theme === "dark" ? "#e5e7eb" : "#111827";
    const animate = !prefersReducedMotion();

    return (
        <Canvas
            camera={{ position: [0, 0, 6], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            frameloop={animate ? "always" : "demand"}
        >
            <Shapes color={color} animate={animate} />
        </Canvas>
    );
};

export default HeroScene;
