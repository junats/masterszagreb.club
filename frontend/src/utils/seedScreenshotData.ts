import { Receipt, Category, Goal, GoalType, CustodyDay, CalendarActivity } from '@common/types';

export const generateScreenshotData = (): { receipts: Receipt[], custodyDays: CustodyDay[], goals: Goal[], monthlyBudget: number } => {
    const receipts: Receipt[] = [];
    const custodyDays: CustodyDay[] = [];
    const now = new Date();

    // Budget: Looks good for a hero screenshot
    const monthlyBudget = 2000;

    // Helper to add receipt
    let receiptIdCounter = 1;
    const mkReceipt = (daysAgo: number, timeStr: string, store: string, name: string, price: number, category: Category | string, isChild: boolean = false): void => {
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        const [hours, minutes] = timeStr.split(':');
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        receipts.push({
            id: `screenshot_${Date.now()}_${receiptIdCounter++}`,
            storeName: store,
            date: d.toISOString(),
            total: price,
            items: [{
                name: name,
                price: price,
                quantity: 1,
                category: category as any,
                isChildRelated: isChild,
                isRestricted: false
            }],
            scannedAt: new Date().toISOString(),
            type: 'receipt',
            categoryId: category as any
        });
    };

    // --- 1. HERO SCREEN (Dashboard) & ANALYTICS ---
    // Make recent activity look beautiful with a mix of colors (categories)
    mkReceipt(0, "14:30", "Whole Foods", "Weekly Groceries", 84.20, Category.FOOD);
    mkReceipt(0, "09:15", "Starbucks", "Morning Coffee", 4.50, Category.FOOD);
    mkReceipt(1, "18:00", "Local Soccer Club", "Kids Tournament Fee", 45.00, Category.EDUCATION, true);
    mkReceipt(2, "12:00", "Target", "Diapers & Wipes", 29.99, 'Child', true);
    mkReceipt(2, "08:30", "Circle K", "Fuel", 55.00, Category.TRANSPORT);
    mkReceipt(3, "19:00", "Luigi's Italian", "Family Dinner", 75.50, Category.DINING);
    mkReceipt(5, "10:00", "Pediatrician", "Checkup Co-pay", 30.00, Category.HEALTH, true);

    // Add some history for the charts to look full and realistic
    for (let i = 7; i < 90; i++) {
        if (Math.random() > 0.4) {
            mkReceipt(i, "12:00", "Supermarket", "Groceries", Math.floor(Math.random() * 50) + 20, Category.FOOD);
        }
        if (i % 7 === 0) {
            mkReceipt(i, "09:00", "Gas Station", "Fuel", 50, Category.TRANSPORT);
        }
        if (i % 14 === 0) {
            mkReceipt(i, "15:00", "Clothing Store", "Kids Clothes", 45, 'Child', true);
        }
    }

    // --- 2. CO-PARENTING SUMMARY ---
    // Generate Custody Days
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const d = new Date(now);
        d.setDate(d.getDate() - 60 + dayOffset);
        const dateStr = d.toISOString().split('T')[0];
        const daysFromToday = dayOffset - 60;

        let status: 'me' | 'partner' | 'split' | 'none' = 'none';

        // 2-2-5-5 Schedule pattern commonly used
        const cycleDay = dayOffset % 14;
        if (cycleDay < 2) status = 'me'; // Mon, Tue
        else if (cycleDay < 4) status = 'partner'; // Wed, Thu
        else if (cycleDay < 9) status = 'me'; // Fri, Sat, Sun, Mon, Tue
        else if (cycleDay < 11) status = 'partner'; // Wed, Thu
        else status = 'partner'; // Fri, Sat, Sun

        // Add some realistic activities
        const activities: CalendarActivity[] = [];
        if (daysFromToday === 1) { // Tomorrow
            activities.push({ id: `act_sport_${dayOffset}`, title: 'Soccer Practice', type: 'sport', startTime: '16:00', endTime: '17:30' });
        }
        if (daysFromToday === 3) {
            activities.push({ id: `act_school_${dayOffset}`, title: 'Parent-Teacher Meeting', type: 'school', startTime: '18:00', endTime: '19:00' });
        }
        if (daysFromToday === 0) { // Today
            activities.push({ id: `act_med_${dayOffset}`, title: 'Dentist Checkup', type: 'other', startTime: '15:00', endTime: '16:00' });
        }

        custodyDays.push({
            date: dateStr,
            status: status,
            note: '',
            activities,
            withYou: status === 'me' || status === 'split'
        });
    }

    // --- 3. GOALS ---
    const goals: Goal[] = [
        { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: true, keywords: ['mcdonalds'], streak: 12, emoji: '🍔' },
        { id: 'impulse', type: GoalType.ONLINE_SHOPPING, name: 'Impulse Control', isEnabled: true, keywords: ['amazon'], streak: 24, emoji: '🧠' },
        { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: 45, emoji: '💰' }
    ];

    return { receipts, custodyDays, goals, monthlyBudget };
};
