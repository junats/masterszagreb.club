import React, { useState } from 'react';
import { X, Check, Shield, Lock, FileDown, Cloud } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = () => {
      setLoading(true);
      // Simulate payment processing
      setTimeout(() => {
          setLoading(false);
          onUpgrade();
          onClose();
      }, 2000);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-4 sm:p-0">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-[#151f32] w-full max-w-md rounded-3xl border border-slate-700 overflow-hidden relative z-10 animate-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl">
        {/* Header Image/Gradient */}
        <div className="h-32 bg-gradient-to-br from-amber-500 to-orange-600 relative p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 rounded-full p-1">
                <X size={20} />
            </button>
            <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <Shield className="text-amber-500 w-7 h-7" fill="currentColor" fillOpacity={0.2} />
            </div>
        </div>

        <div className="pt-8 px-6 pb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
            <p className="text-slate-400 text-sm mb-6">Unlock powerful tools to protect your family and verify your provision.</p>

            <div className="space-y-4 mb-8">
                {[
                    { text: "Parental Control Mode (Filter 18+ items)", icon: Lock },
                    { text: "CSV Data Export for Legal Proof", icon: FileDown },
                    { text: "Cloud Backup & Sync", icon: Cloud },
                    { text: "Priority Support", icon: Check }
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                        <div className="bg-amber-500/10 p-1.5 rounded-full text-amber-500">
                            <item.icon size={14} />
                        </div>
                        {item.text}
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 mb-6">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-bold">Monthly Plan</span>
                    <span className="text-xl font-bold text-white">€4.99<span className="text-sm text-slate-500 font-normal">/mo</span></span>
                </div>
                <p className="text-xs text-slate-500">Cancel anytime. Secure payment via App Store.</p>
            </div>

            <button 
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Processing...' : 'Subscribe Now'}
            </button>
            
            <p className="text-[10px] text-center text-slate-600 mt-4">
                Restore Purchase • Terms of Service • Privacy Policy
            </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;