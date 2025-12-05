import { Receipt } from '../types';

/**
 * Seed data generated from real receipts
 * Covers last 3 months with variety across all categories
 */

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getDateDaysAgo = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

export const SEED_RECEIPTS: Receipt[] = [
    // === THIS MONTH ===

    // Grocery Shopping (Necessity)
    {
        id: generateId(),
        storeName: 'Studenac Market',
        date: getDateDaysAgo(2),
        total: 12.30,
        items: [
            { name: 'Milk', price: 1.85, category: 'Food' },
            { name: 'Bread', price: 0.90, category: 'Food' },
            { name: 'Eggs', price: 2.40, category: 'Food' },
            { name: 'Cheese', price: 3.15, category: 'Food' },
            { name: 'Tomatoes', price: 1.60, category: 'Food' },
            { name: 'Onions', price: 0.80, category: 'Food' },
            { name: 'Potatoes', price: 1.60, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Spar',
        date: getDateDaysAgo(5),
        total: 45.80,
        items: [
            { name: 'Chicken Breast', price: 8.50, category: 'Food' },
            { name: 'Rice', price: 3.20, category: 'Food' },
            { name: 'Pasta', price: 2.40, category: 'Food' },
            { name: 'Olive Oil', price: 6.90, category: 'Food' },
            { name: 'Vegetables Mix', price: 4.50, category: 'Food' },
            { name: 'Yogurt', price: 3.80, category: 'Food' },
            { name: 'Orange Juice', price: 2.90, category: 'Food' },
            { name: 'Coffee', price: 5.60, category: 'Food' },
            { name: 'Butter', price: 2.80, category: 'Food' },
            { name: 'Apples', price: 3.20, category: 'Food' },
            { name: 'Bananas', price: 2.00, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Trgovina Krk',
        date: getDateDaysAgo(8),
        total: 7.55,
        items: [
            { name: 'Water Bottles', price: 2.40, category: 'Food' },
            { name: 'Snacks', price: 3.15, category: 'Food' },
            { name: 'Chocolate', price: 2.00, category: 'Luxury' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },

    // Dining & Alcohol
    {
        id: generateId(),
        storeName: 'Offside Bar',
        date: getDateDaysAgo(3),
        total: 3.40,
        items: [
            { name: 'Beer', price: 3.40, category: 'Alcohol' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Pizzeria Napoli',
        date: getDateDaysAgo(6),
        total: 18.50,
        items: [
            { name: 'Margherita Pizza', price: 9.50, category: 'Dining' },
            { name: 'Capricciosa Pizza', price: 11.00, category: 'Dining' },
            { name: 'Coca Cola', price: 2.50, category: 'Dining' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Caffe Central',
        date: getDateDaysAgo(10),
        total: 8.20,
        items: [
            { name: 'Cappuccino', price: 2.80, category: 'Dining' },
            { name: 'Croissant', price: 2.40, category: 'Dining' },
            { name: 'Espresso', price: 1.50, category: 'Dining' },
            { name: 'Water', price: 1.50, category: 'Dining' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },

    // Transport
    {
        id: generateId(),
        storeName: 'INA Petrol',
        date: getDateDaysAgo(4),
        total: 65.00,
        items: [
            { name: 'Gasoline 40L', price: 65.00, category: 'Transport' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Parking Zagreb',
        date: getDateDaysAgo(7),
        total: 12.00,
        items: [
            { name: 'Parking 4 hours', price: 12.00, category: 'Transport' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },

    // Household
    {
        id: generateId(),
        storeName: 'DM Drogerie',
        date: getDateDaysAgo(9),
        total: 28.40,
        items: [
            { name: 'Shampoo', price: 5.90, category: 'Household' },
            { name: 'Toothpaste', price: 3.20, category: 'Household' },
            { name: 'Soap', price: 2.80, category: 'Household' },
            { name: 'Toilet Paper', price: 6.50, category: 'Household' },
            { name: 'Cleaning Spray', price: 4.20, category: 'Household' },
            { name: 'Sponges', price: 2.80, category: 'Household' },
            { name: 'Laundry Detergent', price: 8.00, category: 'Household' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },

    // === LAST MONTH ===

    {
        id: generateId(),
        storeName: 'Studenac Market',
        date: getDateDaysAgo(15),
        total: 15.60,
        items: [
            { name: 'Milk', price: 1.85, category: 'Food' },
            { name: 'Bread', price: 0.90, category: 'Food' },
            { name: 'Ham', price: 4.50, category: 'Food' },
            { name: 'Cheese', price: 3.80, category: 'Food' },
            { name: 'Juice', price: 2.55, category: 'Food' },
            { name: 'Cookies', price: 2.00, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Spar',
        date: getDateDaysAgo(18),
        total: 52.30,
        items: [
            { name: 'Beef', price: 12.50, category: 'Food' },
            { name: 'Fish', price: 9.80, category: 'Food' },
            { name: 'Vegetables', price: 6.40, category: 'Food' },
            { name: 'Fruits', price: 7.20, category: 'Food' },
            { name: 'Wine', price: 8.50, category: 'Alcohol' },
            { name: 'Bread', price: 1.90, category: 'Food' },
            { name: 'Milk', price: 1.80, category: 'Food' },
            { name: 'Eggs', price: 2.40, category: 'Food' },
            { name: 'Butter', price: 1.80, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'McDonald\'s',
        date: getDateDaysAgo(20),
        total: 14.90,
        items: [
            { name: 'Big Mac Menu', price: 8.50, category: 'Dining' },
            { name: 'Cheeseburger', price: 3.20, category: 'Dining' },
            { name: 'Fries', price: 2.20, category: 'Dining' },
            { name: 'McFlurry', price: 3.00, category: 'Dining' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Konzum',
        date: getDateDaysAgo(22),
        total: 38.70,
        items: [
            { name: 'Chicken', price: 7.80, category: 'Food' },
            { name: 'Pasta', price: 2.90, category: 'Food' },
            { name: 'Tomato Sauce', price: 3.40, category: 'Food' },
            { name: 'Cheese', price: 4.60, category: 'Food' },
            { name: 'Salad', price: 2.80, category: 'Food' },
            { name: 'Yogurt', price: 3.20, category: 'Food' },
            { name: 'Cereal', price: 4.50, category: 'Food' },
            { name: 'Milk', price: 1.80, category: 'Food' },
            { name: 'Orange Juice', price: 2.70, category: 'Food' },
            { name: 'Coffee', price: 5.00, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Offside Bar',
        date: getDateDaysAgo(25),
        total: 12.80,
        items: [
            { name: 'Beer x3', price: 9.60, category: 'Alcohol' },
            { name: 'Peanuts', price: 3.20, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'INA Petrol',
        date: getDateDaysAgo(28),
        total: 70.00,
        items: [
            { name: 'Gasoline 45L', price: 70.00, category: 'Transport' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Müller',
        date: getDateDaysAgo(30),
        total: 42.50,
        items: [
            { name: 'Face Cream', price: 12.90, category: 'Household' },
            { name: 'Perfume', price: 18.50, category: 'Luxury' },
            { name: 'Makeup', price: 11.10, category: 'Luxury' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },

    // === 2 MONTHS AGO ===

    {
        id: generateId(),
        storeName: 'Studenac Market',
        date: getDateDaysAgo(45),
        total: 18.90,
        items: [
            { name: 'Groceries Mix', price: 18.90, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Spar',
        date: getDateDaysAgo(48),
        total: 61.20,
        items: [
            { name: 'Weekly Shopping', price: 61.20, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Zara',
        date: getDateDaysAgo(50),
        total: 89.90,
        items: [
            { name: 'T-Shirt', price: 24.90, category: 'Luxury' },
            { name: 'Jeans', price: 45.00, category: 'Luxury' },
            { name: 'Socks', price: 12.00, category: 'Necessity' },
            { name: 'Belt', price: 18.00, category: 'Luxury' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Lidl',
        date: getDateDaysAgo(52),
        total: 34.80,
        items: [
            { name: 'Meat', price: 9.50, category: 'Food' },
            { name: 'Vegetables', price: 5.80, category: 'Food' },
            { name: 'Fruits', price: 6.40, category: 'Food' },
            { name: 'Bread', price: 1.60, category: 'Food' },
            { name: 'Milk', price: 1.70, category: 'Food' },
            { name: 'Cheese', price: 4.20, category: 'Food' },
            { name: 'Yogurt', price: 2.60, category: 'Food' },
            { name: 'Eggs', price: 3.00, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Restoran Dubrovnik',
        date: getDateDaysAgo(55),
        total: 45.00,
        items: [
            { name: 'Grilled Fish', price: 22.00, category: 'Dining' },
            { name: 'Salad', price: 6.00, category: 'Dining' },
            { name: 'Wine', price: 12.00, category: 'Alcohol' },
            { name: 'Dessert', price: 5.00, category: 'Dining' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Hervis Sports',
        date: getDateDaysAgo(58),
        total: 125.00,
        items: [
            { name: 'Running Shoes', price: 89.00, category: 'Luxury' },
            { name: 'Sports Socks', price: 15.00, category: 'Necessity' },
            { name: 'Water Bottle', price: 12.00, category: 'Household' },
            { name: 'Gym Bag', price: 29.00, category: 'Luxury' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'INA Petrol',
        date: getDateDaysAgo(60),
        total: 68.50,
        items: [
            { name: 'Gasoline 42L', price: 68.50, category: 'Transport' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Plodine',
        date: getDateDaysAgo(62),
        total: 47.30,
        items: [
            { name: 'Groceries', price: 47.30, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Offside Bar',
        date: getDateDaysAgo(65),
        total: 15.60,
        items: [
            { name: 'Beer x4', price: 12.80, category: 'Alcohol' },
            { name: 'Chips', price: 2.80, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Cinema Cinestar',
        date: getDateDaysAgo(68),
        total: 28.00,
        items: [
            { name: 'Movie Tickets x2', price: 20.00, category: 'Luxury' },
            { name: 'Popcorn', price: 5.00, category: 'Dining' },
            { name: 'Drinks', price: 6.00, category: 'Dining' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },

    // === 3 MONTHS AGO ===

    {
        id: generateId(),
        storeName: 'Studenac Market',
        date: getDateDaysAgo(75),
        total: 22.40,
        items: [
            { name: 'Weekly Groceries', price: 22.40, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Spar',
        date: getDateDaysAgo(78),
        total: 55.80,
        items: [
            { name: 'Shopping', price: 55.80, category: 'Food' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'H&M',
        date: getDateDaysAgo(80),
        total: 67.90,
        items: [
            { name: 'Shirt', price: 29.90, category: 'Luxury' },
            { name: 'Pants', price: 38.00, category: 'Luxury' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Pharmacy',
        date: getDateDaysAgo(82),
        total: 34.50,
        items: [
            { name: 'Vitamins', price: 18.50, category: 'Health' },
            { name: 'Pain Relief', price: 8.00, category: 'Health' },
            { name: 'Band-Aids', price: 4.00, category: 'Health' },
            { name: 'Cough Syrup', price: 6.00, category: 'Health' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'INA Petrol',
        date: getDateDaysAgo(85),
        total: 72.00,
        items: [
            { name: 'Gasoline 46L', price: 72.00, category: 'Transport' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    },
    {
        id: generateId(),
        storeName: 'Burger King',
        date: getDateDaysAgo(88),
        total: 16.80,
        items: [
            { name: 'Whopper Menu', price: 9.50, category: 'Dining' },
            { name: 'Chicken Nuggets', price: 4.30, category: 'Dining' },
            { name: 'Milkshake', price: 3.00, category: 'Dining' }
        ],
        scannedAt: new Date().toISOString(),
        type: 'receipt'
    }
];
