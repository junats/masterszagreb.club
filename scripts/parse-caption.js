/**
 * parse-caption.js
 * Extracts structured event data from Instagram captions.
 */

/**
 * Common date patterns found in nightclub Instagram captions:
 *  - "28.03.2026", "28/03/2026", "28-03-2026"
 *  - "28.03.", "28/03"
 *  - "March 28", "28 March"
 *  - "Petak 28.03." (Croatian weekday + date)
 */
const DATE_PATTERNS = [
    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
    // DD.MM. (no year — assume current/next occurrence)
    /(\d{1,2})[.\/-](\d{1,2})\./,
    // Written months (English)
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
    // Croatian month names
    /(\d{1,2})\.\s*(siječnja|veljače|ožujka|travnja|svibnja|lipnja|srpnja|kolovoza|rujna|listopada|studenoga|prosinca)/i,
];

const CROATIAN_MONTHS = {
    'siječnja': 1, 'veljače': 2, 'ožujka': 3, 'travnja': 4,
    'svibnja': 5, 'lipnja': 6, 'srpnja': 7, 'kolovoza': 8,
    'rujna': 9, 'listopada': 10, 'studenoga': 11, 'prosinca': 12,
};

const ENGLISH_MONTHS = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
};

// Time patterns: "22:00", "22h", "23.00", "at 22:00", "doors 22:00"
const TIME_PATTERNS = [
    /(?:doors|vrata|start|početak|at|od|from)?\s*(\d{1,2})[:.h](\d{2})?\s*(?:h|hrs|sati)?/i,
];

/**
 * Parse an Instagram caption into structured event data.
 * @param {string} caption - Raw Instagram caption text
 * @param {string} postDate - ISO timestamp of the post (fallback date)
 * @returns {{ title: string, date: string, time: string, description: string }}
 */
function parseCaption(caption, postDate) {
    if (!caption) {
        return {
            title: 'MASTERS EVENT',
            date: formatFallbackDate(postDate),
            time: '',
            description: '',
        };
    }

    const lines = caption.split('\n').map(l => l.trim()).filter(Boolean);
    const title = extractTitle(lines, caption);
    const date = extractDate(caption, postDate);
    const time = extractTime(caption);
    const description = extractDescription(lines, title);

    return { title, date, time, description };
}

/**
 * Extract the event title — typically the first line or first bold/caps text.
 */
function extractTitle(lines, fullCaption) {
    if (lines.length === 0) return 'MASTERS EVENT';

    // First line is usually the title/event name
    let title = lines[0];

    // Strip emojis and excessive decoration
    title = title.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
    // Remove leading hashtags/mentions from title
    title = title.replace(/^[@#]\S+\s*/g, '').trim();

    // If it's too long, truncate to something reasonable
    if (title.length > 80) {
        title = title.substring(0, 80).trim() + '…';
    }

    return title.toUpperCase() || 'MASTERS EVENT';
}

/**
 * Extract a date from the caption text.
 */
function extractDate(caption, postDate) {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Try DD.MM.YYYY first
    let match = caption.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        return `${day}.${month}.${match[3]}`;
    }

    // DD.MM. (no year)
    match = caption.match(/(\d{1,2})[.\/-](\d{1,2})\./);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        // Assume current year, or next year if date has passed
        let year = currentYear;
        const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
        if (testDate < now) year++;
        return `${day}.${month}.${year}`;
    }

    // English month names
    match = caption.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = String(ENGLISH_MONTHS[match[2].toLowerCase()]).padStart(2, '0');
        return `${day}.${month}.${currentYear}`;
    }
    match = caption.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
    if (match) {
        const day = match[2].padStart(2, '0');
        const month = String(ENGLISH_MONTHS[match[1].toLowerCase()]).padStart(2, '0');
        return `${day}.${month}.${currentYear}`;
    }

    // Croatian month names
    match = caption.match(/(\d{1,2})\.\s*(siječnja|veljače|ožujka|travnja|svibnja|lipnja|srpnja|kolovoza|rujna|listopada|studenoga|prosinca)/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = String(CROATIAN_MONTHS[match[2].toLowerCase()]).padStart(2, '0');
        return `${day}.${month}.${currentYear}`;
    }

    // Fallback to post timestamp
    return formatFallbackDate(postDate);
}

function formatFallbackDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${d.getFullYear()}`;
}

/**
 * Extract time from caption.
 */
function extractTime(caption) {
    // Look for common time patterns
    const match = caption.match(/(?:doors|vrata|start|početak|at|od|from|um)?\s*(\d{1,2})[:.h](\d{2})\s*(?:h|hrs|sati)?/i);
    if (match) {
        const hours = parseInt(match[1]);
        const minutes = match[2] || '00';
        // Nightclub events are typically between 20:00-06:00
        if (hours >= 0 && hours <= 23) {
            return `${String(hours).padStart(2, '0')}:${minutes}`;
        }
    }

    // Try just hour format "22h", "23H"
    const hourMatch = caption.match(/\b(\d{1,2})\s*h\b/i);
    if (hourMatch) {
        const hours = parseInt(hourMatch[1]);
        if (hours >= 18 || hours <= 6) {
            return `${String(hours).padStart(2, '0')}:00`;
        }
    }

    return '';
}

/**
 * Extract description — everything after the title, minus hashtags and mentions.
 */
function extractDescription(lines, title) {
    if (lines.length <= 1) return '';

    // Take lines after the title, filter out pure hashtag/mention lines
    const descLines = lines.slice(1).filter(line => {
        // Skip lines that are just hashtags or mentions
        if (/^[#@]/.test(line) && !line.includes(' ')) return false;
        // Skip lines that are mostly hashtags
        const hashCount = (line.match(/#/g) || []).length;
        const words = line.split(/\s+/).length;
        if (hashCount > words / 2) return false;
        return true;
    });

    let desc = descLines.join(' ').trim();

    // Remove hashtags from within the description
    desc = desc.replace(/#\S+/g, '').trim();
    // Remove @mentions
    desc = desc.replace(/@\S+/g, '').trim();
    // Clean up multiple spaces
    desc = desc.replace(/\s{2,}/g, ' ').trim();
    // Remove emojis
    desc = desc.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();

    // Cap description length
    if (desc.length > 200) {
        desc = desc.substring(0, 197).trim() + '…';
    }

    return desc;
}

module.exports = { parseCaption };
