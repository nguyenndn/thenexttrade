# HƯỚNG DẪN KỸ THUẬT: CẬP NHẬT ĐỒNG BỘ COMMISSION & SWAP CHO EA TRADE MANAGER (MQL5)

> **Tài liệu bàn giao kỹ thuật:** Dành cho Gemini AI / Senior MQL5 Developer phụ trách phát triển EA Trade Manager.  
> **Dự án áp dụng:** TheNextTrade VIP Platform & EA Trade Manager (MetaTrader 5).  
> **Mục tiêu:** Cập nhật logic đồng bộ trade của EA Trade Manager để ghi nhận chính xác 100% phí hoa hồng (**Commission**) và phí qua đêm (**Swap**), giải quyết triệt để lỗi thiếu hụt Commission do cơ chế Multi-deal của MT5.

---

## 1. Bản Chất Lỗi Trên MetaTrader 5 (The Multi-Deal Trap)

### 1.1. Khác biệt cốt lõi giữa MT4 và MT5
- **Trên MT4:** Mỗi Order có 1 Ticket duy nhất. Lệnh đóng lại thì Ticket đó mang trọn vẹn `OrderProfit()`, `OrderCommission()`, `OrderSwap()`.
- **Trên MT5:** Hệ thống quản lý theo 2 tầng: **Position (Vị thế)** và **Deals (Các lượt khớp lệnh)**.
  - Mỗi Position có một `POSITION_IDENTIFIER` (Position ID).
  - Một Position hoàn tất chu kỳ (Round-turn) luôn gồm tối thiểu 2 Deal:
    - **Deal mở (`DEAL_ENTRY_IN`):** Khớp khi vào lệnh.
    - **Deal đóng (`DEAL_ENTRY_OUT`):** Khớp khi thoát lệnh (Take Profit, Stop Loss hoặc đóng tay).
    - Hoặc nhiều Deal nếu có đóng từng phần (`DEAL_ENTRY_INOUT` / Partial Close).

### 1.2. Tại sao EA hiện tại bị thiếu Commission?
Trên hầu hết các broker ECN / Raw Spread phổ biến (ICMarkets, Exness, Vantage, Pepperstone, Tickmill, các quỹ FTMO, TheFundedTrader...):
1. **Phí Commission được trừ ngay ở Deal mở (`DEAL_ENTRY_IN`)**, hoặc được **chia 50% ở Deal mở và 50% ở Deal đóng (`DEAL_ENTRY_OUT`)**.
2. Khi một lệnh đóng, EA thường bắt sự kiện Deal đóng và chỉ gọi:
   ```cpp
   // ❌ SAI LẦM PHỔ BIẾN: Chỉ lấy commission của deal đóng
   double commission = HistoryDealGetDouble(closingDealTicket, DEAL_COMMISSION);
   ```
   $\rightarrow$ Kết quả: **EA bị mất từ 50% đến 100% tiền Commission thực tế của lệnh!**
3. Trên dashboard TheNextTrade, Net PnL sẽ bị hiển thị cao hơn thực tế (do không trừ đủ phí hoa hồng), làm sai lệch chỉ số kỳ vọng lợi nhuận (Expectancy) và tỷ lệ Drawdown.

---

## 2. Công Thức & Thuật Toán Tính Toán Chuẩn

Để lấy đầy đủ và chính xác toàn bộ dữ liệu tài chính của một Position, EA bắt buộc phải:
1. Xác định `positionId` từ deal đóng (`HistoryDealGetInteger(ticket, DEAL_POSITION_ID)`).
2. Gọi `HistorySelectByPosition(positionId)` để tải toàn bộ lịch sử deal của position đó vào bộ nhớ.
3. Chạy vòng lặp cộng dồn toàn bộ các deal có cùng `DEAL_POSITION_ID == positionId`:

