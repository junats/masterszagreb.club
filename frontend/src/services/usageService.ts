import { Preferences } from '@capacitor/preferences';

const USAGE_KEY = 'truetrack_usage_stats';

// Free tier limits
const FREE_DAILY_LIMIT = 3;
const FREE_WEEKLY_LIMIT = 7;

export interface UsageStats {
    dailyUploads: number;
    weeklyUploads: number;
    dailyLimit: number;
    weeklyLimit: number;
    lastResetDate: string; // YYYY-MM-DD
    weekStartDate: string; // YYYY-MM-DD (Monday of current week)
}

interface CheckResult {
    allowed: boolean;
    reason?: 'daily_limit' | 'weekly_limit';
    dailyRemaining: number;
    weeklyRemaining: number;
}

/**
 * Service for tracking receipt upload usage and enforcing free tier limits.
 * Stores data in Capacitor Preferences for persistence across sessions.
 */
export const usageService = {

    /**
     * Get current date as YYYY-MM-DD string in local timezone
     */
    _getLocalDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },

    /**
     * Get the Monday of the current week as YYYY-MM-DD
     */
    _getWeekStartDate(): string {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        const monday = new Date(now.setDate(diff));
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    },

    /**
     * Load usage stats from storage, resetting if day/week has changed
     */
    async getUsageStats(): Promise<UsageStats> {
        const { value } = await Preferences.get({ key: USAGE_KEY });
        const today = this._getLocalDateString();
        const weekStart = this._getWeekStartDate();

        let stats: UsageStats = {
            dailyUploads: 0,
            weeklyUploads: 0,
            dailyLimit: FREE_DAILY_LIMIT,
            weeklyLimit: FREE_WEEKLY_LIMIT,
            lastResetDate: today,
            weekStartDate: weekStart,
        };

        if (value) {
            try {
                const stored = JSON.parse(value) as UsageStats;

                // Check if we need to reset daily count
                if (stored.lastResetDate !== today) {
                    stored.dailyUploads = 0;
                    stored.lastResetDate = today;
                }

                // Check if we need to reset weekly count (new week started)
                if (stored.weekStartDate !== weekStart) {
                    stored.weeklyUploads = 0;
                    stored.weekStartDate = weekStart;
                }

                stats = {
                    ...stats,
                    dailyUploads: stored.dailyUploads,
                    weeklyUploads: stored.weeklyUploads,
                    lastResetDate: stored.lastResetDate,
                    weekStartDate: stored.weekStartDate,
                };
            } catch (e) {
                console.warn('usageService: Failed to parse stored stats, resetting', e);
            }
        }

        return stats;
    },

    /**
     * Check if user can upload a receipt
     * @param isPro - Whether user has Pro subscription (bypasses limits)
     */
    async canUploadReceipt(isPro: boolean): Promise<CheckResult> {
        // Pro users have unlimited uploads
        if (isPro) {
            return {
                allowed: true,
                dailyRemaining: Infinity,
                weeklyRemaining: Infinity,
            };
        }

        const stats = await this.getUsageStats();
        const dailyRemaining = Math.max(0, stats.dailyLimit - stats.dailyUploads);
        const weeklyRemaining = Math.max(0, stats.weeklyLimit - stats.weeklyUploads);

        // Check daily limit first
        if (stats.dailyUploads >= stats.dailyLimit) {
            return {
                allowed: false,
                reason: 'daily_limit',
                dailyRemaining: 0,
                weeklyRemaining,
            };
        }

        // Check weekly limit
        if (stats.weeklyUploads >= stats.weeklyLimit) {
            return {
                allowed: false,
                reason: 'weekly_limit',
                dailyRemaining,
                weeklyRemaining: 0,
            };
        }

        return {
            allowed: true,
            dailyRemaining,
            weeklyRemaining,
        };
    },

    /**
     * Record a successful receipt upload (increments counters)
     */
    async recordUpload(): Promise<void> {
        const stats = await this.getUsageStats();

        stats.dailyUploads += 1;
        stats.weeklyUploads += 1;

        await Preferences.set({
            key: USAGE_KEY,
            value: JSON.stringify(stats),
        });

        console.log(`usageService: Recorded upload. Daily: ${stats.dailyUploads}/${stats.dailyLimit}, Weekly: ${stats.weeklyUploads}/${stats.weeklyLimit}`);
    },

    /**
     * Reset all usage stats (for testing/debugging)
     */
    async resetUsage(): Promise<void> {
        await Preferences.remove({ key: USAGE_KEY });
        console.log('usageService: Usage stats reset');
    },
};
