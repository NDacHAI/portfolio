import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, NormalBlending } from "three";

// Far behind the stars so they barely move with the cursor
const CLOUDS = [
    { color: "#4f46e5", position: [-30, 12, -45], scale: 70 },
    { color: "#7c3aed", position: [28, -8, -50], scale: 80 },
    { color: "#2563eb", position: [6, 22, -55], scale: 60 },
    { color: "#a855f7", position: [-12, -20, -48], scale: 55 },
];

// A few overlapping soft blobs so each cloud has an irregular shape
const createCloudTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i++) {
        const x = 64 + Math.random() * 128;
        const y = 64 + Math.random() * 128;
        const r = 40 + Math.random() * 70;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, "rgba(255,255,255,0.35)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
    }
    return new CanvasTexture(canvas);
};

const Cloud = ({ color, position, scale, index, theme, animate }) => {
    const mesh = useRef();
    const texture = useMemo(createCloudTexture, []);
    const dark = theme === "dark";

    useFrame(({ clock }, delta) => {
        if (!animate) return;
        // Very slow drift around the starting point
        const t = clock.elapsedTime * 0.03 + index * 1.7;
        mesh.current.position.x = position[0] + Math.sin(t) * 4;
        mesh.current.position.y = position[1] + Math.cos(t * 0.8) * 3;
        mesh.current.rotation.z += delta * 0.004 * (index % 2 ? 1 : -1);
    });

    return (
        <mesh ref={mesh} position={position} scale={scale}>
            <planeGeometry />
            <meshBasicMaterial
                map={texture}
                color={color}
                transparent
                opacity={dark ? 0.07 : 0.06}
                depthWrite={false}
                blending={dark ? AdditiveBlending : NormalBlending}
            />
        </mesh>
    );
};

const Nebula = ({ theme, animate }) =>
    CLOUDS.map((cloud, i) => (
        <Cloud key={i} index={i} {...cloud} theme={theme} animate={animate} />
    ));

export default Nebula;
