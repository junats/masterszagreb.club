import React, { useState } from 'react';
import { Receipt } from '../types';
import ReceiptScanner from './ReceiptScanner';
import HistoryView from './HistoryView';
import { Scan, History } from 'lucide-react';
import { HapticService } from '../services/HapticService';

interface ScanHistoryViewProps {
    selectedReceipt: Receipt | null;
    onSelectReceipt: (receipt: Receipt | null) => void;
    initialTab?: 'scan' | 'history';
    onScanComplete?: (receipts: Receipt[]) => void;
    onScanCancel?: () => void;
}

const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
    selectedReceipt,
    onSelectReceipt,
    initialTab = 'scan',
    onScanComplete,
    onScanCancel
}) => {
    const [activeTab, setActiveTab] = useState<'scan' | 'history'>(initialTab);

    const handleTabChange = (tab: 'scan' | 'history') => {
        HapticService.selection();
        setActiveTab(tab);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab Switcher */}
            <div className="px-4 pt-2 pb-3">
                <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
                    <button
                        onClick={() => handleTabChange('scan')}
                        className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase tracking-wide rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'scan' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Scan size={16} />
                        Scan
                    </button>
                    <button
                        onClick={() => handleTabChange('history')}
                        className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase tracking-wide rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <History size={16} />
                        History
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'scan' ? (
                    <ReceiptScanner
                        onScanComplete={onScanComplete || (() => { })}
                        onCancel={onScanCancel || (() => { })}
                    />
                ) : (
                    <HistoryView
                        selectedReceipt={selectedReceipt}
                        onSelectReceipt={onSelectReceipt}
                    />
                )}
            </div>
        </div>
    );
};

export default ScanHistoryView;
