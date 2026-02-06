import React from "react";
import { motion } from "framer-motion";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
    children,
    className = "",
    spotlightColor = "rgba(255, 255, 255, 0.05)",
    ...props
}) => {
    return (
        <div className={`relative overflow-hidden rounded-3xl bg-card shadow-lg border border-slate-800 ${className}`} {...props}>
            {/* Optional Spotlight - made extremely subtle/native feel or removed for strict HIG. Keeping specific to "TrueTrack" identity but toning it down. */}
            <motion.div
                className="pointer-events-none absolute -inset-full opacity-0 dark:opacity-30" // Only visible in dark mode for "glow" effect
                animate={{
                    x: ["-25%", "25%", "-25%"],
                    y: ["-25%", "25%", "-25%"],
                }}
                transition={{
                    duration: 15,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                style={{
                    background: `radial-gradient(circle at center, ${spotlightColor}, transparent 70%)`,
                }}
            />
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
};
