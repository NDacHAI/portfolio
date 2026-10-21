// Shared checks for interactive / animated effects
export const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// True for mouse / trackpad, false for touch screens
export const hasFinePointer = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
