import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check } from 'lucide-react';
import { HapticsService } from '../services/haptics';

interface IntroTourProps {
    onComplete: () => void;
}

const TOUR_STEPS = [
    {
        title: "Welcome to TrueTrack",
        description: "Your intelligent expense tracker with ambient awareness.",
        target: "body", // General welcome
        position: "center"
    },
    {
        title: "Ambient Background",
        description: "The background glow changes color based on your budget health. Green is good, Red needs attention.",
        target: ".ambient-background", // We'll need to add this class or ID
        position: "top"
    },
    {
        title: "Interactive Cards",
        description: "Tap any card to see more details. Try swiping items in the History view to delete them!",
        target: ".dashboard-card", // Target generic card
        position: "bottom"
    },
    {
        title: "Navigation",
        description: "Quickly switch between scanning receipts, viewing history, and managing settings.",
        target: "nav",
        position: "top"
    }
];

const IntroTour: React.FC<IntroTourProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        HapticsService.selection();
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            HapticsService.notificationSuccess();
            onComplete();
        }
    };

    const step = TOUR_STEPS[currentStep];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6"
            >
                {/* Spotlight Effect (Simplified for now as a centered modal) */}

                <motion.div
                    key={currentStep}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-slate-900 border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden"
                >
                    {/* Glow Effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Step {currentStep + 1} of {TOUR_STEPS.length}
                            </span>
                            <button
                                onClick={onComplete}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            {step.description}
                        </p>

                        <div className="flex justify-end">
                            <button
                                onClick={handleNext}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                                {currentStep === TOUR_STEPS.length - 1 ? <Check size={18} /> : <ChevronRight size={18} />}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Dots Indicator */}
                <div className="flex gap-2 mt-8">
                    {TOUR_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-500' : 'bg-slate-700'}`}
                        />
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default IntroTour;
