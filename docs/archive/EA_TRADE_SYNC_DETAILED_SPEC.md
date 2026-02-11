# EA Trade Sync - Detailed Implementation Specification

> **Version:** 1.1  
> **Created:** February 4, 2026  
> **Updated:** February 4, 2026  
> **Purpose:** Auto sync closed trades từ MT4/MT5 via EA  
> **Priority:** P1 (Critical - Core journal feature)

---

## 1. Overview

### 1.1 Data Model Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                  │
│                       (trader123)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────┐ │
│  │ Trading Account 1 │  │ Trading Account 2 │  │ Account 3   │ │
│  ├───────────────────┤  ├───────────────────┤  ├─────────────┤ │
│  │ MT5 - IC Markets  │  │ MT4 - Pepperstone │  │ MT5 - FTMO  │ │
│  │ #12345678         │  │ #87654321         │  │ #11111111   │ │
│  │                   │  │                   │  │             │ │
│  │ 🔑 API Key: xxx1  │  │ 🔑 API Key: xxx2  │  │ 🔑 Key: xxx3│ │
│  │ 📊 156 trades     │  │ 📊 89 trades      │  │ 📊 45 trades│ │
│  └───────────────────┘  └───────────────────┘  └─────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Relationships:**

| Entity | Relationship | Description |
|--------|-------------|-------------|
| User : Trading Account | 1 : N | 1 user có thể có nhiều trading accounts |
| Trading Account : API Key | 1 : 1 | Mỗi account có 1 API key riêng biệt |
| Trading Account : Trades | 1 : N | Mỗi account có nhiều trades |

**Why Multi-Account?**
- Traders thường có nhiều brokers (IC Markets, Pepperstone, etc.)
- Prop firm traders có nhiều challenges/funded accounts
- Tách biệt Personal vs Demo vs Funded accounts
- Analytics riêng cho từng account

### 1.2 Mục tiêu
Cho phép traders:
- Tạo Trading Account trên web
- Download EA và cài vào MT4/MT5
- EA tự động push closed trades lên server
- Trades tự động xuất hiện trong Journal

### 1.2 User Stories
> "Tôi muốn trades tự động sync, không phải nhập tay"  
> "Set and forget - EA chạy ngầm, trades auto log"

### 1.3 So sánh với Manual Import

| Feature | EA Auto Sync | CSV Import |
|---------|-------------|------------|
| **Effort** | One-time setup | Every time export |
| **Real-time** | ✅ Sync ngay khi close | ❌ Manual upload |
| **Accuracy** | 100% không miss | Có thể quên |
| **Setup** | Cài EA | Không cần |

### 1.4 Flow tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD                        │
├─────────────────────────────────────────────────────────┤
│  Trading Accounts                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [+ Add Account]                                  │   │
│  │                                                  │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ MT5 - IC Markets #12345                     │ │   │
│  │ │ 🟢 Connected | Last sync: 2 min ago         │ │   │
│  │ │ 156 trades synced                           │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ MT4 - Pepperstone #67890                    │ │   │
│  │ │ 🔴 Disconnected | Last sync: 3 days ago     │ │   │
│  │ │ 89 trades synced                            │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ API (REST)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      SERVER                             │
├─────────────────────────────────────────────────────────┤
│  POST /api/ea/trades     ← Receive trades from EA       │
│  POST /api/ea/heartbeat  ← Connection status            │
│  GET  /api/ea/config     ← EA fetches settings          │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTPS Push
                           │
┌─────────────────────────────────────────────────────────┐
│                    MT4/MT5 EA                           │
├─────────────────────────────────────────────────────────┤
│  GSN_TradeSyncEA.ex4/.ex5                               │
│  - API Key: xxxx-xxxx-xxxx                              │
│  - Auto push closed trades                              │
│  - Heartbeat every 5 min                                │
└─────────────────────────────────────────────────────────┘
```

### 1.6 User Input vs EA Auto-Collect

| Field | User Input? | EA Auto-Collect? | Notes |
|-------|------------|------------------|-------|
| **Platform** | ✅ Chọn | ❌ | MT4, MT5, cTrader |
| **Account Name** | ✅ Optional | ❌ | "My Main Account" |
| **Account Number** | ❌ | ✅ `ACCOUNT_LOGIN` | Lock sau lần đầu |
| **Broker** | ❌ | ✅ `ACCOUNT_COMPANY` | "IC Markets" |
| **Server** | ❌ | ✅ `ACCOUNT_SERVER` | "ICMarkets-Live02" |
| **Currency** | ❌ | ✅ `ACCOUNT_CURRENCY` | "USD" |
| **Leverage** | ❌ | ✅ `ACCOUNT_LEVERAGE` | 500 |
| **API Key** | ❌ | ❌ | Server auto-generate |

### 1.7 Account Number Validation (Security)

Để tránh user paste nhầm API key vào account khác:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LẦN ĐẦU EA CONNECT                           │
├─────────────────────────────────────────────────────────────────┤
│  EA gửi: { apiKey: "xxx", accountNumber: "12345678" }           │
│                                                                 │
│  Server check:                                                  │
│  ├─ account.accountNumber == null  → Lưu "12345678" ✅          │
│  └─ Trả về: { success: true }                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CÁC LẦN SAU - ĐÚNG ACCOUNT                   │
├─────────────────────────────────────────────────────────────────┤
│  EA gửi: { apiKey: "xxx", accountNumber: "12345678" }           │
│                                                                 │
│  Server check:                                                  │
│  ├─ account.accountNumber == "12345678"                         │
│  ├─ request.accountNumber == "12345678"                         │
│  └─ Match ✅ → Sync trades bình thường                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CÁC LẦN SAU - SAI ACCOUNT ❌                 │
├─────────────────────────────────────────────────────────────────┤
│  User paste nhầm API key vào account khác                       │
│  EA gửi: { apiKey: "xxx", accountNumber: "99999999" }           │
│                                                                 │
│  Server check:                                                  │
│  ├─ account.accountNumber == "12345678" (đã lưu)                │
│  ├─ request.accountNumber == "99999999" (không match!)          │
│  └─ REJECT ❌ → Error 403:                                      │
│     "This API key is linked to account #12345678,               │
│      but EA is running on #99999999"                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Trading Accounts Table

```sql
-- Trading accounts for EA sync
CREATE TABLE IF NOT EXISTS trading_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Account info (name from user, rest auto-collected by EA)
    name VARCHAR(100) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- 'MT4', 'MT5', 'CTRADER'
    broker VARCHAR(100),           -- Auto from EA: ACCOUNT_COMPANY
    server VARCHAR(100),           -- Auto from EA: ACCOUNT_SERVER
    account_number VARCHAR(50),    -- Auto from EA: ACCOUNT_LOGIN
    
    -- API authentication
    api_key VARCHAR(64) NOT NULL UNIQUE,
    api_key_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Connection status
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONNECTED, DISCONNECTED
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    last_sync TIMESTAMP WITH TIME ZONE,
    ea_version VARCHAR(20),
    
    -- Stats
    total_trades INTEGER DEFAULT 0,
    
    -- Settings
    auto_sync BOOLEAN DEFAULT TRUE,
    sync_open_trades BOOLEAN DEFAULT FALSE, -- Future: sync open positions too
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trading_accounts_user ON trading_accounts(user_id);
CREATE UNIQUE INDEX idx_trading_accounts_api_key ON trading_accounts(api_key);
```

### 2.2 Synced Trades Table

```sql
-- Add trading account reference to journal_trades
ALTER TABLE journal_trades 
ADD COLUMN trading_account_id UUID REFERENCES trading_accounts(id) ON DELETE SET NULL,
ADD COLUMN external_ticket VARCHAR(100), -- MT4/MT5 ticket number
ADD COLUMN sync_source VARCHAR(20) DEFAULT 'MANUAL', -- MANUAL, EA_SYNC
ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE;

-- Unique constraint to prevent duplicate syncs
CREATE UNIQUE INDEX idx_journal_trades_external_ticket 
ON journal_trades(trading_account_id, external_ticket) 
WHERE external_ticket IS NOT NULL;
```

### 2.3 Sync History Table

```sql
-- Track sync batches
CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    
    -- Sync info
    trades_received INTEGER DEFAULT 0,
    trades_imported INTEGER DEFAULT 0,
    trades_skipped INTEGER DEFAULT 0, -- Duplicates
    
    -- EA info
    ea_version VARCHAR(20),
    client_time TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_history_account ON sync_history(trading_account_id);
```

### 2.4 Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
model TradingAccount {
  id              String    @id @default(uuid()) @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  
  name            String    @db.VarChar(100)
  platform        String    @db.VarChar(20)
  broker          String?   @db.VarChar(100)  // Auto from EA
  server          String?   @db.VarChar(100)  // Auto from EA
  accountNumber   String?   @map("account_number") @db.VarChar(50) // Auto from EA
  
  apiKey          String    @unique @map("api_key") @db.VarChar(64)
  apiKeyCreatedAt DateTime  @default(now()) @map("api_key_created_at")
  
  status          String    @default("PENDING") @db.VarChar(20)
  lastHeartbeat   DateTime? @map("last_heartbeat")
  lastSync        DateTime? @map("last_sync")
  eaVersion       String?   @map("ea_version") @db.VarChar(20)
  
  totalTrades     Int       @default(0) @map("total_trades")
  
  autoSync        Boolean   @default(true) @map("auto_sync")
  syncOpenTrades  Boolean   @default(false) @map("sync_open_trades")
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades          JournalTrade[]
  syncHistory     SyncHistory[]

  @@index([userId])
  @@map("trading_accounts")
}

model SyncHistory {
  id                String   @id @default(uuid()) @db.Uuid
  tradingAccountId  String   @map("trading_account_id") @db.Uuid
  
  tradesReceived    Int      @default(0) @map("trades_received")
  tradesImported    Int      @default(0) @map("trades_imported")
  tradesSkipped     Int      @default(0) @map("trades_skipped")
  
  eaVersion         String?  @map("ea_version") @db.VarChar(20)
  clientTime        DateTime? @map("client_time")
  
  createdAt         DateTime @default(now()) @map("created_at")

  tradingAccount    TradingAccount @relation(fields: [tradingAccountId], references: [id], onDelete: Cascade)

  @@index([tradingAccountId])
  @@map("sync_history")
}

model JournalTrade {
  // ... existing fields ...
  
  tradingAccountId  String?   @map("trading_account_id") @db.Uuid
  externalTicket    String?   @map("external_ticket") @db.VarChar(100)
  syncSource        String    @default("MANUAL") @map("sync_source") @db.VarChar(20)
  syncedAt          DateTime? @map("synced_at")
  
  tradingAccount    TradingAccount? @relation(fields: [tradingAccountId], references: [id], onDelete: SetNull)

  @@unique([tradingAccountId, externalTicket])
}
```

