import React, { useMemo } from 'react';

interface AmbientBackgroundProps {
    spendRatio: number; // 0 to 1 (or > 1)
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ spendRatio }) => {
    // Determine state based on spend ratio
    const state = useMemo(() => {
        if (spendRatio >= 0.9) return 'critical';
        if (spendRatio >= 0.75) return 'warning';
        return 'healthy';
    }, [spendRatio]);

    // Configuration for each state
    const config = {
        healthy: {
            // Emerald/Teal - Slow, calm
            base: 'bg-emerald-900/50',
            primary: 'bg-emerald-500/30',
            secondary: 'bg-teal-500/30',
            duration: 'duration-[10s]',
            pulse: ''
        },
        warning: {
            // Amber/Indigo - Medium speed, alert
            base: 'bg-amber-900/50',
            primary: 'bg-amber-500/30',
            secondary: 'bg-indigo-500/30',
            duration: 'duration-[6s]',
            pulse: ''
        },
        critical: {
            // Red/Purple - Fast, urgent pulse
            base: 'bg-red-900/50',
            primary: 'bg-red-600/40',
            secondary: 'bg-purple-600/40',
            duration: 'duration-[3s]',
            pulse: 'animate-pulse'
        }
    };

    const currentConfig = config[state];

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-1000 ${currentConfig.base} mix-blend-screen opacity-50`}>
            {/* Top Left Blob */}
            <div
                className={`absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full blur-[100px] transition-colors ${currentConfig.duration} ease-in-out ${currentConfig.primary} ${currentConfig.pulse}`}
            />

            {/* Bottom Right Blob */}
            <div
                className={`absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full blur-[100px] transition-colors ${currentConfig.duration} ease-in-out ${currentConfig.secondary} ${currentConfig.pulse}`}
            />

            {/* Middle Accent (Subtle) */}
            <div
                className={`absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-40 transition-colors ${currentConfig.duration} ${state === 'critical' ? 'bg-red-500/30' : 'bg-blue-500/10'}`}
            />
            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </div>
    );

};
