/**
 * Date Utility Functions
 * Standardized date handling to avoid timezone issues.
 */

/**
 * Returns a date string in "YYYY-MM-DD" format based on the user's LOCAL time.
 * This ensures that comparisons against database strings (which are often YYYY-MM-DD)
 * work correctly regardless of the browser's timezone offset.
 * 
 * @param date The Date object to format
 * @returns String in "YYYY-MM-DD" format
 */
export const getLocalYYYYMMDD = (date: Date): string => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
};

/**
 * Checks if two dates represent the same calendar day in local time.
 * 
 * @param date1 First date
 * @param date2 Second date
 * @returns boolean
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return getLocalYYYYMMDD(date1) === getLocalYYYYMMDD(date2);
};
