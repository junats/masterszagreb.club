import React, { useState, useMemo } from 'react';
import { Receipt, Category, CategoryDefinition, ReceiptItem } from '@common/types';
import { Search, ChevronRight, Share2, MapPin, Trash2, FileText, Receipt as ReceiptIcon, Copy, Image as ImageIcon, X, BarChart3, PieChart, TrendingUp, Baby } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Share } from '@capacitor/share';
import HistoryAnalytics from './HistoryAnalytics';
import AnimatedSection from './AnimatedSection';
import { PlaceholderImage } from './ui/PlaceholderImage';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryViewProps {
    // Only keeping UI-specific props that coordinate with parent view state
    selectedReceipt: Receipt | null;
    onSelectReceipt: (receipt: Receipt | null) => void;
    // Removed: receipts, ageRestricted, categoryBudgets, onDelete, onUpdate, childSupportMode, categories
}

const HistoryView: React.FC<HistoryViewProps> = ({
    selectedReceipt,
    onSelectReceipt
}) => {
    const {
        receipts,
        ageRestricted,
        categoryBudgets,
        deleteReceipt,
        updateReceipt,
        childSupportMode,
        categories
    } = useData();

    const { t } = useLanguage();

    // Map context functions to local names if needed or use directly
    const onDelete = deleteReceipt;
    const onUpdate = updateReceipt;

    // ... existing logic

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

    // Navigation State
    const [viewMode, setViewMode] = useState<'day' | 'month' | 'year' | 'all'>('all');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter States
    const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
    const [childFilter, setChildFilter] = useState(false);

    // Date Navigation Helpers
    const navigateTime = (direction: -1 | 1) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else if (viewMode === 'year') {
            newDate.setFullYear(newDate.getFullYear() + direction);
        }
        setCurrentDate(newDate);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getFormattedDateRange = () => {
        if (viewMode === 'all') return t('history.allTime');
        if (viewMode === 'day') {
            if (isToday(currentDate)) return t('history.today');
            return currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        }
        if (viewMode === 'month') {
            return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        }
        if (viewMode === 'year') {
            return currentDate.getFullYear().toString();
        }
        return '';
    };

    const filteredReceipts = useMemo(() => {
        return receipts.filter(r => {
            // 0. Co-Parenting Filter (Strict -> Relaxed)
            // User Request: "show all items in coparenting mode"
            // We do NOT filter out non-child receipts anymore.
            // if (childSupportMode) { ... } -> REMOVED

            // 1. Search Term
            const matchesSearch = r.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.referenceCode && r.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()));
            if (!matchesSearch) return false;

            // 2. Date Filter
            if (viewMode !== 'all') {
                const rDate = new Date(r.date);
                if (viewMode === 'day') {
                    if (rDate.toDateString() !== currentDate.toDateString()) return false;
                } else if (viewMode === 'month') {
                    if (rDate.getMonth() !== currentDate.getMonth() || rDate.getFullYear() !== currentDate.getFullYear()) return false;
                } else if (viewMode === 'year') {
                    if (rDate.getFullYear() !== currentDate.getFullYear()) return false;
                }
            }

            // 3. Category Filter
            if (categoryFilter !== 'all') {
                const hasCategory = r.items.some(i => i.category === categoryFilter && (!ageRestricted || !i.isRestricted));
                if (!hasCategory) return false;
            }

            // 4. Child Filter
            if (childFilter) {
                const hasChildItem = r.items.some(i => i.isChildRelated && (!ageRestricted || !i.isRestricted));
                if (!hasChildItem) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [receipts, searchTerm, viewMode, currentDate, categoryFilter, childFilter, ageRestricted]);

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
                const isChildOrHome = [Category.EDUCATION, Category.HEALTH, Category.FOOD, Category.NECESSITY, Category.HOUSEHOLD].includes(i.category as Category);

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
                <div className="h-full overflow-y-auto no-scrollbar px-4 pt-0 pb-24">
                    <button
                        onClick={() => onSelectReceipt(null)}
                        className="text-white bg-white/5 hover:bg-white/10 text-sm mb-4 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-95"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to History
                    </button>

                    {/* Sticky Header Wrapper */}
                    <div className="sticky top-0 z-10 -mx-4 px-4 pb-3 bg-gradient-to-b from-background via-background to-transparent">
                        <div className={`rounded-3xl p-3 shadow-2xl border ${isBill ? 'bg-slate-900 border-indigo-500/50' : 'bg-surface border-white/10'} relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isBill ? 'from-indigo-400 via-blue-500 to-indigo-400' : 'from-primary via-purple-500 to-pink-500'}`}></div>

                            {/* Single line layout */}
                            <div className="flex items-center justify-between gap-3 mt-0.5">
                                {/* Store name */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-heading font-bold text-white tracking-tight truncate">{selectedReceipt.storeName}</h2>
                                </div>

                                {/* Pie chart */}
                                <div className="relative flex-shrink-0">
                                    <svg width="36" height="36" viewBox="0 0 36 36" className="transform -rotate-90">
                                        {(() => {
                                            const childItems = visibleItems.filter(i => i.isChildRelated);
                                            const childTotal = childItems.reduce((sum, i) => sum + i.price, 0);
                                            const childPercentage = effectiveTotal > 0 ? (childTotal / effectiveTotal) * 100 : 0;
                                            const circumference = 2 * Math.PI * 15.9155;
                                            const childStroke = (childPercentage / 100) * circumference;
                                            const otherStroke = circumference - childStroke;

                                            return (
                                                <>
                                                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.2" />
                                                    {childPercentage > 0 && (
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15.9155"
                                                            fill="none"
                                                            stroke="#34d399"
                                                            strokeWidth="3.2"
                                                            strokeDasharray={`${childStroke} ${circumference}`}
                                                            strokeLinecap="round"
                                                        />
                                                    )}
                                                    {childPercentage < 100 && (
                                                        <circle
                                                            cx="18"
                                                            cy="18"
                                                            r="15.9155"
                                                            fill="none"
                                                            stroke="#f472b6"
                                                            strokeWidth="3.2"
                                                            strokeDasharray={`${otherStroke} ${circumference}`}
                                                            strokeDashoffset={-childStroke}
                                                            strokeLinecap="round"
                                                        />
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[7px] font-bold text-white">
                                            {(() => {
                                                const childItems = visibleItems.filter(i => i.isChildRelated);
                                                const childTotal = childItems.reduce((sum, i) => sum + i.price, 0);
                                                const childPercentage = effectiveTotal > 0 ? Math.round((childTotal / effectiveTotal) * 100) : 0;
                                                return `${childPercentage}%`;
                                            })()}
                                        </span>
                                    </div>
                                </div>


                                {/* Mini trends sparkline - Item Nutrition Scores */}
                                {/* <div className="flex-shrink-0">
                                    <svg width="40" height="24" viewBox="0 0 40 24" className="opacity-60">
                                        <polyline
                                            points={(() => {
                                                // Get items with nutrition scores
                                                const scoredItems = visibleItems.filter(i => i.insights?.nutritionScore !== undefined);
                                                if (scoredItems.length === 0) return "0,20 40,20"; // Flat line if no data
                                                if (scoredItems.length === 1) return `0,${24 - (scoredItems[0].insights!.nutritionScore / 100 * 24)} 40,${24 - (scoredItems[0].insights!.nutritionScore / 100 * 24)}`;

                                                return scoredItems.map((item, idx) => {
                                                    const score = item.insights!.nutritionScore;
                                                    const x = (idx / (scoredItems.length - 1)) * 40;
                                                    const y = 24 - ((score / 100) * 20) - 2; // Keep within padded bounds
                                                    return `${x},${y}`;
                                                }).join(' ');
                                            })()}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={isBill ? 'text-indigo-400' : 'text-primary'}
                                        />
                                    </svg>
                                </div> */}

                                {/* Total */}
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-xl font-heading font-bold tracking-tight tabular-nums ${isBill ? 'text-indigo-400' : 'text-primary'}`}>€{effectiveTotal.toFixed(2)}</p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <button onClick={handleShare} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        <Share2 size={14} />
                                    </button>
                                    {onDelete && (
                                        <button onClick={handleDelete} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {ageRestricted && selectedReceipt.items.some(i => i.isRestricted) && (
                                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium">
                                    <span>{t('history.restrictedHidden')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content with spacing */}
                    <div className="pt-6">

                        {displayImageUrl && (
                            <div className="mt-4">
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">{t('history.originalScan')}</p>
                                <div
                                    className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 group cursor-pointer hover:border-white/30 transition-all duration-300"
                                    onClick={() => setShowFullImage(true)}
                                >
                                    {displayImageUrl ? (
                                        <img
                                            src={displayImageUrl}
                                            alt="Receipt Scan"
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.placeholder-fallback')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : (
                                        <PlaceholderImage className="w-full h-full rounded-none" />
                                    )}
                                    <div className="placeholder-fallback hidden absolute inset-0">
                                        <PlaceholderImage className="w-full h-full rounded-none" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors duration-300">
                                        <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-white/10 shadow-lg">
                                            <ImageIcon size={14} /> {t('history.viewFullImage')}
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
                                    <div
                                        key={idx}
                                        className="relative overflow-hidden rounded-lg mb-2"
                                    >
                                        <div
                                            className={`relative bg-surfaceHighlight flex flex-col justify-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors duration-200 ${item.isRestricted && !ageRestricted ? 'opacity-50 grayscale' : ''}`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <div>
                                                    <p className="text-slate-200 text-sm font-medium mb-1">{item.name}</p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${item.category === Category.LUXURY ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' :
                                                            item.category === Category.EDUCATION ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                                                item.category === Category.NECESSITY ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                                    item.category === Category.ALCOHOL ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                                        item.category === Category.DINING ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                                                            'bg-slate-800 border-slate-700 text-slate-400'
                                                            }`}>
                                                            {item.category}
                                                        </span>
                                                        {item.isRestricted && !ageRestricted && (
                                                            <span className="text-xs text-red-400 border border-red-500/30 px-1 rounded font-bold">18+</span>
                                                        )}
                                                        {item.isChildRelated && childSupportMode && (
                                                            <span className="text-xs text-emerald-400 border border-emerald-500/30 px-1 rounded font-bold flex items-center gap-1">
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
                                                            className={`p-2 rounded-lg transition-all duration-200 ${item.isChildRelated ? 'text-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-500/30' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 bg-slate-800/50'}`}
                                                            title="Toggle Child Related"
                                                        >
                                                            <Baby size={18} />
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
                                            </div>

                                            {/* AI Insights Display */}
                                            {item.insights && (
                                                <div className="w-full mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                                                    <div className="col-span-2 text-xs text-slate-400 italic">
                                                        ✨ {item.insights.insight}
                                                    </div>
                                                    {/* <div className="flex items-center gap-2 bg-black/20 rounded p-1.5">
                                                        {item.insights.nutritionScore === -1 ? (
                                                            <span className="text-xs text-slate-500 w-full text-center font-medium tracking-wide">{t('financial.utilityItem')}</span>
                                                        ) : (
                                                            <>
                                                                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.insights.nutritionScore > 70 ? 'bg-emerald-500' : item.insights.nutritionScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                        style={{ width: `${item.insights.nutritionScore}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-400 w-8 text-right">{t('financial.nutri')} {item.insights.nutritionScore}</span>
                                                            </>
                                                        )}
                                                    </div> */}
                                                    <div className="flex items-center gap-1 bg-black/20 rounded p-1.5 justify-center">
                                                        <span className="text-xs text-slate-400">{t('financial.value')}:</span>
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <span key={star} className={`text-xs ${star <= item.insights!.valueRating ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                        className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30"
                                    >
                                        {t('common.today')}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingDate(false)}
                                        className="px-2 py-1 rounded bg-white/10 text-white text-xs font-bold hover:bg-white/20"
                                    >
                                        {t('common.done')}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-medium">{new Date(selectedReceipt.date).toLocaleDateString()}</span>
                                    {onUpdate && (
                                        <button
                                            onClick={() => setIsEditingDate(true)}
                                            className="text-xs text-primary hover:text-primary/80 font-medium underline"
                                        >
                                            {t('common.editDate')}
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
                                className="absolute right-6 z-[200] text-white bg-black/60 backdrop-blur-md rounded-full p-3 transition-all hover:bg-black/80 shadow-2xl hover:scale-110 active:scale-95"
                                style={{
                                    top: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)'
                                }}
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
                </div> {/* Close content wrapper */}
            </div>

        );
    }

    return (
        <div className="flex flex-col h-full px-4 pt-0 pb-4 bg-background">


            {/* Filters */}
            <div className="mb-4 space-y-3">
                {/* Search & Chart Toggle */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-hover:text-slate-300 transition-colors duration-300" />
                        <input
                            type="text"
                            placeholder={t('history.search')}
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
                    {/* Time View Mode */}
                    <div className="flex bg-surface border border-white/10 rounded-lg p-1 gap-1">
                        {(['all', 'year', 'month', 'day'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1 rounded-md text-xs uppercase font-bold tracking-wider transition-colors duration-200 ${viewMode === mode ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Navigation Controls (Only if not All) */}
                    {viewMode !== 'all' && (
                        <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-lg p-1">
                            <button onClick={() => navigateTime(-1)} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors">
                                <ChevronRight size={14} className="rotate-180" />
                            </button>
                            <span className="text-xs font-bold text-white min-w-[80px] text-center tabular-nums">
                                {getFormattedDateRange()}
                            </span>
                            <button onClick={() => navigateTime(1)} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

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

            <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-32 relative z-10">
                {showStats && filteredReceipts.length > 0 && (
                    <HistoryAnalytics receipts={filteredReceipts} ageRestricted={ageRestricted} categoryBudgets={categoryBudgets} childSupportMode={childSupportMode} />
                )}
                {filteredReceipts.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-600 font-medium">No records found.</p>
                        {childSupportMode && receipts.length > 0 && (
                            <p className="text-xs text-emerald-500/80 mt-2 bg-emerald-500/10 inline-block px-3 py-1 rounded-full border border-emerald-500/20">
                                Some receipts hidden by Co-Parenting Mode
                            </p>
                        )}
                    </div>
                ) : (
                    filteredReceipts.map((receipt, index) => {
                        const effectiveTotal = getEffectiveTotal(receipt);
                        const visibleItemCount = getVisibleItems(receipt).length;
                        const isBill = receipt.type === 'bill';
                        const thumbUrl = receipt.imageUrl || (receipt.storagePath ? storageService.getPublicUrl(receipt.storagePath) : '');

                        return (
                            <div key={receipt.id} className="relative mb-3">
                                {/* Delete Background with gradient */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-l from-red-500/30 via-red-500/20 to-transparent rounded-2xl flex items-center justify-end px-6 z-0"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Trash2 className="text-red-400" size={20} />
                                        <span className="text-red-400 font-bold text-sm">Delete</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    drag="x"
                                    dragConstraints={{ left: -120, right: 0 }}
                                    dragElastic={{ left: 0.2, right: 0.8 }}
                                    dragTransition={{
                                        bounceStiffness: 300,
                                        bounceDamping: 25,
                                        power: 0.2
                                    }}
                                    onDrag={(e, info) => {
                                        // Progressive haptic feedback as user drags
                                        if (Math.abs(info.offset.x) > 40 && Math.abs(info.offset.x) < 45) {
                                            import('../services/haptics').then(({ HapticsService }) => {
                                                HapticsService.selection();
                                            });
                                        }
                                    }}
                                    onDragEnd={(e, info) => {
                                        if (info.offset.x < -80 && onDelete) {
                                            // Strong haptic for delete threshold
                                            import('../services/haptics').then(({ HapticsService }) => {
                                                HapticsService.impactMedium();
                                            });

                                            if (confirm("Delete this receipt?")) {
                                                // Success haptic
                                                import('../services/haptics').then(({ HapticsService }) => {
                                                    HapticsService.notificationSuccess();
                                                });
                                                onDelete(receipt.id);
                                            }
                                        }
                                    }}
                                    onTap={() => {
                                        onSelectReceipt(receipt);
                                        import('../services/haptics').then(({ HapticsService }) => {
                                            HapticsService.selection();
                                        });
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    whileDrag={{
                                        scale: 0.98,
                                        transition: { type: "spring", stiffness: 400, damping: 30 }
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                    className={`relative z-10 w-full transition-all duration-300 p-3 rounded-2xl border flex items-center gap-4 group cursor-pointer ${isBill
                                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950 border-indigo-500/20 hover:border-indigo-500/40'
                                        : 'bg-surface border-white/5 hover:bg-surfaceHighlight hover:border-white/10'
                                        } shadow-lg hover:shadow-xl`}
                                >
                                    <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex-shrink-0 relative shadow-inner group-hover:border-white/30 group-hover:shadow-lg transition-all duration-300">
                                        {thumbUrl ? (
                                            <>
                                                <img
                                                    src={thumbUrl}
                                                    alt="Receipt"
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement?.querySelector('.placeholder-thumb')?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="placeholder-thumb hidden absolute inset-0">
                                                    <PlaceholderImage className="w-full h-full rounded-none bg-transparent" text="" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <PlaceholderImage className="w-full h-full rounded-none bg-transparent" text="" />
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
                                            <p className="text-xs font-mono text-indigo-300/80 truncate mb-1">
                                                Ref: {receipt.referenceCode}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-end mt-1">
                                            <p className="text-xs text-slate-500 font-medium group-hover:text-slate-400 transition-colors duration-300">{new Date(receipt.date).toLocaleDateString()}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium group-hover:text-primary transition-colors duration-300">
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
