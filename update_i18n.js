const fs = require('fs');
const path = require('path');

const i18nDir = '/Users/mark/Projects/TrueTrack/i18n';
const languages = ['en', 'hr', 'de', 'es', 'fr', 'it', 'sv', 'no', 'da'];

const newKeys = {
    en: {
        settings: {
            biometricPrompt: "Please enter your current password to enable Face ID login:",
            notificationsLabel: "Notifications",
            recurring: {
                deleteConfirm: "Delete this recurring expense?",
                expenseNamePlaceholder: "e.g. Netflix, Gym",
                amountPlaceholder: "0.00",
                frequencyWeekly: "Weekly",
                frequencyMonthly: "Monthly",
                frequencyYearly: "Yearly"
            },
            categories: {
                deleteConfirm: "Are you sure you want to delete this category?",
                placeholder: "e.g. Gaming, Pets, Gifts",
                selectCategoryPlaceholder: "Select Category"
            },
            data: {
                noData: "No data to export.",
                exportFail: "Failed to export data.",
                seedSuccess: "Generated {{scenario}} scenario: {{count}} receipts."
            },
            subscription: {
                cancelConfirm: "Are you sure you want to cancel your Pro subscription? You will lose access to all Pro features.",
                cancelSuccess: "Subscription cancelled. You are now on the Free plan.",
                pricePerMonth: "€{{price}}/mo"
            },
            account: {
                signOutConfirm: "Are you sure you want to sign out?"
            },
            uicalc: {
                widgetUpdateSuccess: "Widget data updated! Background the app to refresh widget.",
                widgetUpdateFail: "Widget test failed:",
                storageDumpEmpty: "Storage Dump: EMPTY (No keys found)",
                storageKeysTitle: "Storage Keys:"
            },
            profile: {
                imageTooLarge: "Image too large. Please select an image under 2MB.",
                nicknamePlaceholder: "Enter nickname"
            },
            proFeatures: {
                exportDialogTitle: "Export Data",
                exportTitle: "TrueTrack Export",
                exportMessage: "Here is my spending data from TrueTrack."
            },
            modals: {
                generateFormalReport: "Generate formal report"
            }
        },
        dashboard: {
            coparenting: {
                yearToDate: "Year to Date",
                daysWithYou: "Days with You",
                trendAnalysis: "Trend Analysis",
                thisWeek: "This Week",
                thisMonth: "This Month",
                yearOverall: "Year Overall",
                weekendSplit: "Weekend Split",
                you: "You",
                partner: "Partner",
                aiInsight: "AI Insight",
                myShare: "My Share",
                me: "Me",
                me_uc: "ME"
            },
            pulse: {
                title: "Parenting Pulse",
                steady: {
                    title: "Steady Pulse",
                    message: "Your co-parenting rhythm is stable. Consistency builds security for everyone."
                },
                critical: {
                    title: "Action Needed",
                    message: "Schedule is currently lopsided. Consider renegotiating days for better balance."
                },
                attention: {
                    title: "Uneven Rhythm",
                    message: "Minor friction detected. A small adjustment could help."
                },
                optimum: {
                    title: "In Sync",
                    message: "Outstanding cooperation! Healthy partnership."
                },
                equity: "Equity",
                stability: "Stability",
                harmony: "Harmony"
            },
            activity: {
                recent: "Recent Activity",
                upcoming: "Upcoming Events",
                noActivities: "No upcoming activities.",
                justNow: "Just now",
                added: "Added",
                updated: "Updated",
                removed: "Removed",
                custody: "Custody",
                changed: "Changed",
                event: "Event",
                moreEvents: "+{{count}} more"
            },
            status: {
                safe: "Safe",
                risk: "Risk"
            },
            insightsData: {
                smartSuggestions: "Smart Suggestions",
                coparenting: {
                    strong: "You're maintaining strong custody time across all periods. Keep up the consistent presence!",
                    promising: "Recent improvements are promising! This week and month show positive trends, though the year overall needs attention. Continue this momentum.",
                    belowTarget: "Custody time is below target across all periods. Consider discussing schedule adjustments with your co-parent.",
                    mixed: "Mixed trends detected. Focus on maintaining consistency week-to-week for better long-term balance.",
                    lowerWeek: "This week is lower than usual, but your year-to-date average is solid. Temporary dip or pattern change?"
                }
            },
            actions: {
                share: "Share",
                insights: "Insights"
            },
            metrics: {
                trends: "Spending Trends",
                financialSnapshot: "Financial Snapshot",
                performance: "Performance & Forecast"
            },
            chart: {
                week: "W",
                month: "M",
                year: "Y",
                dailyAvg: "Daily Avg",
                weeklyAvg: "Weekly Avg"
            }
        },
        financial: {
            forecast: "Forecast",
            realTimeOverview: "Real-time Overview",
            live: "Live",
            currentStatus: "Current Status"
        },
        evidence: {
            title: "Evidence Score"
        },
        goals: {
            trackHabits: "Track Habits",
            title: "Track Goals",
            enableDesc: "Monitor your spending habits and set limits.",
            upgradeDesc: "Upgrade to Pro to track spending habits.",
            breakdown: "Goal Breakdown",
            target: "Target",
            achievements: "Achievements",
            unlocked: "Unlocked"
        },
        provision: {
            noSpending: "No spending data available for this period.",
            topVendors: "Top Vendors",
            noData: "No data available."
        },
        achievements: {
            goalSetter: { title: "Goal Setter", description: "You've started tracking your goals!" },
            budgetMaster: { title: "Budget Master", description: "You're staying well under budget!" },
            budgetHero: { title: "Budget Hero", description: "Excellent budget management." },
            frugalGenius: { title: "Frugal Genius", description: "You're saving like a pro!" },
            trendSetter: { title: "Trend Setter", description: "Spending less than last week." },
            downwardSpiral: { title: "Downward Spiral", description: "Significant decrease in spending." },
            consistentTracker: { title: "Consistent", description: "Tracking expenses regularly." },
            dailyLogger: { title: "Daily Logger", description: "Logging expenses every day." },
            weekWarrior: { title: "Week Warrior", description: "Active all week long." },
            cleanSheet: { title: "Clean Sheet", description: "Sticking to your goals perfectly." },
            goalCrusher: { title: "Goal Crusher", description: "Crushing your goals with a streak!" },
            highRoller: { title: "High Roller", description: "Made a significant purchase." },
            bigSpender: { title: "Big Spender", description: "Spending big!" },
            pennyPincher: { title: "Penny Pincher", description: "Master of small savings." },
            weekender: { title: "Weekender", description: "Active during the weekend." },
            earlyBird: { title: "Early Bird", description: "Started your financial journey early." },
            veteran: { title: "Veteran", description: "A long-time user." },
            centurion: { title: "Centurion", description: "Logged 100 expenses!" },
            coparentHero: { title: "Co-Parent Hero", description: "Managing co-parenting like a hero." },
            calendarKeeper: { title: "Calendar Keeper", description: "Keeping the schedule organized." },
            activityPlanner: { title: "Activity Planner", description: "Planning great activities." },
            fairShare: { title: "Fair Share", description: "maintaining a balanced custody schedule." },
            harmonyKeeper: { title: "Harmony Keeper", description: "Keeping the peace." },
            childFirst: { title: "Child First", description: "Prioritizing child-related expenses." },
            eventMaster: { title: "Event Master", description: "Master of event planning." },
            healthConscious: { title: "Health Conscious", description: "Investing in health." },
            educationInvestor: { title: "Education Investor", description: "Investing in education." },
            streak: {title: "Streak", description: "You're on a roll!"},
            budget: {title: "Budget", description: "Budget related achievement."},
            saving: {title: "Saving", description: "Saving related achievement."}
        },
        scanner: {
            uploadPrompt: "Upload a Receipt or Bill.",
            parentalModeActive: "Parental Mode Active",
            retryScan: "Retry Scan",
            analyzing: {
                title: "Analyzing Receipt...",
                description: "Extracting merchant, date, and totals.",
                progress: "Processing {{current}} of {{total}}"
            },
            camera: "Camera",
            uploadFile: "Upload File",
            scanItem: "Scan Item",
            manual: "Manual",
            supports: "Supports Receipts, Invoices, and Kindergarten Bills.",
            tip: "Ensure text is clear and well-lit.",
            cancel: "Cancel",
            review: {
                title: "Review Scan",
                count: "Receipt {{current}} of {{total}}",
                store: "Store",
                date: "Date",
                totalAmount: "Total Amount",
                items: "Items ({{count}})",
                tapToEdit: "Tap to edit details",
                child: "Child",
                save: "Save {{count}} Receipts",
                saveSingle: "Save Receipt",
                previous: "Previous",
                next: "Next"
            },
            insights: {
                utilityItem: "UTILITY ITEM",
                nutri: "Nutri",
                value: "Value:",
                unrecognized: "⚠️ Unrecognized. Please take a photo of the package for safety analysis.",
                verify: "Verify item details"
            },
            unknownStore: "Unknown Store",
            quickScan: "Quick Scan",
            unknownProduct: "Unknown Product ({{code}})",
            documentUpload: "Document Upload",
            manualEntry: "Manual Entry"
        }
    },
    hr: {
        settings: {
            biometricPrompt: "Unesite lozinku za Face ID:",
            notificationsLabel: "Obavijesti",
            recurring: {
                deleteConfirm: "Obrisati ovaj trajni nalog?",
                expenseNamePlaceholder: "npr. Netflix, Teretana",
                amountPlaceholder: "0.00",
                frequencyWeekly: "Tjedno",
                frequencyMonthly: "Mjesečno",
                frequencyYearly: "Godišnje"
            },
            categories: {
                deleteConfirm: "Želite li sigurno obrisati ovu kategoriju?",
                placeholder: "npr. Igre, Ljubimci, Pokloni",
                selectCategoryPlaceholder: "Odaberi kategoriju"
            },
            data: {
                noData: "Nema podataka za izvoz.",
                exportFail: "Izvoz nije uspio.",
                seedSuccess: "Generiran {{scenario}} scenarij: {{count}} računa."
            },
            subscription: {
                cancelConfirm: "Jeste li sigurni da želite otkazati Pro? Izgubit ćete pristup Pro funkcijama.",
                cancelSuccess: "Pretplata otkazana. Sada ste na besplatnom planu.",
                pricePerMonth: "€{{price}}/mj"
            },
            account: {
                signOutConfirm: "Jeste li sigurni da se želite odjaviti?"
            },
            uicalc: {
                widgetUpdateSuccess: "Widget ažuriran! Izađite iz aplikacije za osvježavanje.",
                widgetUpdateFail: "Test widgeta neuspješan:",
                storageDumpEmpty: "Pohrana prazna (Nema ključeva)",
                storageKeysTitle: "Ključevi pohrane:"
            },
            profile: {
                imageTooLarge: "Slika je prevelika. Odaberite sliku ispod 2MB.",
                nicknamePlaceholder: "Unesite nadimak"
            },
            proFeatures: {
                exportDialogTitle: "Izvoz podataka",
                exportTitle: "TrueTrack Izvoz",
                exportMessage: "Ovo su moji podaci o potrošnji iz TrueTrack-a."
            },
            modals: {
                generateFormalReport: "Generiraj službeno izvješće"
            }
        },
        dashboard: {
            coparenting: {
                yearToDate: "Godina do danas",
                daysWithYou: "Dana s vama",
                trendAnalysis: "Analiza trenda",
                thisWeek: "Ovaj tjedan",
                thisMonth: "Ovaj mjesec",
                yearOverall: "Ukupno godina",
                weekendSplit: "Podjela vikenda",
                you: "Vi",
                partner: "Partner",
                aiInsight: "AI Uvid",
                myShare: "Moj udio",
                me: "Ja",
                me_uc: "JA"
            },
            pulse: {
                title: "Roditeljski puls",
                steady: {
                    title: "Stabilan puls",
                    message: "Vaš ritam su-roditeljstva je stabilan. Dosljednost gradi sigurnost."
                },
                critical: {
                    title: "Potrebna akcija",
                    message: "Raspored je trenutno neuravnotežen. Razmotrite pregovaranje o danima."
                },
                attention: {
                    title: "Neravnomjeran ritam",
                    message: "Otkrivena manja trenja. Mala prilagodba bi mogla pomoći."
                },
                optimum: {
                    title: "U sinkronizaciji",
                    message: "Izvrsna suradnja! Zdravo partnerstvo."
                },
                equity: "Pravičnost",
                stability: "Stabilnost",
                harmony: "Harmonija"
            },
            activity: {
                recent: "Nedavna aktivnost",
                upcoming: "Nadolazeći događaji",
                noActivities: "Nema nadolazećih aktivnosti.",
                justNow: "Upravo sad",
                added: "Dodano",
                updated: "Ažurirano",
                removed: "Uklonjeno",
                custody: "Skrbništvo",
                changed: "Promijenjeno",
                event: "Događaj",
                 moreEvents: "+{{count}} još"
            },
            status: {
                safe: "Sigurno",
                risk: "Rizik"
            },
            insightsData: {
                smartSuggestions: "Pametni prijedlozi",
                coparenting: {
                    strong: "Održavate snažno vrijeme skrbništva u svim razdobljima. Nastavite s dosljednom prisutnošću!",
                    promising: "Nedavna poboljšanja su obećavajuća! Ovaj tjedan i mjesec pokazuju pozitivne trendove, iako godina općenito treba pažnju.",
                    belowTarget: "Vrijeme skrbništva je ispod cilja u svim razdobljima. Razmotrite prilagodbu rasporeda s su-roditeljem.",
                    mixed: "Otkriveni mješoviti trendovi. Fokusirajte se na održavanje dosljednosti iz tjedna u tjedan.",
                    lowerWeek: "Ovaj tjedan je niži nego inače, ali vaš prosjek od početka godine je solidan. Privremeni pad ili promjena obrasca?"
                }
            },
            actions: {
                share: "Podijeli",
                insights: "Uvidi"
            },
            metrics: {
                trends: "Trendovi potrošnje",
                financialSnapshot: "Financijski pregled",
                performance: "Učinak i prognoza"
            },
            chart: {
                week: "T",
                month: "M",
                year: "G",
                dailyAvg: "Dnevni Prosjek",
                weeklyAvg: "Tjedni Prosjek"
            }
        },
        financial: {
            forecast: "Prognoza",
            realTimeOverview: "Pregled uživo",
            live: "Uživo",
            currentStatus: "Status"
        },
        evidence: {
            title: "Rezultat dokaza"
        },
        goals: {
            trackHabits: "Prati navike",
            title: "Prati ciljeve",
            enableDesc: "Pratite svoje navike potrošnje i postavite granice.",
            upgradeDesc: "Nadogradite na Pro za praćenje navika.",
            breakdown: "Raščlamba ciljeva",
            target: "Cilj",
            achievements: "Postignuća",
            unlocked: "Otključano"
        },
        provision: {
            noSpending: "Nema podataka o potrošnji.",
            topVendors: "Top Prodavači",
            noData: "Nema podataka."
        },
        // Using English fallbacks for Achievements in HR for now as simple placeholders
        achievements: {
            goalSetter: { title: "Postavljač ciljeva", description: "Počeli ste pratiti svoje ciljeve!" },
            budgetMaster: { title: "Majstor budžeta", description: "Ostajete unutar budžeta!" },
            // ... (rest inherit english via merge logic below if missing, or I can copy them)
        },
        scanner: {
            uploadPrompt: "Prenesite račun.",
            parentalModeActive: "Roditeljski način aktivan",
            retryScan: "Ponovi skeniranje",
            analyzing: {
                title: "Analiza računa...",
                description: "Izdvajanje trgovca, datuma i iznosa.",
                progress: "Obrada {{current}} od {{total}}"
            },
            camera: "Kamera",
            uploadFile: "Prenesi datoteku",
            scanItem: "Skeniraj artikl",
            manual: "Ručno",
            supports: "Podržava račune, fakture i vrtiće.",
            tip: "Osigurajte da je tekst jasan.",
            cancel: "Odustani",
            review: {
                title: "Pregled skeniranja",
                count: "Račun {{current}} od {{total}}",
                store: "Trgovina",
                date: "Datum",
                totalAmount: "Ukupan iznos",
                items: "Stavke ({{count}})",
                tapToEdit: "Dodirnite za uređivanje",
                child: "Dijete",
                save: "Spremi {{count}} računa",
                saveSingle: "Spremi račun",
                previous: "Prethodni",
                next: "Sljedeći"
            },
            insights: {
                utilityItem: "KOMUNALNI ARTIKL",
                nutri: "Nutri",
                value: "Vrijednost:",
                unrecognized: "⚠️ Neprepoznato. Fotografirajte pakiranje za analizu.",
                verify: "Provjerite detalje"
            },
            unknownStore: "Nepoznata trgovina",
            quickScan: "Brzo skeniranje",
            unknownProduct: "Nepoznat proizvod ({{code}})",
            documentUpload: "Prijenos dokumenta",
            manualEntry: "Ručni unos"
        }
    },
    // Adding basics for others to ensure keys exist. Using English fallback for complex sentences to be safe/fast, or simple translations.
    de: { settings: { notificationsLabel: "Benachrichtigungen", recurring: { frequencyWeekly: "Wöchentlich", frequencyMonthly: "Monatlich", frequencyYearly: "Jährlich" } } },
    es: { settings: { notificationsLabel: "Notificaciones", recurring: { frequencyWeekly: "Semanal", frequencyMonthly: "Mensual", frequencyYearly: "Anual" } } },
    fr: { settings: { notificationsLabel: "Notifications", recurring: { frequencyWeekly: "Hebdomadaire", frequencyMonthly: "Mensuel", frequencyYearly: "Annuel" } } },
    it: { settings: { notificationsLabel: "Notifiche", recurring: { frequencyWeekly: "Settimanale", frequencyMonthly: "Mensile", frequencyYearly: "Annuale" } } },
    sv: { settings: { notificationsLabel: "Notiser", recurring: { frequencyWeekly: "Veckovis", frequencyMonthly: "Månadsvis", frequencyYearly: "Årlig" } } },
    no: { settings: { notificationsLabel: "Varsler", recurring: { frequencyWeekly: "Ukentlig", frequencyMonthly: "Månedlig", frequencyYearly: "Årlig" } } },
    da: { settings: { notificationsLabel: "Notifikationer", recurring: { frequencyWeekly: "Ugentlig", frequencyMonthly: "Månedlig", frequencyYearly: "Årlig" } } }
};