$$\text{Total Gross Profit} = \sum_{i=1}^{n} \text{DEAL\_PROFIT}_i$$
$$\text{Total Commission} = \sum_{i=1}^{n} \text{DEAL\_COMMISSION}_i$$
$$\text{Total Swap} = \sum_{i=1}^{n} \text{DEAL\_SWAP}_i$$

$$\text{Net PnL (Server tính)} = \text{Total Gross Profit} + \text{Total Commission} + \text{Total Swap}$$

> [!IMPORTANT]
> - `totalProfit` gửi lên server là **Gross Profit** (lợi nhuận gộp từ chênh lệch giá, chưa trừ phí).
> - `totalCommission` là tổng số âm (ví dụ: `-0.70` USD).
> - `totalSwap` là tổng phí qua đêm (âm hoặc dương, ví dụ: `-0.15` USD).
> - Phía backend TheNextTrade sẽ tự động tính: `Net Profit = profit + commission + swap` để hiển thị trên Journal và Analytics.

---

## 3. Đặc Tả API Payload Phía Server TheNextTrade

### 3.1. Endpoint Tiếp Nhận Trade
- **URL:** `POST https://thenexttrade.com/api/ea/trades` *(hoặc `/api/ea/history` khi sync lịch sử)*
- **Headers:**
  ```http
  Content-Type: application/json
  X-API-Key: <SYNC_API_KEY>
  ```
  *(Lưu ý: Có thể dùng header `X-Sync-Key` hoặc `X-API-Key`)*

### 3.2. Cấu Trúc JSON Payload Chuẩn
```json
{
  "trades": [
    {
      "ticket": "12345678",
      "symbol": "XAUUSD",
      "type": 0,
      "volume": 0.05,
      "openPrice": 2650.50,
      "openTime": 1727690400,
      "closePrice": 2655.00,
      "closeTime": 1727694000,
      "stopLoss": 2645.00,
      "takeProfit": 2660.00,
      "profit": 22.50,
      "commission": -0.70,
      "swap": -0.15
    }
  ],
  "eaVersion": "2.4.0",
  "clientTime": "2026-09-30 11:30:00",
  "accountNumber": "53062951"
}
```

### 3.3. Giải Thích Các Trường Trong Object `trades`
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `ticket` | `string` | **Position ID** (lấy từ `DEAL_POSITION_ID`). Giúp gom các deal partial close thành 1 trade duy nhất trên Journal. |
| `symbol` | `string` | Cặp tiền / hàng hóa (ví dụ: `XAUUSD`, `EURUSD`). |
| `type` | `int` | `0` = BUY, `1` = SELL. |
| `volume` | `double` | Khối lượng lot (ví dụ: `0.05`). |
| `openPrice` | `double` | Giá vào lệnh của Deal IN (`DEAL_ENTRY_IN`). |
| `openTime` | `int / long` | Unix timestamp (giây) thời điểm khớp Deal IN. |
| `closePrice` | `double` | Giá đóng lệnh của Deal OUT (`DEAL_ENTRY_OUT`). |
| `closeTime` | `int / long` | Unix timestamp (giây) thời điểm khớp Deal OUT. |
| `stopLoss` | `double` | Giá SL cuối cùng trước khi đóng lệnh (quét từ Order History). |
| `takeProfit` | `double` | Giá TP cuối cùng trước khi đóng lệnh (quét từ Order History). |
| `profit` | `double` | **Gross Profit** (tổng `DEAL_PROFIT` của mọi deal thuộc position). |
| `commission` | `double` | **Total Commission** (tổng `DEAL_COMMISSION` của cả Deal IN + Deal OUT + Partial deals). Thường là số âm. |
| `swap` | `double` | **Total Swap** (tổng `DEAL_SWAP` của mọi deal thuộc position). |

---

## 4. Mã Nguồn MQL5 Mẫu (Implementation Code)

