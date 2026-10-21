import useTilt from "../../hooks/useTilt";

// Card that tilts toward the cursor with a glare that follows it
const TiltCard = ({ as = "div", maxTilt = 10, className = "", children }) => {
    const Tag = as;
    const tilt = useTilt(maxTilt);

    return (
        <Tag
            {...tilt}
            className={`group relative transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl will-change-transform ${className}`}
        >
            <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(17,24,39,0.08),transparent_45%)] dark:bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.12),transparent_45%)]" />
            {children}
        </Tag>
    );
};

export default TiltCard;
