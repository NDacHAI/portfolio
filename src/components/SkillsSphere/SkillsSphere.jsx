import { useEffect, useMemo, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { prefersReducedMotion } from "../../utils/motion";

const AUTO_SPEED = 0.004;
const AUTO_TILT_SPEED = 0.0015;

// Spread points evenly over a unit sphere (Fibonacci sphere)
const spherePoints = (count) => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: count }, (_, i) => {
        // Half-step offset keeps the first and last items off the poles
        const y = 1 - ((i + 0.5) / count) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = i * golden;
        return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });
};

const SkillsSphere = ({ skills, selected, onSelect }) => {
    const containerRef = useRef(null);
    const tagRefs = useRef([]);
    const draggedRef = useRef(false);
    const points = useMemo(() => spherePoints(skills.length), [skills.length]);

    useEffect(() => {
        const container = containerRef.current;
        const reduced = prefersReducedMotion();
        const rotation = { x: 0.3, y: 0 };
        const velocity = { x: reduced ? 0 : AUTO_TILT_SPEED, y: reduced ? 0 : AUTO_SPEED };
        let drag = null;
        let hovering = false;
        let frame;

        const render = () => {
            const radius = Math.min(container.clientWidth, container.clientHeight) / 2 - 50;
            const cosX = Math.cos(rotation.x), sinX = Math.sin(rotation.x);
            const cosY = Math.cos(rotation.y), sinY = Math.sin(rotation.y);

            points.forEach((p, i) => {
                const tag = tagRefs.current[i];
                if (!tag) return;
                // Rotate around Y, then around X
                const x1 = p.x * cosY + p.z * sinY;
                const z1 = -p.x * sinY + p.z * cosY;
                const y2 = p.y * cosX - z1 * sinX;
                const z2 = p.y * sinX + z1 * cosX;

                const depth = (z2 + 1) / 2; // 0 = back, 1 = front
                tag.style.transform = `translate(-50%, -50%) translate(${x1 * radius}px, ${y2 * radius}px) scale(${0.6 + depth * 0.5})`;
                tag.style.opacity = 0.25 + depth * 0.75;
                tag.style.zIndex = Math.round(depth * 100);
            });
        };

        const tick = () => {
            if (!drag) {
                // Ease back toward the idle spin after a drag
                const target = reduced ? 0 : hovering ? AUTO_SPEED / 4 : AUTO_SPEED;
                velocity.y += (target - velocity.y) * 0.03;
                const targetX = reduced ? 0 : hovering ? AUTO_TILT_SPEED / 4 : AUTO_TILT_SPEED;
                velocity.x += (targetX - velocity.x) * 0.03;
            }
            rotation.x += velocity.x;
            rotation.y += velocity.y;
            render();
            frame = requestAnimationFrame(tick);
        };

        const handleDown = (e) => {
            drag = { x: e.clientX, y: e.clientY };
            draggedRef.current = false;
        };
        const handleMove = (e) => {
            if (!drag) return;
            if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 3) draggedRef.current = true;
            velocity.y = (e.clientX - drag.x) * 0.003;
            velocity.x = (e.clientY - drag.y) * 0.003;
            drag = { x: e.clientX, y: e.clientY };
        };
        const handleUp = () => {
            drag = null;
        };
        const handleEnter = () => (hovering = true);
        const handleLeave = () => (hovering = false);

        container.addEventListener("pointerdown", handleDown);
        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        container.addEventListener("pointerenter", handleEnter);
        container.addEventListener("pointerleave", handleLeave);
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            container.removeEventListener("pointerdown", handleDown);
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
            container.removeEventListener("pointerenter", handleEnter);
            container.removeEventListener("pointerleave", handleLeave);
        };
    }, [points]);

    return (
        <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-[520px] h-[340px] sm:h-[460px] cursor-grab active:cursor-grabbing select-none touch-pan-y"
        >
            {skills.map((skill, i) => (
                <button
                    key={skill.title}
                    ref={(el) => (tagRefs.current[i] = el)}
                    onClick={() => !draggedRef.current && onSelect(skill.type)}
                    title={skill.content}
                    className={`absolute left-1/2 top-1/2 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border transition-[scale,background-color,color] duration-200 hover:scale-125 cursor-pointer
                        ${skill.type === selected
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                            : "bg-white text-gray-900 border-gray-900 dark:bg-gray-900 dark:text-white dark:border-white"
                        }`}
                >
                    <FontAwesomeIcon icon={skill.icon} />
                    <span>{skill.title}</span>
                </button>
            ))}
        </div>
    );
};

export default SkillsSphere;
