import React, { useState } from 'react';
import { Receipt, Category } from '../types';
import { Search, ChevronRight, Share2, MapPin, Trash2, FileText, Receipt as ReceiptIcon, Copy } from 'lucide-react';

interface HistoryViewProps {
  receipts: Receipt[];
  ageRestricted: boolean;
  onDelete?: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ receipts, ageRestricted, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const filteredReceipts = receipts.filter(r => 
    r.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper to calculate effective total
  const getEffectiveTotal = (receipt: Receipt) => {
      const validItems = receipt.items.filter(i => !ageRestricted || !i.isRestricted);
      return validItems.reduce((sum, item) => sum + item.price, 0);
  };

  const getVisibleItems = (receipt: Receipt) => {
      return receipt.items.filter(i => !ageRestricted || !i.isRestricted);
  };
  
  const handleDelete = () => {
    if (selectedReceipt && onDelete) {
        if(confirm("Are you sure you want to delete this record?")) {
            onDelete(selectedReceipt.id);
            setSelectedReceipt(null);
        }
    }
  };

  if (selectedReceipt) {
    const visibleItems = getVisibleItems(selectedReceipt);
    const effectiveTotal = getEffectiveTotal(selectedReceipt);
    const isBill = selectedReceipt.type === 'bill';

    return (
        <div className="flex flex-col h-full px-4 pt-4 pb-24 animate-in slide-in-from-right duration-200">
            <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 text-sm mb-4 flex items-center gap-1">
                &larr; Back to History
            </button>
            
            <div className={`rounded-3xl p-6 shadow-2xl border ${isBill ? 'bg-slate-800 border-indigo-500/50' : 'bg-surface border-slate-700'} relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isBill ? 'from-indigo-400 via-blue-500 to-indigo-400' : 'from-primary via-purple-500 to-pink-500'}`}></div>
                
                <div className="flex justify-between items-start mb-4 mt-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {isBill && <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wide">Invoice / Bill</span>}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{selectedReceipt.storeName}</h2>
                        
                        {/* Reference Code Display for Bills */}
                        {isBill && selectedReceipt.referenceCode && (
                            <div className="mt-2 bg-black/30 border border-white/10 rounded-lg p-2 flex items-center gap-3 w-fit">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase">Payment Code</p>
                                    <p className="text-sm font-mono text-white tracking-wide">{selectedReceipt.referenceCode}</p>
                                </div>
                                <button className="text-slate-400 hover:text-white" onClick={() => navigator.clipboard.writeText(selectedReceipt.referenceCode!)}>
                                    <Copy size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-2">
                            <MapPin size={12} />
                            <span>{isBill ? 'Provider Address' : 'Main St. Branch'}</span>
                        </div>
                         {ageRestricted && selectedReceipt.items.some(i => i.isRestricted) && (
                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px]">
                                <span>Restricted items hidden</span>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs">Total</p>
                        <p className={`text-2xl font-bold ${isBill ? 'text-indigo-400' : 'text-primary'}`}>€{effectiveTotal.toFixed(2)}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-1 no-scrollbar">
                    {visibleItems.length > 0 ? (
                        visibleItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                                <div>
                                    <p className="text-slate-200 text-sm font-medium">{item.name}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                        item.category === Category.LUXURY ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' :
                                        item.category === Category.EDUCATION ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                        item.category === Category.NECESSITY ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                        'bg-slate-700 border-slate-600 text-slate-400'
                                    }`}>
                                        {item.category}
                                    </span>
                                </div>
                                <span className="text-slate-300 font-mono text-sm">€{item.price.toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-slate-500 text-sm italic">
                            No items visible under current restrictions.
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                    <span className="text-xs text-slate-500">{new Date(selectedReceipt.date).toLocaleDateString()}</span>
                    <div className="flex gap-3">
                        {onDelete && (
                            <button onClick={handleDelete} className="flex items-center gap-2 text-xs text-red-400 font-medium hover:text-red-300 transition-colors">
                                <Trash2 size={14} />
                                Delete
                            </button>
                        )}
                        <button className="flex items-center gap-2 text-xs text-primary font-medium hover:text-white transition-colors">
                            <Share2 size={14} />
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-slate-400 text-sm">Review receipts and bills {ageRestricted && <span className="text-amber-500">(Filtered)</span>}</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
            type="text" 
            placeholder="Search stores or bills..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
        {filteredReceipts.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-slate-600">No records found.</p>
            </div>
        ) : (
            filteredReceipts.map((receipt) => {
                const effectiveTotal = getEffectiveTotal(receipt);
                const visibleItemCount = getVisibleItems(receipt).length;
                const isBill = receipt.type === 'bill';

                return (
                    <button 
                        key={receipt.id} 
                        onClick={() => setSelectedReceipt(receipt)}
                        className={`w-full transition-colors p-4 rounded-xl border flex items-center justify-between group ${
                            isBill 
                            ? 'bg-slate-800/80 border-indigo-500/30 hover:bg-slate-800' 
                            : 'bg-surface border-slate-700/50 hover:bg-slate-800'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold shadow-lg ${
                                isBill 
                                ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-300' 
                                : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300'
                            }`}>
                                {isBill ? <FileText size={20} /> : receipt.storeName.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <h3 className="text-slate-200 font-semibold text-sm">{receipt.storeName}</h3>
                                {isBill && receipt.referenceCode && (
                                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-1 rounded block w-fit mt-0.5">
                                        Ref: {receipt.referenceCode}
                                    </span>
                                )}
                                <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                                    <span>{new Date(receipt.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{visibleItemCount} items</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`font-bold ${isBill ? 'text-indigo-300' : 'text-white'}`}>€{effectiveTotal.toFixed(2)}</span>
                            <ChevronRight className="text-slate-600 w-5 h-5 group-hover:text-primary transition-colors" />
                        </div>
                    </button>
                );
            })
        )}
      </div>
    </div>
  );
};

export default HistoryView;