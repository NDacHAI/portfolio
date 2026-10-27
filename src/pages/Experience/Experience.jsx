import {
    faBriefcase,
    faBuilding,
    faCheck,
    faDatabase,
    faDiagramProject,
    faLock,
    faNetworkWired,
    faPeopleGroup,
    faServer,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FadeInSection from "../../components/FadeInSection/FadeInSection";
import SlideInSection from "../../components/SlideInSection/SlideInSection";
import { lazy, Suspense, useContext } from "react";
import useTilt from "../../hooks/useTilt";
import { ThemeContext } from "../../context/ThemeContext";

// Lazy-loaded so three.js stays out of the main bundle
const ExperienceScene = lazy(() => import("../../components/ExperienceScene/ExperienceScene"));

const workExperiences = [
    {
        icon: faBuilding,
        title: "Intern Developer",
        role: "HRM (Human Resource Management) System",
        project: "Visnam Joint Stock Company",
        period: "03/2026 - 07/2026",
        location: "Work Experience",
        responsibilities: [
            "Built RESTful APIs for organization, employee, leave, work shift and scheduling modules with ASP.NET Core & EF Core.",
            "Worked with PostgreSQL: entity relationships, validation and EF Core migrations.",
            "Implemented RBAC and permission-based authorization using ASP.NET Core Middleware.",
            "Contributed to a multi-tenant architecture with separate databases per organization.",
            "Developed employee management, shift scheduling and leave request approval workflows.",
            "Built Blazor/Razor UIs with forms, tables, validation, API integration and file uploads.",
        ],
        techStack: [".NET", "ASP.NET Core", "Blazor", "PostgreSQL", "EF Core", "REST API", "Git"],
    },
];

const responsibilityIcons = [
    faServer,
    faDatabase,
    faLock,
    faDiagramProject,
    faCheck,
    faNetworkWired,
    faBriefcase,
    faPeopleGroup,
];

// Article with its own tilt ref, so every card in the list tilts independently
const TiltArticle = ({ children, className }) => {
    const tilt = useTilt();
    return (
        <article {...tilt} className={className}>
            {children}
        </article>
    );
};

const Experience = () => {
    const { theme } = useContext(ThemeContext);

    // In dark mode the band blends with the page so the particle background shows through
    return (
        <section
            id="experience"
            className={`mx-[-1rem] ${theme === "dark" ? "bg-transparent" : "bg-slate-900"} py-14 px-4 text-white sm:mx-0 sm:px-6 lg:px-8 scroll-mt-[80px]`}
        >
            <div className="mx-auto max-w-7xl">
                <FadeInSection direction="up">
                    <div className="mb-8 flex justify-center gap-4">
                        <div className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-slate-900">
                            <FontAwesomeIcon icon={faBriefcase} />
                            <span>Work Experience</span>
                        </div>
                    </div>
                </FadeInSection>

                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
                    {workExperiences.map((item, index) => (
                        <SlideInSection
                            key={item.title}
                            direction={index % 2 === 0 ? "left" : "right"}
                        >
                            <TiltArticle
                                className="group relative h-full rounded-lg border border-white/80 bg-slate-900 p-6 text-left transition-all duration-200 ease-out hover:-translate-y-1 hover:border-white will-change-transform"
                            >
                                {/* Glare that follows the cursor */}
                                <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.12),transparent_45%)]" />
                                <div className="mb-6 flex items-start gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white text-3xl text-slate-900">
                                        <FontAwesomeIcon icon={item.icon} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold leading-tight text-white">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm font-medium text-slate-300">
                                            {item.role}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {item.period} - {item.location}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <p className="mb-2 text-sm font-bold text-white">{item.project}</p>
                                </div>

                                <div className="mb-6">
                                    <p className="mb-3 text-sm font-bold text-white">Responsibilities:</p>
                                    <ul className="space-y-3">
                                        {item.responsibilities.map((responsibility, responsibilityIndex) => (
                                            <li
                                                key={responsibility}
                                                className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                                            >
                                                <FontAwesomeIcon
                                                    icon={responsibilityIcons[responsibilityIndex] || faCheck}
                                                    className="mt-1 text-slate-300"
                                                />
                                                <span>{responsibility}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <p className="mb-3 text-sm font-bold text-white">Tech Stack:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {item.techStack.map((tech) => (
                                            <span
                                                key={tech}
                                                className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </TiltArticle>
                        </SlideInSection>
                    ))}

                    <FadeInSection direction="up">
                        <div className="h-[320px] sm:h-[420px]" aria-hidden="true">
                            <Suspense fallback={null}>
                                <ExperienceScene />
                            </Suspense>
                        </div>
                        <div className="flex justify-center gap-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
                            <span>UI</span>
                            <span>API</span>
                            <span>Database</span>
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </section>
    );
};

export default Experience;