---

## 3. API Endpoints

### 3.1 Account Management APIs

**File:** `src/app/api/trading-accounts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";

// GET - List user's trading accounts
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        platform: true,
        broker: true,
        accountNumber: true,
        status: true,
        lastHeartbeat: true,
        lastSync: true,
        totalTrades: true,
        autoSync: true,
        createdAt: true,
        // Don't expose full API key
        apiKey: false,
      },
    });

    // Calculate connection status based on heartbeat
    const accountsWithStatus = accounts.map((acc) => ({
      ...acc,
      isConnected: acc.lastHeartbeat 
        ? Date.now() - new Date(acc.lastHeartbeat).getTime() < 10 * 60 * 1000 // 10 min
        : false,
    }));

    return NextResponse.json(accountsWithStatus);
  } catch (error) {
    console.error("Trading accounts list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

// POST - Create new trading account
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, platform, broker, accountNumber } = body;

    // Validate platform
    const validPlatforms = ["MT4", "MT5", "CTRADER"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    // Generate unique API key
    const apiKey = generateApiKey();

    const account = await prisma.tradingAccount.create({
      data: {
        userId: user.id,
        name: name || `${platform} Account`,
        platform,
        broker,
        accountNumber,
        apiKey,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        name: account.name,
        platform: account.platform,
        apiKey: account.apiKey, // Only show once on creation
      },
    });
  } catch (error) {
    console.error("Create trading account error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
```

### 3.2 Single Account Operations

**File:** `src/app/api/trading-accounts/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";

// GET - Get account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.tradingAccount.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        syncHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { trades: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...account,
      apiKey: undefined, // Never expose
      maskedApiKey: `${account.apiKey.substring(0, 8)}...${account.apiKey.substring(account.apiKey.length - 4)}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

// PATCH - Update account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, broker, autoSync } = body;

    const account = await prisma.tradingAccount.updateMany({
      where: { id: params.id, userId: user.id },
      data: { name, broker, autoSync },
    });

    if (account.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

// DELETE - Remove account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.tradingAccount.deleteMany({
      where: { id: params.id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
```

### 3.3 Regenerate API Key

**File:** `src/app/api/trading-accounts/[id]/regenerate-key/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newApiKey = generateApiKey();

    const account = await prisma.tradingAccount.updateMany({
      where: { id: params.id, userId: user.id },
      data: {
        apiKey: newApiKey,
        apiKeyCreatedAt: new Date(),
        status: "PENDING", // Reset status as EA needs new key
      },
    });

    if (account.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      apiKey: newApiKey, // Show new key once
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to regenerate key" }, { status: 500 });
  }
}
```

---

## 4. EA Communication APIs

### 4.1 Receive Trades from EA

**File:** `src/app/api/ea/trades/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateEARequest, parseEATrade } from "@/lib/ea/utils";

