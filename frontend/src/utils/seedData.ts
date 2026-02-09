import { Receipt, Category, Goal, GoalType, CustodyDay, CalendarActivity } from '@common/types';

export type SeedScenario = 'good' | 'average' | 'bad';


// --- HEALTH/GOOD ---
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
    { name: 'Zoo Family Ticket', price: 65.00, store: 'Dublin Zoo', category: Category.LUXURY, goalType: undefined, scenario: ['good', 'average'], isChild: true },
];

const SAMPLE_ACTIVITIES: { title: string, type: CalendarActivity['type'] }[] = [
    { title: 'Soccer Training', type: 'sport' },
    { title: 'Swimming Lesson', type: 'sport' },
    { title: 'Piano Lesson', type: 'school' },
    { title: 'Doctor Appointment', type: 'other' },
    { title: 'Birthday Party', type: 'birthday' },
    { title: 'School Play', type: 'school' },
    { title: 'Family Visit', type: 'other' },
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

    // 1. GUARANTEE "TODAY" DATA (For Daily View) & INSIGHTS
    // ------------------------------------------------
    const today = new Date(now);

    // Inject High Spend on Today for "Spending Insight" test
    // If scenario is Bad or Average, ensure we have a high spend today
    if (scenario !== 'good') {
        const zooTrip = dummyProducts.find(p => p.name === 'Zoo Family Ticket') || dummyProducts[0];
        mkReceipt(today, zooTrip, 65.00);
    } else {
        const lunch = new Date(today); lunch.setHours(13, 0);
        mkReceipt(lunch, dummyProducts.find(p => p.name === 'Lunch Deal')!);
    }

    if (scenario === 'bad') {
        // Late Night Trigger
        const lateNight = new Date(today); lateNight.setHours(2, 30);
        const pizza = dummyProducts.find(p => p.name === 'Late Night Pizza') || dummyProducts[0];
        mkReceipt(lateNight, pizza, 65.00);
    }

    // 2. GUARANTEE "THIS WEEK" DATA (For Weekly View)
    // ------------------------------------------------
    for (let i = 1; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(14, 0);

        if (scenario === 'bad') {
            mkReceipt(d, dummyProducts.find(p => p.name === 'Cinema Tickets')!);
            mkReceipt(d, dummyProducts.find(p => p.name === 'Vodka bottle')!);
        } else if (scenario === 'average') {
            if (i % 2 === 0) mkReceipt(d, dummyProducts.find(p => p.name === 'Weekly Groceries')!);
        } else {
            if (i === 3) mkReceipt(d, dummyProducts.find(p => p.name === 'Weekly Groceries')!);
        }
    }

    // 3. INSIGHT TRIGGERS (Historical / Patterns)
    // ------------------------------------------------
    if (scenario === 'average') {
        const d = new Date(now);
        d.setDate(d.getDate() - (d.getDay() + 1)); // Go back to Sat
        d.setHours(20, 0);
        mkReceipt(d, dummyProducts.find(p => p.name === 'Craft Beer Crate')!, 150.00);
    }

    if (scenario === 'bad') {
        const d = new Date(now);
        d.setDate(d.getDate() - 2);
        mkReceipt(d, dummyProducts.find(p => p.name === 'New Video Game')!, 400.00);
    }

    // Co-Parenting / Child Items (All Scenarios)
    for (let i = 0; i < 4; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7) - 2);
        d.setHours(10, 0);
        const childItem = dummyProducts.filter(p => p.isChild)[i % dummyProducts.filter(p => p.isChild).length];
        mkReceipt(d, childItem);
    }

    // 4. RANDOM FILL (For Month View density)
    // ------------------------------------------------
    const daysToGen = months * 30;
    for (let i = 7; i < daysToGen; i++) {
        if (Math.random() > 0.3) continue;

        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(Math.floor(Math.random() * 12) + 8);

        const validProducts = dummyProducts.filter(p => p.scenario.includes(scenario));
        const p = validProducts[Math.floor(Math.random() * validProducts.length)];
        mkReceipt(d, p);
    }


    // 5. Generate Custody Days (Matches Dashboard logic)
    // ------------------------------------------------
    // Range: 2 months back to 1 month forward (90 days total)
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
        const d = new Date(now);
        d.setDate(d.getDate() - 60 + dayOffset); // Start 60 days ago
        const dateStr = d.toISOString().split('T')[0];
        const isToday = dayOffset === 60;
        const daysFromToday = dayOffset - 60;

        let status: 'me' | 'partner' | 'split' | 'none' = 'none';

        // INTELLIGENT PATTERN GENERATION
        if (daysFromToday >= 0 && daysFromToday <= 4) {
            // FORCE STREAK: Today + Next 4 Days = ME (Triggers 'Streak Incoming' insight)
            status = 'me';
        } else if (daysFromToday === 5) {
            // Forcing transition
            status = 'split';
        } else {
            // Standard Pattern
            if (scenario === 'good') {
                status = (dayOffset % 4 < 2) ? 'me' : 'partner';
            } else if (scenario === 'average') {
                const day = d.getDay();
                if (day === 0 || day === 6 || day === 3) status = 'me';
                else status = 'partner';
            } else {
                status = Math.random() > 0.8 ? 'me' : 'partner';
            }
        }

        // Add Activities
        const activities: CalendarActivity[] = [];
        // Add activity if 'me' or 'split', random chance
        // FORCE ACTIVITY for Tomorrow (daysFromToday === 1)
        if (daysFromToday === 1) {
            activities.push({
                id: `act_${dayOffset}`,
                title: 'Soccer Finals',
                type: 'sport',
                startTime: '10:00',
                endTime: '12:00'
            });
        }
        // Force activity for Today
        else if (isToday) {
            activities.push({
                id: `act_${dayOffset}`,
                title: 'Piano Lesson',
                type: 'school',
                startTime: '16:00',
                endTime: '17:00'
            });
        }
        else if ((status === 'me' || status === 'split') && Math.random() > 0.7) {
            const act = SAMPLE_ACTIVITIES[Math.floor(Math.random() * SAMPLE_ACTIVITIES.length)];
            activities.push({
                id: `act_${dayOffset}`,
                title: act.title,
                type: act.type
            });
        }

        custodyDays.push({
            date: dateStr,
            status: status as any,
            note: '',
            activities,
            withYou: status === 'me' || status === 'split'
        });
    }

    // 6. Goals
    const goals: Goal[] = [
        { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: true, keywords: ['mcdonalds'], streak: scenario === 'good' ? 45 : 0, emoji: '🍔' },
        { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', isEnabled: true, keywords: ['beer', 'vodka'], streak: scenario === 'good' ? 30 : 0, emoji: '🍺' },
        { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: scenario === 'good' ? 60 : 5, emoji: '💰' }
    ];

    return { receipts, custodyDays, goals, monthlyBudget };
};
