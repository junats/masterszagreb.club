import { Receipt, CustodyDay, Goal, GoalType, Category, CustodyStatus } from '@common/types';

// Dictionaries for realistic data
const STORE_NAMES = {
    [Category.FOOD]: ['Tesco', 'Lidl', 'Aldi', 'Dunnes Stores', 'SuperValu', 'M&S Food'],
    [Category.DINING]: ['McDonalds', 'Nando\'s', 'Starbucks', 'Subway', 'Local Cafe', 'Pizza Express'],
    [Category.ALCOHOL]: ['O\'Briens Wine', 'The Local Pub', 'City Bar', 'Off License'],
    [Category.LUXURY]: ['Brown Thomas', 'Zara', 'Apple Store', 'JD Sports', 'Arnotts'],
    [Category.HOUSEHOLD]: ['IKEA', 'Woodies', 'Home Store + More', 'Amazon'],
    [Category.HEALTH]: ['Boots', 'LloydsPharmacy', 'Hickey\'s Pharmacy'],
    [Category.TRANSPORT]: ['Circle K', 'Applegreen', 'Leap Card Topup', 'Uber'],
    [Category.EDUCATION]: ['Easons', 'School Office', 'Art & Hobby'],
    [Category.NECESSITY]: ['Electric Ireland', 'Virgin Media', 'Bord Gais']
};

const ITEMS_BY_CATEGORY = {
    [Category.FOOD]: [
        { name: 'Whole Milk 2L', price: 2.29 }, { name: 'Sourdough Bread', price: 3.50 }, { name: 'Free Range Eggs', price: 4.10 },
        { name: 'Chicken Breast', price: 6.50 }, { name: 'Bananas (Bunch)', price: 1.89 }, { name: 'Pasta 500g', price: 1.29 },
        { name: 'Rice 1kg', price: 2.50 }, { name: 'Cheddar Cheese', price: 3.99 }, { name: 'Yogurt Multipack', price: 3.00 },
        { name: 'Apples (6pk)', price: 2.99 }, { name: 'Orange Juice', price: 2.50 }, { name: 'Potatoes 2kg', price: 3.00 }
    ],
    [Category.DINING]: [
        { name: 'Starbucks Latte', price: 4.50 }, { name: 'Costa Cappuccino', price: 4.20 }, // Cafe
        { name: 'McDonalds Meal', price: 9.50 }, { name: 'Dominos Pizza', price: 18.00 }, { name: 'Subway Sandwich', price: 8.50 }, // Fast Food
        { name: 'Local Bistro Dinner', price: 45.00 }, { name: 'Sushi Restaurant', price: 32.00 } // Restaurant
    ],
    [Category.ALCOHOL]: [
        { name: 'Heineken Pint', price: 6.50 }, { name: 'Guinness Pint', price: 6.20 }, { name: 'Vodka measure', price: 5.50 },
        { name: 'Wine Bottle (Red)', price: 12.00 }, { name: 'Craft Beer Can', price: 4.50 }, { name: 'Gin & Tonic', price: 8.50 },
        { name: 'Whiskey', price: 7.00 }, { name: 'Cocktail', price: 12.50 }
    ],
    [Category.LUXURY]: [
        // Tech
        { name: 'Apple AirPods', price: 140.00 }, { name: 'Sony Headphones', price: 89.00 }, { name: 'USB-C Cable (Tech)', price: 15.00 },
        { name: 'Smart Watch Strap', price: 29.00 }, { name: 'Phone Case', price: 35.00 },
        // Clothing
        { name: 'Zara Jacket', price: 85.00 }, { name: 'Nike Sneakers', price: 110.00 }, { name: 'H&M T-Shirt', price: 15.00 },
        { name: 'Gym Clothes', price: 45.00 }, { name: 'Winter Coat', price: 120.00 },
        // Gaming/Toys
        { name: 'PS5 Game', price: 69.99 }, { name: 'Steam Gift Card', price: 20.00 }, { name: 'Lego Set', price: 45.00 },
        { name: 'Board Game', price: 35.00 }
    ],
    [Category.HOUSEHOLD]: [
        // Cleaning
        { name: 'Laundry Detergent', price: 8.00 }, { name: 'Cleaning Spray', price: 3.50 }, { name: 'Toilet Paper (12pk)', price: 6.50 },
        { name: 'Dishwasher Tablets', price: 14.00 }, { name: 'Kitchen Towels', price: 3.00 },
        // Decor/Furniture
        { name: 'Scented Candle', price: 18.00 }, { name: 'Table Lamp', price: 45.00 }, { name: 'Photo Frame', price: 12.00 },
        { name: 'Throw Cushion', price: 22.00 }, { name: 'Small Plant Pot', price: 15.00 },
        // Garden
        { name: 'Garden Seeds', price: 4.50 }, { name: 'Plant Food', price: 8.00 }
    ],
    [Category.HEALTH]: [
        { name: 'Paracetamol (Pharmacy)', price: 4.50 }, { name: 'Vitamins (Pharmacy)', price: 12.00 },
        { name: 'GP Visit (Doctor)', price: 60.00 }, { name: 'Dentist Checkup', price: 80.00 },
        { name: 'Gym Membership', price: 45.00 }, { name: 'Swimming Pool Entry', price: 12.00 }
    ],
    [Category.TRANSPORT]: [
        { name: 'Petrol (Circle K)', price: 55.00 }, { name: 'Diesel (Applegreen)', price: 70.00 }, // Fuel
        { name: 'Bus Ticket', price: 2.50 }, { name: 'Leap Card Topup', price: 20.00 }, { name: 'Taxi (Uber)', price: 18.00 }, // Public/Taxi
        { name: 'Car Wash', price: 12.00 }, { name: 'Parking Fee', price: 4.00 } // Car
    ],
    [Category.EDUCATION]: [
        { name: 'School Books', price: 45.00 }, { name: 'Stationery Set', price: 12.00 }, { name: 'Uniform Jumper', price: 35.00 },
        { name: 'Art Supplies', price: 25.00 }, { name: 'Backpack', price: 40.00 }, { name: 'Calculator', price: 18.00 }
    ],
    [Category.NECESSITY]: [
        { name: 'Electricity Bill', price: 120.00 }, { name: 'Internet Bill', price: 60.00 }, { name: 'Gas Bill', price: 85.00 },
        { name: 'Phone Bill', price: 45.00 }, { name: 'Bin Charges', price: 22.00 }
    ]
};

