import React, { useState, useMemo } from 'react';
import { Receipt, Category, CategoryDefinition, ReceiptItem } from '../types';
import { Search, ChevronRight, Share2, MapPin, Trash2, FileText, Receipt as ReceiptIcon, Copy, Image as ImageIcon, X, BarChart3, PieChart, TrendingUp, Baby } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Share } from '@capacitor/share';
import HistoryAnalytics from './HistoryAnalytics';
import AnimatedSection from './AnimatedSection';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface HistoryViewProps {
    receipts: Receipt[];
    ageRestricted: boolean;
    categoryBudgets: Record<string, number>;
    onDelete?: (id: string) => void;
    onUpdate?: (receipt: Receipt) => void;
    selectedReceipt: Receipt | null;
    onSelectReceipt: (receipt: Receipt | null) => void;
    childSupportMode: boolean;
    categories: CategoryDefinition[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ receipts, ageRestricted, categoryBudgets, onDelete, onUpdate, selectedReceipt, onSelectReceipt, childSupportMode, categories }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showFullImage, setShowFullImage] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [isEditingDate, setIsEditingDate] = useState(false);


    // Zoom & Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleImageClick = (e: React.MouseEvent) => {
        if (isDragging) return;
        if (zoomLevel === 1) {
            setZoomLevel(2.5);
        } else {
            setZoomLevel(1);
            setPanPosition({ x: 0, y: 0 });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            setPanPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch support for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && zoomLevel > 1) {
            // e.preventDefault(); // Passive listener issue, better to avoid
            setPanPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    // Filter States
    const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'thisYear'>('all');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
    const [childFilter, setChildFilter] = useState(false);

    const filteredReceipts = useMemo(() => {
        return receipts.filter(r => {
            // 1. Search Term
            const matchesSearch = r.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.referenceCode && r.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()));
            if (!matchesSearch) return false;

            // 2. Date Filter
            const d = new Date(r.date);
            const now = new Date();
            if (dateFilter === 'thisMonth') {
                if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
            } else if (dateFilter === 'lastMonth') {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                if (d.getMonth() !== lastMonth.getMonth() || d.getFullYear() !== lastMonth.getFullYear()) return false;
            } else if (dateFilter === 'thisYear') {
                if (d.getFullYear() !== now.getFullYear()) return false;
            }

            // 3. Category Filter (Check if ANY item matches)
            if (categoryFilter !== 'all') {
                const hasCategory = r.items.some(i => i.category === categoryFilter && (!ageRestricted || !i.isRestricted));
                if (!hasCategory) return false;
            }

            // 4. Child Filter (Check if ANY item is child related)
            if (childFilter) {
                const hasChildItem = r.items.some(i => i.isChildRelated && (!ageRestricted || !i.isRestricted));
                if (!hasChildItem) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [receipts, searchTerm, dateFilter, categoryFilter, childFilter, ageRestricted]);

    const stats = useMemo(() => {
        let childTotal = 0;
        let luxuryTotal = 0;
        let otherTotal = 0;
        let total = 0;
        const catBreakdown: Record<string, number> = {};

        filteredReceipts.forEach(r => {
            r.items.forEach(i => {
                if (ageRestricted && i.isRestricted) return;

                total += i.price;
                const isChildOrHome = [Category.EDUCATION, Category.HEALTH, Category.FOOD, Category.NECESSITY, Category.HOUSEHOLD].includes(i.category);

                if (isChildOrHome) {
                    childTotal += i.price;
                    catBreakdown[i.category] = (catBreakdown[i.category] || 0) + i.price;
                } else if (i.category === Category.LUXURY) {
                    luxuryTotal += i.price;
                } else {
                    otherTotal += i.price;
                }
            });
        });

        return {
            childTotal, luxuryTotal, otherTotal, total,
            childRatio: total > 0 ? (childTotal / total) * 100 : 0,
            topChildCategories: Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3)
        };
    }, [filteredReceipts, ageRestricted]);

    const getEffectiveTotal = (receipt: Receipt) => {
        const validItems = receipt.items.filter(i => !ageRestricted || !i.isRestricted);
        return validItems.reduce((sum, item) => sum + item.price, 0);
    };

    const getVisibleItems = (receipt: Receipt) => {
        return receipt.items.filter(i => !ageRestricted || !i.isRestricted);
    };

    const handleDelete = () => {
        if (selectedReceipt && onDelete) {
            if (confirm("Are you sure you want to delete this record?")) {
                onDelete(selectedReceipt.id);
                onSelectReceipt(null);
            }
        }
    };

    const handleToggleRestriction = (itemIndex: number) => {
        if (!onUpdate || !selectedReceipt) return;
        const updatedItems = [...selectedReceipt.items];
        updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            isRestricted: !updatedItems[itemIndex].isRestricted
        };
        const updatedReceipt = { ...selectedReceipt, items: updatedItems };
        onUpdate(updatedReceipt);
        onSelectReceipt(updatedReceipt);
    };

    const handleToggleChildRelated = (itemIndex: number) => {
        if (!onUpdate || !selectedReceipt) return;
        const updatedItems = [...selectedReceipt.items];
        updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            isChildRelated: !updatedItems[itemIndex].isChildRelated
        };
        const updatedReceipt = { ...selectedReceipt, items: updatedItems };
        onUpdate(updatedReceipt);
        onSelectReceipt(updatedReceipt);
    };

    const handleShare = async () => {
        if (!selectedReceipt) return;
        try {
            const effectiveTotal = getEffectiveTotal(selectedReceipt);
            await Share.share({
                title: `Receipt from ${selectedReceipt.storeName}`,
                text: `Store: ${selectedReceipt.storeName}\nDate: ${new Date(selectedReceipt.date).toLocaleDateString()}\nTotal: €${effectiveTotal.toFixed(2)}\n\nSent via TrueTrack`,
                url: selectedReceipt.imageUrl || undefined,
                dialogTitle: 'Share Receipt'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (selectedReceipt) {
        const visibleItems = selectedReceipt.items;
        const effectiveTotal = getEffectiveTotal(selectedReceipt);
        const isBill = selectedReceipt.type === 'bill';
        const displayImageUrl = selectedReceipt.storagePath ? storageService.getPublicUrl(selectedReceipt.storagePath) : selectedReceipt.imageUrl;

        return (

            <div className="h-full w-full animate-in slide-in-from-right duration-300 ease-out">
                <div className="h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
                    <button onClick={() => onSelectReceipt(null)} className="text-slate-400 text-sm mb-4 flex items-center gap-1 font-medium hover:text-white transition-colors duration-300">
                        &larr; Back to History
                    </button>

                    <div className={`rounded-3xl p-6 shadow-2xl border ${isBill ? 'bg-slate-900 border-indigo-500/50' : 'bg-surface border-white/10'} relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isBill ? 'from-indigo-400 via-blue-500 to-indigo-400' : 'from-primary via-purple-500 to-pink-500'}`}></div>

                        <div className="flex justify-between items-start mb-6 mt-2">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {isBill && <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase tracking-wide">Invoice / Bill</span>}
                                </div>
                                <h2 className="text-2xl font-heading font-bold text-white tracking-tight">{selectedReceipt.storeName}</h2>

                                {isBill && selectedReceipt.referenceCode && (
                                    <div className="mt-2 bg-black/30 border border-white/10 rounded-lg p-2 flex items-center gap-3 w-full hover:border-white/30 transition-colors duration-300">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Payment Code</p>
                                            <p className="text-sm font-mono text-white tracking-wide break-all">{selectedReceipt.referenceCode}</p>
                                        </div>
                                        <button className="text-slate-400 hover:text-white transition-colors duration-300 shrink-0" onClick={() => navigator.clipboard.writeText(selectedReceipt.referenceCode!)}>
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-2 font-medium">
                                    <MapPin size={12} />
                                    <span>{isBill ? 'Provider Address' : 'Main St. Branch'}</span>
                                </div>
                                {ageRestricted && selectedReceipt.items.some(i => i.isRestricted) && (
                                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-medium">
                                        <span>Restricted items hidden from totals</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="flex gap-2 mb-1">
                                    <button onClick={handleShare} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        <Share2 size={16} />
                                    </button>
                                    {onDelete && (
                                        <button onClick={handleDelete} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Total</p>
                                    <p className={`text-3xl font-heading font-bold tracking-tight tabular-nums ${isBill ? 'text-indigo-400' : 'text-primary'}`}>€{effectiveTotal.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {displayImageUrl && (
                            <div className="mb-6">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Original Scan</p>
                                <div
                                    className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 group cursor-pointer hover:border-white/30 transition-all duration-300"
                                    onClick={() => setShowFullImage(true)}
                                >
                                    <img
                                        src={displayImageUrl}
                                        alt="Receipt Scan"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors duration-300">
                                        <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-white/10 shadow-lg">
                                            <ImageIcon size={14} /> View Full Image
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 mb-6 pr-1">
                            {visibleItems.map((item, idx) => {
                                const isHidden = ageRestricted && item.isRestricted;
                                if (isHidden) return null;

                                const handleDeleteItem = () => {
                                    if (onUpdate) {
                                        const newItems = [...selectedReceipt.items];
                                        newItems.splice(idx, 1);
                                        // Recalculate total
                                        const newTotal = newItems.reduce((sum, i) => sum + i.price, 0);
                                        onUpdate({ ...selectedReceipt, items: newItems, total: newTotal });
                                        onSelectReceipt({ ...selectedReceipt, items: newItems, total: newTotal });
                                        // Haptic feedback
                                        import('../services/haptics').then(({ HapticsService }) => {
                                            HapticsService.notificationSuccess();
                                        });
                                    }
                                };

                                return (
                                    <motion.div
                                        key={idx}
                                        className="relative overflow-hidden rounded-lg mb-2"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-red-500/20 flex items-center justify-end px-4 rounded-lg"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                        >
                                            <Trash2 size={18} className="text-red-400" />
                                        </motion.div>
                                        <motion.div
                                            className={`relative bg-surfaceHighlight flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors duration-200 ${item.isRestricted && !ageRestricted ? 'opacity-50 grayscale' : ''}`}
                                            drag="x"
                                            dragConstraints={{ left: -100, right: 0 }}
                                            onDragEnd={(e, info) => {
                                                if (info.offset.x < -60) {
                                                    handleDeleteItem();
                                                }
                                            }}
                                            whileDrag={{ scale: 0.98 }}
                                        >
                                            <div>
                                                <p className="text-slate-200 text-sm font-medium mb-1">{item.name}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${item.category === Category.LUXURY ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' :
                                                        item.category === Category.EDUCATION ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                                            item.category === Category.NECESSITY ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                                item.category === Category.ALCOHOL ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                                    item.category === Category.DINING ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                                                        'bg-slate-800 border-slate-700 text-slate-400'
                                                        }`}>
                                                        {item.category}
                                                    </span>
                                                    {item.isRestricted && !ageRestricted && (
                                                        <span className="text-[10px] text-red-400 border border-red-500/30 px-1 rounded font-bold">18+</span>
                                                    )}
                                                    {item.isChildRelated && childSupportMode && (
                                                        <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-1 rounded font-bold flex items-center gap-1">
                                                            <Baby size={10} /> Child
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono text-sm font-medium tabular-nums ${item.isRestricted ? 'text-slate-500 line-through decoration-red-500' : 'text-slate-300'}`}>
                                                    €{item.price.toFixed(2)}
                                                </span>
                                                {onUpdate && childSupportMode && (
                                                    <button
                                                        onClick={() => handleToggleChildRelated(idx)}
                                                        className={`p-1.5 rounded-lg transition-colors duration-200 ${item.isChildRelated ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 hover:text-emerald-400 hover:bg-slate-800'}`}
                                                        title="Toggle Child Related"
                                                    >
                                                        <Baby size={14} />
                                                    </button>
                                                )}
                                                {onUpdate && !ageRestricted && (
                                                    <button
                                                        onClick={() => handleToggleRestriction(idx)}
                                                        className={`p-1.5 rounded-lg transition-colors duration-200 ${item.isRestricted ? 'text-red-400 bg-red-500/10' : 'text-slate-600 hover:text-red-400 hover:bg-slate-800'}`}
                                                        title="Toggle Restriction (18+)"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            {isEditingDate ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="date"
                                        value={new Date(selectedReceipt.date).toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            if (onUpdate && e.target.value) {
                                                onUpdate({ ...selectedReceipt, date: e.target.value });
                                                onSelectReceipt({ ...selectedReceipt, date: e.target.value });
                                            }
                                        }}
                                        className="bg-surfaceHighlight border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            if (onUpdate) {
                                                onUpdate({ ...selectedReceipt, date: today });
                                                onSelectReceipt({ ...selectedReceipt, date: today });
                                            }
                                        }}
                                        className="px-2 py-1 rounded bg-primary/20 text-primary text-[10px] font-bold hover:bg-primary/30"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => setIsEditingDate(false)}
                                        className="px-2 py-1 rounded bg-white/10 text-white text-[10px] font-bold hover:bg-white/20"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-medium">{new Date(selectedReceipt.date).toLocaleDateString()}</span>
                                    {onUpdate && (
                                        <button
                                            onClick={() => setIsEditingDate(true)}
                                            className="text-[10px] text-primary hover:text-primary/80 font-medium underline"
                                        >
                                            Edit Date
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {showFullImage && displayImageUrl && (
                        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden animate-in fade-in duration-300 backdrop-blur-sm">
                            <button
                                onClick={() => {
                                    setShowFullImage(false);
                                    setZoomLevel(1);
                                    setPanPosition({ x: 0, y: 0 });
                                }}
                                className="absolute top-6 right-6 z-[110] text-white/70 hover:text-white bg-white/10 rounded-full p-2 transition-colors duration-300"
                            >
                                <X size={24} />
                            </button>

                            <div
                                className="relative w-full h-full flex items-center justify-center touch-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleMouseUp}
                            >
                                <img
                                    src={displayImageUrl}
                                    alt="Full Receipt"
                                    draggable={false}
                                    style={{
                                        transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                                        cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
                                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                                    }}
                                    onClick={handleImageClick}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                                />
                            </div>

                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-medium border border-white/10 pointer-events-none">
                                {zoomLevel === 1 ? 'Tap to Zoom' : 'Drag to Pan • Tap to Reset'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full px-4 pt-4 pb-32 bg-background">
            <div className="mb-6">
                <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight mb-2">History</h1>
                <p className="text-slate-300 text-sm font-medium mb-4">Review receipts and bills {ageRestricted && <span className="text-amber-500">(Filtered)</span>}</p>
            </div>

            {/* Filters */}
            <div className="mb-4 space-y-3">
                {/* Search & Chart Toggle */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-hover:text-slate-300 transition-colors duration-300" />
                        <input
                            type="text"
                            placeholder="Search store or reference..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 placeholder:text-slate-600 font-medium hover:border-white/20 hover:shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`p-3 rounded-xl border transition-all duration-300 ${showStats ? 'bg-primary/20 text-primary border-primary/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'bg-surface border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-surfaceHighlight'}`}
                    >
                        <BarChart3 size={20} />
                    </button>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/50"
                    >
                        <option value="all">All Time</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="thisYear">This Year</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as any)}
                        className="bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/50"
                    >
                        <option value="all">All Categories</option>
                        {Object.values(Category).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Child Filter Toggle */}
                    {childSupportMode && (
                        <button
                            onClick={() => setChildFilter(!childFilter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-300 flex items-center gap-1 ${childFilter ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-surface border-white/10 text-slate-400 hover:text-slate-200'}`}
                        >
                            <Baby size={12} /> Child Items
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {showStats && filteredReceipts.length > 0 && (
                    <HistoryAnalytics receipts={filteredReceipts} ageRestricted={ageRestricted} categoryBudgets={categoryBudgets} childSupportMode={childSupportMode} />
                )}
                {filteredReceipts.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-600 font-medium">No records found.</p>
                    </div>
                ) : (
                    filteredReceipts.map((receipt, index) => {
                        const effectiveTotal = getEffectiveTotal(receipt);
                        const visibleItemCount = getVisibleItems(receipt).length;
                        const isBill = receipt.type === 'bill';
                        const thumbUrl = receipt.imageUrl || (receipt.storagePath ? storageService.getPublicUrl(receipt.storagePath) : '');

                        return (
                            <div key={receipt.id} className="relative mb-3">
                                {/* Delete Background */}
                                <div className="absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-end px-6 z-0">
                                    <Trash2 className="text-red-400" size={20} />
                                </div>

                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: -100, right: 0 }}
                                    dragElastic={0.1}
                                    onDragEnd={(e, info) => {
                                        if (info.offset.x < -80 && onDelete) {
                                            // Small vibration
                                            if (navigator.vibrate) navigator.vibrate(50);

                                            if (confirm("Are you sure you want to delete this receipt?")) {
                                                onDelete(receipt.id);
                                            }
                                        }
                                    }}
                                    onClick={(e) => {
                                        // Prevent click if we were dragging (simple heuristic)
                                        // In a real app we might check drag distance, but for now
                                        // we rely on the user intention.
                                        onSelectReceipt(receipt);
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative z-10 w-full transition-colors duration-300 p-3 rounded-2xl border flex items-center gap-4 group cursor-pointer ${isBill
                                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950 border-indigo-500/20'
                                        : 'bg-surface border-white/5 hover:bg-surfaceHighlight'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex-shrink-0 relative shadow-inner group-hover:border-white/30 transition-colors duration-300">
                                        {thumbUrl ? (
                                            <img
                                                src={thumbUrl}
                                                alt="Receipt"
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <ReceiptIcon size={24} />
                                            </div>
                                        )}
                                        {isBill && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>}
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className="text-slate-200 font-bold text-sm truncate pr-2 tracking-tight group-hover:text-white transition-colors duration-300">{receipt.storeName}</h3>
                                            <span className={`font-bold text-sm tabular-nums tracking-tight transition-colors duration-300 ${isBill ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-white'}`}>€{effectiveTotal.toFixed(2)}</span>
                                        </div>

                                        {isBill && receipt.referenceCode && (
                                            <p className="text-[10px] font-mono text-indigo-300/80 truncate mb-1">
                                                Ref: {receipt.referenceCode}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-end mt-1">
                                            <p className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors duration-300">{new Date(receipt.date).toLocaleDateString()}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium group-hover:text-primary transition-colors duration-300">
                                                <span>{visibleItemCount} items</span>
                                                <ChevronRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default HistoryView;
