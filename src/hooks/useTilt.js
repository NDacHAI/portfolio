import { useRef } from "react";
import { prefersReducedMotion } from "../utils/motion";

// Tilts an element toward the cursor and exposes --gx / --gy for a glare overlay
const useTilt = (maxTilt = 8) => {
    const ref = useRef(null);

    const onMouseMove = (e) => {
        if (prefersReducedMotion()) return;
        const el = ref.current;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * maxTilt}deg) rotateY(${(x - 0.5) * maxTilt}deg)`;
        el.style.setProperty("--gx", `${x * 100}%`);
        el.style.setProperty("--gy", `${y * 100}%`);
    };

    const onMouseLeave = () => {
        ref.current.style.transform = "";
    };

    return { ref, onMouseMove, onMouseLeave };
};

export default useTilt;
