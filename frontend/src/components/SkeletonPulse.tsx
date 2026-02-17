import React from 'react';

interface SkeletonPulseProps {
    className?: string;
    style?: React.CSSProperties;
}

export const SkeletonPulse: React.FC<SkeletonPulseProps> = ({ className = '', style }) => {
    return (
        <div
            className={`rounded-xl bg-slate-800/60 relative overflow-hidden ${className}`}
            style={{ isolation: 'isolate', ...style }}
        >
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                }}
            />
        </div>
    );
};

// Inject shimmer keyframes once
if (typeof document !== 'undefined') {
    const id = 'skeleton-shimmer-keyframes';
    if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
}
