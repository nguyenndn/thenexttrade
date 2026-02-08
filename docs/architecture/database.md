# Database Schema

The project uses a PostgreSQL database hosted on Supabase, managed via Prisma ORM.

## Core Models

### `User`
Stores user profile information, subscription status, and preferences.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `level`: Int (Gamification level)
- `xp`: Int (Experience points)
- `streak`: Int (Login streak)

### `JournalTrade`
The central entity for trading data.
- `id`: UUID
- `userId`: UUID (Relation to User)
- `accountId`: UUID (Relation to TradingAccount)
- `symbol`: String (e.g., "XAUUSD")
- `type`: Enum ("BUY", "SELL")
- `lotSize`: Float
- `entryPrice`: Float
- `exitPrice`: Float
- `entryDate`: DateTime
- `exitDate`: DateTime
- `pnl`: Float (Profit/Loss)
- `result`: Enum ("WIN", "LOSS", "BREAK_EVEN")
- `status`: Enum ("OPEN", "CLOSED")
- `strategies`: Relation to Strategy
- `emotions`: JSON (Psychology data)

### `TradingAccount`
Manages different trading accounts (Demo/Live, different brokers).
- `id`: UUID
- `broker`: String
- `balance`: Float
- `currency`: String

### `Strategy`
User-defined trading strategies.
- `id`: UUID
- `name`: String
- `description`: String
- `rules`: JSON

## Relationships
- One **User** has many **TradingAccounts**.
- One **User** has many **Strategies**.
- One **TradingAccount** has many **JournalTrades**.
