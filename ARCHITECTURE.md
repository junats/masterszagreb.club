# Architecture Overview
This document serves as a critical, living template designed to equip agents with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one. Update this document as the codebase evolves.

## 1. Project Structure

[Project Root]/
├── backend/              # Backend services and configuration
│   ├── supabase/         # Supabase configuration, migrations, and functions
│   │   ├── migrations/   # Database schema changes
│   │   ├── functions/    # Edge functions
│   │   └── config.toml   # Local Supabase config
│   └── mcp-server/       # Local Model Context Protocol server
├── frontend/             # Frontend application (React + Vite)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Application views (implied or structural)
│   │   ├── assets/       # Static assets
│   │   ├── services/     # API services
│   │   ├── contexts/     # React Contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── data/         # Static data
│   │   ├── constants/    # App constants
│   │   └── utils/        # Utility functions
│   ├── public/           # Public assets
│   ├── index.html        # Entry HTML
│   └── vite.config.ts    # Build configuration
├── common/               # Shared code
│   └── types/            # TypeScript type definitions
├── scripts/              # Automation scripts (Agents, etc.)
└── ROADMAP.md            # Project roadmap

## 2. High-Level System Diagram
 
[User] <--> [Frontend (React/Vite)] <--> [Supabase (Backend/DB)]
                  |
                  +--> [Local Agent/MCP] (Dev Time)
                  +--> [Capacitor] (Mobile Wrapper)

## 3. Core Components

### 3.1. Frontend

**Name**: TrueTrack Web/Mobile App

**Description**: The main user interface for expense tracking, receipt scanning, and family management.

**Technologies**: React, Vite, TailwindCSS, Capacitor (for mobile), Framer Motion.

**Deployment**: Vercel (Web), iOS/Android (via Capacitor).

### 3.2. Backend Services

#### 3.2.1. Supabase (BaaS)

**Name**: TrueTrack Backend

**Description**: Handles authentication, database, real-time subscriptions, and storage.

**Technologies**: PostgreSQL, Supabase Auth, Storage, Edge Functions.

**Deployment**: Supabase Cloud.

#### 3.2.2. Local MCP Server

**Name**: Dev Agent Server

**Description**: A local bridge exposing database schema and utilities to AI coding assistants.

**Technologies**: Node.js, Model Context Protocol.

**Deployment**: Localhost.

## 4. Data Stores

### 4.1. Primary Database

**Name**: Supabase Postgres

**Type**: PostgreSQL

**Purpose**: Stores user data, receipts, categories, goals, and custody schedules.

**Key Tables**: `receipts`, `users`, `goals`, `custody_days`.

## 5. External Integrations / APIs

**Service**: Google Gemini

**Purpose**: AI analysis of receipt images and receipt data extraction.

**Integration**: Google GenAI SDK.

## 6. Security Considerations

**Authentication**: Supabase Auth (Email/Password, Social Managers).

**Authorization**: Row Level Security (RLS) on Postgres tables.

## 7. Development & Testing Environment

- **Frontend**: `npm run dev` (in `frontend/` or root via script).
- **Backend**: `supabase start` (in `backend/`).
- **Testing**: Vitest (planned).

## 10. Project Identification

**Project Name**: TrueTrack
**Repository URL**: https://git.nivas.hr/markupmark/hotel-track.git
