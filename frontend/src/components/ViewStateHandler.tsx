import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ViewState, Receipt } from '@common/types';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from './Dashboard';
import ScanHistoryView from './ScanHistoryView';
import CustodyCalendar from './CustodyCalendar';
import SettlementView from './SettlementView';
import ProvisionAnalysis from './ProvisionAnalysis';
import Settings from './Settings';
import SupportView from './SupportView';
import { useData } from '../contexts/DataContext';

interface ViewStateHandlerProps {
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    direction: number;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        zIndex: 1
    }),
    center: {
        zIndex: 1,
        x: 0,
        position: 'relative' as const,
        width: '100%',
        height: '100%'
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? '100%' : '-100%',
        position: 'absolute' as const,
        width: '100%',
        height: '100%'
    })
};

const ViewStateHandler: React.FC<ViewStateHandlerProps> = ({ currentView, setCurrentView, direction }) => {
    const { setSelectedReceipt, addReceipts, selectedReceipt, receipts } = useData();

    const handleScanComplete = (receipts: Receipt[]) => {
        addReceipts(receipts);
        setCurrentView('history');
    };

    return (
        <AnimatePresence initial={false} custom={direction}>
            <motion.div
                key={currentView}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    x: { type: "tween", ease: "circOut", duration: 0.3 }
                }}
                className="h-full w-full"
            >
                <ErrorBoundary>
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
                </ErrorBoundary>
            </motion.div>
        </AnimatePresence>
    );
};

export default ViewStateHandler;
