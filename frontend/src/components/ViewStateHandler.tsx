import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewState, Receipt } from '@common/types';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from './Dashboard';
import ScanHistoryView from './ScanHistoryView';
import { useData } from '../contexts/DataContext';

// Lazy-load non-default views to reduce initial bundle parse time
const CustodyCalendar = React.lazy(() => import('./CustodyCalendar'));
const SettlementView = React.lazy(() => import('./SettlementView'));
const ProvisionAnalysis = React.lazy(() => import('./ProvisionAnalysis'));
const Settings = React.lazy(() => import('./Settings'));
const SupportView = React.lazy(() => import('./SupportView'));

interface ViewStateHandlerProps {
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    direction: number;
}

const slideVariants = {
    enter: (direction: number) => ({
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        zIndex: 1
    }),
    center: {
        zIndex: 1,
        position: 'relative' as const,
        width: '100%',
        height: '100%'
    },
    exit: (direction: number) => ({
        zIndex: 0,
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        opacity: 0
    })
};

const ViewStateHandler: React.FC<ViewStateHandlerProps> = ({ currentView, setCurrentView, direction }) => {
    const { setSelectedReceipt, addReceipts, selectedReceipt, receipts } = useData();

    const handleScanComplete = (receipts: Receipt[]) => {
        addReceipts(receipts);
        setCurrentView('history');
    };

    return (
        <AnimatePresence initial={false} mode="wait">
            <motion.div
                key={currentView}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0 }}
                className="h-full w-full"
            >
                <ErrorBoundary>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                        {(() => {
                            switch (currentView) {
                                case 'dashboard':
                                    return (
                                        <div className="flex flex-col h-full">
                                            <Dashboard
                                                onViewReceipt={(receipt) => {
                                                    setSelectedReceipt(receipt);
                                                    setCurrentView('history');
                                                }}
                                                onProvisionClick={() => setCurrentView('provision')}
                                                onSettlementClick={() => setCurrentView('settlement')}
                                                onCustodyClick={() => setCurrentView('custody')}
                                                onHabitsClick={() => setCurrentView('settings')}
                                            />
                                        </div>
                                    );
                                case 'custody':
                                    return (
                                        <CustodyCalendar
                                            onBack={() => setCurrentView('dashboard')}
                                        />
                                    );
                                case 'scan':
                                    return (
                                        <ScanHistoryView
                                            selectedReceipt={selectedReceipt}
                                            onSelectReceipt={setSelectedReceipt}
                                            initialTab="scan"
                                            onScanComplete={handleScanComplete}
                                            onScanCancel={() => setCurrentView('history')}
                                        />
                                    );

                                case 'history':
                                    return (
                                        <ScanHistoryView
                                            selectedReceipt={selectedReceipt}
                                            onSelectReceipt={setSelectedReceipt}
                                            initialTab="history"
                                            onScanComplete={handleScanComplete}
                                            onScanCancel={() => setCurrentView('history')}
                                        />
                                    );

                                case 'support':
                                    return <SupportView />;
                                case 'settlement':
                                    return (
                                        <SettlementView onBack={() => setCurrentView('dashboard')} receipts={receipts} />
                                    );
                                case 'provision':
                                    return (
                                        <ProvisionAnalysis
                                            onBack={() => setCurrentView('dashboard')}
                                        />
                                    );
                                case 'settings':
                                    return (
                                        <Settings />
                                    );

                                default:
                                    return (
                                        <Dashboard
                                            onViewReceipt={(receipt) => {
                                                setSelectedReceipt(receipt);
                                                setCurrentView('history');
                                            }}
                                            onProvisionClick={() => setCurrentView('provision')}
                                            onSettlementClick={() => setCurrentView('settlement')}
                                            onCustodyClick={() => setCurrentView('custody')}
                                            onHabitsClick={() => setCurrentView('settings')}
                                        />
                                    );
                            }
                        })()}
                    </Suspense>
                </ErrorBoundary>
            </motion.div>
        </AnimatePresence>
    );
};

export default ViewStateHandler;
