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
    spotlightColor = "rgba(56, 189, 248, 0.1)", // Slightly more subtle default
    ...props
}) => {
    return (
        <div className={`relative overflow-hidden ${className}`} {...props}>
            {/* Subtle Auto-Animating Spotlight */}
            <motion.div
                className="pointer-events-none absolute -inset-full opacity-50"
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
