# Project Overview & Architecture

## 1. Introduction
**TheNextTrade** is a comprehensive CRM and Analytics platform designed for Forex/Crypto traders. It helps traders track their performance, manage strategies, monitor psychology, and improve their edge through data-driven insights.

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with custom "Breek Premium" design system)
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** React Hooks & Context API

### Backend & Database
- **BaaS:** Supabase (PostgreSQL, Auth, Realtime)
- **ORM:** Prisma
- **API:** Next.js API Routes (Serverless functions)

## 3. System Architecture

```mermaid
graph TD
    User[User / Client] -->|HTTPS| NextJS[Next.js App Router]
    
    subgraph "Frontend Layer"
        NextJS -->|React Server Components| ServerComp[Server Components]
        NextJS -->|Interactivity| ClientComp[Client Components]
    end
    
    subgraph "Data Layer"
        ServerComp -->|Prisma ORM| DB[(Supabase PostgreSQL)]
        ClientComp -->|SWR / Fetch| API[API Routes]
        API -->|Prisma ORM| DB
    end
    
    subgraph "External Services"
        NextJS -->|Auth| SupabaseAuth[Supabase Auth]
        NextJS -->|Storage| SupabaseStorage[Supabase Storage]
        API -->|Scraping| FireCrawl[FireCrawl API]
        API -->|AI Rewrite| Gemini[Gemini 2.5 Flash]
        API -->|Search| Serper[Serper.dev]
    end
```

## 4. Key Modules
- **Dashboard:** Main command center for traders.
- **Journal:** Detailed trade logging and history.
- **Analytics:** Advanced performance metrics, heatmaps, profit calendar, and equity curves.
- **Academy:** 12-level educational curriculum with AI content pipeline, quizzes, and progress tracking.
- **Psychology:** Emotion tracking, tilt indicators, confidence correlation.
- **Strategies:** Strategy management and performance comparison.
- **Admin Panel:** User management, content CMS, academy editor with AI rewrite.
- **AI Content Pipeline:** Multi-source scraping (FireCrawl), search (Serper.dev), rewrite (Gemini) with 8 tone options and 5-layer copyright protection.

## 5. Design Principles
- **Mobile First:** All interfaces are responsive.
- **Dark Mode Support:** Native support for light/dark themes.
- **Performance:** Server Components for heavy lifting, Client Components for interactivity.
- **Accessibility:** Text contrast standards enforced (no gray-400 in light mode, no gray-500 in dark mode).

