import { CategoryDefinition, Goal, GoalType } from '@common/types';

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
    { id: 'necessity', name: 'Necessity', color: '#38bdf8' }, // Sky
    { id: 'food', name: 'Food', color: '#4ade80' },           // Green
    { id: 'dining', name: 'Dining', color: '#f97316' },       // Orange
    { id: 'alcohol', name: 'Alcohol', color: '#ef4444' },     // Red
    { id: 'luxury', name: 'Luxury', color: '#f472b6' },       // Pink
    { id: 'household', name: 'Household', color: '#818cf8' }, // Indigo
    { id: 'health', name: 'Health', color: '#fb7185' },       // Rose
    { id: 'transport', name: 'Transport', color: '#facc15' }, // Yellow
    { id: 'education', name: 'Education', color: '#6366f1' }, // Indigo
    { id: 'other', name: 'Other', color: '#94a3b8' },         // Slate
];

export const DEFAULT_GOALS: Goal[] = [
    { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: false, keywords: ['mcdonalds', 'kfc', 'burger king', 'pizza', 'chips', 'candy', 'chocolate', 'takeaway', 'fast food'], streak: 0, emoji: '🍔' },
    { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', isEnabled: false, keywords: ['beer', 'wine', 'vodka', 'whiskey', 'liquor', 'alcohol', 'pub', 'bar', 'off license'], streak: 0, emoji: '🍺' },
    { id: 'impulse_buy', type: GoalType.ONLINE_SHOPPING, name: 'Impulse Control', isEnabled: true, keywords: ['amazon', 'temu', 'shein', 'wish', 'aliexpress'], streak: 7, emoji: '🧠' }, // AI Based
    { id: 'subscriptions', type: GoalType.STREAMING, name: 'Sub Fatigue', isEnabled: true, keywords: ['netflix', 'spotify', 'apple', 'adobe', 'prime', 'hulu', 'disney'], streak: 30, emoji: '📉' }, // AI Based
    { id: 'late_night', type: GoalType.JUNK_FOOD, name: 'Late Night Eats', isEnabled: true, keywords: ['uber eats', 'deliveroo', 'just eat', 'dominos', 'mcdonalds'], streak: 3, emoji: '🌙' }, // AI Based
    { id: 'gambling', type: GoalType.GAMBLING, name: 'Stop Gambling', isEnabled: false, keywords: ['bet', 'casino', 'lottery', 'lotto', 'poker', 'bookmakers', 'ladbrokes', 'paddy power'], streak: 0, emoji: '🎰' },
    { id: 'caffeine', type: GoalType.CAFFEINE, name: 'Cut Caffeine', isEnabled: false, keywords: ['coffee', 'starbucks', 'costa', 'espresso', 'latte', 'caffeine', 'energy drink', 'red bull', 'monster'], streak: 0, emoji: '☕' },
    { id: 'sugar', type: GoalType.SUGAR, name: 'Reduce Sugar', isEnabled: false, keywords: ['sugar', 'cake', 'cookies', 'donuts', 'sweets', 'soda', 'coke', 'pepsi', 'ice cream'], streak: 0, emoji: '🍩' },
    { id: 'tech_spend', type: GoalType.ONLINE_SHOPPING, name: 'Tech Detox', isEnabled: false, keywords: ['apple', 'currys', 'pc world', 'steam', 'game', 'amazon'], streak: 0, emoji: '🔌' },
    { id: 'fast_fashion', type: GoalType.FAST_FASHION, name: 'Avoid Fast Fashion', isEnabled: false, keywords: ['zara', 'h&m', 'primark', 'shein', 'boohoo', 'forever 21'], streak: 0, emoji: '👗' },
    { id: 'ride_sharing', type: GoalType.RIDE_SHARING, name: 'Walk More', isEnabled: false, keywords: ['uber', 'lyft', 'taxi', 'bolt', 'freenow'], streak: 0, emoji: '🚶' },
    { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: 15, emoji: '💰' },
];
