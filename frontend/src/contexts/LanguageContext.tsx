import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';

// Import translation files
import en from '../i18n/en.json';
import hr from '../i18n/hr.json';
import sv from '../i18n/sv.json';
import no from '../i18n/no.json';
import da from '../i18n/da.json';

type TranslationKey = string;
type Translations = typeof en;

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => Promise<void>;
    t: (key: string, params?: Record<string, string | number>) => string;
    translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationFiles: Record<string, any> = {
    en,
    hr,
    sv,
    no,
    da
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<string>('en');
    const [translations, setTranslations] = useState<Translations>(en);

    // Load saved language preference on mount
    useEffect(() => {
        const loadLanguage = async () => {
            const { value } = await Preferences.get({ key: 'app_language' });
            if (value && translationFiles[value]) {
                setLanguageState(value);
                setTranslations(translationFiles[value]);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: string) => {
        if (translationFiles[lang]) {
            setLanguageState(lang);
            setTranslations(translationFiles[lang]);
            await Preferences.set({ key: 'app_language', value: lang });
        }
    };

    // Translation function with nested key support and parameter interpolation
    const t = (key: string, params?: Record<string, string | number>): string => {
        if (!key) return '';

        const keys = key.split('.');
        let value: any = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // If key not found, check if a defaultValue was provided
                if (params && params.defaultValue) {
                    return params.defaultValue.toString();
                }
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            if (params && params.defaultValue) {
                return params.defaultValue.toString();
            }
            return key;
        }

        // Replace parameters like {{amount}}, {{goalName}}, etc.
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
                return params[paramKey]?.toString() || match;
            });
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
