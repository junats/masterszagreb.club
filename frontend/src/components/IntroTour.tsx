import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, Camera, BarChart3, Users, Shield, Sparkles } from 'lucide-react';
import { HapticsService } from '../services/haptics';
import { useLanguage } from '../contexts/LanguageContext';

interface IntroTourProps {
    onComplete: () => void;
    onNavigateToScan?: () => void;
}

const IntroTour: React.FC<IntroTourProps> = ({ onComplete, onNavigateToScan }) => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        HapticsService.selection();
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(prev => prev + 1);
        } else {
            HapticsService.notificationSuccess();
            onComplete();
            if (onNavigateToScan) onNavigateToScan();
        }
    };

    const slides = [
        // Screen 1: Welcome
        {
            gradient: 'from-blue-600 via-indigo-700 to-purple-800',
            content: (
                <div className="flex flex-col items-center text-center px-8">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
                        className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/20 backdrop-blur-xl shadow-2xl"
                    >
                        <Shield size={48} className="text-white" fill="currentColor" fillOpacity={0.15} />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-bold text-white mb-3 leading-tight"
                    >
                        {t('onboarding.welcome.title') || 'Track Every Dollar.\nBuild Your Case.'}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-base text-white/60 leading-relaxed max-w-[280px]"
                    >
                        {t('onboarding.welcome.description') || 'Smart receipt tracking designed for co-parents. Scan, categorize, and build transparency — effortlessly.'}
                    </motion.p>
                </div>
            ),
        },
        // Screen 2: Features
        {
            gradient: 'from-purple-700 via-indigo-700 to-blue-700',
            content: (
                <div className="flex flex-col items-center text-center px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold text-white mb-8"
                    >
                        {t('onboarding.features.title') || 'Everything You Need'}
                    </motion.h2>
                    <div className="space-y-4 w-full max-w-[300px]">
                        {[
                            {
                                icon: Camera,
                                color: 'text-blue-300',
                                bg: 'bg-blue-500/20',
                                title: t('onboarding.features.scan') || 'Scan Receipts',
                                desc: t('onboarding.features.scanDesc') || 'AI-powered receipt scanning in seconds',
                            },
                            {
                                icon: BarChart3,
                                color: 'text-purple-300',
                                bg: 'bg-purple-500/20',
                                title: t('onboarding.features.budget') || 'Smart Budget',
                                desc: t('onboarding.features.budgetDesc') || 'Real-time spending insights & forecasts',
                            },
                            {
                                icon: Users,
                                color: 'text-cyan-300',
                                bg: 'bg-cyan-500/20',
                                title: t('onboarding.features.coParenting') || 'Co-Parenting',
                                desc: t('onboarding.features.coParentingDesc') || 'Custody tracking & shared expenses',
                            },
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.15, type: 'spring' }}
                                className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-left"
                            >
                                <div className={`${feature.bg} p-3 rounded-xl ${feature.color} shrink-0 border border-white/10`}>
                                    <feature.icon size={22} />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-white block">{feature.title}</span>
                                    <span className="text-xs text-white/50">{feature.desc}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ),
        },
        // Screen 3: Get Started
        {
            gradient: 'from-indigo-700 via-blue-600 to-cyan-600',
            content: (
                <div className="flex flex-col items-center text-center px-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
                        className="w-28 h-28 bg-white/10 rounded-full flex items-center justify-center mb-8 border-2 border-white/20 backdrop-blur-xl shadow-2xl"
                    >
                        <Camera size={48} className="text-white" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-bold text-white mb-3"
                    >
                        {t('onboarding.start.title') || 'Ready to Go!'}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-base text-white/60 leading-relaxed max-w-[280px] mb-2"
                    >
                        {t('onboarding.start.description') || 'Start by scanning your first receipt. It only takes a few seconds.'}
                    </motion.p>
                </div>
            ),
        },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col"
            >
                {/* Background */}
                <motion.div
                    key={`bg-${currentStep}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 bg-gradient-to-br ${slides[currentStep].gradient}`}
                />

                {/* Skip */}
                <div className="relative z-20 flex justify-end p-6 pt-14">
                    <button
                        onClick={onComplete}
                        className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
                    >
                        {t('onboarding.skip') || 'Skip'}
                    </button>
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            className="w-full"
                        >
                            {slides[currentStep].content}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Bottom: Dots + Button */}
                <div className="relative z-20 pb-16 px-8 flex flex-col items-center gap-6">
                    {/* Progress Dots */}
                    <div className="flex gap-2">
                        {slides.map((_, idx) => (
                            <motion.div
                                key={idx}
                                animate={{
                                    width: idx === currentStep ? 32 : 8,
                                    backgroundColor: idx === currentStep ? '#ffffff' : 'rgba(255,255,255,0.3)',
                                }}
                                transition={{ duration: 0.3 }}
                                className="h-2 rounded-full"
                            />
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleNext}
                        className="w-full max-w-[300px] bg-white text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xl active:scale-[0.97] transition-transform text-base"
                    >
                        {currentStep === 2
                            ? (t('onboarding.start.cta') || 'Scan First Receipt')
                            : (t('onboarding.next') || 'Continue')
                        }
                        {currentStep === 2 ? <Camera size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default IntroTour;
