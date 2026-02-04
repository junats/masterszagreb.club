import { Receipt, Category, Goal, GoalType, CustodyDay } from '@common/types';

export type SeedScenario = 'good' | 'average' | 'bad';


// --- HEALTH/GOOD ---
// Product Database with strict scenario alignment
// Product Database with strict scenario alignment
const dummyProducts: { name: string, price: number, store: string, category: Category, goalType?: GoalType, scenario: string[], isChild?: boolean, isRestricted?: boolean }[] = [
    // BAD SCENARIO ITEMS (High Cost / Unhealthy / Impulsive)
    { name: 'Craft Beer Crate', price: 45.00, store: 'Off License', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL, scenario: ['bad'], isRestricted: true },
    { name: 'Vodka bottle', price: 32.00, store: 'Tesco', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL, scenario: ['bad'], isRestricted: true },
    { name: 'Mega Burger Meal', price: 18.50, store: 'McDonalds', category: Category.DINING, goalType: GoalType.JUNK_FOOD, scenario: ['bad'] },
    { name: 'Late Night Pizza', price: 24.00, store: 'Domino\'s', category: Category.DINING, goalType: GoalType.JUNK_FOOD, scenario: ['bad', 'average'] },
    { name: 'Online Bet', price: 50.00, store: 'PaddyPower', category: Category.LUXURY, goalType: GoalType.GAMBLING, scenario: ['bad'], isRestricted: true },
    { name: 'Lotto Ticket', price: 10.00, store: 'Centra', category: Category.LUXURY, goalType: GoalType.GAMBLING, scenario: ['bad', 'average'], isRestricted: true },
    { name: 'New Video Game', price: 70.00, store: 'GameStop', category: Category.LUXURY, goalType: GoalType.GAMING, scenario: ['bad', 'average'] },
    { name: 'Vape Juice', price: 12.00, store: 'Vape Shop', category: Category.HEALTH, goalType: GoalType.SMOKING, scenario: ['bad'], isRestricted: true },
    { name: 'Cigarettes', price: 16.50, store: 'Spar', category: Category.HEALTH, goalType: GoalType.SMOKING, scenario: ['bad'], isRestricted: true },
    { name: 'Cinema Tickets', price: 30.00, store: 'Odeon', category: Category.LUXURY, goalType: undefined, scenario: ['bad', 'average'] },

    // GOOD SCENARIO ITEMS (Essential / Healthy / Responsible)
    { name: 'Weekly Groceries', price: 85.00, store: 'Aldi', category: Category.FOOD, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Fresh Vegetables', price: 12.50, store: 'Lidl', category: Category.FOOD, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Gym Membership', price: 40.00, store: 'Flyefit', category: Category.HEALTH, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Book', price: 15.00, store: 'Easons', category: Category.EDUCATION, goalType: undefined, scenario: ['good'] },
    { name: 'School Supplies', price: 25.00, store: 'Tesco', category: Category.EDUCATION, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Bus Fare', price: 2.00, store: 'Dublin Bus', category: Category.TRANSPORT, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Chemistry Set', price: 35.00, store: 'Smyths', category: Category.EDUCATION, goalType: undefined, scenario: ['good'] },
    { name: 'Savings Transfer', price: 100.00, store: 'Bank', category: Category.OTHER, goalType: GoalType.SAVINGS, scenario: ['good'] },

    // AVERAGE MIX (Standard Irish items)
    { name: 'Coffee', price: 4.50, store: 'Starbucks', category: Category.FOOD, goalType: GoalType.CAFFEINE, scenario: ['average', 'bad'] },
    { name: 'Lunch Deal', price: 8.00, store: 'Centra', category: Category.FOOD, goalType: undefined, scenario: ['average', 'good'] },
    { name: 'Petrol', price: 50.00, store: 'Circle K', category: Category.TRANSPORT, goalType: undefined, scenario: ['average', 'good', 'bad'] },
    { name: 'Electricity Bill', price: 120.00, store: 'Electric Ireland', category: Category.NECESSITY, goalType: undefined, scenario: ['good', 'average', 'bad'] },
    { name: 'Internet Bill', price: 45.00, store: 'Virgin Media', category: Category.NECESSITY, goalType: undefined, scenario: ['good', 'average', 'bad'] },

    // CO-PARENTING / CHILD ITEMS (Crucial for testing mode)
    { name: 'School Uniform', price: 65.00, store: 'M&S', category: Category.EDUCATION, goalType: undefined, scenario: ['average', 'good'], isChild: true },
    { name: 'Child Maintenance', price: 200.00, store: 'Bank Transfer', category: 'Child' as any, goalType: undefined, scenario: ['average', 'good', 'bad'], isChild: true },
    { name: 'Nappies', price: 14.00, store: 'Tesco', category: 'Child' as any, goalType: undefined, scenario: ['average', 'good', 'bad'], isChild: true },
    { name: 'Toy Store', price: 45.00, store: 'Smyths', category: Category.LUXURY, goalType: undefined, scenario: ['average', 'bad'], isChild: true },
    { name: 'Kids Shoes', price: 35.00, store: 'Clarks', category: Category.NECESSITY, goalType: undefined, scenario: ['average', 'good'], isChild: true },
    { name: 'Swimming Lessons', price: 80.00, store: 'Local Pool', category: Category.EDUCATION, goalType: undefined, scenario: ['good', 'average'], isChild: true },
];

export const generateScenarioData = (scenario: SeedScenario, months: number = 3): { receipts: Receipt[], custodyDays: CustodyDay[], goals: Goal[], monthlyBudget: number } => {
    const receipts: Receipt[] = [];
    const custodyDays: CustodyDay[] = [];
    const now = new Date();

    // Budget Logic
    const monthlyBudget = scenario === 'good' ? 3000 : scenario === 'average' ? 2000 : 1000;

    // Helper to add receipt
    const mkReceipt = (date: Date, product: typeof dummyProducts[0], overridePrice?: number): void => {
        const price = overridePrice || product.price;
        receipts.push({
            id: `seed_${Date.now()}_${receipts.length}`,
            storeName: product.store,
            date: date.toISOString(),
            total: price,
            items: [{
                name: product.name,
                price: price,
                quantity: 1,
                category: product.category,
                isChildRelated: product.isChild || false,
                isRestricted: product.isRestricted || false
            }],
            scannedAt: new Date().toISOString(),
            type: 'receipt',
            categoryId: product.category
        });
    };

    // 1. GUARANTEE "TODAY" DATA (For Daily View)
    // ------------------------------------------------
    const today = new Date(now);

    if (scenario === 'bad') {
        // Trigger Late Night Insight (2AM today)
        const lateNight = new Date(today); lateNight.setHours(2, 30);
        const pizza = dummyProducts.find(p => p.name === 'Late Night Pizza') || dummyProducts[0];
        mkReceipt(lateNight, pizza, 65.00); // > €50 limit

        // Trigger Goal Violation (Junk Food)
        const lunch = new Date(today); lunch.setHours(13, 15);
        mkReceipt(lunch, dummyProducts.find(p => p.name === 'Mega Burger Meal')!);
    } else {
        // Good/Average: Just normal healthy lunch today
        const lunch = new Date(today); lunch.setHours(13, 0);
        mkReceipt(lunch, dummyProducts.find(p => p.name === 'Lunch Deal')!);
    }

    // 2. GUARANTEE "THIS WEEK" DATA (For Weekly View)
    // ------------------------------------------------
    // Add receipts for last 6 days
    for (let i = 1; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(14, 0);

        if (scenario === 'bad') {
            // Daily Splurge
            mkReceipt(d, dummyProducts.find(p => p.name === 'Cinema Tickets')!);
            mkReceipt(d, dummyProducts.find(p => p.name === 'Vodka bottle')!);
        } else if (scenario === 'average') {
            // Normal spread
            if (i % 2 === 0) mkReceipt(d, dummyProducts.find(p => p.name === 'Weekly Groceries')!);
        } else {
            // Good: minimal spend
            if (i === 3) mkReceipt(d, dummyProducts.find(p => p.name === 'Weekly Groceries')!);
        }
    }

    // 3. INSIGHT TRIGGERS (Historical / Patterns)
    // ------------------------------------------------

    // Weekend Splurge (Average Scenario)
    if (scenario === 'average') {
        // Find last Saturday
        const d = new Date(now);
        d.setDate(d.getDate() - (d.getDay() + 1)); // Go back to Sat
        d.setHours(20, 0);

        // Massive spend on Sat
        mkReceipt(d, dummyProducts.find(p => p.name === 'Craft Beer Crate')!, 150.00);
        mkReceipt(d, dummyProducts.find(p => p.name === 'Online Bet')!, 100.00);
    }

    // Category Drift (Bad Scenario)
    if (scenario === 'bad') {
        // Pump luxury to > 35% of budget (€1000) -> Need > €350 Luxury
        const d = new Date(now);
        d.setDate(d.getDate() - 2);
        mkReceipt(d, dummyProducts.find(p => p.name === 'New Video Game')!, 400.00);
    }

    // Co-Parenting / Child Items (All Scenarios to test filter)
    // Distributed randomly over the month
    for (let i = 0; i < 4; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7) - 2); // Every weekish
        d.setHours(10, 0);
        const childItem = dummyProducts.filter(p => p.isChild)[i % dummyProducts.filter(p => p.isChild).length];
        mkReceipt(d, childItem);
    }


    // 4. RANDOM FILL (For Month View density)
    // ------------------------------------------------
    const daysToGen = months * 30;
    for (let i = 7; i < daysToGen; i++) {
        if (Math.random() > 0.3) continue; // Skip some days

        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(Math.floor(Math.random() * 12) + 8); // Daytime

        const validProducts = dummyProducts.filter(p => p.scenario.includes(scenario));
        const p = validProducts[Math.floor(Math.random() * validProducts.length)];

        // Don't accidentally minimize 'Bad' scenario spending too much
        mkReceipt(d, p);
    }


    // 2. Generate Custody Days (Matches Dashboard logic)
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const d = new Date(now);
        d.setDate(d.getDate() - 60 + dayOffset); // Start 2 months ago
        const dateStr = d.toISOString().split('T')[0];

        let status: 'me' | 'partner' | 'none' = 'none';

        if (scenario === 'good') {
            status = (dayOffset % 4 < 2) ? 'me' : 'partner';
        } else if (scenario === 'average') {
            const day = d.getDay();
            if (day === 0 || day === 6 || day === 3) status = 'me';
            else status = 'partner';
        } else {
            status = Math.random() > 0.8 ? 'me' : 'partner';
        }

        custodyDays.push({
            date: dateStr,
            status: status,
            note: ''
        });
    }

    // 3. Goals
    const goals: Goal[] = [
        { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: true, keywords: ['mcdonalds'], streak: scenario === 'good' ? 45 : 0, emoji: '🍔' },
        { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', isEnabled: true, keywords: ['beer', 'vodka'], streak: scenario === 'good' ? 30 : 0, emoji: '🍺' },
        { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: scenario === 'good' ? 60 : 5, emoji: '💰' }
    ];

    return { receipts, custodyDays, goals, monthlyBudget };
};
