import React from 'react';
import { Shield } from 'lucide-react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed top-0 left-0 w-full h-[100dvh] z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                    <Shield
                        className="w-12 h-12 text-white animate-[pulse_3s_ease-in-out_infinite]"
                        strokeWidth={1.5}
                        style={{
                            fill: 'rgba(56, 189, 248, 0.2)',
                            animation: 'fillPulse 3s ease-in-out infinite'
                        }}
                    />
                </div>
                <h1 className="text-xl font-heading font-bold text-white tracking-tight">TrueTrack</h1>
            </div>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
            </div>
        </div>
    );
};

export default LoadingScreen;