Dưới đây là các hàm MQL5 chuẩn đã được kiểm nghiệm thực tế từ `TheNextTrade_TradeSync.mq5`. Hãy đưa các hàm này vào EA Trade Manager.

### 4.1. Hàm Trích Xuất Dữ Liệu Position (Core Function)
Hàm này thực hiện 2-pass:
- **Pass 1:** Duyệt toàn bộ deal của position để cộng dồn Gross Profit, Commission 2 chiều, Swap, và tìm deal mở (`DEAL_ENTRY_IN`).
- **Pass 2:** Quét ngược `HistoryOrdersTotal()` để tìm lệnh sửa SL/TP gần nhất của position.

```cpp
//+------------------------------------------------------------------+
//| Find opening deal, calculate full commission, swap, profit and   |
//| retrieve the latest SL/TP from Order History                     |
//+------------------------------------------------------------------+
bool FindOpeningDealWithSLTP(long positionId, 
                             double &openPrice,
                             datetime &openTime, 
                             int &tradeType,
                             double &stopLoss, 
                             double &takeProfit,
                             double &totalProfit, 
                             double &totalCommission,
                             double &totalSwap) 
{
  //--- 1. Tải toàn bộ deal thuộc position này vào bộ nhớ
  if (!HistorySelectByPosition(positionId)) {
    // Fallback nếu broker không hỗ trợ HistorySelectByPosition
    HistorySelect(0, TimeCurrent());
  }

  stopLoss = 0;
  takeProfit = 0;
  totalProfit = 0;
  totalCommission = 0;
  totalSwap = 0;
  bool foundOpening = false;

  //--- PASS 1: Duyệt qua TẤT CẢ các deal của position này
  int totalDeals = HistoryDealsTotal();
  for (int i = 0; i < totalDeals; i++) {
    ulong ticket = HistoryDealGetTicket(i);
    if (ticket == 0) continue;

    long dealPosId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
    if (dealPosId != positionId) continue;

    // QUAN TRỌNG NHẤT: Cộng dồn lợi nhuận, hoa hồng (cả In lẫn Out) và swap
    totalProfit     += HistoryDealGetDouble(ticket, DEAL_PROFIT);
    totalCommission += HistoryDealGetDouble(ticket, DEAL_COMMISSION);
    totalSwap       += HistoryDealGetDouble(ticket, DEAL_SWAP);

    ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);

    // Tìm deal mở (DEAL_ENTRY_IN) để lấy open price, time và loại lệnh
    if (entry == DEAL_ENTRY_IN && !foundOpening) {
      openPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      openTime  = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      ENUM_DEAL_TYPE type = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      tradeType = (type == DEAL_TYPE_BUY) ? 0 : 1;
      foundOpening = true;
    }
  }

  if (!foundOpening) return false;

  //--- PASS 2: Tìm giá trị SL/TP thực tế cuối cùng từ Order History
  //--- (Bao gồm lệnh ban đầu + các lệnh Modify Position)
  int totalOrders = HistoryOrdersTotal();
  datetime lastOrderTime = 0;

  for (int i = 0; i < totalOrders; i++) {
    ulong orderTicket = HistoryOrderGetTicket(i);
    if (orderTicket == 0) continue;

    long orderPosId = HistoryOrderGetInteger(orderTicket, ORDER_POSITION_ID);
    if (orderPosId != positionId) continue;

    double orderSL = HistoryOrderGetDouble(orderTicket, ORDER_SL);
    double orderTP = HistoryOrderGetDouble(orderTicket, ORDER_TP);
    datetime orderTime = (datetime)HistoryOrderGetInteger(orderTicket, ORDER_TIME_DONE);

    if (orderTime >= lastOrderTime) {
      if (orderSL > 0 || orderTP > 0 || lastOrderTime == 0) {
        stopLoss = orderSL;
        takeProfit = orderTP;
        lastOrderTime = orderTime;
      }
    }
  }

  return true;
}
```

---

