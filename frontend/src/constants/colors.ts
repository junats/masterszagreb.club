
import { Category } from '@common/types';

export const CATEGORY_COLORS: Record<string, string> = {
    [Category.EDUCATION]: '#818cf8', // Indigo (Matches Dashboard Gauge)
    [Category.FOOD]: '#fbbf24',      // Amber (Matches Dashboard Gauge)
    [Category.LUXURY]: '#f472b6',    // Pink (Matches Dashboard Gauge 'Activities')
    [Category.HEALTH]: '#34d399',    // Emerald (Matches Dashboard Gauge)

    // Derived/Complementary for others not in Dash Gauge
    [Category.NECESSITY]: '#3b82f6', // Blue
    [Category.HOUSEHOLD]: '#60a5fa', // Light Blue
    [Category.TRANSPORT]: '#a78bfa', // Violet
    [Category.DINING]: '#fb923c',    // Orange
    [Category.ALCOHOL]: '#f87171',   // Red
    [Category.OTHER]: '#94a3b8',     // Slate
};

export const CHART_COLORS = {
    needs: '#34d399', // Emerald
    wants: '#f472b6', // Pink
    savings: '#10b981', // Emerald Darker
    income: '#3b82f6', // Blue
};
