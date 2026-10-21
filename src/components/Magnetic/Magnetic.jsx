import { useEffect, useRef } from "react";
import { hasFinePointer, prefersReducedMotion } from "../../utils/motion";

// All mounted magnetic elements share one listener so only the nearest one reacts
const items = new Set();

// Distance from a point to a rect along one axis (0 when inside)
const gap = (p, min, max) => Math.max(min - p, 0, p - max);

// Untransformed rect, so the element's own offset doesn't skew the distance
const baseRect = (item) => {
    const r = item.el.getBoundingClientRect();
    // Offset currently on screen, including mid-transition
    const { m41: tx, m42: ty } = new DOMMatrix(getComputedStyle(item.el).transform);
    return {
        left: r.left - tx,
        right: r.right - tx,
        top: r.top - ty,
        bottom: r.bottom - ty,
    };
};

// Keeps this much space between a pulled element and its neighbours
const MIN_SPACE = 4;

// Free space around rect r before it would touch another magnetic element
const freeSpace = (r, rects) => {
    const space = { left: Infinity, right: Infinity, up: Infinity, down: Infinity };
    for (const o of rects) {
        const sameRow = o.top < r.bottom && o.bottom > r.top;
        const sameCol = o.left < r.right && o.right > r.left;
        if (sameRow && o.left >= r.right) space.right = Math.min(space.right, o.left - r.right);
        if (sameRow && o.right <= r.left) space.left = Math.min(space.left, r.left - o.right);
        if (sameCol && o.top >= r.bottom) space.down = Math.min(space.down, o.top - r.bottom);
        if (sameCol && o.bottom <= r.top) space.up = Math.min(space.up, r.top - o.bottom);
    }
    for (const k in space) space[k] = Math.max(space[k] - MIN_SPACE, 0);
    return space;
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const moveTo = (item, x, y) => {
    if (item.x === x && item.y === y) return;
    item.x = x;
    item.y = y;
    item.el.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
};

const handleMove = (e) => {
    let nearest = null;
    let nearestDist = Infinity;
    const rects = new Map();

    for (const item of items) {
        const r = baseRect(item);
        rects.set(item, r);
        const dist = Math.hypot(gap(e.clientX, r.left, r.right), gap(e.clientY, r.top, r.bottom));
        if (dist < item.radius && dist < nearestDist) {
            nearest = { item, r };
            nearestDist = dist;
        }
    }

    for (const item of items) {
        if (item !== nearest?.item) moveTo(item, 0, 0);
    }
    if (!nearest) return;

    const { item, r } = nearest;
    const dx = e.clientX - (r.left + r.right) / 2;
    const dy = e.clientY - (r.top + r.bottom) / 2;
    // Cap each axis so the edge stops at the cursor and never covers a neighbour
    const gx = gap(e.clientX, r.left, r.right);
    const gy = gap(e.clientY, r.top, r.bottom);
    const x = Math.sign(dx) * Math.min(Math.abs(dx * item.strength), gx || Infinity);
    const y = Math.sign(dy) * Math.min(Math.abs(dy * item.strength), gy || Infinity);
    // Never slide into a neighbouring magnetic element
    rects.delete(item);
    const space = freeSpace(r, rects.values());
    moveTo(item, clamp(x, -space.left, space.right), clamp(y, -space.up, space.down));
};

const handleLeave = () => {
    for (const item of items) moveTo(item, 0, 0);
};

// Pulls its children toward the cursor when the cursor comes close
const Magnetic = ({ children, strength = 0.35, radius = 80, className = "" }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!hasFinePointer() || prefersReducedMotion()) return;
        const item = { el: ref.current, strength, radius, x: 0, y: 0 };

        if (items.size === 0) {
            window.addEventListener("mousemove", handleMove);
            document.documentElement.addEventListener("mouseleave", handleLeave);
        }
        items.add(item);

        return () => {
            items.delete(item);
            item.el.style.transform = "";
            if (items.size === 0) {
                window.removeEventListener("mousemove", handleMove);
                document.documentElement.removeEventListener("mouseleave", handleLeave);
            }
        };
    }, [strength, radius]);

    return (
        <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`}>
            {children}
        </div>
    );
};

export default Magnetic;