### 4.2. Hàm Đồng Bộ Một Lệnh Vừa Đóng (`SyncSingleTrade`)

```cpp
//+------------------------------------------------------------------+
//| Xử lý và gửi dữ liệu của một lệnh vừa đóng lên TheNextTrade      |
//+------------------------------------------------------------------+
bool SyncSingleTrade(ulong dealTicket, string apiUrl, string apiKey, string accountNumber) {
  if (!HistoryDealSelect(dealTicket)) return false;

  long positionId    = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
  string symbol      = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
  double volume      = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
  double closePrice  = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
  datetime closeTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
  ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);

  double openPrice = 0;
  datetime openTime = 0;
  int tradeType = 0;
  double stopLoss = HistoryDealGetDouble(dealTicket, DEAL_SL);
  double takeProfit = HistoryDealGetDouble(dealTicket, DEAL_TP);
  double fbSL = 0, fbTP = 0;
  double posProfit = 0, posComm = 0, posSwap = 0;

  // Gọi hàm 2-pass tính toán tổng profit, commission 2 chiều, swap
  if (FindOpeningDealWithSLTP(positionId, openPrice, openTime, tradeType, fbSL, fbTP, posProfit, posComm, posSwap)) {
    if (stopLoss == 0) stopLoss = fbSL;
    if (takeProfit == 0) takeProfit = fbTP;
  } else {
    // Fallback nếu không truy vết được deal IN
    openPrice = closePrice;
    openTime  = closeTime;
    tradeType = (dealType == DEAL_TYPE_SELL) ? 0 : 1;
    posProfit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
    posComm   = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
    posSwap   = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
  }

  // Đóng gói JSON
  string tradesJson = StringFormat(
      "{"
      "\"ticket\":\"%d\","
      "\"symbol\":\"%s\","
      "\"type\":%d,"
      "\"volume\":%.2f,"
      "\"openPrice\":%.5f,"
      "\"openTime\":%d,"
      "\"closePrice\":%.5f,"
      "\"closeTime\":%d,"
      "\"stopLoss\":%.5f,"
      "\"takeProfit\":%.5f,"
      "\"profit\":%.2f,"
      "\"commission\":%.2f,"
      "\"swap\":%.2f"
      "}",
      positionId, symbol, tradeType, volume, openPrice, (long)openTime,
      closePrice, (long)closeTime, stopLoss, takeProfit, posProfit, posComm, posSwap);

  string fullJson = StringFormat(
      "{\"trades\":[%s],\"eaVersion\":\"2.4.0\",\"clientTime\":\"%s\",\"accountNumber\":\"%s\"}",
      tradesJson, TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS), accountNumber);

  // Gửi WebRequest lên Server
  return SendTradesPayload(apiUrl, apiKey, fullJson);
}
```

---

### 4.3. Bắt Sự Kiện Thời Gian Thực Qua `OnTradeTransaction`
Tránh gọi `WebRequest` trực tiếp trong `OnTradeTransaction` vì lệnh WebRequest là hàm blocking, có thể làm lag luồng xử lý lệnh thị trường của EA Trade Manager. Sử dụng cờ hiệu (flag) để `OnTimer()` thực hiện:

```cpp
// Biến toàn cục
bool g_CheckTradesNow = false;

//+------------------------------------------------------------------+
//| Bắt sự kiện giao dịch thời gian thực                             |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result) {
  if (trans.type == TRADE_TRANSACTION_DEAL_ADD) {
    ulong dealTicket = trans.deal;
    if (dealTicket > 0 && HistoryDealSelect(dealTicket)) {
      ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      // Khi có deal đóng lệnh (DEAL_ENTRY_OUT hoặc đóng từng phần DEAL_ENTRY_INOUT)
      if (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT) {
        g_CheckTradesNow = true; // Bật cờ để OnTimer xử lý async
      }
    }
  }
}
```

---