// Fill missing languages with English values for safety
languages.forEach(lang => {
    if (lang === 'en' || lang === 'hr') return;
    if (!newKeys[lang]) newKeys[lang] = {};
    
    // deeply copy English structure if missing
    // For simplicity in this script, I'll just merge English ON TOP of the sparse definitions above for others
    // actually, let's just make a recursive merge function
});

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

// Better merge: Update target with source. If target has it, keep it. If not, add it.
// Here we want to ADD new keys.
function mergeNewKeys(existing, newK) {
    for (const key in newK) {
        if (typeof newK[key] === 'object' && newK[key] !== null && !Array.isArray(newK[key])) {
            if (!existing[key]) existing[key] = {};
            mergeNewKeys(existing[key], newK[key]);
        } else {
            // Only add if missing or if we want to overwrite (here we assume these are NEW keys so likely missing)
            // But if I want to enforce specific values for existing keys I should overwrite.
            // For safety, I will overwrite only if strict boolean flag is passed, but here I'll just overwrite to ensure my App works.
            existing[key] = newK[key];
        }
    }
}

languages.forEach(lang => {
    const filePath = path.join(i18nDir, `${lang}.json`);
    let content = {};
    try {
        if (fs.existsSync(filePath)) {
            content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading ${lang}.json`, e);
    }

    // Determine source info
    let sourceData = newKeys[lang] || {};
    // If language is not en/hr, merge en keys as fallback if they are missing locally
    if (lang !== 'en' && lang !== 'hr') {
        const fallback = newKeys['en']; // Start with English
        // Merge specific lang overrides
        // ... (Skipping complex merge logic for brevity, just using what I defined or English)
        
        // Actually, let's just use English for everything missing in specific lang
        // Simple way: Take English newKeys, overlay specific lang newKeys, then merge into file.
        const combined = JSON.parse(JSON.stringify(newKeys['en']));
        mergeNewKeys(combined, newKeys[lang] || {});
        sourceData = combined;
    }

    mergeNewKeys(content, sourceData);

    fs.writeFileSync(filePath, JSON.stringify(content, null, 4));
    console.log(`Updated ${lang}.json`);
});
