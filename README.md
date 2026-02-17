# 🛡️ TrueTrack

> **Financial Discipline. Verified Provision. Peace of Mind.**

TrueTrack is a precision financial tracking and discipline tool designed for parents who demand control over their finances. While it serves as a powerful "evidence generator" for co-parenting situations, its core mission is to help you master your budget, track discipline habits, and maintain a verifiable log of your financial life.

---

## AI Tooling

This project is tool-agnostic.

Previous iterations used Google Antigravity / Gemini.
Those tools are now considered legacy and are not required
to build, refactor, or maintain this codebase.

---

## Why This Exists

Elevate your tracking experience with **Coparent Pro**, a suite of quality-of-life features designed to turn financial discipline into a premium experience.

### 🌟 Quality of Life Features
*   **Ambient Mode:** Dynamic, mood-based lighting effects that react to your spending health.
*   **Goals & Habits:** Track daily disciplines (e.g., "No Junk Food," "Gym," "Savings") alongside your finances.
*   **Category Budgets:** Set precise monthly limits for specific spending categories (e.g., Dining, Entertainment).

### 🛡️ Advanced Protection
*   **Provision Analysis:** Automated reports proving your financial contribution to your child's well-being.
*   **Parental Controls:** specialized filtering to omit 18+ items (alcohol, tobacco) from shared reports.
*   **Evidence Export:** One-click CSV/PDF generation for legal counsel or mediation.

---

## 📱 What Now? (Mobile Deployment)

Since you have the web app running locally, here are the steps to build the Native iOS and Android apps for the App Store.

### 1. Build the Web Assets
Run this command to create the production bundle of your React app.
```bash
npm run build
```

### 2. Sync with Native Projects
This copies your build folder (`dist`) into the iOS and Android native containers.
```bash
npx cap sync
```

### 3. Open in Native IDE
Use these commands to open the native project. You will then click the "Play" button in Xcode or Android Studio to run it on your phone/simulator.
```bash
# For iPhone
npx cap open ios

# For Android
npx cap open android
```

## 🍎 Building for iOS (Detailed)

1.  **Sync Changes:**
    Always run this after making changes to your React code:
    ```bash
    npm run build:mobile
    ```

2.  **Open Xcode:**
    ```bash
    npx cap open ios
    ```

3.  **Setup Signing (First Time Only):**
    *   In Xcode, click on the **App** project in the left navigator.
    *   Select the **App** target.
    *   Go to the **Signing & Capabilities** tab.
    *   Select your **Team**.
    *   Ensure "Automatically manage signing" is checked.

4.  **Run on Device:**
    *   Connect your iPhone via USB.
    *   Select your device from the top toolbar (Product > Destination).
    *   Press **Cmd + R** or click the **Play** button.

5.  **Build for App Store:**
    *   Select **Any iOS Device (arm64)** as the destination.
    *   Go to **Product > Archive**.
    *   Once archived, the "Organizer" window will open, allowing you to **Distribute App** to TestFlight/App Store.

### ⚠️ iOS Troubleshooting
*   **CocoaPods Error:** If you see pod-related errors, try:
    ```bash
    cd ios/App
    pod install
    cd ../..
    ```
*   **Assets Not Updating:** Ensure you ran `npm run build` *before* `npx cap sync`.

---

## 💡 The Vision

TrueTrack combines rigorous financial tracking with the "soft power" of wellness and discipline. Whether you are navigating a complex custody arrangement or simply striving for financial independence, TrueTrack provides the data you need.

### Key Problem Solvers:
1.  **Precision Budgeting:** Go beyond simple tracking. Set hard limits, visualize categories, and get haptic feedback on your spending health.
2.  **Habit Stacking:** Monitor lifestyle choices (smoking, fast food, gaming) that impact both your wallet and your well-being.
3.  **AI-Powered Classification:** Uses Google Gemini AI to read receipts and bills, detecting store names, dates, and line items with near-perfect accuracy.
4.  **Legal Readiness:** Automatically calculates an "Evidence Score" based on consistency, ensuring you are always prepared if legal need arises.

---

## 🛠️ Tech Stack

