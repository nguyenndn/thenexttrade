# Business Analysis: Trading Tools Module

## 1. Tổng quan (Overview)
Module **Trading Tools** cung cấp bộ công cụ hỗ trợ trader trong việc phân tích, tính toán rủi ro và theo dõi hiệu suất giao dịch.

### Các công cụ chính:
1.  **Trading Journal:** Nhật ký giao dịch điện tử.
2.  **Risk Calculator:** Máy tính quản lý vốn.
3.  **Economic Calendar:** Lịch kinh tế & Sự kiện.
4.  **Trading Plan:** Lập kế hoạch giao dịch (Integrated into Journal/Notes).

---

## 2. Trading Journal (Nhật ký giao dịch)
> **Status:** ✅ Fully Implemented

### 2.2. Chức năng (Functional Requirements)
- **Log Trade:** Form nhập liệu chi tiết (Entry, Exit, SL, TP, Result).
- **Stats:** Win Rate, P/L, Equity Curve.
- **UI:** Dashboard Tab View.

---

## 3. Risk Calculator (Máy tính rủi ro)
> **Status:** ✅ Fully Implemented

### 3.2. Chức năng
- **Input:** Balance, Risk %, SL Pips.
- **Output:** Lot Size, Risk Amount, R:R.

---

## 4. Economic Calendar (Lịch kinh tế)
> **Status:** ✅ Fully Implemented

### 4.2. Chức năng
- **Data Source:** External API / Mock Data.
- **Features:** List View, Filter by Impact/Currency.

---

## 6. Trading Plan (Kế hoạch giao dịch)
> **Status:** ✅ Implemented (Simplified)
- Tích hợp vào phần **Notes** và **Journal** thay vì module riêng biệt phức tạp.

---

## 7. Database Schema
> **Status:** ✅ Implemented

```prisma
model JournalEntry {
  id          String   @id @default(cuid())
  symbol      String
  type        TradeType
  entryPrice  Float
  exitPrice   Float?
  pnl         Float?
  status      TradeStatus
  // ... other fields
}

model EconomicEvent {
  // ... event fields
}
```

---

## 8. Trạng thái Triển khai
- **Sprint 2:** Risk Calculator ✅ Completed.
- **Sprint 3:** Journal & Calendar ✅ Completed.
