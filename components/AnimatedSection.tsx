import React, { useState, useEffect } from 'react';

// Hook for scroll animations
export function useInView(options = { threshold: 0.1, rootMargin: '0px' }, triggerOnce = false) {
    const [ref, setRef] = useState<HTMLDivElement | null>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!ref) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                if (triggerOnce) observer.disconnect();
            } else {
                if (!triggerOnce) setIsInView(false);
            }
        }, options);

        observer.observe(ref);

        // Fallback: Force visible after 100ms to ensure content shows even if observer fails
        const timeout = setTimeout(() => {
            setIsInView(true);
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, [ref, options.threshold, options.rootMargin, triggerOnce]);

    return [setRef, isInView] as const;
}

interface AnimatedSectionProps {
    children: React.ReactNode | ((props: { isInView: boolean }) => React.ReactNode);
    className?: string;
    delay?: number;
    triggerOnce?: boolean;
    animateContainer?: boolean;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
    children,
    className = "",
    delay = 0,
    triggerOnce = false,
    animateContainer = true
}) => {
    const [ref, isInView] = useInView({ threshold: 0.1, rootMargin: '0px' }, triggerOnce);

    const containerClasses = animateContainer
        ? `transition-all duration-1000 ease-out transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`
        : '';

    return (
        <div
            ref={ref}
            className={`${containerClasses} ${className}`}
            style={animateContainer ? { transitionDelay: `${delay}ms` } : {}}
        >
            {typeof children === 'function'
                ? children({ isInView })
                : React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, { isInView });
                    }
                    return child;
                })
            }
        </div>
    );
};

export default AnimatedSection;
