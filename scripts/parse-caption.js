/**
 * parse-caption.js
 * Extracts structured event data from Instagram captions.
 */

// Common date patterns found in nightclub Instagram captions:
const DATE_PATTERNS = [
    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
    // DD.MM. (no year — assume current/next occurrence)
    /(\d{1,2})[.\/-](\d{1,2})\./,
    // Written months (English) with optional ordinals (rd, th, st, nd)
    /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
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

const WEEKDAYS = {
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0,
    'ponedjeljak': 1, 'utorak': 2, 'srijeda': 3, 'četvrtak': 4, 'petak': 5, 'subota': 6, 'nedjelja': 0,
    'pon': 1, 'uto': 2, 'sri': 3, 'čet': 4, 'pet': 5, 'sub': 6, 'ned': 0
};

// Time patterns: "22:00", "22h", "23.00", "at 22:00", "doors 22:00"
const TIME_PATTERNS = [
    /(?:doors|vrata|start|početak|at|od|from)?\s*(\d{1,2})[:.h](\d{2})?\s*(?:h|hrs|sati)?/i,
];

/**
 * Parse an Instagram caption into structured event data.
 * @param {string} caption - Raw Instagram caption text
 * @param {string} postDate - ISO timestamp of the post (reference date)
 * @returns {{ title: string, date: string, time: string, description: string }}
 */
function parseCaption(caption, postDate) {
    if (!caption) {
        return {
            title: 'MASTERS EVENT',
            date: '', // No date found
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
 * Extract a date from the caption text, using postDate as reference.
 */
function extractDate(caption, postDateStr) {
    const postDate = new Date(postDateStr);
    const referenceDate = isNaN(postDate.getTime()) ? new Date() : postDate;
    const currentYear = referenceDate.getFullYear();
    const lcCaption = caption.toLowerCase();

    // 1. Check for relative terms (Tonight, Tomorrow, Večeras, Sutra)
    if (lcCaption.includes('večeras') || lcCaption.includes('tonight')) {
        return formatDateObject(referenceDate);
    }
    
    if (lcCaption.includes('sutra') || lcCaption.includes('tomorrow')) {
        const tomorrow = new Date(referenceDate);
        tomorrow.setDate(referenceDate.getDate() + 1);
        return formatDateObject(tomorrow);
    }

    // 2. Try DD.MM.YYYY first
    let match = caption.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        return `${day}.${month}.${match[3]}`;
    }

    // 3. DD.MM. (no year)
    match = caption.match(/(\d{1,2})[.\/-](\d{1,2})\./);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        // Assume current year if it's near or after postDate, or next year if it's in the past relative to postDate
        let year = currentYear;
        const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
        if (testDate < referenceDate && (referenceDate - testDate) > 1000 * 60 * 60 * 24 * 60) {
            // More than 60 days in the past? Assume next year.
            year++;
        }
        return `${day}.${month}.${year}`;
    }

    // 4. English month names with ordinals
    match = caption.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = String(ENGLISH_MONTHS[match[2].toLowerCase()]).padStart(2, '0');
        return `${day}.${month}.${currentYear}`;
    }
    match = caption.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
    if (match) {
        const day = match[2].padStart(2, '0');
        const month = String(ENGLISH_MONTHS[match[1].toLowerCase()]).padStart(2, '0');
        return `${day}.${month}.${currentYear}`;
    }

    // 5. Croatian month names
    match = caption.match(/(\d{1,2})\.\s*(siječnja|veljače|ožujka|travnja|svibnja|lipnja|srpnja|kolovoza|rujna|listopada|studenoga|prosinca)/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = String(CROATIAN_MONTHS[match[2].toLowerCase()]).padStart(2, '0');
        return `${day}.${month}.${currentYear}`;
    }

    // 6. Weekday mention (This Friday, Saturday, etc.)
    // Only if it's near the start of the caption or mentions "Petak" / "Friday"
    for (const [name, dayIndex] of Object.entries(WEEKDAYS)) {
        if (lcCaption.includes(name)) {
            const date = new Date(referenceDate);
            const currentDay = referenceDate.getDay();
            let daysAhead = (dayIndex - currentDay + 7) % 7;
            
            // If it's the same day, assume next week unless "tonight" or "večeras" is mentioned
            if (daysAhead === 0 && !lcCaption.includes('večeras') && !lcCaption.includes('tonight')) {
                daysAhead = 7;
            }
            
            date.setDate(referenceDate.getDate() + daysAhead);
            return formatDateObject(date);
        }
    }

    // No date found - return empty string to indicate "TBD"
    return '';
}

function formatDateObject(d) {
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
        if (hours >= 18 || hours <= 23 || hours <= 6) {
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