### Frontend Core
*   **Framework:** [React 19](https://react.dev/) (via Vite)
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
*   **Subscription Management:** RevenueCat (native In-App Purchases), handling entitlements, offerings, and cross-platform synchronization.

---

## 🤖 Developer Workflow (GSD + Local AI)

This project uses the **GSD (Get Shit Done)** methodology combined with **Local AI Tools** to maximize productivity while minimizing cloud API costs.

### Core Philosophy

| Layer | Tool | Purpose |
|-------|------|---------|
| **Planning** | Cloud Agent (Gemini/Claude) | Architecture, complex reasoning, multi-file changes |
| **Execution** | Local Ollama (`fix`, `debate`) | Simple refactors, code fixes, brainstorming |
| **Testing** | Local Ollama (`gentest`, `autofix`) | Generate tests, auto-fix failures |

---

### 🔧 Setup (One-Time)

```bash
# Install Ollama (if not already installed)
brew install ollama

# Pull the coding model
ollama pull qwen2.5-coder:7b

# Install the terminal shortcuts
./scripts/setup_alias.sh
source ~/.zshrc
```

---

### ⌨️ Terminal Commands

| Command | Description | Example |
|---------|-------------|---------|
| `fix <file> "<instruction>"` | Refactor a file using local AI | `fix src/App.tsx "Add dark mode toggle"` |
| `debate "<question>"` | Two AI personas debate, then synthesize | `debate "Should we use Redux or Context?"` |
| `gentest <file>` | Generate Vitest tests for a file | `gentest src/utils/format.ts` |
| `autofix <file> "<test_cmd>"` | Run tests → fix failures → repeat (3x max) | `autofix src/App.tsx "npm test"` |

---

### 📋 GSD Slash Commands (Chat with Agent)

| Command | Mode | Purpose |
|---------|------|---------|
| `/plan "<feature>"` | PLANNING | Create implementation roadmap in `.gsd/ROADMAP.md` |
| `/execute` | EXECUTION | Implement a specific phase from the roadmap |
| `/verify` | VERIFICATION | Validate work with empirical evidence (screenshots, test output) |
| `/pause` | — | Dump state to `.gsd/STATE.md` for clean session handoff |
| `/resume` | — | Restore context from previous session |
| `/progress` | — | Show current position in roadmap |
| `/debug` | — | Systematic debugging with state persistence |

---

### 📁 GSD State Files

```
.gsd/
├── SPEC.md       # Finalized requirements (must exist before coding)
├── ROADMAP.md    # Phased implementation plan
├── STATE.md      # Current position, what was accomplished, next steps
├── JOURNAL.md    # Session log with decisions and milestones
└── DECISIONS.md  # Architectural decision records
```

---

### 🔄 Typical Workflow

```
1. PLAN   →  /plan "Add receipt export feature"
              (Agent creates ROADMAP.md with phases)

2. DEBATE →  debate "PDF vs CSV for export format?"
              (Local AI debates, outputs synthesis)

3. CODE   →  fix src/export.ts "Implement CSV export as planned"
              (Local AI writes code, saves tokens)

4. TEST   →  gentest src/export.ts
              (Local AI generates test file)

5. FIX    →  autofix src/export.ts "npm test"
              (Loops: test → fail → fix → test)

6. VERIFY →  /verify
              (Agent confirms with empirical evidence)
```

---

### ⚠️ GSD Rules (Enforced)

| Rule | Description |
|------|-------------|
| **Planning Lock 🔒** | No implementation code until `SPEC.md` is FINALIZED |
| **State Persistence 💾** | Agent updates `STATE.md` after every task |
| **Context Hygiene 🧹** | After 3 failed debug attempts → state dump + fresh session |
| **Empirical Validation ✅** | No "trust me" → verify with screenshots/commands |

---

### 🧠 When to Use Which Tool?

| Task | ☁️ Cloud Agent | 💻 Local `fix` |
|------|:--------------:|:--------------:|
| Plan a new feature | ✅ | ❌ |
| Create new files | ✅ | ❌ |
| Debug complex crashes | ✅ | ❌ |
| Rename variables | ❌ | ✅ |
| Add comments | ❌ | ✅ |
| Fix typos | ❌ | ✅ |
| Simple refactors | ❌ | ✅ |
---

### 🎭 Multi-Agent Orchestration

Modern AI tools support **parallel subagents** for complex tasks:

| Tool | Feature | Capability |
|------|---------|------------|
| Claude Code | Subagents | Up to 50 parallel agents |
| Cursor | Background Agents | Async task execution |
| Windsurf | Cascade | Auto-parallelization |

**Trigger orchestration with:**
```
"Execute in parallel:
 - Agent 1: Implement backend API
 - Agent 2: Build frontend UI
 - Agent 3: Generate tests
 Then synthesize results."
```

**GSD Command:** `/orchestrate "task description"`

---

## 📂 Project Structure

```text
/
├── frontend/               # React Native/Capacitor App
│   ├── src/                # UI Source Code
│   ├── index.html          # Entry point
│   ├── capacitor.config.json
│   └── package.json
├── backend/                # Server-side logic
│   └── supabase/           # Supabase Cloud functions & config
├── common/                 # Shared resources (types, configs)
├── README.md
└── package.json            # Root scripts
```

---

## ✨ Core Features

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

## 🎉 Recent Enhancements (February 2026)

### Co-Parenting Widget Rework
The Co-Parenting card on the dashboard has been completely reworked from a tabbed interface to compact, always-visible widgets.

#### 📊 Compact Visualizations (Always Visible)
*   **GitHub Grid** (50% width): Monthly calendar grid with color-coded custody days
*   **Orbital Ring** (50% width): Circular donut chart showing custody day distribution
*   **DNA Helix** (100% width): Animated double-helix showing custody patterns across the month
*   All three are visible simultaneously — no tabs to switch between

#### 🧠 AI Smart Insights (10 Types)
*   **Spending Correlation:** Flags high-spend custody days
*   **Custody Streaks:** Warns about upcoming multi-day custody stretches
*   **Transition Prep:** Reminders when custody switches tomorrow
*   **Weekly Spend Comparison:** Custody-day vs non-custody spending analysis
*   **Category Analysis:** Top spending category on custody days
*   **Monthly Balance:** Alerts when custody split deviates from 50/50
*   **Recurring Stores:** Identifies frequent custody-day shopping habits
*   **Weekend/Weekday Patterns:** Detects custody schedule patterns
*   **Quality Time / Stay Connected:** Context-aware daily suggestions

#### 📦 Layout
*   **Header:** Title + edit button + today's event
*   **Weekly Strip:** Mon→Sun status dots with event indicators
*   **Month Summary:** 3-column grid (You / Partner / Split counts + percentages)
*   **Visualizations Row:** GitHub + Orbital side by side, DNA full width below
*   **Smart Insights:** Up to 4 AI-driven contextual suggestions

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
