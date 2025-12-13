import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

interface AnimatedSectionProps {
    children: React.ReactNode | ((props: { isInView: boolean }) => React.ReactNode);
    className?: string;
    delay?: number;
    triggerOnce?: boolean;
    variants?: Variants;
    threshold?: number;
    noSlide?: boolean;
}

const defaultVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] // Custom easeOutCubic-like curve
        }
    }
};

const staticVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
    children,
    className = "",
    delay = 0,
    triggerOnce = false, // Default to false so it restarts when scrolling back/forth
    variants,
    threshold = 0.2,
    noSlide = false
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: triggerOnce, amount: threshold });

    const activeVariants = variants || (noSlide ? staticVariants : defaultVariants);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                ...activeVariants,
                visible: {
                    ...activeVariants.visible,
                    transition: {
                        ...(activeVariants.visible as any)?.transition,
                        delay: delay / 1000 // Convert ms to seconds for framer-motion
                    }
                }
            }}
            className={className}
        >
            {typeof children === 'function' ? children({ isInView }) : children}
        </motion.div>
    );
};

export default AnimatedSection;
