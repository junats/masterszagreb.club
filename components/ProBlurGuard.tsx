
import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProBlurGuardProps {
    children: React.ReactNode;
    isPro: boolean;
    onClick: () => void;
    blurIntensity?: 'sm' | 'md' | 'lg' | 'xl';
    label?: string;
    className?: string; // Allow passing standard classNames
    visualStyle?: 'full' | 'simple';
}

export const ProBlurGuard: React.FC<ProBlurGuardProps> = ({
    children,
    isPro,
    onClick,
    blurIntensity = 'md',
    label = 'Pro Feature',
    className = '',
    visualStyle = 'full'
}) => {
    if (isPro) {
        return <>{children}</>;
    }

    const blurClass = {
        'sm': 'blur-[2px]',
        'md': 'blur-[3px]',
        'lg': 'blur-sm',
        'xl': 'blur-md'
    }[blurIntensity];

    return (
        <div className={`relative group overflow-hidden ${className}`}>
            {/* Blurred Content */}
            <div className={`transition-all duration-500 ease-in-out ${blurClass} opacity-60 pointer-events-none select-none grayscale-[0.5] overflow-hidden rounded-[inherit]`}>
                {children}
            </div>

            {/* Lock Overlay */}
            <motion.button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute inset-0 z-50 bg-slate-900/10 hover:bg-slate-900/20 transition-colors cursor-pointer rounded-[inherit]"
            >
                <div className="h-full w-full relative">
                    <div className="sticky top-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-4">
                        {visualStyle === 'full' ? (
                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <div className="p-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
                                    <Lock size={20} className="fill-white/20" />
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-0.5">{label}</span>
                                    <span className="text-xs text-indigo-300 font-medium">Tap to Unlock</span>
                                </div>
                            </div>
                        ) : (
                            // Simple = Invisible clickable area (Just blur)
                            null
                        )}
                    </div>
                </div>
            </motion.button>
        </div>
    );
};
