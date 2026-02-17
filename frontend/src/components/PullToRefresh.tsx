import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowDown, Loader2 } from 'lucide-react';
import { HapticsService } from '../services/haptics';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    threshold?: number;
    disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    threshold = 60,
    disabled = false,
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasCrossedThreshold, setHasCrossedThreshold] = useState(false);
    const touchStartY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pullDistance = useMotionValue(0);

    const indicatorOpacity = useTransform(pullDistance, [0, threshold * 0.3, threshold], [0, 0.5, 1]);
    const indicatorScale = useTransform(pullDistance, [0, threshold], [0.6, 1]);
    const arrowRotation = useTransform(pullDistance, [0, threshold], [0, 180]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;
        const scrollTop = scrollRef.current?.scrollTop ?? 0;
        if (scrollTop <= 0) {
            touchStartY.current = e.touches[0].clientY;
        } else {
            touchStartY.current = 0;
        }
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing || touchStartY.current === 0) return;
        const scrollTop = scrollRef.current?.scrollTop ?? 0;
        if (scrollTop > 0) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;

        if (diff > 0) {
            // Dampen the pull (feels more native)
            const dampened = Math.min(diff * 0.4, threshold * 1.5);
            pullDistance.set(dampened);

            if (dampened >= threshold && !hasCrossedThreshold) {
                setHasCrossedThreshold(true);
                HapticsService.selection();
            } else if (dampened < threshold && hasCrossedThreshold) {
                setHasCrossedThreshold(false);
            }
        }
    }, [disabled, isRefreshing, threshold, hasCrossedThreshold, pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        if (disabled || isRefreshing) return;
        const currentPull = pullDistance.get();

        if (currentPull >= threshold) {
            setIsRefreshing(true);
            animate(pullDistance, threshold * 0.6, { duration: 0.2 });
            HapticsService.notificationSuccess();

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setHasCrossedThreshold(false);
                animate(pullDistance, 0, { duration: 0.3, ease: 'easeOut' });
            }
        } else {
            setHasCrossedThreshold(false);
            animate(pullDistance, 0, { duration: 0.25, ease: 'easeOut' });
        }

        touchStartY.current = 0;
    }, [disabled, isRefreshing, threshold, pullDistance, onRefresh]);

    const contentY = useTransform(pullDistance, (v) => Math.max(0, v));

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Pull Indicator */}
            <motion.div
                className="absolute top-0 left-0 right-0 flex items-center justify-center z-20 pointer-events-none"
                style={{
                    opacity: indicatorOpacity,
                    height: pullDistance,
                }}
            >
                <motion.div
                    className="flex items-center justify-center"
                    style={{ scale: indicatorScale }}
                >
                    {isRefreshing ? (
                        <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Loader2 size={16} className="text-blue-400 animate-spin" />
                        </div>
                    ) : (
                        <motion.div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-sm transition-colors duration-200 ${hasCrossedThreshold
                                    ? 'bg-blue-500/20 border-blue-500/30'
                                    : 'bg-slate-800/80 border-white/10'
                                }`}
                            style={{ rotate: arrowRotation }}
                        >
                            <ArrowDown size={16} className={`transition-colors duration-200 ${hasCrossedThreshold ? 'text-blue-400' : 'text-slate-400'
                                }`} />
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
                ref={scrollRef}
                className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar"
                style={{ y: contentY }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </motion.div>
        </div>
    );
};
