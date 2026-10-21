import { useContext, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { ThemeContext } from "../../context/ThemeContext";
import { hasFinePointer, prefersReducedMotion } from "../../utils/motion";
import Stars from "./Stars";
import Nebula from "./Nebula";
import ShootingStar from "./ShootingStar";

// How far the camera shifts with the cursor; near stars move more than far ones
const PARALLAX_X = 1.8;
const PARALLAX_Y = 1.2;

const Scene = ({ theme, count, animate }) => {
    const sky = useRef();
    const scroll = useRef(0);
    const mouse = useRef({ x: 0, y: 0, active: false });

    useEffect(() => {
        if (!animate || !hasFinePointer()) return;
        const handleMove = (e) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
            mouse.current.active = true;
        };
        const handleLeave = () => {
            mouse.current.active = false;
        };
        window.addEventListener("mousemove", handleMove, { passive: true });
        document.documentElement.addEventListener("mouseleave", handleLeave);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            document.documentElement.removeEventListener("mouseleave", handleLeave);
        };
    }, [animate]);

    useEffect(() => {
        const handleScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            scroll.current = max > 0 ? window.scrollY / max : 0;
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useFrame(({ camera }, delta) => {
        if (!animate) return;
        const m = mouse.current;
        // Slow spin of the whole sky, and the camera glides forward as the page scrolls
        sky.current.rotation.z += delta * 0.005;
        camera.position.x = MathUtils.lerp(camera.position.x, m.active ? m.x * PARALLAX_X : 0, 0.04);
        camera.position.y = MathUtils.lerp(camera.position.y, m.active ? m.y * PARALLAX_Y : 0, 0.04);
        camera.position.z = MathUtils.lerp(camera.position.z, 10 - scroll.current * 6, 0.05);
    });

    return (
        <>
            <Nebula theme={theme} animate={animate} />
            <group ref={sky}>
                <Stars count={count} theme={theme} animate={animate} mouse={mouse} />
            </group>
            <ShootingStar theme={theme} animate={animate} />
        </>
    );
};

const ParticleField = () => {
    const { theme } = useContext(ThemeContext);
    const animate = !prefersReducedMotion();
    const count = window.innerWidth < 640 ? 1000 : 3000;

    return (
        <Canvas
            camera={{ position: [0, 0, 10], fov: 60, far: 120 }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, alpha: true }}
            frameloop={animate ? "always" : "demand"}
        >
            <Scene theme={theme} count={count} animate={animate} />
        </Canvas>
    );
};

export default ParticleField;
