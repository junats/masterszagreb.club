import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion, useInView } from "framer-motion";

interface CountUpProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
    duration?: number;
}

export const CountUp: React.FC<CountUpProps> = ({
    value,
    prefix = "",
    suffix = "",
    decimals = 0,
    className = "",
    duration = 1.5,
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.5 }); // Restart every time
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
        duration: duration * 1000,
    });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        } else {
            motionValue.set(0);
        }
    }, [isInView, value, motionValue]);

    const displayValue = useTransform(springValue, (latest) => {
        return `${prefix}${latest.toFixed(decimals)}${suffix}`;
    });

    return <motion.span ref={ref} className={`tabular-nums ${className}`}>{displayValue}</motion.span>;
};