const CHILD_ITEMS = [
    { name: 'School Lunch', price: 5.00, category: Category.FOOD },
    { name: 'Nappies', price: 12.00, category: Category.HEALTH },
    { name: 'Baby Formula', price: 16.00, category: Category.FOOD },
    { name: 'Kids Shoes', price: 45.00, category: Category.LUXURY },
    { name: 'Toy Car', price: 8.00, category: Category.LUXURY },
    { name: 'School Uniform', price: 65.00, category: Category.EDUCATION },
    { name: 'Swimming Lesson', price: 15.00, category: Category.EDUCATION },
    { name: 'Kids Haircut', price: 18.00, category: Category.HEALTH }
];

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

    const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomAmount = (base: number, variance: number) => base + (Math.random() * variance * 2 - variance);

    // --- 1. SPENDING DATA (12 Months / 1 Year) ---
    for (let i = 0; i < 365; i++) {
        const date = addDays(today, -i);
        const dateStr = date.toISOString().split('T')[0];

        // Frequency: Good = Less frequent, Bad = Frequent (impulse)
        // Force today (i===0) to have data
        const chance = (i === 0) ? 1.0 : (type === 'good' ? 0.4 : 0.7);

        if (Math.random() < chance) {
            let category: Category;

            if (type === 'good') {
                // Focus: Food, Household, Health, Education
                const r = Math.random();
                if (r < 0.4) category = Category.FOOD;
                else if (r < 0.6) category = Category.HOUSEHOLD;
                else if (r < 0.75) category = Category.TRANSPORT;
                else if (r < 0.85) category = Category.EDUCATION; // More child/responsible
                else if (r < 0.95) category = Category.HEALTH;
                else category = Category.DINING; // Occasional treat
            } else {
                // Focus: Alcohol, Dining, Luxury
                const r = Math.random();
                if (r < 0.3) category = Category.ALCOHOL;
                else if (r < 0.5) category = Category.DINING;
                else if (r < 0.7) category = Category.LUXURY;
                else if (r < 0.8) category = Category.FOOD;
                else category = Category.TRANSPORT;
            }

            const storeList = STORE_NAMES[category] || ['Generic Store'];
            const store = getRandomItem(storeList);
            const potentialItems = ITEMS_BY_CATEGORY[category] || [{ name: 'Item', price: 10 }];

            const numItems = Math.floor(Math.random() * 3) + 1;
            const items: any[] = [];

            for (let k = 0; k < numItems; k++) {
                const itemTemplate = getRandomItem(potentialItems);

                // Variance in price
                const price = getRandomAmount(itemTemplate.price, itemTemplate.price * 0.1);

                // Smart tagging for Child Expenses
                let isChild = false;
                if (category === Category.EDUCATION) isChild = true;
                if (itemTemplate.name.includes('School') || itemTemplate.name.includes('Kids') || itemTemplate.name.includes('Baby') || itemTemplate.name.includes('Nappies')) isChild = true;

                items.push({
                    name: itemTemplate.name,
                    price: price,
                    category: category,
                    quantity: 1,
                    isRestricted: (category === Category.ALCOHOL),
                    isChildRelated: isChild
                });
            }

            // Inject explicit Child Items occasionally
            if (Math.random() < 0.25) {
                const childItem = getRandomItem(CHILD_ITEMS);
                items.push({
                    ...childItem,
                    price: getRandomAmount(childItem.price, 2),
                    quantity: 1,
                    isRestricted: false,
                    isChildRelated: true
                });
            }

            const total = items.reduce((sum, item) => sum + item.price, 0);

            receipts.push({
                id: `demo-r-${i}-${type}`,
                storeName: store,
                date: dateStr,
                total: total,
                items: items,
                scannedAt: new Date().toISOString(),
                categoryId: category.toLowerCase()
            });
        }
    }

    // --- 2. CUSTODY DATA ---
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
            activities: activities,
            withYou: status === 'me'
        });
    }

    // --- 3. GOALS ---
    const goalTemplates = [
        { id: 'alcohol', type: GoalType.ALCOHOL, name: 'Reduce Alcohol', goodStreak: 45, badStreak: 0, emoji: '🍺', threshold: 100 },
        { id: 'smoking', type: GoalType.SMOKING, name: 'Quit Smoking', goodStreak: 120, badStreak: 0, emoji: '🚬', threshold: 0 },
        { id: 'savings', type: GoalType.SAVINGS, name: 'Boost Savings', goodStreak: 30, badStreak: 0, emoji: '💰', threshold: 500 },
        { id: 'junk_food', type: GoalType.JUNK_FOOD, name: 'Stop Junk Food', goodStreak: 15, badStreak: 0, emoji: '🍔', threshold: 50 },
    ];

    goals.push(...goalTemplates.map(t => ({
        ...t,
        isEnabled: true,
        streak: type === 'good' ? t.goodStreak : t.badStreak,
        keywords: [],
        history: [], // Populate if needed
        limit: t.threshold,
        period: 'monthly' as 'monthly' // Fixed Period
    })));

    return { receipts, custodyDays, goals };
};
