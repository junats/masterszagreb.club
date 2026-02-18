import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ChevronRight } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string; // e.g. 'privacy_policy.md'
    title: string;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, fileName, title }) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && fileName) {
            setIsLoading(true);
            fetch(`/${fileName}`)
                .then(res => res.text())
                .then(text => {
                    setContent(text);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load legal file:', err);
                    setContent('Failed to load document. Please try again later.');
                    setIsLoading(false);
                });
        }
    }, [isOpen, fileName]);

    if (!isOpen) return null;

    // Lightweight markdown to JSX parser
    const renderContent = (md: string) => {
        const lines = md.split('\n');
        const elements: React.ReactNode[] = [];
        let inTable = false;
        let tableRows: string[][] = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // Table detection
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                inTable = true;
                const cells = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                if (cells.every(c => c.replace(/-/g, '') === '')) {
                    // Separator line, ignore
                } else {
                    tableRows.push(cells);
                }
                return;
            } else if (inTable) {
                // End of table
                elements.push(
                    <div key={`table-${index}`} className="overflow-x-auto my-6 rounded-xl border border-white/10">
                        <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                                <tr className="bg-white/5">
                                    {tableRows[0].map((cell, i) => (
                                        <th key={i} className="p-3 font-bold text-slate-300 border-b border-white/10">{cell}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.slice(1).map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        {row.map((cell, j) => (
                                            <td key={j} className="p-3 text-slate-400 font-medium">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                tableRows = [];
                inTable = false;
            }

            // Headers
            if (trimmed.startsWith('### ')) {
                elements.push(<h3 key={index} className="text-lg font-bold text-white mt-8 mb-4 border-l-4 border-indigo-500 pl-4">{trimmed.replace('### ', '')}</h3>);
            } else if (trimmed.startsWith('## ')) {
                elements.push(<h2 key={index} className="text-xl font-bold text-white mt-10 mb-6 flex items-center gap-2"><ChevronRight size={18} className="text-indigo-400" /> {trimmed.replace('## ', '')}</h2>);
            } else if (trimmed.startsWith('# ')) {
                elements.push(<h1 key={index} className="text-3xl font-black text-white mt-4 mb-8 tracking-tighter">{trimmed.replace('# ', '')}</h1>);
            } else if (trimmed.startsWith('- ')) {
                elements.push(
                    <div key={index} className="flex gap-3 mb-3 pl-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                        <p className="text-slate-400 text-sm leading-relaxed">{parseInline(trimmed.replace('- ', ''))}</p>
                    </div>
                );
            } else if (trimmed === '') {
                elements.push(<div key={index} className="h-2" />);
            } else {
                elements.push(<p key={index} className="text-slate-400 text-sm leading-relaxed mb-4">{parseInline(trimmed)}</p>);
            }
        });

        return elements;
    };

    // Helper for bold and simple styling
    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-indigo-300 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <FileText className="text-indigo-400 w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar scroll-smooth">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    <p className="text-slate-500 text-sm font-medium animate-pulse">Loading document...</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {renderContent(content)}

                                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                                        <p className="text-slate-500 text-xs italic mb-6">
                                            If you have any questions about this document, please contact us at support@truetrack.app
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default LegalModal;
