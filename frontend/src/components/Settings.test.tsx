import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import Settings from './Settings';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

vi.mock('../services/authService', () => ({
    authService: {
        deleteAccount: vi.fn(),
    },
}));

vi.mock('../services/biometricService', () => ({
    biometricService: {
        isAvailable: vi.fn().mockResolvedValue({ available: true }),
        isEnabled: vi.fn().mockResolvedValue(true),
        verifyIdentity: vi.fn().mockResolvedValue(true),
        saveCredentials: vi.fn(),
        deleteCredentials: vi.fn(),
        setEnabled: vi.fn(),
    },
}));

vi.mock('../services/exportService', () => ({
    exportService: {
        generateCSV: vi.fn(),
        downloadCSV: vi.fn(),
    },
}));

vi.mock('../services/pdfService', () => ({
    PDFService: {
        generateLegalReport: vi.fn(),
    },
}));

vi.mock('../services/haptics', () => ({
    HapticsService: {
        impactMedium: vi.fn(),
        impactLight: vi.fn(),
        impactHeavy: vi.fn(),
    },
}));

vi.mock('../services/widgetService', () => ({
    WidgetService: {
        updateWidgetData: vi.fn(),
    },
}));

vi.mock('@capacitor/preferences', () => ({
    Preferences: {
        keys: vi.fn().mockResolvedValue({ keys: [] }),
    },
}));

vi.mock('../contexts/DataContext');
vi.mock('../contexts/UserContext');
vi.mock('../contexts/ToastContext');
vi.mock('../contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en',
        setLanguage: vi.fn(),
    }),
}));

const mockUseData = () => ({
    monthlyBudget: 1000,
    setMonthlyBudget: vi.fn(),
    categoryBudgets: [],
    setCategoryBudgets: vi.fn(),
    ageRestricted: false,
    setAgeRestricted: vi.fn(),
    childSupportMode: false,
    setChildSupportMode: vi.fn(),
    helpEnabled: true,
    setHelpEnabled: vi.fn(),
    categories: [],
    setCategories: vi.fn(),
    recurringExpenses: [],
    setRecurringExpenses: vi.fn(),
    goals: [],
    setGoals: vi.fn(),
    receipts: [],
    custodyDays: [],
    setReceipts: vi.fn(),
    generateDummyData: vi.fn(),
    ambientMode: false,
    setAmbientMode: vi.fn(),
    showGlobalAmbient: false,
    setShowGlobalAmbient: vi.fn(),
    setCustodyDays: vi.fn(),
    deleteAllReceipts: vi.fn(),
    isProMode: true,
    setIsProMode: vi.fn(),
    proActivatedAt: '2023-01-01',
    goalsEnabled: true,
    setGoalsEnabled: vi.fn(),
    addGoal: vi.fn(),
    updateGoal: vi.fn(),
    financialSnapshotEnabled: false,
    setFinancialSnapshotEnabled: vi.fn(),
});

const mockUseUser = () => ({
    user: { id: '1', name: 'John Doe', email: 'john@example.com' },
    updateUser: vi.fn(),
    signOut: vi.fn(),
    upgradeToPro: vi.fn(),
});

const mockUseToast = () => ({
    showToast: vi.fn(),
});

describe('Settings Component', () => {
    beforeEach(() => {
        (useData as Mock).mockImplementation(mockUseData);
        (useUser as Mock).mockImplementation(mockUseUser);
        (useToast as Mock).mockImplementation(mockUseToast);
    });

    it('renders the component', () => {
        render(<Settings />);
        expect(screen.getByText(/settings\.profile\.edit/i)).toBeInTheDocument();
    });
});