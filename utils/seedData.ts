import { Receipt, Category, Goal, GoalType, CustodyDay } from '../types';

export type SeedScenario = 'good' | 'average' | 'bad';


// --- HEALTH/GOOD ---
// Product Database with strict scenario alignment
const dummyProducts = [
    // BAD SCENARIO ITEMS (High Cost / Unhealthy / Impulsive)
    { name: 'Craft Beer Crate', price: 45.00, store: 'Off License', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL, scenario: ['bad'] },
    { name: 'Vodka bottle', price: 32.00, store: 'Tesco', category: Category.ALCOHOL, goalType: GoalType.ALCOHOL, scenario: ['bad'] },
    { name: 'Mega Burger Meal', price: 18.50, store: 'McDonalds', category: Category.DINING, goalType: GoalType.JUNK_FOOD, scenario: ['bad'] },
    { name: 'Late Night Pizza', price: 24.00, store: 'Domino\'s', category: Category.DINING, goalType: GoalType.JUNK_FOOD, scenario: ['bad', 'average'] },
    { name: 'Online Bet', price: 50.00, store: 'PaddyPower', category: Category.LUXURY, goalType: GoalType.GAMBLING, scenario: ['bad'] },
    { name: 'Lotto Ticket', price: 10.00, store: 'Centra', category: Category.LUXURY, goalType: GoalType.GAMBLING, scenario: ['bad', 'average'] },
    { name: 'New Video Game', price: 70.00, store: 'GameStop', category: Category.LUXURY, goalType: GoalType.GAMING, scenario: ['bad', 'average'] },
    { name: 'Vape Juice', price: 12.00, store: 'Vape Shop', category: Category.HEALTH, goalType: GoalType.SMOKING, scenario: ['bad'] },
    { name: 'Cigarettes', price: 16.50, store: 'Spar', category: Category.HEALTH, goalType: GoalType.SMOKING, scenario: ['bad'] },
    { name: 'Cinema Tickets', price: 30.00, store: 'Odeon', category: Category.LUXURY, goalType: undefined, scenario: ['bad', 'average'] },

    // GOOD SCENARIO ITEMS (Essential / Healthy / Responsible)
    { name: 'Weekly Groceries', price: 85.00, store: 'Aldi', category: Category.FOOD, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Fresh Vegetables', price: 12.50, store: 'Lidl', category: Category.FOOD, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Gym Membership', price: 40.00, store: 'Flyefit', category: Category.HEALTH, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Book', price: 15.00, store: 'Easons', category: Category.EDUCATION, goalType: undefined, scenario: ['good'] },
    { name: 'School Supplies', price: 25.00, store: 'Tesco', category: Category.EDUCATION, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Bus Fare', price: 2.00, store: 'Dublin Bus', category: Category.TRANSPORT, goalType: undefined, scenario: ['good', 'average'] },
    { name: 'Chemistry Set', price: 35.00, store: 'Smyths', category: Category.EDUCATION, goalType: undefined, scenario: ['good'] },
    { name: 'Savings Transfer', price: 100.00, store: 'Bank', category: Category.SAVINGS, goalType: GoalType.SAVINGS, scenario: ['good'] },

    // AVERAGE MIX (Standard Irish items)
    { name: 'Coffee', price: 4.50, store: 'Starbucks', category: Category.FOOD, goalType: GoalType.CAFFEINE, scenario: ['average', 'bad'] },
    { name: 'Lunch Deal', price: 8.00, store: 'Centra', category: Category.FOOD, goalType: undefined, scenario: ['average', 'good'] },
    { name: 'Petrol', price: 50.00, store: 'Circle K', category: Category.TRANSPORT, goalType: undefined, scenario: ['average', 'good', 'bad'] },
    { name: 'Electricity Bill', price: 120.00, store: 'Electric Ireland', category: Category.NECESSITY, goalType: undefined, scenario: ['good', 'average', 'bad'] },
    { name: 'Internet Bill', price: 45.00, store: 'Virgin Media', category: Category.NECESSITY, goalType: undefined, scenario: ['good', 'average', 'bad'] },
];

export const generateScenarioData = (scenario: SeedScenario, months: number = 3): { receipts: Receipt[], custodyDays: CustodyDay[], goals: Goal[], monthlyBudget: number } => {
    const receipts: Receipt[] = [];
    const custodyDays: CustodyDay[] = [];
    const now = new Date();
    const daysToGen = months * 30;

    // Budget Logic:
    // Good: High budget (€3000), low spend -> Green ambient
    // Average: Moderate budget (€2000), moderate spend -> Yellow/Orange
    // Bad: Low budget (€1000), high spend -> Red ambient
    const monthlyBudget = scenario === 'good' ? 3000 : scenario === 'average' ? 2000 : 1000;

    // 1. Generate Receipts
    for (let dayOffset = 0; dayOffset < daysToGen; dayOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);

        // Time logic for achievements:
        // Bad: Late night (23:00 - 04:00)
        // Good: Early morning (06:00 - 08:00)
        let hour = 14;
        if (scenario === 'bad') hour = Math.random() > 0.5 ? 23 : 2;
        else if (scenario === 'good') hour = Math.random() > 0.7 ? 7 : 12;

        date.setHours(hour, Math.floor(Math.random() * 59));

        const dateStr = date.toISOString().split('T')[0];

        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let dailyCount = scenario === 'bad' ? 4 : scenario === 'good' ? 1 : 2;
        if (isWeekend) dailyCount += 2;

        // Randomize count
        dailyCount = Math.floor(Math.random() * dailyCount) + 1;

        for (let i = 0; i < dailyCount; i++) {
            // Filter products by scenario
            const validProducts = dummyProducts.filter(p => p.scenario.includes(scenario));
            const product = validProducts[Math.floor(Math.random() * validProducts.length)];

            if (!product) continue;

            // Variance logic
            const variance = 1 + (Math.random() * 0.2 - 0.1);
            const price = parseFloat((product.price * variance).toFixed(2));

            receipts.push({
                id: `seed_${Date.now()}_${dayOffset}_${i}`,
                storeName: product.store,
                date: date.toISOString(), // Full ISO for time-based achievements
                total: price,
                items: [{
                    name: product.name,
                    price: price,
                    quantity: 1,
                    category: product.category,
                    isChildRelated: false
                }],
                scannedAt: new Date().toISOString(),
                type: 'receipt',
                categoryId: product.category
            });
        }
    }

    // 2. Generate Custody Days (3 Months)
    // Good: 50/50 split evenly
    // Average: 70/30
    // Bad: Irregular / Low custody
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
    // Good: Enabled and High Streaks
    // Bad: Enabled but Low Streaks (0)
    const goals: Goal[] = [
        { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', isEnabled: true, keywords: ['mcdonalds'], streak: scenario === 'good' ? 45 : 0, emoji: '🍔' },
        { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', isEnabled: true, keywords: ['beer', 'vodka'], streak: scenario === 'good' ? 30 : 0, emoji: '🍺' },
        { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', isEnabled: true, keywords: [], streak: scenario === 'good' ? 60 : 5, emoji: '💰' }
    ];

    return { receipts, custodyDays, goals, monthlyBudget };
};
