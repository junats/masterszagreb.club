import React, { useMemo } from 'react';
import { Receipt, Category } from '../types';
import { ArrowLeft, CheckCircle2, FileText, Download, Activity, ShoppingBag, Wallet, TrendingUp, TrendingDown, ArrowUpRight, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ProvisionAnalysisProps {
    receipts: Receipt[];
    onBack: () => void;
}

const COLORS: Record<string, string> = {
    [Category.NECESSITY]: '#38bdf8', // Sky
    [Category.FOOD]: '#4ade80',      // Green
    [Category.LUXURY]: '#f472b6',    // Pink
    [Category.HOUSEHOLD]: '#818cf8', // Indigo
    [Category.HEALTH]: '#fb7185',    // Rose
    [Category.TRANSPORT]: '#facc15', // Yellow
    [Category.EDUCATION]: '#6366f1', // Indigo
    [Category.OTHER]: '#94a3b8',     // Slate
};

const ProvisionAnalysis: React.FC<ProvisionAnalysisProps> = ({ receipts, onBack }) => {
    const data = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // --- 1. Detailed Monthly Trend (Last 6 Months) ---
        const trendData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;

            // Initialize with all categories set to 0
            const monthEntry: any = { name: key, total: 0 };
            Object.values(Category).forEach(cat => {
                monthEntry[cat] = 0;
            });
            if (monthEntry[Category.OTHER] === undefined) monthEntry[Category.OTHER] = 0;

            trendData.push(monthEntry);
        }

        receipts.forEach(r => {
            const d = new Date(r.date);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(2)}`;
            const monthData = trendData.find(m => m.name === key);

            if (monthData) {
                r.items.forEach(item => {
                    let cat = item.category || Category.OTHER;
                    if (typeof cat === 'string') {
                        const lower = cat.toLowerCase();
                        if (['groceries', 'food', 'dining', 'alcohol'].includes(lower)) cat = Category.FOOD;
                        else if (['health', 'pharmacy', 'medical'].includes(lower)) cat = Category.HEALTH;
                        else if (['household', 'cleaning', 'furniture'].includes(lower)) cat = Category.HOUSEHOLD;
                        else if (['education', 'school', 'tuition', 'child'].includes(lower)) cat = Category.EDUCATION;
                        else if (['transport', 'fuel', 'parking'].includes(lower)) cat = Category.TRANSPORT;
                        else if (['luxury', 'electronics', 'entertainment'].includes(lower)) cat = Category.LUXURY;
                        else if (['necessity'].includes(lower)) cat = Category.NECESSITY;
                    }
                    if (monthData[cat] === undefined) cat = Category.OTHER;

                    monthData.total += item.price;
                    monthData[cat] += item.price;
                });
            }
        });

        // --- 2. Daily Activity (Last 7 Days) ---
        // --- 2. Daily Activity (Last 7 Days) ---
        const weeklyActivity = [];
        let maxDayTotal = 0;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const offset = d.getTimezoneOffset();
            const localDate = new Date(d.getTime() - (offset * 60 * 1000));
            const dStr = localDate.toISOString().split('T')[0];

            // Initialize day entry with 0 for all categories
            const dayEntry: any = {
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                total: 0
            };
            Object.values(Category).forEach(cat => {
                dayEntry[cat] = 0;
            });
            if (dayEntry[Category.OTHER] === undefined) dayEntry[Category.OTHER] = 0;

            receipts.forEach(r => {
                let rDateStr = r.date;
                if (r.date.includes('T')) {
                    rDateStr = r.date.split('T')[0];
                } else if (r.date.length === 10 && r.date.includes('-')) {
                    // Already YYYY-MM-DD
                } else {
                    try {
                        rDateStr = new Date(r.date).toISOString().split('T')[0];
                    } catch (e) {
                        rDateStr = '';
                    }
                }

                if (rDateStr === dStr) {
                    r.items.forEach(item => {
                        // Normalize Category
                        let cat = item.category || Category.OTHER;
                        if (typeof cat === 'string') {
                            const lower = cat.toLowerCase();
                            if (['groceries', 'food', 'dining', 'alcohol'].includes(lower)) cat = Category.FOOD;
                            else if (['health', 'pharmacy', 'medical'].includes(lower)) cat = Category.HEALTH;
                            else if (['household', 'cleaning', 'furniture'].includes(lower)) cat = Category.HOUSEHOLD;
                            else if (['education', 'school', 'tuition', 'child'].includes(lower)) cat = Category.EDUCATION;
                            else if (['transport', 'fuel', 'parking'].includes(lower)) cat = Category.TRANSPORT;
                            else if (['luxury', 'electronics', 'entertainment'].includes(lower)) cat = Category.LUXURY;
                            else if (['necessity'].includes(lower)) cat = Category.NECESSITY;
                        }
                        if (dayEntry[cat] === undefined) cat = Category.OTHER;

                        dayEntry[cat] += item.price;
                        dayEntry.total += item.price;
                    });
                }
            });

            if (dayEntry.total > maxDayTotal) maxDayTotal = dayEntry.total;
            weeklyActivity.push(dayEntry);
        }

        // --- 3. Top Vendors & Category Breakdown (Current Month) ---
        const currentMonthReceipts = receipts.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        let totalSpent = 0;
        const storeTotals: Record<string, number> = {};
        const categoryTotals: Record<string, number> = {};

        currentMonthReceipts.forEach(r => {
            storeTotals[r.storeName] = (storeTotals[r.storeName] || 0) + r.items.reduce((s, i) => s + i.price, 0);
            r.items.forEach(i => {
                let cat = i.category || Category.OTHER;
                // Normalize (simplified for brevity, assuming data is mostly clean or handled above)
                if (typeof cat === 'string') {
                    const lower = cat.toLowerCase();
                    if (['groceries', 'food', 'dining', 'alcohol'].includes(lower)) cat = Category.FOOD;
                    else if (['health', 'pharmacy', 'medical'].includes(lower)) cat = Category.HEALTH;
                    else if (['household', 'cleaning', 'furniture'].includes(lower)) cat = Category.HOUSEHOLD;
                    else if (['education', 'school', 'tuition', 'child'].includes(lower)) cat = Category.EDUCATION;
                    else if (['transport', 'fuel', 'parking'].includes(lower)) cat = Category.TRANSPORT;
                    else if (['luxury', 'electronics', 'entertainment'].includes(lower)) cat = Category.LUXURY;
                    else if (['necessity'].includes(lower)) cat = Category.NECESSITY;
                    else cat = Category.OTHER;
                }

                categoryTotals[cat] = (categoryTotals[cat] || 0) + i.price;
                totalSpent += i.price;
            });
        });

        const topStores = Object.entries(storeTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, val]) => ({ name, value: val, percentage: totalSpent > 0 ? (val / totalSpent) * 100 : 0 }));

        const categoryData = Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value, percentage: totalSpent > 0 ? (value / totalSpent) * 100 : 0 }))
            .sort((a, b) => b.value - a.value);

        return {
            trendData,
            weeklyActivity,
            topStores,
            categoryData,
            currentMonthName: months[currentMonth],
            currentYear,
            totalSpent
        };
    }, [receipts]);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('expense-report-container');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 1.5, // Reduced from 2 to save memory
                backgroundColor: '#0B1221',
                logging: false,
                useCORS: true
            });

            // Use JPEG with compression instead of PNG
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = 297; // A4 height in mm

            // Reset for the loop
            const pdfFinal = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdfFinal.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            const totalPages = Math.ceil(imgHeight / pdfHeight);

            for (let i = 0; i < totalPages; i++) {
                if (i > 0) pdfFinal.addPage();
                // Position shifts up by one page height each time
                const yPos = -(pdfHeight * i);
                pdfFinal.addImage(imgData, 'JPEG', 0, yPos, pdfWidth, imgHeight);
            }

            const pdfBase64 = pdfFinal.output('datauristring').split(',')[1];
            const fileName = `Expense_Report_${data.currentYear}_${data.currentMonthName}.pdf`;

            try {
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: pdfBase64,
                    directory: Directory.Cache,
                });

                const uriResult = await Filesystem.getUri({
                    directory: Directory.Cache,
                    path: fileName
                });

                await Share.share({
                    title: 'Expense Report',
                    text: `Here is my expense report for ${data.currentMonthName} ${data.currentYear}`,
                    url: uriResult.uri,
                    dialogTitle: 'Share Expense Report'
                });

            } catch (fsError) {
                console.error('Native file/share error:', fsError);
                pdfFinal.save(fileName);
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    return (
        <div id="expense-report-container" className="flex flex-col h-full bg-[#0B1221] text-slate-200 animate-in fade-in duration-300 font-sans selection:bg-blue-500/30">
            {/* Header Bar */}
            <div className="px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        data-html2canvas-ignore
                        className="p-2 rounded-full bg-[#131B2C] border border-white/5 text-slate-400 hover:text-white transition-colors hover:bg-white/5"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Expense Report #{data.currentYear}-00{new Date().getMonth() + 1}</h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-[#131B2C] border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500 tracking-wide uppercase">Verified</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 space-y-6">

                {/* 1. Monthly Trend (Stacked Area Chart) */}
                <div className="bg-[#131B2C] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-blue-400 w-5 h-5" />
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Monthly Trend</h3>
                    </div>
                    <div className="h-64 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trendData}>
                                <defs>
                                    {Object.keys(COLORS).map((cat) => (
                                        <linearGradient key={cat} id={`report-gradient-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS[cat]} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS[cat]} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `€${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0B1221', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    formatter={(value: number, name: string) => [`€${value.toFixed(2)}`, name]}
                                    wrapperStyle={{ zIndex: 1000 }}
                                />
                                {Object.keys(COLORS).map((cat) => (
                                    <Area
                                        key={cat}
                                        type="monotone"
                                        dataKey={cat}
                                        name={cat}
                                        stackId="1"
                                        stroke={COLORS[cat]}
                                        fill={COLORS[cat]} // Solid fill for PDF reliability
                                        fillOpacity={0.6}
                                        strokeWidth={2}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grid for Daily Activity & Top Vendors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 2. Daily Activity */}
                    <div className="bg-[#131B2C] rounded-3xl p-6 border border-white/5 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="text-blue-500 w-5 h-5" />
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Daily Activity</h3>
                        </div>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.weeklyActivity}>
                                    <defs>
                                        <linearGradient id="report-daily-gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0B1221', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                                        formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spent']}
                                    />
                                    {Object.keys(COLORS).map((cat) => (
                                        <Area
                                            key={cat}
                                            type="monotone"
                                            dataKey={cat}
                                            name={cat}
                                            stackId="1"
                                            stroke={COLORS[cat]}
                                            fill={COLORS[cat]} // Solid fill for PDF reliability
                                            fillOpacity={0.6}
                                            strokeWidth={2}
                                            isAnimationActive={false}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Top Vendors */}
                    <div className="bg-[#131B2C] rounded-3xl p-6 border border-white/5 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Store className="text-indigo-400 w-5 h-5" />
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Top Vendors</h3>
                        </div>
                        <div className="space-y-5">
                            {data.topStores.length > 0 ? (
                                data.topStores.map((store, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end text-xs">
                                            <span className="text-slate-300 font-medium mr-2">{store.name}</span>
                                            <span className="text-slate-400 tabular-nums whitespace-nowrap">€{store.value.toFixed(0)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${store.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-500 text-center py-4">No data</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Spending Breakdown */}
                <div className="bg-[#131B2C] rounded-3xl p-6 border border-white/5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <ShoppingBag className="text-emerald-400 w-5 h-5" />
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Spending Breakdown</h3>
                    </div>
                    <div className="space-y-5">
                        {data.categoryData.map((d, i) => (
                            <div key={i} className="group space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: COLORS[d.name] || '#94a3b8', color: COLORS[d.name] || '#94a3b8' }}></div>
                                        <span className="text-slate-200 font-medium">{d.name}</span>
                                    </div>
                                    <span className="text-slate-400 font-mono tabular-nums">€{d.value.toFixed(0)}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${d.percentage}%`, backgroundColor: COLORS[d.name] || '#94a3b8' }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {data.categoryData.length === 0 && (
                            <p className="text-slate-500 text-xs text-center py-2">No spending data yet.</p>
                        )}
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownloadPDF}
                    data-html2canvas-ignore
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                    <Download size={18} />
                    Download PDF Report
                </button>

            </div>
        </div>
    );
};

export default ProvisionAnalysis;
