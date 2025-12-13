import { Receipt, CustodyDay, Goal, GoalType, Category, CustodyStatus } from '../types';

export const generateDemoData = (type: 'good' | 'bad') => {
    const today = new Date();
    const receipts: Receipt[] = [];
    const custodyDays: CustodyDay[] = [];
    const goals: Goal[] = [];

    // Helper to add days
    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    // --- 1. SPENDING DATA (6 Months) ---
    // Good: Under budget (e.g. 250/mo), Healthy priorities
    // Bad: Over budget (e.g. 600/mo), Luxury/Alcohol heavy

    for (let i = 0; i < 180; i++) {
        const date = addDays(today, -i);
        const dateStr = date.toISOString().split('T')[0];

        // Random chance of transaction
        if (Math.random() > 0.4) {
            let store: string;
            let items: any[] = [];
            let total = 0;

            if (type === 'good') {
                // Healthy / Responsible
                const stores = ['Tesco', 'Lidl', 'Aldi', 'Pharmacy'];
                store = stores[Math.floor(Math.random() * stores.length)];

                // Mostly Essentials
                if (Math.random() > 0.3) {
                    items.push({ name: 'Vegetables', price: 2 + Math.random() * 3, category: 'Food' });
                    items.push({ name: 'Bread', price: 1.5, category: 'Food' });
                    items.push({ name: 'Milk', price: 1.2, category: 'Food' });
                } else {
                    items.push({ name: 'Medicine', price: 5 + Math.random() * 5, category: 'Health' });
                }
            } else {
                // Unhealthy / Overspending
                const stores = ['Zara', 'Off License', 'McDonalds', 'TechStore', 'Pub'];
                store = stores[Math.floor(Math.random() * stores.length)];

                if (store === 'Zara') {
                    items.push({ name: 'Jacket', price: 45 + Math.random() * 20, category: 'Luxury' });
                } else if (store === 'Pub') {
                    items.push({ name: 'Drinks', price: 30 + Math.random() * 20, category: 'Alcohol' });
                } else if (store === 'McDonalds') {
                    items.push({ name: 'Burger Meal', price: 12, category: 'Dining' });
                } else {
                    items.push({ name: 'Gadget', price: 25, category: 'Luxury' });
                }
            }

            total = items.reduce((sum, item) => sum + item.price, 0);

            if (items.length > 0) {
                receipts.push({
                    id: `demo-r-${i}`,
                    storeName: store,
                    date: dateStr, // YYYY-MM-DD
                    total: total,
                    items: items.map(it => ({ ...it, quantity: 1, isRestricted: false, isChildRelated: false })),
                    imagePath: '',
                    timestamp: date.getTime(),
                    isVerified: true
                });
            }
        }
    }

    // --- 2. CUSTODY DATA (Next 3 Months + Past 3 Months) ---
    // Good: 50/50, Balanced Weekends
    // Bad: 90/10 (Sole Custody), Skewed Weekends

    for (let i = -90; i < 90; i++) {
        const date = addDays(today, i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay(); // 0 = Sun

        let status: CustodyStatus = 'me';
        const activities: any[] = [];

        if (type === 'good') {
            // 2-2-3 Schedule or Alternating Weeks
            // Simple alt weeks
            const weekNum = Math.floor((date.getTime() / (7 * 24 * 60 * 60 * 1000)));
            status = weekNum % 2 === 0 ? 'me' : 'partner';

            // Activities (Balanced)
            if (status === 'me') {
                if (dayOfWeek === 6) activities.push({ id: `a-${i}`, title: 'Soccer', type: 'sport' });
                if (dayOfWeek === 1) activities.push({ id: `b-${i}`, title: 'School', type: 'school' });
            }
        } else {
            // Skewed (Me 90%)
            status = Math.random() > 0.1 ? 'me' : 'partner';

            // Overloaded Activities
            if (status === 'me') {
                if (dayOfWeek !== 0) activities.push({ id: `c-${i}`, title: 'School', type: 'school' });
                if (dayOfWeek === 2 || dayOfWeek === 4) activities.push({ id: `d-${i}`, title: 'Training', type: 'sport' });
                if (dayOfWeek === 6) {
                    activities.push({ id: `e-${i}`, title: 'Match', type: 'sport' });
                    activities.push({ id: `f-${i}`, title: 'Party', type: 'other' });
                }
            }
        }

        custodyDays.push({
            date: dateStr,
            status: status,
            note: '',
            activities: activities
        });
    }

    // --- 3. GOALS / HABITS ---
    // Good: High streaks on good habits, low on bad
    // Bad: Failed streaks

    const goalTemplates = [
        { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', goodStreak: 45, badStreak: 0, emoji: '🍺' },
        { id: 'smoking', type: GoalType.SMOKING, name: 'Quit Smoking', goodStreak: 120, badStreak: 0, emoji: '🚬' },
        { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', goodStreak: 30, badStreak: 0, emoji: '💰' },
        { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', goodStreak: 15, badStreak: 0, emoji: '🍔' },
    ];

    goals.push(...goalTemplates.map(t => ({
        ...t,
        isEnabled: true,
        streak: type === 'good' ? t.goodStreak : t.badStreak,
        keywords: [] // simplified
    })));

    return { receipts, custodyDays, goals };
};