export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    // Validate API key and get account
    const account = await prisma.tradingAccount.findUnique({
      where: { apiKey },
      select: {
        id: true,
        userId: true,
        platform: true,
        autoSync: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!account.autoSync) {
      return NextResponse.json({ error: "Sync disabled" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { trades, eaVersion, clientTime, accountNumber } = body;

    // ========================================
    // ACCOUNT NUMBER VALIDATION
    // ========================================
    if (account.accountNumber && accountNumber) {
      if (account.accountNumber !== String(accountNumber)) {
        return NextResponse.json(
          { 
            error: "Account mismatch", 
            message: `API key is for account #${account.accountNumber}, not #${accountNumber}`,
          }, 
          { status: 403 }
        );
      }
    }

    if (!Array.isArray(trades)) {
      return NextResponse.json({ error: "Invalid trades data" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each trade
    for (const rawTrade of trades) {
      try {
        const trade = parseEATrade(rawTrade, account.platform);

        // Check for duplicate
        const existing = await prisma.journalTrade.findFirst({
          where: {
            tradingAccountId: account.id,
            externalTicket: trade.ticket,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create trade
        await prisma.journalTrade.create({
          data: {
            userId: account.userId,
            tradingAccountId: account.id,
            symbol: trade.symbol,
            type: trade.type,
            entryDate: trade.openTime,
            entryPrice: trade.openPrice,
            exitDate: trade.closeTime,
            exitPrice: trade.closePrice,
            size: trade.volume,
            pnl: trade.profit,
            commission: trade.commission,
            swap: trade.swap,
            status: "CLOSED",
            result: trade.profit > 0 ? "WIN" : trade.profit < 0 ? "LOSS" : "BREAKEVEN",
            externalTicket: trade.ticket,
            syncSource: "EA_SYNC",
            syncedAt: new Date(),
          },
        });

        imported++;
      } catch (err: any) {
        errors.push(`Trade ${rawTrade.ticket}: ${err.message}`);
      }
    }

    // Log sync history
    await prisma.syncHistory.create({
      data: {
        tradingAccountId: account.id,
        tradesReceived: trades.length,
        tradesImported: imported,
        tradesSkipped: skipped,
        eaVersion,
        clientTime: clientTime ? new Date(clientTime) : null,
      },
    });

    // Update account stats
    await prisma.tradingAccount.update({
      where: { id: account.id },
      data: {
        lastSync: new Date(),
        eaVersion,
        totalTrades: { increment: imported },
      },
    });

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("EA trades sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
```

### 4.2 EA Heartbeat

**File:** `src/app/api/ea/heartbeat/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      eaVersion, 
      accountNumber, 
      balance, 
      equity,
      // EA auto-collected info
      broker,      // ACCOUNT_COMPANY
      server,      // ACCOUNT_SERVER  
      currency,    // ACCOUNT_CURRENCY
      leverage,    // ACCOUNT_LEVERAGE
    } = body;

    const account = await prisma.tradingAccount.findUnique({
      where: { apiKey },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // ========================================
    // ACCOUNT NUMBER VALIDATION
    // ========================================
    // Lần đầu connect: lưu account_number
    // Các lần sau: validate account_number phải match
    // Tránh user paste nhầm API key vào account khác
    // ========================================
    if (account.accountNumber && accountNumber) {
      if (account.accountNumber !== String(accountNumber)) {
        return NextResponse.json(
          { 
            error: "Account mismatch", 
            message: `This API key is linked to account #${account.accountNumber}, but EA is running on #${accountNumber}. Please use correct API key.`,
            expectedAccount: account.accountNumber,
            actualAccount: String(accountNumber),
          }, 
          { status: 403 }
        );
      }
    }

    // Update heartbeat, status, and EA-collected info
    await prisma.tradingAccount.update({
      where: { id: account.id },
      data: {
        lastHeartbeat: new Date(),
        status: "CONNECTED",
        eaVersion,
        // Auto-collected from EA
        // accountNumber: chỉ lưu lần đầu, không update sau đó (để validate)
        accountNumber: account.accountNumber || String(accountNumber),
        broker: broker || account.broker,
        server: server || undefined,
        currency: currency || account.currency,
        leverage: leverage ? String(leverage) : account.leverage,
      },
    });

    return NextResponse.json({
      success: true,
      autoSync: account.autoSync,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("EA heartbeat error:", error);
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 });
  }
}
```

### 4.3 EA Config

**File:** `src/app/api/ea/config/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const account = await prisma.tradingAccount.findUnique({
      where: { apiKey },
      select: {
        id: true,
        autoSync: true,
        syncOpenTrades: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    return NextResponse.json({
      autoSync: account.autoSync,
      syncOpenTrades: account.syncOpenTrades,
      heartbeatInterval: 300, // 5 minutes
      syncInterval: 60, // 1 minute after trade close
    });
  } catch (error) {
    return NextResponse.json({ error: "Config fetch failed" }, { status: 500 });
  }
}
```

---

## 5. Utility Functions

### 5.1 API Key Generator

**File:** `src/lib/utils/api-key.ts`

```typescript
import { randomBytes } from "crypto";

export function generateApiKey(): string {
  // Generate 32 random bytes = 64 hex characters
  const bytes = randomBytes(32);
  const key = bytes.toString("hex");
  
  // Format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx
  return key.match(/.{1,8}/g)?.join("-") || key;
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 12) return "****";
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}
```

### 5.2 EA Trade Parser

**File:** `src/lib/ea/utils.ts`

```typescript
export interface EATrade {
  ticket: string;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openTime: Date;
  openPrice: number;
  closeTime: Date;
  closePrice: number;
  profit: number;
  commission: number;
  swap: number;
}

export interface RawEATrade {
  ticket: string | number;
  symbol: string;
  type: number; // 0=BUY, 1=SELL in MT4/MT5
  volume: number;
  lots?: number;
  openTime: string | number;
  openPrice: number;
  closeTime: string | number;
  closePrice: number;
  profit: number;
  commission?: number;
  swap?: number;
}

export function parseEATrade(raw: RawEATrade, platform: string): EATrade {
  return {
    ticket: String(raw.ticket),
    symbol: raw.symbol.replace(/[^A-Za-z0-9]/g, ""), // Clean symbol
    type: raw.type === 0 ? "BUY" : "SELL",
    volume: raw.volume || raw.lots || 0,
    openTime: parseEATime(raw.openTime),
    openPrice: raw.openPrice,
    closeTime: parseEATime(raw.closeTime),
    closePrice: raw.closePrice,
    profit: raw.profit,
    commission: raw.commission || 0,
    swap: raw.swap || 0,
  };
}

function parseEATime(time: string | number): Date {
  // MT4/MT5 can send as Unix timestamp or datetime string
  if (typeof time === "number") {
    return new Date(time * 1000); // Unix timestamp
  }
  return new Date(time);
}
```

---

## 6. React Components

### 6.1 File Structure

```
src/
├── app/
│   └── dashboard/
│       └── trading-accounts/
│           ├── page.tsx
│           └── [id]/
│               └── page.tsx
├── components/
│   └── trading-accounts/
│       ├── AccountList.tsx
│       ├── AddAccountModal.tsx
│       ├── AccountCard.tsx
│       ├── AccountDetails.tsx
│       ├── SetupInstructions.tsx
│       ├── SyncHistory.tsx
│       └── index.ts
```

### 6.2 Trading Accounts Page

**File:** `src/app/dashboard/trading-accounts/page.tsx`

```typescript
import { Metadata } from "next";
import { AccountList } from "@/components/trading-accounts/AccountList";

export const metadata: Metadata = {
  title: "Trading Accounts | GSN",
  description: "Manage your trading accounts and EA sync",
};

export default function TradingAccountsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Trading Accounts
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Connect your MT4/MT5 accounts to auto-sync trades
        </p>
      </div>

      <AccountList />
    </div>
  );
}
```

### 6.3 Account List Component

**File:** `src/components/trading-accounts/AccountList.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { AddAccountModal } from "./AddAccountModal";
import { toast } from "sonner";

interface TradingAccount {
  id: string;
  name: string;
  platform: string;
  broker: string | null;
  accountNumber: string | null;
  status: string;
  lastHeartbeat: string | null;
  lastSync: string | null;
  totalTrades: number;
  isConnected: boolean;
}

export function AccountList() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/trading-accounts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      toast.error("Failed to load accounts");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={fetchAccounts}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00C888] text-white rounded-xl font-medium hover:bg-[#00B377] transition-colors"
        >
          <Plus size={18} />
          Add Account
        </button>
      </div>

      {/* Account Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#00C888]/10 rounded-full flex items-center justify-center">
            <Plus size={32} className="text-[#00C888]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Trading Accounts
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add your first account to start syncing trades automatically
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-[#00C888] text-white rounded-xl font-medium hover:bg-[#00B377]"
          >
            Add Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onUpdate={fetchAccounts}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(account) => {
          setShowAddModal(false);
          fetchAccounts();
        }}
      />
    </div>
  );
}
```

### 6.4 Account Card

**File:** `src/components/trading-accounts/AccountCard.tsx`

```typescript
"use client";

import { useState } from "react";
import {
  MoreVertical,
  Settings,
  Key,
  Trash2,
  ExternalLink,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    platform: string;
    broker: string | null;
    accountNumber: string | null;
    status: string;
    lastHeartbeat: string | null;
    lastSync: string | null;
    totalTrades: number;
    isConnected: boolean;
  };
  onUpdate: () => void;
}

export function AccountCard({ account, onUpdate }: AccountCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const platformIcons: Record<string, string> = {
    MT4: "🔵",
    MT5: "🟣",
    CTRADER: "🟠",
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            account.isConnected ? "bg-[#00C888] animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-500">
          {account.isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Platform & Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl">
          {platformIcons[account.platform] || "📊"}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {account.name}
          </h3>
          <p className="text-sm text-gray-500">
            {account.platform}
            {account.accountNumber && ` #${account.accountNumber}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Trades</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {account.totalTrades}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Last Sync</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {account.lastSync
              ? formatDistanceToNow(new Date(account.lastSync), {
                  addSuffix: true,
                })
              : "Never"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/trading-accounts/${account.id}`}
          className="flex-1 text-center py-2 text-sm font-medium text-[#00C888] hover:bg-[#00C888]/10 rounded-lg transition-colors"
        >
          View Details
        </Link>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-4 top-16 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 py-2 z-10">
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
            <Settings size={16} />
            Settings
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
            <Key size={16} />
            Regenerate Key
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6.5 Add Account Modal

**File:** `src/components/trading-accounts/AddAccountModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { X, Copy, Download, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: any) => void;
}

type Step = "select-platform" | "create" | "setup-instructions";

export function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: AddAccountModalProps) {
  const [step, setStep] = useState<Step>("select-platform");
  const [platform, setPlatform] = useState<string>("");
  const [name, setName] = useState("");
  // NOTE: broker removed - EA will auto-collect from MT4/MT5
  const [isCreating, setIsCreating] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const platforms = [
    { id: "MT4", name: "MetaTrader 4", icon: "🔵", description: "Classic MT4 platform" },
    { id: "MT5", name: "MetaTrader 5", icon: "🟣", description: "Latest MT5 platform" },
    { id: "CTRADER", name: "cTrader", icon: "🟠", description: "Coming soon", disabled: true },
  ];

  async function handleCreate() {
    setIsCreating(true);
    try {
      const res = await fetch("/api/trading-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, name }), // Broker auto-collected by EA
      });

      if (!res.ok) throw new Error("Failed to create account");

      const data = await res.json();
      setCreatedAccount(data.account);
      setStep("setup-instructions");
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setIsCreating(false);
    }
  }

  function copyApiKey() {
    navigator.clipboard.writeText(createdAccount?.apiKey || "");
    setCopied(true);
    toast.success("API Key copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setStep("select-platform");
    setPlatform("");
    setName("");
    setCreatedAccount(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === "select-platform" && "Select Platform"}
            {step === "create" && "Account Details"}
            {step === "setup-instructions" && "Setup Instructions"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Platform */}
          {step === "select-platform" && (
            <div className="space-y-3">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  disabled={p.disabled}
                  onClick={() => {
                    setPlatform(p.id);
                    setStep("create");
                  }}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                    ${p.disabled
                      ? "opacity-50 cursor-not-allowed border-gray-100 dark:border-gray-700"
                      : "border-gray-100 dark:border-gray-700 hover:border-[#00C888] cursor-pointer"
                    }
                  `}
                >
                  <span className="text-3xl">{p.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-500">{p.description}</p>
                  </div>
                  <ArrowRight size={20} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === "create" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`My ${platform} Account`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Broker, account number, currency sẽ được EA tự động thu thập
                </p>
              </div>

              {/* NOTE: Broker field removed - EA will auto-collect this info */}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep("select-platform")}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex-1 py-3 bg-[#00C888] text-white rounded-xl font-medium hover:bg-[#00B377] disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Setup Instructions */}
          {step === "setup-instructions" && createdAccount && (
            <div className="space-y-6">
              {/* API Key */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your API Key (save this - only shown once!)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-900 dark:text-white break-all">
                    {createdAccount.apiKey}
                  </code>
                  <button
                    onClick={copyApiKey}
                    className="p-3 bg-[#00C888] text-white rounded-lg hover:bg-[#00B377]"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Setup Steps:
                </h3>
                <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-[#00C888] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      1
                    </span>
                    <span>
                      Download the GSN Trade Sync EA for {platform}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-[#00C888] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      2
                    </span>
                    <span>
                      Copy the EA file to your{" "}
                      <code className="px-1 bg-gray-100 dark:bg-gray-700 rounded">
                        MQL{platform === "MT5" ? "5" : "4"}/Experts
                      </code>{" "}
                      folder
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-[#00C888] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </span>
                    <span>Restart {platform} and attach EA to any chart</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-[#00C888] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      4
                    </span>
                    <span>Paste the API Key above into EA settings</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 bg-[#00C888] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      5
                    </span>
                    <span>Done! Trades will sync automatically</span>
                  </li>
                </ol>
              </div>

              {/* Download Button */}
              <a
                href={`/downloads/GSN_TradeSync_${platform}.ex${platform === "MT5" ? "5" : "4"}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#00C888] text-white rounded-xl font-medium hover:bg-[#00B377]"
              >
                <Download size={18} />
                Download EA for {platform}
              </a>

              <button
                onClick={() => {
                  handleClose();
                  onSuccess(createdAccount);
                }}
                className="w-full py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. EA Code Template (MQL5)

**File:** `public/downloads/GSN_TradeSync_MT5.mq5` (template)

```mql5
//+------------------------------------------------------------------+
//|                                            GSN_TradeSync.mq5     |
//|                                       Copyright 2026, GSN        |
//+------------------------------------------------------------------+
#property copyright "GSN"
#property version   "1.00"
#property strict

//--- Input parameters
input string ApiKey = "";        // API Key from GSN Dashboard
input string ServerUrl = "https://gsn.com/api/ea"; // Server URL
input int HeartbeatInterval = 300; // Heartbeat interval (seconds)
input int SyncDelay = 5;          // Delay after trade close (seconds)

//--- Global variables
datetime lastHeartbeat = 0;
datetime lastTradeCheck = 0;
int lastHistoryTotal = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(ApiKey == "")
   {
      Alert("Please enter your API Key!");
      return INIT_FAILED;
   }
   
   // Send initial heartbeat
   SendHeartbeat();
   
   // Get initial history count
   lastHistoryTotal = HistoryDealsTotal();
   
   Print("GSN Trade Sync initialized. API Key: ", StringSubstr(ApiKey, 0, 8), "...");
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("GSN Trade Sync stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   datetime now = TimeCurrent();
   
   // Heartbeat
   if(now - lastHeartbeat >= HeartbeatInterval)
   {
      SendHeartbeat();
      lastHeartbeat = now;
   }
   
   // Check for new closed trades
   if(now - lastTradeCheck >= SyncDelay)
   {
      CheckNewTrades();
      lastTradeCheck = now;
   }
}

//+------------------------------------------------------------------+
//| Send heartbeat to server                                         |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
   string url = ServerUrl + "/heartbeat";
   string headers = "Content-Type: application/json\r\nX-API-Key: " + ApiKey;
   
   // Collect all account info to send to server
   string body = StringFormat(
      "{\"eaVersion\":\"%s\",\"accountNumber\":\"%d\",\"balance\":%.2f,\"equity\":%.2f,"
      "\"broker\":\"%s\",\"server\":\"%s\",\"currency\":\"%s\",\"leverage\":%d}",
      "1.00",
      AccountInfoInteger(ACCOUNT_LOGIN),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      AccountInfoString(ACCOUNT_COMPANY),   // Broker name
      AccountInfoString(ACCOUNT_SERVER),    // Server name
      AccountInfoString(ACCOUNT_CURRENCY),  // Account currency
      AccountInfoInteger(ACCOUNT_LEVERAGE)  // Leverage
   );
   
   char data[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(body, data);
   
   int res = WebRequest("POST", url, headers, 5000, data, result, resultHeaders);
   
   if(res == 200)
   {
      Print("Heartbeat sent successfully");
   }
   else
   {
      Print("Heartbeat failed: ", res);
   }
}

//+------------------------------------------------------------------+
//| Check for new closed trades                                      |
//+------------------------------------------------------------------+
void CheckNewTrades()
{
   // Select all history
   HistorySelect(0, TimeCurrent());
   
   int currentTotal = HistoryDealsTotal();
   
   if(currentTotal > lastHistoryTotal)
   {
      // New trades found
      string trades = "[";
      bool first = true;
      
      for(int i = lastHistoryTotal; i < currentTotal; i++)
      {
         ulong ticket = HistoryDealGetTicket(i);
         
         // Only process closed trades (DEAL_ENTRY_OUT)
         if(HistoryDealGetInteger(ticket, DEAL_ENTRY) != DEAL_ENTRY_OUT)
            continue;
         
         if(!first) trades += ",";
         first = false;
         
         trades += FormatTrade(ticket);
      }
      
      trades += "]";
      
      if(!first) // Has trades to sync
      {
         SendTrades(trades);
      }
      
      lastHistoryTotal = currentTotal;
   }
}

//+------------------------------------------------------------------+
//| Format trade as JSON                                             |
//+------------------------------------------------------------------+
string FormatTrade(ulong ticket)
{
   ENUM_DEAL_TYPE type = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
   
   return StringFormat(
      "{\"ticket\":\"%d\",\"symbol\":\"%s\",\"type\":%d,\"volume\":%.2f,\"openPrice\":%.5f,\"closePrice\":%.5f,\"openTime\":%d,\"closeTime\":%d,\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f}",
      ticket,
      HistoryDealGetString(ticket, DEAL_SYMBOL),
      (type == DEAL_TYPE_BUY ? 0 : 1),
      HistoryDealGetDouble(ticket, DEAL_VOLUME),
      HistoryDealGetDouble(ticket, DEAL_PRICE),
      HistoryDealGetDouble(ticket, DEAL_PRICE),
      HistoryDealGetInteger(ticket, DEAL_TIME),
      HistoryDealGetInteger(ticket, DEAL_TIME),
      HistoryDealGetDouble(ticket, DEAL_PROFIT),
      HistoryDealGetDouble(ticket, DEAL_COMMISSION),
      HistoryDealGetDouble(ticket, DEAL_SWAP)
   );
}

//+------------------------------------------------------------------+
//| Send trades to server                                            |
//+------------------------------------------------------------------+
void SendTrades(string tradesJson)
{
   string url = ServerUrl + "/trades";
   string headers = "Content-Type: application/json\r\nX-API-Key: " + ApiKey;
   
   // Include accountNumber for server-side validation
   string body = StringFormat(
      "{\"trades\":%s,\"eaVersion\":\"%s\",\"clientTime\":\"%s\",\"accountNumber\":\"%d\"}",
      tradesJson,
      "1.00",
      TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS),
      AccountInfoInteger(ACCOUNT_LOGIN)
   );
   
   char data[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(body, data);
   
   int res = WebRequest("POST", url, headers, 10000, data, result, resultHeaders);
   
   if(res == 200)
   {
      Print("Trades synced successfully");
   }
   else
   {
      Print("Trades sync failed: ", res);
   }
}
//+------------------------------------------------------------------+
```

---

## 8. Test Cases

**File:** `src/lib/utils/api-key.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { generateApiKey, maskApiKey } from "./api-key";

describe("generateApiKey", () => {
  it("should generate 64 character key", () => {
    const key = generateApiKey();
    // With dashes: 8*8 + 7 dashes = 71 chars
    expect(key.replace(/-/g, "").length).toBe(64);
  });

  it("should generate unique keys", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey());
    }
    expect(keys.size).toBe(100);
  });

  it("should be properly formatted with dashes", () => {
    const key = generateApiKey();
    const parts = key.split("-");
    expect(parts.length).toBe(8);
    parts.forEach((part) => {
      expect(part.length).toBe(8);
    });
  });
});

describe("maskApiKey", () => {
  it("should mask middle of key", () => {
    const key = "12345678-abcd-efgh-ijkl-mnop";
    const masked = maskApiKey(key);
    expect(masked).toBe("12345678...mnop");
  });

  it("should handle short keys", () => {
    const masked = maskApiKey("short");
    expect(masked).toBe("****");
  });
});
```

**File:** `src/lib/ea/utils.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { parseEATrade } from "./utils";

describe("parseEATrade", () => {
  it("should parse MT5 trade data", () => {
    const raw = {
      ticket: 12345,
      symbol: "EURUSD",
      type: 0, // BUY
      volume: 0.1,
      openTime: 1704067200, // Unix timestamp
      openPrice: 1.0950,
      closeTime: 1704153600,
      closePrice: 1.1000,
      profit: 50.0,
      commission: -2.0,
      swap: -0.5,
    };

    const trade = parseEATrade(raw, "MT5");

    expect(trade.ticket).toBe("12345");
    expect(trade.symbol).toBe("EURUSD");
    expect(trade.type).toBe("BUY");
    expect(trade.volume).toBe(0.1);
    expect(trade.profit).toBe(50.0);
  });

  it("should handle SELL type", () => {
    const raw = {
      ticket: 12346,
      symbol: "GBPUSD",
      type: 1, // SELL
      volume: 0.5,
      openTime: "2024-01-01T10:00:00",
      openPrice: 1.2700,
      closeTime: "2024-01-01T15:00:00",
      closePrice: 1.2650,
      profit: 250.0,
    };

    const trade = parseEATrade(raw, "MT5");

    expect(trade.type).toBe("SELL");
  });

  it("should clean symbol name", () => {
    const raw = {
      ticket: 123,
      symbol: "EURUSD.raw",
      type: 0,
      volume: 0.1,
      openTime: 1704067200,
      openPrice: 1.0,
      closeTime: 1704067200,
      closePrice: 1.0,
      profit: 0,
    };

    const trade = parseEATrade(raw, "MT5");

    expect(trade.symbol).toBe("EURUSDraw");
  });
});
```

---

## 9. Files Summary

### Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `src/app/api/trading-accounts/route.ts` | List & Create accounts |
| 2 | `src/app/api/trading-accounts/[id]/route.ts` | Get, Update, Delete |
| 3 | `src/app/api/trading-accounts/[id]/regenerate-key/route.ts` | Regenerate API key |
| 4 | `src/app/api/ea/trades/route.ts` | Receive trades from EA |
| 5 | `src/app/api/ea/heartbeat/route.ts` | EA heartbeat |
| 6 | `src/app/api/ea/config/route.ts` | EA config |
| 7 | `src/app/dashboard/trading-accounts/page.tsx` | Accounts page |
| 8 | `src/components/trading-accounts/AccountList.tsx` | Account list |
| 9 | `src/components/trading-accounts/AccountCard.tsx` | Account card |
| 10 | `src/components/trading-accounts/AddAccountModal.tsx` | Add modal |
| 11 | `src/lib/utils/api-key.ts` | API key generator |
| 12 | `src/lib/ea/utils.ts` | EA utilities |
| 13 | `public/downloads/GSN_TradeSync_MT5.mq5` | EA source code |

### Files to MODIFY:

| # | File Path | Change |
|---|-----------|--------|
| 1 | `prisma/schema.prisma` | Add TradingAccount, SyncHistory models |
| 2 | `src/config/navigation.ts` | Add Trading Accounts nav item |

### Migration:

```bash
npx prisma migrate dev --name add_trading_accounts_ea_sync
npx prisma generate
```

---

## 10. Comparison: EA Sync vs CSV Import

| Feature | EA Auto Sync | CSV Import |
|---------|-------------|------------|
| **Recommended** | ✅ Primary | Fallback |
| **User Effort** | One-time setup | Every export |
| **Real-time** | ✅ Instant | ❌ Manual |
| **Accuracy** | 100% | May miss |
| **Setup Time** | 5 min | None |
| **Maintenance** | EA updates | None |

**Kết luận:** EA Auto Sync là approach chính, CSV Import giữ lại như fallback option cho users không muốn cài EA.

---

## 11. Additional Features

### 11.1 Account Labels/Tags

Cho phép user phân loại accounts để dễ quản lý và reporting.

**Database Addition:**

```sql
-- Account tags/labels
ALTER TABLE trading_accounts 
ADD COLUMN account_type VARCHAR(30) DEFAULT 'PERSONAL', -- PERSONAL, PROP_FIRM, DEMO, FUNDED
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN leverage VARCHAR(10);

-- Predefined account types
-- PERSONAL: Tài khoản cá nhân
-- PROP_FIRM: Prop trading firm (FTMO, MyForexFunds, etc.)
-- DEMO: Tài khoản demo
-- FUNDED: Tài khoản funded từ prop firm
```

**Prisma Update:**

```prisma
model TradingAccount {
  // ... existing fields ...
  
  accountType   String    @default("PERSONAL") @map("account_type") @db.VarChar(30)
  tags          String[]  @default([])
  currency      String    @default("USD") @db.VarChar(10)
  leverage      String?   @db.VarChar(10)
}
```

**UI Component:**

```typescript
const ACCOUNT_TYPES = [
  { id: "PERSONAL", label: "Personal", icon: "👤", color: "blue" },
  { id: "PROP_FIRM", label: "Prop Firm", icon: "🏢", color: "purple" },
  { id: "DEMO", label: "Demo", icon: "🎮", color: "gray" },
  { id: "FUNDED", label: "Funded", icon: "💰", color: "green" },
];

const POPULAR_TAGS = [
  "Scalping",
  "Swing",
  "FTMO",
  "MyForexFunds",
  "The5ers",
  "IC Markets",
  "Pepperstone",
];
```

---

### 11.2 Multi-Account Dashboard

Tổng hợp performance across all accounts.

**API Endpoint:**

**File:** `src/app/api/trading-accounts/summary/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all accounts with aggregated stats
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        platform: true,
        accountType: true,
        currency: true,
        status: true,
        lastSync: true,
        _count: { select: { trades: true } },
      },
    });

    // Calculate P&L per account
    const accountStats = await Promise.all(
      accounts.map(async (acc) => {
        const stats = await prisma.journalTrade.aggregate({
          where: { tradingAccountId: acc.id, status: "CLOSED" },
          _sum: { pnl: true },
          _count: true,
        });

        const wins = await prisma.journalTrade.count({
          where: { tradingAccountId: acc.id, result: "WIN" },
        });

        return {
          ...acc,
          totalPnl: stats._sum.pnl || 0,
          totalTrades: stats._count,
          winRate: stats._count > 0 ? (wins / stats._count) * 100 : 0,
        };
      })
    );

    // Calculate totals
    const totals = accountStats.reduce(
      (acc, curr) => ({
        totalPnl: acc.totalPnl + curr.totalPnl,
        totalTrades: acc.totalTrades + curr.totalTrades,
        connectedAccounts:
          acc.connectedAccounts + (curr.status === "CONNECTED" ? 1 : 0),
      }),
      { totalPnl: 0, totalTrades: 0, connectedAccounts: 0 }
    );

    return NextResponse.json({
      accounts: accountStats,
      totals: {
        ...totals,
        totalAccounts: accounts.length,
      },
    });
  } catch (error) {
    console.error("Account summary error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
```

**Dashboard Component:**

**File:** `src/components/trading-accounts/AccountsSummary.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AccountsSummaryProps {
  className?: string;
}

export function AccountsSummary({ className }: AccountsSummaryProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/trading-accounts/summary");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />;
  }

  const { totals } = data || { totals: {} };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Total P&L */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          {totals.totalPnl >= 0 ? (
            <TrendingUp className="text-[#00C888]" size={20} />
          ) : (
            <TrendingDown className="text-red-500" size={20} />
          )}
          <span className="text-sm text-gray-500">Total P&L</span>
        </div>
        <p
          className={`text-2xl font-bold ${
            totals.totalPnl >= 0 ? "text-[#00C888]" : "text-red-500"
          }`}
        >
          {formatCurrency(totals.totalPnl)}
        </p>
      </div>

      {/* Total Trades */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="text-blue-500" size={20} />
          <span className="text-sm text-gray-500">Total Trades</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {totals.totalTrades?.toLocaleString()}
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#00C888] animate-pulse" />
          <span className="text-sm text-gray-500">Connected</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {totals.connectedAccounts} / {totals.totalAccounts}
        </p>
      </div>

      {/* Accounts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="text-purple-500" size={20} />
          <span className="text-sm text-gray-500">Accounts</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {totals.totalAccounts}
        </p>
      </div>
    </div>
  );
}
```

---

### 11.3 Historical Sync

Cho phép sync trades cũ khi connect account lần đầu.

**API Endpoint:**

**File:** `src/app/api/ea/history/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEATrade } from "@/lib/ea/utils";

// EA calls this to sync historical trades
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const account = await prisma.tradingAccount.findUnique({
      where: { apiKey },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await request.json();
    const { trades, syncType, dateRange } = body;
    // syncType: "LAST_30_DAYS" | "LAST_60_DAYS" | "LAST_90_DAYS" | "ALL"

    if (!Array.isArray(trades)) {
      return NextResponse.json({ error: "Invalid trades data" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;

    for (const rawTrade of trades) {
      try {
        const trade = parseEATrade(rawTrade, account.platform);

        // Check duplicate
        const existing = await prisma.journalTrade.findFirst({
          where: {
            tradingAccountId: account.id,
            externalTicket: trade.ticket,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.journalTrade.create({
          data: {
            userId: account.userId,
            tradingAccountId: account.id,
            symbol: trade.symbol,
            type: trade.type,
            entryDate: trade.openTime,
            entryPrice: trade.openPrice,
            exitDate: trade.closeTime,
            exitPrice: trade.closePrice,
            size: trade.volume,
            pnl: trade.profit,
            commission: trade.commission,
            swap: trade.swap,
            status: "CLOSED",
            result: trade.profit > 0 ? "WIN" : trade.profit < 0 ? "LOSS" : "BREAKEVEN",
            externalTicket: trade.ticket,
            syncSource: "EA_HISTORY",
            syncedAt: new Date(),
          },
        });

        imported++;
      } catch (err) {
        // Skip invalid trades
      }
    }

    // Update account
    await prisma.tradingAccount.update({
      where: { id: account.id },
      data: {
        totalTrades: { increment: imported },
        lastSync: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: trades.length,
    });
  } catch (error) {
    console.error("Historical sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
```

**EA Addition (MQL5):**

```mql5
//+------------------------------------------------------------------+
//| Sync historical trades                                            |
//+------------------------------------------------------------------+
input bool SyncHistoryOnStart = true;    // Sync history on first connect
input int HistoryDays = 30;               // Days of history to sync

void SyncHistoricalTrades()
{
   if(!SyncHistoryOnStart) return;
   
   datetime fromDate = TimeCurrent() - HistoryDays * 24 * 60 * 60;
   HistorySelect(fromDate, TimeCurrent());
   
   int total = HistoryDealsTotal();
   string trades = "[";
   bool first = true;
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      
      // Only closed trades
      if(HistoryDealGetInteger(ticket, DEAL_ENTRY) != DEAL_ENTRY_OUT)
         continue;
      
      if(!first) trades += ",";
      first = false;
      
      trades += FormatTrade(ticket);
   }
   
   trades += "]";
   
   // Send to server
   string url = ServerUrl + "/history";
   string headers = "Content-Type: application/json\r\nX-API-Key: " + ApiKey;
   
   string body = StringFormat(
      "{\"trades\":%s,\"syncType\":\"LAST_%d_DAYS\",\"dateRange\":{\"from\":\"%s\",\"to\":\"%s\"}}",
      trades,
      HistoryDays,
      TimeToString(fromDate, TIME_DATE),
      TimeToString(TimeCurrent(), TIME_DATE)
   );
   
   // Send request...
   Print("Historical sync: ", total, " trades sent");
}
```

---

### 11.4 Notifications System

Thông báo khi EA disconnect hoặc sync events.

**Database:**

```sql
-- Account notification settings
ALTER TABLE trading_accounts
ADD COLUMN notify_disconnect BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_sync_errors BOOLEAN DEFAULT TRUE,
ADD COLUMN disconnect_threshold_hours INTEGER DEFAULT 24;

-- Notification logs
CREATE TABLE IF NOT EXISTS account_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(30) NOT NULL, -- DISCONNECT, SYNC_ERROR
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    is_read BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_account_notifications_user ON account_notifications(user_id, is_read);
```

**Cron Job - Check Disconnected Accounts:**

**File:** `src/lib/cron/check-disconnected-accounts.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function checkDisconnectedAccounts() {
  const now = new Date();

  // Find accounts that haven't sent heartbeat in threshold hours
  const disconnectedAccounts = await prisma.tradingAccount.findMany({
    where: {
      status: "CONNECTED",
      notifyDisconnect: true,
      lastHeartbeat: {
        lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours
      },
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  for (const account of disconnectedAccounts) {
    // Update status
    await prisma.tradingAccount.update({
      where: { id: account.id },
      data: { status: "DISCONNECTED" },
    });

    // Create notification
    await prisma.accountNotification.create({
      data: {
        tradingAccountId: account.id,
        userId: account.userId,
        type: "DISCONNECT",
        title: `${account.name} has been disconnected`,
        message: `Your trading account "${account.name}" hasn't synced in over 24 hours. Please check if the EA is running.`,
      },
    });

    // Send email
    if (account.user.email) {
      await sendEmail({
        to: account.user.email,
        subject: `⚠️ Trading Account Disconnected: ${account.name}`,
        template: "account-disconnected",
        data: {
          userName: account.user.name,
          accountName: account.name,
          platform: account.platform,
          lastSync: account.lastSync,
        },
      });
    }
  }

  return { checked: disconnectedAccounts.length };
}
```

---

### 11.5 Security Enhancements

**Rate Limiting:**

**File:** `src/app/api/ea/trades/route.ts` (update)

```typescript
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    // Rate limit by API key
    try {
      await limiter.check(30, apiKey); // 30 requests per minute
    } catch {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // ... rest of handler
  } catch (error) {
    // ...
  }
}
```

**API Key Expiration:**

```sql
-- Add expiration to API keys
ALTER TABLE trading_accounts
ADD COLUMN api_key_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ip_whitelist TEXT[] DEFAULT '{}';
```

**Prisma Update:**

```prisma
model TradingAccount {
  // ... existing fields ...
  
  apiKeyExpiresAt DateTime? @map("api_key_expires_at")
  ipWhitelist     String[]  @default([]) @map("ip_whitelist")
}
```

**IP Validation:**

```typescript
// In EA API handlers
function validateRequest(request: NextRequest, account: TradingAccount): boolean {
  // Check API key expiration
  if (account.apiKeyExpiresAt && new Date() > account.apiKeyExpiresAt) {
    return false;
  }

  // Check IP whitelist
  if (account.ipWhitelist.length > 0) {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "";
    if (!account.ipWhitelist.includes(clientIp)) {
      return false;
    }
  }

  return true;
}
```

---

### 11.6 Broker Auto-Detection

EA gửi thêm thông tin để auto-detect broker.

**EA Update:**

```mql5
void SendHeartbeat()
{
   string url = ServerUrl + "/heartbeat";
   string headers = "Content-Type: application/json\r\nX-API-Key: " + ApiKey;
   
   // Get broker/server info
   string server = AccountInfoString(ACCOUNT_SERVER);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   long leverage = AccountInfoInteger(ACCOUNT_LEVERAGE);
   
   string body = StringFormat(
      "{\"eaVersion\":\"%s\",\"accountNumber\":\"%d\",\"balance\":%.2f,\"equity\":%.2f,\"server\":\"%s\",\"company\":\"%s\",\"currency\":\"%s\",\"leverage\":%d}",
      EA_VERSION,
      AccountInfoInteger(ACCOUNT_LOGIN),
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      server,
      company,
      currency,
      leverage
   );
   
   // Send request...
}
```

**Broker Detection Logic:**

**File:** `src/lib/ea/broker-detection.ts`

```typescript
const BROKER_PATTERNS: Record<string, string[]> = {
  "IC Markets": ["ICMarkets", "ICMarketsEU", "ICMarkets-Live"],
  "Pepperstone": ["Pepperstone", "PepperstoneUK", "Pepperstone-Edge"],
  "FTMO": ["FTMO", "FTMODemo"],
  "Exness": ["Exness", "Exness-Real"],
  "XM": ["XMGlobal", "XM.COM"],
  "FxPro": ["FxPro", "FxPro.com"],
  "Tickmill": ["Tickmill", "TickmillEU"],
  "MyForexFunds": ["MyForexFunds", "MFF"],
  "The5ers": ["The5ers", "5ers"],
};

export function detectBroker(server: string, company: string): string | null {
  const combined = `${server} ${company}`.toLowerCase();

  for (const [broker, patterns] of Object.entries(BROKER_PATTERNS)) {
    for (const pattern of patterns) {
      if (combined.includes(pattern.toLowerCase())) {
        return broker;
      }
    }
  }

  // Fallback: use company name
  if (company) {
    return company.split(" ")[0]; // First word of company name
  }

  return null;
}
```

**Update heartbeat handler:**

```typescript
// In /api/ea/heartbeat/route.ts
import { detectBroker } from "@/lib/ea/broker-detection";

// Inside handler:
const detectedBroker = detectBroker(body.server || "", body.company || "");

await prisma.tradingAccount.update({
  where: { id: account.id },
  data: {
    lastHeartbeat: new Date(),
    status: "CONNECTED",
    eaVersion,
    accountNumber: body.accountNumber || account.accountNumber,
    broker: detectedBroker || account.broker,
    currency: body.currency || account.currency,
    leverage: body.leverage ? String(body.leverage) : account.leverage,
  },
});
```

---

## 12. Updated Files Summary

### Additional Files to CREATE:

| # | File Path | Purpose |
|---|-----------|---------|
| 14 | `src/app/api/trading-accounts/summary/route.ts` | Multi-account summary |
| 15 | `src/app/api/ea/history/route.ts` | Historical sync |
| 16 | `src/components/trading-accounts/AccountsSummary.tsx` | Summary dashboard |
| 17 | `src/lib/ea/broker-detection.ts` | Auto-detect broker |
| 18 | `src/lib/cron/check-disconnected-accounts.ts` | Disconnect notifications |

### Updated Database Schema:

```sql
-- Full migration script
ALTER TABLE trading_accounts 
ADD COLUMN account_type VARCHAR(30) DEFAULT 'PERSONAL',
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN leverage VARCHAR(10),
ADD COLUMN notify_disconnect BOOLEAN DEFAULT TRUE,
ADD COLUMN notify_sync_errors BOOLEAN DEFAULT TRUE,
ADD COLUMN disconnect_threshold_hours INTEGER DEFAULT 24,
ADD COLUMN api_key_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ip_whitelist TEXT[] DEFAULT '{}';

-- Notifications table
CREATE TABLE IF NOT EXISTS account_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

```

---

## 13. Implementation Phases

### Phase 1 - Core (Week 1-2)
- [x] Trading Accounts CRUD
- [x] EA API endpoints (trades, heartbeat, config)
- [x] Basic UI components
- [x] Duplicate detection

### Phase 2 - Enhanced (Week 3)
- [ ] Account labels/tags
- [ ] Multi-account dashboard
- [ ] Historical sync on first connect
- [ ] Broker auto-detection

### Phase 3 - Notifications (Week 4)
- [ ] Disconnect alerts
- [ ] In-app notifications

### Phase 4 - Security (Week 5)
- [ ] Rate limiting
- [ ] API key expiration
- [ ] IP whitelist

### Phase 5 - Remote Sync (Week 6)
- [ ] Command Queue system
- [ ] Web-triggered sync
- [ ] Real-time status updates

---

## 14. Remote Sync Feature (Command Queue Pattern)

### 14.1 Problem Statement

**Vấn đề:** User muốn trigger sync từ website, nhưng EA chạy trên VPS không thể nhận incoming requests (EA chỉ có thể gọi outbound).

**Use Cases:**
- User để EA chạy trên VPS 24/7, muốn sync từ điện thoại/máy khác
- User quên sync, muốn trigger manual từ web
- Admin cần force sync cho user khi troubleshoot

### 14.2 Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REMOTE SYNC FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐                                                      │
│   │   Website    │                                                      │
│   │  Dashboard   │                                                      │
│   └──────┬───────┘                                                      │
│          │ (1) User clicks "Remote Sync"                                │
│          │     POST /api/ea/commands                                    │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                      SERVER                                   │      │
│   │  ┌─────────────────────────────────────────────────────────┐ │      │
│   │  │              COMMAND QUEUE (Database)                   │ │      │
│   │  │  ┌─────────────────────────────────────────────────┐   │ │      │
│   │  │  │ id: cmd_001                                      │   │ │      │
│   │  │  │ type: SYNC_TRADES                                │   │ │      │
│   │  │  │ params: { days: 7 }                              │   │ │      │
│   │  │  │ status: PENDING ─▶ PROCESSING ─▶ COMPLETED       │   │ │      │
│   │  │  │ created: 2026-02-05 10:00:00                     │   │ │      │
│   │  │  └─────────────────────────────────────────────────┘   │ │      │
│   │  └─────────────────────────────────────────────────────────┘ │      │
│   └──────────────────────────────────────────────────────────────┘      │
│          ▲                                                              │
│          │ (2) EA polls every 5-10 seconds                              │
│          │     GET /api/ea/commands                                     │
│          │                                                              │
│   ┌──────┴───────┐                                                      │
│   │   EA (VPS)   │                                                      │
│   │   MT4/MT5    │                                                      │
│   └──────┬───────┘                                                      │
│          │ (3) EA executes command                                      │
│          │     - Sync trades                                            │
│          │     - Report result                                          │
│          │     PATCH /api/ea/commands/:id                               │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │                    RESULT                                     │      │
│   │  - Command marked COMPLETED/FAILED                            │      │
│   │  - User sees result on web (real-time via polling/websocket)  │      │
│   └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 14.3 Database Schema

```sql
-- EA Commands table for remote sync
CREATE TABLE IF NOT EXISTS ea_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Command details
    type VARCHAR(30) NOT NULL,  -- 'SYNC_TRADES', 'SYNC_ALL', 'TEST_CONNECTION'
    params JSONB DEFAULT '{}',  -- { days: 7, fromDate: "2026-01-01", toDate: "2026-02-01" }
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,      -- When EA picked up
    completed_at TIMESTAMP WITH TIME ZONE,    -- When EA finished
    expires_at TIMESTAMP WITH TIME ZONE,      -- Auto-expire if not picked up
    
    -- Result
    result JSONB,  -- { success: true, syncedCount: 15, message: "..." }
    error_message TEXT,
    
    -- Metadata
    source VARCHAR(20) DEFAULT 'WEB',  -- WEB, API, ADMIN
    ip_address VARCHAR(45),
    
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'))
);

-- Index for EA polling (get pending commands quickly)
CREATE INDEX idx_ea_commands_pending ON ea_commands(trading_account_id, status, created_at) 
WHERE status = 'PENDING';

-- Index for user viewing their commands
CREATE INDEX idx_ea_commands_user ON ea_commands(user_id, created_at DESC);

-- Auto-expire old PENDING commands (optional trigger)
CREATE OR REPLACE FUNCTION expire_old_commands()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ea_commands 
    SET status = 'EXPIRED' 
    WHERE status = 'PENDING' 
    AND expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 14.4 Prisma Schema

```prisma
model EaCommand {
  id                String          @id @default(uuid())
  tradingAccountId  String          @map("trading_account_id")
  userId            String          @map("user_id")
  
  // Command details
  type              String          // SYNC_TRADES, SYNC_ALL, TEST_CONNECTION
  params            Json            @default("{}")
  
  // Status
  status            String          @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED
  
  // Timestamps
  createdAt         DateTime        @default(now()) @map("created_at")
  startedAt         DateTime?       @map("started_at")
  completedAt       DateTime?       @map("completed_at")
  expiresAt         DateTime?       @map("expires_at")
  
  // Result
  result            Json?
  errorMessage      String?         @map("error_message")
  
  // Metadata
  source            String          @default("WEB")
  ipAddress         String?         @map("ip_address")
  
  // Relations
  tradingAccount    TradingAccount  @relation(fields: [tradingAccountId], references: [id], onDelete: Cascade)
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([tradingAccountId, status, createdAt])
  @@index([userId, createdAt(sort: Desc)])
  @@map("ea_commands")
}

// Update TradingAccount model
model TradingAccount {
  // ... existing fields ...
  commands          EaCommand[]
}
```

### 14.5 API Endpoints

#### 14.5.1 Create Command (Web → Server)

```typescript
// POST /api/ea/commands
// Auth: Session (logged-in user)

// Request Body:
{
  "tradingAccountId": "uuid-xxx",
  "type": "SYNC_TRADES",
  "params": {
    "days": 7
    // OR
    "fromDate": "2026-01-01",
    "toDate": "2026-02-01"
  }
}

// Response:
{
  "success": true,
  "command": {
    "id": "cmd-uuid-xxx",
    "type": "SYNC_TRADES",
    "status": "PENDING",
    "createdAt": "2026-02-05T10:00:00Z",
    "expiresAt": "2026-02-05T10:10:00Z"
  }
}
```

**File: `src/app/api/ea/commands/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const CreateCommandSchema = z.object({
  tradingAccountId: z.string().uuid(),
  type: z.enum(["SYNC_TRADES", "SYNC_ALL", "TEST_CONNECTION"]),
  params: z.object({
    days: z.number().min(1).max(365).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateCommandSchema.parse(body);

    // Verify user owns this trading account
    const account = await prisma.tradingAccount.findFirst({
      where: {
        id: validated.tradingAccountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Trading account not found" }, { status: 404 });
    }

    // Check if EA is connected (last heartbeat within 60 seconds)
    const isConnected = account.lastHeartbeat && 
      new Date().getTime() - new Date(account.lastHeartbeat).getTime() < 60000;

    if (!isConnected) {
      return NextResponse.json({ 
        error: "EA is not connected. Please ensure EA is running on your MT4/MT5 terminal.",
        code: "EA_OFFLINE"
      }, { status: 400 });
    }

    // Check for existing pending command (prevent spam)
    const existingPending = await prisma.eaCommand.findFirst({
      where: {
        tradingAccountId: validated.tradingAccountId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json({ 
        error: "A command is already pending. Please wait for it to complete.",
        existingCommand: existingPending
      }, { status: 409 });
    }

    // Create command with 10-minute expiry
    const command = await prisma.eaCommand.create({
      data: {
        tradingAccountId: validated.tradingAccountId,
        userId: session.user.id,
        type: validated.type,
        params: validated.params,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        source: "WEB",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      },
    });

    return NextResponse.json({
      success: true,
      command: {
        id: command.id,
        type: command.type,
        status: command.status,
        createdAt: command.createdAt,
        expiresAt: command.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("Create command error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/ea/commands - List user's commands
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tradingAccountId = searchParams.get("tradingAccountId");
    const limit = parseInt(searchParams.get("limit") || "10");

    const commands = await prisma.eaCommand.findMany({
      where: {
        userId: session.user.id,
        ...(tradingAccountId && { tradingAccountId }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        tradingAccount: {
          select: { name: true, accountNumber: true },
        },
      },
    });

    return NextResponse.json({ commands });
  } catch (error) {
    console.error("List commands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### 14.5.2 EA Poll Commands (EA → Server)

```typescript
// GET /api/ea/commands/pending
// Auth: X-API-Key header

// Response:
{
  "commands": [
    {
      "id": "cmd-uuid-xxx",
      "type": "SYNC_TRADES",
      "params": { "days": 7 },
      "createdAt": "2026-02-05T10:00:00Z"
    }
  ]
}
```

**File: `src/app/api/ea/commands/pending/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    // Find trading account by API key
    const account = await prisma.tradingAccount.findUnique({
      where: { apiKey },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Get pending commands for this account
    const commands = await prisma.eaCommand.findMany({
      where: {
        tradingAccountId: account.id,
        status: "PENDING",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 1, // Process one command at a time
    });

    // Mark as PROCESSING if found
    if (commands.length > 0) {
      await prisma.eaCommand.update({
        where: { id: commands[0].id },
        data: { 
          status: "PROCESSING",
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      commands: commands.map(cmd => ({
        id: cmd.id,
        type: cmd.type,
        params: cmd.params,
        createdAt: cmd.createdAt,
      })),
    });
  } catch (error) {
    console.error("Poll commands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### 14.5.3 EA Report Result (EA → Server)

```typescript
// PATCH /api/ea/commands/:id
// Auth: X-API-Key header

// Request Body:
{
  "status": "COMPLETED",  // or "FAILED"
  "result": {
    "success": true,
    "syncedCount": 15,
    "message": "Synced 15 trades from last 7 days"
  }
}
// OR for failure:
{
  "status": "FAILED",
  "errorMessage": "No trades found in specified period"
}

// Response:
{
  "success": true,
  "message": "Command result recorded"
}
```

**File: `src/app/api/ea/commands/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const UpdateCommandSchema = z.object({
  status: z.enum(["COMPLETED", "FAILED"]),
  result: z.object({
    success: z.boolean(),
    syncedCount: z.number().optional(),
    message: z.string().optional(),
  }).optional(),
  errorMessage: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    // Find trading account by API key
    const account = await prisma.tradingAccount.findUnique({
      where: { apiKey },
    });

    if (!account) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateCommandSchema.parse(body);

    // Update command (only if belongs to this account and is PROCESSING)
    const command = await prisma.eaCommand.updateMany({
      where: {
        id: params.id,
        tradingAccountId: account.id,
        status: "PROCESSING",
      },
      data: {
        status: validated.status,
        result: validated.result || undefined,
        errorMessage: validated.errorMessage,
        completedAt: new Date(),
      },
    });

    if (command.count === 0) {
      return NextResponse.json({ 
        error: "Command not found or not in PROCESSING status" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Command result recorded",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    console.error("Update command error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### 14.5.4 Get Command Status (Web polling)

```typescript
// GET /api/ea/commands/:id
// Auth: Session

// Response:
{
  "command": {
    "id": "cmd-uuid-xxx",
    "type": "SYNC_TRADES",
    "status": "COMPLETED",
    "params": { "days": 7 },
    "result": {
      "success": true,
      "syncedCount": 15,
      "message": "Synced 15 trades"
    },
    "createdAt": "2026-02-05T10:00:00Z",
    "startedAt": "2026-02-05T10:00:05Z",
    "completedAt": "2026-02-05T10:00:12Z"
  }
}
```

### 14.6 EA Implementation (MQL5)

Add to `GSN_TradeSync_MT5.mq5`:

```mq4
//+------------------------------------------------------------------+
//| Remote Command Processing                                         |
//+------------------------------------------------------------------+
string g_CurrentCommandId = "";  // Track current command being processed

//+------------------------------------------------------------------+
//| Check for pending remote commands                                 |
//+------------------------------------------------------------------+
void CheckRemoteCommands()
{
   // Don't check if already processing a command
   if(g_CurrentCommandId != "") return;
   
   string url = g_BaseUrl + "/api/ea/commands/pending";
   string headers = "Content-Type: application/json\r\nX-API-Key: " + InpApiKey;
   
   char postData[];
   char resultData[];
   string resultHeaders;
   
   ResetLastError();
   int res = WebRequest("GET", url, headers, 5000, postData, resultData, resultHeaders);
   
   if(res == 200)
   {
      string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
      
      // Parse response to get command
      // Simple JSON parsing (or use a JSON library)
      string commandId = ExtractJsonString(response, "id");
      string commandType = ExtractJsonString(response, "type");
      string paramsJson = ExtractJsonObject(response, "params");
      
      if(commandId != "")
      {
         g_CurrentCommandId = commandId;
         ProcessRemoteCommand(commandId, commandType, paramsJson);
      }
   }
}

//+------------------------------------------------------------------+
//| Process a remote command                                          |
//+------------------------------------------------------------------+
void ProcessRemoteCommand(string commandId, string commandType, string paramsJson)
{
   Print("Processing remote command: ", commandType, " (", commandId, ")");
   
   bool success = false;
   int syncedCount = 0;
   string message = "";
   string errorMsg = "";
   
   if(commandType == "SYNC_TRADES")
   {
      // Parse params
      int days = (int)ExtractJsonNumber(paramsJson, "days");
      string fromDateStr = ExtractJsonString(paramsJson, "fromDate");
      string toDateStr = ExtractJsonString(paramsJson, "toDate");
      
      if(days > 0)
      {
         // Sync by days
         syncedCount = SyncRecentTrades(days);
         if(syncedCount >= 0)
         {
            success = true;
            message = StringFormat("Synced %d trades from last %d days", syncedCount, days);
         }
         else
         {
            errorMsg = g_LastError;
         }
      }
      else if(fromDateStr != "" && toDateStr != "")
      {
         // Sync by date range
         datetime fromDate = StringToTime(fromDateStr);
         datetime toDate = StringToTime(toDateStr) + 24*60*60; // Include end date
         
         syncedCount = SyncDateRange(fromDate, toDate);
         if(syncedCount >= 0)
         {
            success = true;
            message = StringFormat("Synced %d trades from %s to %s", syncedCount, fromDateStr, toDateStr);
         }
         else
         {
            errorMsg = g_LastError;
         }
      }
   }
   else if(commandType == "SYNC_ALL")
   {
      syncedCount = SyncAllHistory();
      if(syncedCount >= 0)
      {
         success = true;
         message = StringFormat("Synced entire history: %d trades", syncedCount);
      }
      else
      {
         errorMsg = g_LastError;
      }
   }
   else if(commandType == "TEST_CONNECTION")
   {
      success = g_IsConnected;
      message = success ? "Connection OK" : "Not connected";
   }
   
   // Report result back to server
   ReportCommandResult(commandId, success, syncedCount, message, errorMsg);
   
   g_CurrentCommandId = "";
}

//+------------------------------------------------------------------+
//| Report command result to server                                   |
//+------------------------------------------------------------------+
void ReportCommandResult(string commandId, bool success, int syncedCount, string message, string errorMsg)
{
   string url = g_BaseUrl + "/api/ea/commands/" + commandId;
   string headers = "Content-Type: application/json\r\nX-API-Key: " + InpApiKey;
   
   string json;
   if(success)
   {
      json = StringFormat(
         "{"
         "\"status\":\"COMPLETED\","
         "\"result\":{"
         "\"success\":true,"
         "\"syncedCount\":%d,"
         "\"message\":\"%s\""
         "}"
         "}",
         syncedCount,
         EscapeJsonString(message)
      );
   }
   else
   {
      json = StringFormat(
         "{"
         "\"status\":\"FAILED\","
         "\"errorMessage\":\"%s\""
         "}",
         EscapeJsonString(errorMsg)
      );
   }
   
   char postData[];
   char resultData[];
   string resultHeaders;
   
   StringToCharArray(json, postData, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(postData, ArraySize(postData) - 1);
   
   ResetLastError();
   int res = WebRequest("PATCH", url, headers, 5000, postData, resultData, resultHeaders);
   
   if(res == 200)
   {
      Print("Command result reported successfully");
   }
   else
   {
      Print("Failed to report command result. HTTP: ", res);
   }
}

//+------------------------------------------------------------------+
//| Simple JSON string extraction                                     |
//+------------------------------------------------------------------+
string ExtractJsonString(string json, string key)
{
   string searchKey = "\"" + key + "\":\"";
   int start = StringFind(json, searchKey);
   if(start == -1) return "";
   
   start += StringLen(searchKey);
   int end = StringFind(json, "\"", start);
   if(end == -1) return "";
   
   return StringSubstr(json, start, end - start);
}

//+------------------------------------------------------------------+
//| Simple JSON number extraction                                     |
//+------------------------------------------------------------------+
double ExtractJsonNumber(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int start = StringFind(json, searchKey);
   if(start == -1) return 0;
   
   start += StringLen(searchKey);
   
   // Skip whitespace
   while(start < StringLen(json) && StringSubstr(json, start, 1) == " ")
      start++;
   
   // Find end (comma, }, or ])
   int end = start;
   while(end < StringLen(json))
   {
      string ch = StringSubstr(json, end, 1);
      if(ch == "," || ch == "}" || ch == "]") break;
      end++;
   }
   
   string numStr = StringSubstr(json, start, end - start);
   StringTrimLeft(numStr);
   StringTrimRight(numStr);
   
   return StringToDouble(numStr);
}

//+------------------------------------------------------------------+
//| Simple JSON object extraction                                     |
//+------------------------------------------------------------------+
string ExtractJsonObject(string json, string key)
{
   string searchKey = "\"" + key + "\":";
   int start = StringFind(json, searchKey);
   if(start == -1) return "{}";
   
   start += StringLen(searchKey);
   
   // Skip whitespace
   while(start < StringLen(json) && StringSubstr(json, start, 1) == " ")
      start++;
   
   if(StringSubstr(json, start, 1) != "{") return "{}";
   
   // Find matching closing brace
   int depth = 0;
   int end = start;
   while(end < StringLen(json))
   {
      string ch = StringSubstr(json, end, 1);
      if(ch == "{") depth++;
      else if(ch == "}") depth--;
      if(depth == 0) break;
      end++;
   }
   
   return StringSubstr(json, start, end - start + 1);
}
```

**Update OnTimer to check for remote commands:**

```mq4
void OnTimer()
{
   static datetime lastHeartbeatSent = 0;
   static datetime lastCommandCheck = 0;
   datetime now = TimeCurrent();
   
   //--- Send heartbeat at configured interval
   if(now - lastHeartbeatSent >= InpHeartbeatInterval)
   {
      SendHeartbeat();
      lastHeartbeatSent = now;
   }
   
   //--- Check for remote commands every 5 seconds
   if(now - lastCommandCheck >= 5)
   {
      CheckRemoteCommands();
      lastCommandCheck = now;
   }
   
   //--- Update panel every second
   UpdatePanel();
}
```

### 14.7 Web UI Component

**File: `src/components/trading-accounts/RemoteSyncButton.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface RemoteSyncButtonProps {
  tradingAccountId: string;
  accountName: string;
  isConnected: boolean;
}

type CommandStatus = "idle" | "pending" | "processing" | "completed" | "failed";

export function RemoteSyncButton({
  tradingAccountId,
  accountName,
  isConnected,
}: RemoteSyncButtonProps) {
  const [open, setOpen] = useState(false);
  const [syncPeriod, setSyncPeriod] = useState("7");
  const [status, setStatus] = useState<CommandStatus>("idle");
  const [commandId, setCommandId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Poll for command status
  useEffect(() => {
    if (!commandId || status === "completed" || status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ea/commands/${commandId}`);
        const data = await res.json();
        
        if (data.command) {
          setStatus(data.command.status.toLowerCase() as CommandStatus);
          if (data.command.result) {
            setResult(data.command.result);
          }
          if (data.command.errorMessage) {
            setResult({ error: data.command.errorMessage });
          }
        }
      } catch (error) {
        console.error("Failed to poll command status:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [commandId, status]);

  const handleSync = async () => {
    try {
      setStatus("pending");
      setResult(null);

      const res = await fetch("/api/ea/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradingAccountId,
          type: syncPeriod === "all" ? "SYNC_ALL" : "SYNC_TRADES",
          params: syncPeriod !== "all" ? { days: parseInt(syncPeriod) } : {},
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create sync command");
      }

      setCommandId(data.command.id);
      toast.info("Sync command sent to EA. Waiting for response...");
    } catch (error: any) {
      setStatus("failed");
      setResult({ error: error.message });
      toast.error(error.message);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Waiting for EA to pick up...";
      case "processing":
        return "EA is syncing trades...";
      case "completed":
        return result?.message || `Synced ${result?.syncedCount || 0} trades`;
      case "failed":
        return result?.error || "Sync failed";
      default:
        return "";
    }
  };

  const resetDialog = () => {
    setStatus("idle");
    setCommandId(null);
    setResult(null);
    setSyncPeriod("7");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!isConnected}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Remote Sync
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remote Sync - {accountName}</DialogTitle>
          <DialogDescription>
            Trigger sync from EA running on your VPS/MT5 terminal
          </DialogDescription>
        </DialogHeader>

        {status === "idle" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Period</label>
              <Select value={syncPeriod} onValueChange={setSyncPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="3">Last 3 Days</SelectItem>
                  <SelectItem value="7">Last Week</SelectItem>
                  <SelectItem value="30">Last Month</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="all">Entire History</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSync} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Remote Sync
            </Button>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              {getStatusIcon()}
              <span className={`text-sm ${
                status === "completed" ? "text-green-600" :
                status === "failed" ? "text-red-600" :
                "text-muted-foreground"
              }`}>
                {getStatusText()}
              </span>
            </div>

            {result?.syncedCount !== undefined && (
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">
                  {result.syncedCount}
                </span>
                <p className="text-sm text-muted-foreground">trades synced</p>
              </div>
            )}

            {(status === "completed" || status === "failed") && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetDialog} className="flex-1">
                  Sync Again
                </Button>
                <Button onClick={() => setOpen(false)} className="flex-1">
                  Done
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### 14.8 Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Command Spam** | Max 1 pending command per account |
| **Expired Commands** | Auto-expire after 10 minutes |
| **Unauthorized Access** | Verify user owns account before creating command |
| **EA Impersonation** | API key validation on all EA endpoints |
| **DoS on EA Polling** | Rate limit polling endpoint |
| **Command Hijacking** | Verify command belongs to API key's account |

### 14.9 Testing Checklist

- [ ] Create command from web → command appears in database with PENDING status
- [ ] EA polls → receives command, status changes to PROCESSING
- [ ] EA syncs → reports result, status changes to COMPLETED
- [ ] Web sees status updates in real-time
- [ ] Command expires after 10 minutes if not picked up
- [ ] Cannot create new command if one is already PENDING
- [ ] Cannot trigger remote sync if EA is offline (no recent heartbeat)
- [ ] Error handling: EA fails to sync → status FAILED with error message

### 14.10 Files to Create/Modify

| # | File Path | Action | Purpose |
|---|-----------|--------|---------|
| 1 | `prisma/schema.prisma` | MODIFY | Add EaCommand model |
| 2 | `src/app/api/ea/commands/route.ts` | CREATE | Create/list commands (web) |
| 3 | `src/app/api/ea/commands/pending/route.ts` | CREATE | EA poll pending commands |
| 4 | `src/app/api/ea/commands/[id]/route.ts` | CREATE | Get/update command status |
| 5 | `src/components/trading-accounts/RemoteSyncButton.tsx` | CREATE | Web UI component |
| 6 | `public/downloads/GSN_TradeSync_MT5.mq5` | MODIFY | Add remote command handling |
| 7 | `prisma/migrations/xxx_add_ea_commands/` | CREATE | Database migration |

---

*Document End - Ready for Implementation*
