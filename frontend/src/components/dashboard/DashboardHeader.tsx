import React from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { SpotlightCard } from '../SpotlightCard';
import { BudgetOverview } from '../BudgetOverview';
import { SpendingDistribution } from '../SpendingDistribution';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardHeaderProps {
    metrics: any;
    budgetView: 'daily' | 'weekly' | 'monthly';
    setBudgetView: (view: 'daily' | 'weekly' | 'monthly') => void;
    monthlyBudget: number;
    suggestions: any[];
    currentTipIndex: number;
    pieView: 'daily' | 'weekly' | 'monthly';
    setPieView: (view: 'daily' | 'weekly' | 'monthly') => void;
    getCategoryColor: (catName: string) => string;
    setSelectedCategory: (cat: string | null) => void;
    selectedCategory: string | null;
    childSupportMode: boolean;
    ambientMode: boolean;
    ambientStyle: React.CSSProperties;
    budgetCardRef: React.RefObject<HTMLDivElement>;
    isVisible?: boolean;
}

const VisibilitySensor = ({ children, threshold = 0.5 }: { children: (props: { isVisible: boolean }) => React.ReactNode, threshold?: number }) => {
    const ref = React.useRef(null);
    const isVisible = useInView(ref, { amount: threshold });
    return <div ref={ref} className="w-full h-full">{children({ isVisible })}</div>;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    metrics,
    budgetView,
    setBudgetView,
    monthlyBudget,
    suggestions,
    currentTipIndex,
    pieView,
    setPieView,
    getCategoryColor,
    setSelectedCategory,
    selectedCategory,
    childSupportMode,
    ambientMode,
    ambientStyle,
    budgetCardRef,
    isVisible = true
}) => {
    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div
            ref={budgetCardRef}
            style={ambientMode ? ambientStyle : {}}
            className={"relative transition-all duration-1000 mb-4"} // Removed hardcoded borders/radius to let Card handle it
        >
            <SpotlightCard
                className="p-4 group h-full" // Removed bg-card, rounded-3xl
                spotlightColor="rgba(0, 122, 255, 0.15)" // System Blue tint
            >

                <BudgetOverview
                    metrics={metrics}
                    budgetView={budgetView}
                    setBudgetView={setBudgetView}
                    monthlyBudget={monthlyBudget || 0}
                    isVisible={isVisible}
                />

                {suggestions.length > 0 && (
                    <div className="relative z-10 mt-3 border-t border-white/10 pt-3 h-14 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentTipIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.5 }}
                                className="flex items-start gap-3"
                            >
                                <div className={"p-1.5 rounded-lg shrink-0 " + (
                                    suggestions[currentTipIndex].severity === 'danger' ? 'bg-red-500/10 text-red-400' :
                                        suggestions[currentTipIndex].severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                            'bg-emerald-500/10 text-emerald-400'
                                )}>
                                    {React.createElement(suggestions[currentTipIndex].icon, { size: 14 })}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xxs text-slate-300 font-medium leading-tight truncate">{suggestions[currentTipIndex].text}</p>
                                    {suggestions[currentTipIndex].subtext && <p className="text-xxs text-slate-400 mt-0.5 leading-tight truncate">{suggestions[currentTipIndex].subtext}</p>}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}

                <div className="relative z-10 border-t border-white/5 pt-4">
                    <VisibilitySensor threshold={0.2}>
                        {({ isVisible }: { isVisible: boolean }) => (
                            <>
                                <SpendingDistribution
                                    metrics={metrics}
                                    pieView={pieView}
                                    setPieView={setPieView}
                                    getCategoryColor={getCategoryColor}
                                    onCategoryClick={setSelectedCategory}
                                    selectedCategory={selectedCategory}
                                    childSupportMode={childSupportMode}
                                    isVisible={isVisible}
                                />
                            </>
                        )}
                    </VisibilitySensor>
                </div>
            </SpotlightCard>
        </div>
    );
};
