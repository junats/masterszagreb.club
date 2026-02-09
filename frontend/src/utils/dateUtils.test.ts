import { describe, it, expect } from 'vitest';
import { getLocalYYYYMMDD, isSameDay } from './dateUtils';

describe('dateUtils', () => {
    describe('getLocalYYYYMMDD', () => {
        it('should return YYYY-MM-DD format', () => {
            const date = new Date(2023, 0, 15); // Jan 15, 2023
            expect(getLocalYYYYMMDD(date)).toBe('2023-01-15');
        });

        it('should handle single digit months and days', () => {
            const date = new Date(2023, 8, 5); // Sep 5, 2023
            expect(getLocalYYYYMMDD(date)).toBe('2023-09-05');
        });

        it('should return correct local date even late in the day', () => {
            // Create a date at 23:59:59 local time
            const date = new Date(2023, 11, 31, 23, 59, 59);
            expect(getLocalYYYYMMDD(date)).toBe('2023-12-31');
        });
    });

    describe('isSameDay', () => {
        it('should return true for same day different times', () => {
            const d1 = new Date(2023, 10, 1, 10, 0, 0);
            const d2 = new Date(2023, 10, 1, 15, 30, 0);
            expect(isSameDay(d1, d2)).toBe(true);
        });

        it('should return false for different days', () => {
            const d1 = new Date(2023, 10, 1);
            const d2 = new Date(2023, 10, 2);
            expect(isSameDay(d1, d2)).toBe(false);
        });
    });
});
