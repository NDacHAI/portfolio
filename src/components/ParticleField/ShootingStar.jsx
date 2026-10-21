import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, NormalBlending } from "three";

// Trail length and thickness in world units, at a fixed distance in front of the camera
const LENGTH = 2.5;
const THICKNESS = 0.035;
const DISTANCE = 10;

// Faint tail on the left fading into a bright head on the right
const createTrailTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    const tail = ctx.createLinearGradient(0, 0, 256, 0);
    tail.addColorStop(0, "rgba(255,255,255,0)");
    tail.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = tail;
    ctx.fillRect(0, 4, 256, 8);
    const head = ctx.createRadialGradient(248, 8, 0, 248, 8, 8);
    head.addColorStop(0, "rgba(255,255,255,1)");
    head.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = head;
    ctx.fillRect(232, 0, 24, 16);
    return new CanvasTexture(canvas);
};

const nextDelay = () => 5 + Math.random() * 9;

const ShootingStar = ({ theme, animate }) => {
    const mesh = useRef();
    const texture = useMemo(createTrailTexture, []);
    const state = useRef({ active: false, wait: 3 + Math.random() * 4 });
    const dark = theme === "dark";

    const launch = (s) => {
        // Diagonal path heading down-left or down-right across the upper half
        const toRight = Math.random() < 0.5;
        const angle = 0.25 + Math.random() * 0.35;
        s.dx = Math.cos(angle) * (toRight ? 1 : -1);
        s.dy = -Math.sin(angle);
        s.x = (toRight ? -7 : 1) + Math.random() * 6;
        s.y = 1 + Math.random() * 3;
        s.distance = 7 + Math.random() * 3;
        s.duration = 0.8 + Math.random() * 0.5;
        s.progress = 0;
        s.active = true;
        mesh.current.rotation.z = Math.atan2(s.dy, s.dx);
    };

    useFrame(({ camera }, delta) => {
        const s = state.current;
        const m = mesh.current;
        if (!animate) return;

        if (!s.active) {
            s.wait -= delta;
            m.visible = false;
            if (s.wait > 0) return;
            launch(s);
        }

        s.progress += delta / s.duration;
        if (s.progress >= 1) {
            s.active = false;
            s.wait = nextDelay();
            m.visible = false;
            return;
        }

        // Head travels along the path; the mesh is centred half a trail behind it
        const travel = s.progress * s.distance - LENGTH / 2;
        m.visible = true;
        m.position.set(
            camera.position.x + s.x + s.dx * travel,
            camera.position.y + s.y + s.dy * travel,
            camera.position.z - DISTANCE
        );
        m.material.opacity = Math.sin(Math.PI * s.progress);
    });

    return (
        <mesh ref={mesh} scale={[LENGTH, THICKNESS, 1]} visible={false}>
            <planeGeometry />
            <meshBasicMaterial
                map={texture}
                color={dark ? "#ffffff" : "#475569"}
                transparent
                opacity={0}
                depthWrite={false}
                blending={dark ? AdditiveBlending : NormalBlending}
            />
        </mesh>
    );
};

export default ShootingStar;
