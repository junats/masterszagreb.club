import React from 'react';
import { motion } from 'framer-motion';
import { SkeletonPulse } from './SkeletonPulse';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 }
};

export const DashboardSkeleton: React.FC = () => {
    return (
        <motion.div
            className="w-full h-full pt-2 px-4 pb-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="pt-0 pb-32 space-y-4">

                {/* Budget Card Skeleton */}
                <motion.div variants={itemVariants} className="rounded-3xl border border-slate-800 bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <SkeletonPulse className="h-4 w-24" />
                        <div className="flex gap-1">
                            <SkeletonPulse className="h-7 w-12 rounded-lg" />
                            <SkeletonPulse className="h-7 w-12 rounded-lg" />
                            <SkeletonPulse className="h-7 w-12 rounded-lg" />
                        </div>
                    </div>
                    <SkeletonPulse className="h-10 w-40 mb-2" />
                    <SkeletonPulse className="h-3 w-full rounded-full mb-4" />
                    <div className="flex gap-8">
                        <div>
                            <SkeletonPulse className="h-3 w-16 mb-1" />
                            <SkeletonPulse className="h-5 w-20" />
                        </div>
                        <div>
                            <SkeletonPulse className="h-3 w-16 mb-1" />
                            <SkeletonPulse className="h-5 w-20" />
                        </div>
                    </div>
                    {/* Suggestion skeleton */}
                    <div className="border-t border-white/10 mt-3 pt-3">
                        <div className="flex items-start gap-3">
                            <SkeletonPulse className="h-8 w-8 rounded-lg shrink-0" />
                            <div className="flex-1">
                                <SkeletonPulse className="h-3 w-full mb-1" />
                                <SkeletonPulse className="h-3 w-3/4" />
                            </div>
                        </div>
                    </div>
                    {/* Pie chart skeleton */}
                    <div className="border-t border-white/5 mt-4 pt-4 flex items-center gap-6">
                        <SkeletonPulse className="h-28 w-28 rounded-full shrink-0" />
                        <div className="flex-1 space-y-3">
                            <SkeletonPulse className="h-3 w-full" />
                            <SkeletonPulse className="h-3 w-4/5" />
                            <SkeletonPulse className="h-3 w-3/5" />
                            <SkeletonPulse className="h-3 w-2/5" />
                        </div>
                    </div>
                </motion.div>

                {/* Bento Grid Skeleton */}
                <div className="grid grid-cols-1 gap-3">

                    {/* Chart Skeleton */}
                    <motion.div variants={itemVariants} className="rounded-3xl border border-slate-800 bg-card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <SkeletonPulse className="h-4 w-4 rounded" />
                                <SkeletonPulse className="h-4 w-20" />
                            </div>
                            <div className="flex gap-1">
                                <SkeletonPulse className="h-6 w-10 rounded-lg" />
                                <SkeletonPulse className="h-6 w-10 rounded-lg" />
                                <SkeletonPulse className="h-6 w-10 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2 h-[200px] pt-4">
                            {[40, 65, 30, 80, 55, 45, 70].map((h, i) => (
                                <SkeletonPulse key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` } as any} />
                            ))}
                        </div>
                    </motion.div>

                    {/* Categories Skeleton */}
                    <motion.div variants={itemVariants} className="rounded-3xl border border-slate-800 bg-card p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <SkeletonPulse className="h-8 w-8 rounded-xl" />
                            <SkeletonPulse className="h-4 w-28" />
                        </div>
                        <div className="space-y-4">
                            {[85, 60, 40, 25].map((w, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-1">
                                        <SkeletonPulse className="h-3 w-20" />
                                        <SkeletonPulse className="h-3 w-12" />
                                    </div>
                                    <SkeletonPulse className="h-2 rounded-full" style={{ width: `${w}%` } as any} />
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Vendors Skeleton */}
                    <motion.div variants={itemVariants} className="rounded-3xl border border-slate-800 bg-card p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <SkeletonPulse className="h-8 w-8 rounded-xl" />
                            <SkeletonPulse className="h-4 w-24" />
                        </div>
                        <div className="space-y-4">
                            {[70, 50, 35].map((w, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-1">
                                        <SkeletonPulse className="h-3 w-24" />
                                        <SkeletonPulse className="h-3 w-14" />
                                    </div>
                                    <SkeletonPulse className="h-2 rounded-full" style={{ width: `${w}%` } as any} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};
