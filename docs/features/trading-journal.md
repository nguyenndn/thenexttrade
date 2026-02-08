# Trading Journal

## Overview
The Trading Journal is the core tool for traders to log, review, and analyze their trades. It goes beyond simple data entry by integrating psychological tracking and strategy performance.

## Key Features

### 1. Trade Logging
- **Manual Entry**: Users can manually input trade details (Symbol, Type, Price, Lots).
- **Rich Data**:
    - **Screenshots**: Upload charts analysis directly to the journal entry.
    - **Notes**: Rich text editor for detailed trade rationale.
    - **Tags**: Custom tags for filtering (e.g., #fomc, #news).

### 2. Strategy & Psychology
- **Strategy Tagging**: Associate every trade with a defined Strategy (e.g., "Trend Following").
    - *Why?* Allows filtering performance by strategy later.
- **Psychology Tracking**:
    - **Emotion Before/After**: Record mental state (e.g., "Calm", "Anxious", "FOMO").
    - **Confidence**: Rate confidence (1-10) on entry.

### 3. Management
- **Filtering**: Filter by Date Range, Symbol, Outcome (Win/Loss), or Strategy.
- **Views**: Toggle between List View (Table) and Grid View (Card).

## Technical Implementation
- **Data Model**: `JournalEntry` table.
- **Storage**: Screenshots are stored in Supabase Storage buckets (`trade-screenshots`).
- **Calculations**: P&L and R:R are calculated automatically if Entry, SL, and TP are provided.
