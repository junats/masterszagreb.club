import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-0 z-[200] left-0 right-0 px-3 pointer-events-none flex flex-col items-center gap-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast, onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const icons = {
        success: <CheckCircle size={16} className="text-emerald-400" />,
        error: <AlertCircle size={16} className="text-red-400" />,
        warning: <AlertTriangle size={16} className="text-amber-400" />,
        info: <Info size={16} className="text-blue-400" />
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            layout
            className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-md shadow-lg max-w-sm ${bgColors[toast.type]} bg-black/80`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-xs font-medium text-white">{toast.message}</p>
            <button onClick={onDismiss} className="text-slate-400 hover:text-white transition-colors">
                <X size={12} />
            </button>
        </motion.div>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
