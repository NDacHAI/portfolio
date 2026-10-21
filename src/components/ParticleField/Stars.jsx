import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, MathUtils, NormalBlending, Vector2 } from "three";

// Pull strength at the cursor (0 to 1) and reach as a fraction of viewport height
const PULL_STRENGTH = 0.8;
const PULL_RADIUS = 0.25;

// White, blue, warm yellow, pale purple, with how often each appears
const PALETTES = {
    dark: ["#ffffff", "#a8c8ff", "#ffd8a8", "#d6c2ff"],
    light: ["#334155", "#2f5bb7", "#a16207", "#6d4bb8"],
};
const TINT_WEIGHTS = [0.35, 0.25, 0.22, 0.18];

const pickTint = () => {
    let r = Math.random();
    for (let i = 0; i < TINT_WEIGHTS.length; i++) {
        r -= TINT_WEIGHTS[i];
        if (r <= 0) return i;
    }
    return 0;
};

// Stars spread through the camera's view from near to far, so each depth fills the screen
const createStars = (count) => {
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const glow = new Float32Array(count);
    const bright = new Float32Array(count);
    const tint = new Float32Array(count);
    const twinkle = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
        const z = MathUtils.lerp(2, -60, Math.random());
        const spread = (10 - z) * 1.5;
        position[i * 3] = (Math.random() * 2 - 1) * spread;
        position[i * 3 + 1] = (Math.random() * 2 - 1) * spread;
        position[i * 3 + 2] = z;

        // Steep curve: most stars small and dim, a few large and bright
        const big = Math.random() ** 6;
        const far = (2 - z) / 62;
        size[i] = 1.5 + big * 2.4;
        glow[i] = MathUtils.smoothstep(big, 0.35, 1);
        bright[i] = (0.4 + 0.6 * Math.sqrt(big)) * MathUtils.lerp(1, 0.7, far);
        tint[i] = pickTint();
        twinkle[i * 2] = 0.6 + Math.random() * 2;
        twinkle[i * 2 + 1] = Math.random() * Math.PI * 2;
    }
    return { position, size, glow, bright, tint, twinkle };
};

const vertexShader = /* glsl */ `
    attribute float aSize;
    attribute float aGlow;
    attribute float aBright;
    attribute float aTint;
    attribute vec2 aTwinkle;

    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uGlowScale;
    uniform vec3 uPalette[4];
    uniform vec2 uMouse;
    uniform float uAspect;
    uniform float uPull;

    varying vec3 vColor;
    varying float vAlpha;
    varying float vGlow;
    varying float vCoreR;

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        // Pull stars on screen toward the cursor, after projection so rotation doesn't matter
        vec2 ndc = gl_Position.xy / gl_Position.w;
        vec2 diff = (uMouse - ndc) * vec2(uAspect, 1.0);
        float falloff = 1.0 - smoothstep(0.0, ${(PULL_RADIUS * 2).toFixed(2)}, length(diff));
        ndc += (uMouse - ndc) * falloff * uPull;
        gl_Position.xy = ndc * gl_Position.w;

        // Bright stars get a larger sprite to make room for the halo and spikes
        vGlow = aGlow * uGlowScale;
        float spread = 1.0 + vGlow * 7.0;
        gl_PointSize = aSize * spread * (1.0 + falloff * uPull) * uPixelRatio;
        vCoreR = 0.5 / spread;

        float twinkle = 0.55 + 0.45 * sin(uTime * aTwinkle.x + aTwinkle.y);
        vAlpha = aBright * twinkle;
        vColor = uPalette[int(aTint)];
    }
`;

const fragmentShader = /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    varying float vGlow;
    varying float vCoreR;

    void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);

        float core = exp(-pow(d / vCoreR, 2.0) * 1.5);
        float halo = 0.35 * vGlow * exp(-d / (vCoreR * 2.5));
        // Thin cross-shaped spikes that fade out toward the sprite edge
        float w = vCoreR * 0.25;
        float spikes = 0.8 * vGlow * (
            exp(-abs(p.y) / w) * (1.0 - smoothstep(0.0, 0.5, abs(p.x))) +
            exp(-abs(p.x) / w) * (1.0 - smoothstep(0.0, 0.5, abs(p.y)))
        );

        float alpha = clamp((core + halo + spikes) * vAlpha, 0.0, 1.0);
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(vColor, alpha);
    }
`;

const Stars = ({ count, theme, animate, mouse }) => {
    const stars = useMemo(() => createStars(count), [count]);
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uPixelRatio: { value: 1 },
            uGlowScale: { value: 1 },
            uPalette: { value: PALETTES.dark.map((c) => new Color(c)) },
            uMouse: { value: new Vector2() },
            uAspect: { value: 1 },
            uPull: { value: 0 },
        }),
        []
    );

    // Theme only swaps uniforms, so the stars keep their positions
    const dark = theme === "dark";
    PALETTES[dark ? "dark" : "light"].forEach((c, i) => uniforms.uPalette.value[i].set(c));
    uniforms.uGlowScale.value = dark ? 1 : 0.4;

    useFrame(({ size, viewport }, delta) => {
        uniforms.uPixelRatio.value = viewport.dpr;
        uniforms.uAspect.value = size.width / size.height;
        if (!animate) return;
        uniforms.uTime.value += delta;
        // Ease the pull point and strength so the cluster trails the cursor smoothly
        const m = mouse.current;
        uniforms.uMouse.value.lerp(m, 0.15);
        uniforms.uPull.value = MathUtils.lerp(uniforms.uPull.value, m.active ? PULL_STRENGTH : 0, 0.08);
    });

    return (
        <points frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[stars.position, 3]} />
                <bufferAttribute attach="attributes-aSize" args={[stars.size, 1]} />
                <bufferAttribute attach="attributes-aGlow" args={[stars.glow, 1]} />
                <bufferAttribute attach="attributes-aBright" args={[stars.bright, 1]} />
                <bufferAttribute attach="attributes-aTint" args={[stars.tint, 1]} />
                <bufferAttribute attach="attributes-aTwinkle" args={[stars.twinkle, 2]} />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={dark ? AdditiveBlending : NormalBlending}
            />
        </points>
    );
};

export default Stars;
