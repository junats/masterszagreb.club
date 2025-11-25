# 🛡️ TrueTrack

> **Protecting Fathers. Verifying Provision.**

TrueTrack is a specialized expense tracking and document verification application designed specifically for single fathers. It serves as a digital "Safe Harbor," allowing users to scan receipts, automatically categorize expenses (distinguishing between Child Necessity and Luxury), and build a verifiable log of financial provision.

---

## 💡 The Vision

Single fathers often face the burden of proof when demonstrating financial support for their children during custody agreements or legal disputes. TrueTrack shifts the paradigm from "tracking spending" to **"verifying provision."**

### Key Problem Solvers:
1.  **Legal Evidence Generation:** Automatically calculates an "Evidence Score" based on the consistency and ratio of essential spending.
2.  **AI-Powered Classification:** Uses Google Gemini AI to read receipts and bills, detecting store names, dates, and line items, and categorizing them (e.g., distinguishing "School Supplies" from "Alcohol").
3.  **Parental Control Mode:** A specialized feature that filters out age-restricted items (18+) from reports and charts to ensure shared financial logs remain appropriate for family courts or ex-partners.
4.  **Local Support Network:** Geolocation-based resource finder for legal aid, mental health support, and social services.

---

## 🛠️ Tech Stack

### Frontend Core
*   **Framework:** [React 18](https://react.dev/) (via Vite)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for strict type safety.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom Slate-950 Dark Mode palette.
*   **Icons:** [Lucide React](https://lucide.dev/).

### Artificial Intelligence
*   **Engine:** **Google Gemini 2.5 Flash** (via `@google/genai`).
*   **Function:** Multimodal analysis (Image-to-JSON). It handles OCR, entity extraction, context-based categorization, and "Bill vs. Receipt" classification.

### Data & Backend (Hybrid Architecture)
*   **Service Abstraction:** The app uses a Service Repository pattern.
*   **Primary Backend:** [Supabase](https://supabase.com/) (PostgreSQL + Auth).
*   **Fallback Mode:** A robust **Mock Service** runs if no API keys are detected. This allows the app to be fully functional (Auth, Database, Storage) in a local browser environment using `localStorage` for rapid testing and demoing.

### Utilities
*   **Image Processing:** Custom HTML5 Canvas compression engine to resize 5MB+ camera photos to <100KB for storage efficiency.
*   **iOS Support:** `heic2any` library to convert Apple HEIC/HEIF photos to JPEG in the browser.

---

## 📂 Project Structure

```text
/
├── index.html              # Entry point (includes Font & Tailwind config)
├── src/
│   ├── App.tsx             # Main Application Logic & Routing
│   ├── types.ts            # TypeScript Interfaces (Receipt, User, AnalysisResult)
│   ├── lib/
│   │   └── supabaseClient.ts # Database Connection (Crash-proof implementation)
│   ├── services/
│   │   ├── authService.ts    # Authentication Logic (Mock + Real)
│   │   └── geminiService.ts  # AI Integration for Receipt Analysis
│   └── components/
│       ├── AuthScreen.tsx      # Login/Signup UI
│       ├── Dashboard.tsx       # Main Bento Grid, Analytics & Charts
│       ├── ReceiptScanner.tsx  # Camera/Gallery Interface & Image Optimization
│       ├── HistoryView.tsx     # List, Search, Detail View & Manual Editing
│       ├── Settings.tsx        # User Preferences, Budget, Data Export
│       ├── SupportView.tsx     # Geolocation-based Help Resources
│       ├── Navigation.tsx      # Bottom Tab Bar
│       └── SubscriptionModal.tsx # Paywall UI
```

---

## ✨ Key Features

### 1. Smart Scan & Deduplication
*   **Unified Scanner:** Auto-detects if a document is a "Shopping Receipt" or "Utility/Tuition Bill".
*   **Duplicate Protection:** Generates a unique signature (Store + Date + Price + RefCode) for every scan to prevent double-counting expenses.
*   **HEIC Support:** Native conversion for iPhone photos.

### 2. The Dashboard (Bento Grid)
*   **Verified Provision:** Tracks money spent specifically on Child/Home needs.
*   **Evidence Score (0-100):** A gamified metric based on log volume and provision ratio.
*   **Spending Insights:** AI-driven text summaries (e.g., "Trending 20% lower than average").

### 3. History & Analytics
*   **Visual Logs:** Thumbnails of original receipts stored alongside data.
*   **Child-First Analytics:** Breakdowns showing specifically how much went to Education, Health, and Food.
*   **Restriction Toggle:** Manual override to hide/ban items (like alcohol) from the final report.

### 4. Data Export
*   **Legal Proof:** Generates a structured CSV export containing dates, stores, itemized lists, and prices, ready for printing or emailing to attorneys.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/truetrack.git
    cd truetrack
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root (optional, app runs in Mock Mode without it).
    ```env
    # Required for AI Scanning
    VITE_GEMINI_API_KEY=your_google_gemini_key

    # Required for Real Database (Optional)
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 🔒 Security & Privacy

*   **Data Isolation:** In Mock Mode, all data lives in the user's browser (`localStorage`).
*   **Restricted Item Filtering:** The "Parental Mode" ensures that even if a father buys a beer with groceries, the generated report for the other parent can exclude that line item to prevent friction.
*   **Encryption:** In Production Mode (Supabase), Row Level Security (RLS) ensures users can only access their own records.

---

## ⚖️ License

Private / Proprietary. Designed for the TrueTrack Initiative.
