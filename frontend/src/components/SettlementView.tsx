import React, { useMemo } from 'react';
import { Receipt, Category } from '@common/types';
import { ArrowLeft, Calculator, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

interface SettlementViewProps {
    receipts: Receipt[];
    onBack: () => void;
}

const SettlementView: React.FC<SettlementViewProps> = ({ receipts = [], onBack }) => {
    return (
        <div className="flex flex-col h-full bg-background text-white pt-0 px-4 pb-4">
            <button onClick={onBack} className="mb-4 text-blue-400">Back</button>
            <h1>Settlement View Debug</h1>
            <p>Receipts count: {receipts?.length || 0}</p>
        </div>
    );
};

export default SettlementView;