## 5. Checklist Kiểm Thử Dành Cho Developer (QA Verification)

Sau khi Gemini AI bên kia cập nhật code cho EA Trade Manager, hãy kiểm tra theo các kịch bản sau:

- [ ] **1. Kiểm thử sàn ECN/Raw Spread (Commission tại Deal In):**
  - Mở 1 lệnh 0.1 lot trên XAUUSD (sàn ICMarkets/Exness Raw Spread).
  - Đóng lệnh và xem tab History của MT5: Kiểm tra xem Commission có hiển thị là `-0.70` (hoặc con số broker quy định) hay không.
  - Kiểm tra JSON gửi lên TheNextTrade: Trường `"commission"` phải là `-0.70` (KHÔNG ĐƯỢC là `0.00`).
- [ ] **2. Kiểm thử lệnh giữ qua đêm (Swap):**
  - Kiểm tra lệnh giữ qua 00:00 server time có phát sinh Swap.
  - Trường `"swap"` trong JSON phải phản ánh chính xác số âm/dương của swap.
- [ ] **3. Kiểm thử đóng một phần (Partial Close):**
  - Mở lệnh 0.2 lot $\rightarrow$ Đóng trước 0.1 lot $\rightarrow$ Đóng tiếp 0.1 lot còn lại.
  - Cả 2 lần đóng phải được tính toán commission tương ứng theo từng phần mà không bị nhân đôi hoặc bỏ sót.
- [ ] **4. Kiểm tra Net PnL trên TheNextTrade Journal:**
  - So sánh: $\text{Journal PnL} = \text{Gross Profit} + \text{Commission} + \text{Swap}$.
  - Con số này phải khớp chính xác đến từng cent ($) so với cột Profit cuối cùng trên MT5 Terminal.

---

## 6. SYSTEM PROMPT MẪU ĐỂ GỬI CHO GEMINI AI CỦA BẠN

*(Anh có thể copy nguyên đoạn văn bản bên dưới để gửi cho bạn Gemini AI đang code EA Trade Manager)*

```text
Chào bạn, tôi cần bạn cập nhật tính năng đồng bộ lịch sử giao dịch (Trade Sync) cho EA Trade Manager (MQL5) của hệ thống TheNextTrade.

Vấn đề hiện tại:
EA đang bị thiếu trường Commission (phí hoa hồng) và Swap (phí qua đêm), dẫn đến số liệu PnL trên Trading Journal bị lệch so với MT5.
Nguyên nhân là do trên MT5, phí Commission của sàn ECN thường bị trừ ở Deal mở (DEAL_ENTRY_IN), nếu EA chỉ đọc deal đóng (DEAL_ENTRY_OUT) thì sẽ bị mất toàn bộ hoặc 50% Commission.

Yêu cầu cập nhật:
1. Tạo hàm FindOpeningDealWithSLTP sử dụng HistorySelectByPosition(positionId) để duyệt tất cả deal của position và cộng dồn:
   - totalProfit: Tổng gross profit của tất cả deal.
   - totalCommission: Tổng commission của cả deal IN lẫn deal OUT.
   - totalSwap: Tổng swap của position.
   - Quét HistoryOrdersTotal để lấy giá trị SL và TP mới nhất.
2. Cập nhật cấu trúc JSON gửi lên POST /api/ea/trades với đầy đủ 3 trường: "profit", "commission", "swap".
3. Tích hợp bắt sự kiện qua OnTradeTransaction (TRADE_TRANSACTION_DEAL_ADD với DEAL_ENTRY_OUT) và gửi bất đồng bộ qua OnTimer để không gây nghẽn luồng quản lý lệnh.

Vui lòng tham khảo chi tiết tài liệu đặc tả kỹ thuật và code MQL5 mẫu tại file docs/EA-TRADE-MANAGER-COMMISSION-SYNC-SPEC.md để thực hiện cập nhật chính xác.
```
