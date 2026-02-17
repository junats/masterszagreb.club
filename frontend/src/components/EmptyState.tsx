import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    ctaLabel?: string;
    onCtaClick?: () => void;
    iconColor?: string;
    iconBg?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    ctaLabel,
    onCtaClick,
    iconColor = 'text-slate-500',
    iconBg = 'bg-slate-800/50',
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
        >
            <div className={`${iconBg} p-4 rounded-2xl mb-4 border border-white/5`}>
                <Icon size={28} className={`${iconColor} opacity-60`} />
            </div>
            <h4 className="text-sm font-semibold text-white/80 mb-1">{title}</h4>
            <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed mb-4">{description}</p>
            {ctaLabel && onCtaClick && (
                <button
                    onClick={onCtaClick}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/20 transition-all active:scale-95"
                >
                    {ctaLabel}
                </button>
            )}
        </motion.div>
    );
};
