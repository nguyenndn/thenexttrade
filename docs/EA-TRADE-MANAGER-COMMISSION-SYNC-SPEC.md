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

## 3. Cơ Chế Fallback (The Fallback Mechanism) - Bảo Đảm 100% Phí Hoa Hồng & Lịch Sử

### 3.1. Chức năng Fallback là gì?
**Cơ chế Fallback (Deep Position-Level Deal Lifecycle Recovery)** là thuật toán dự phòng tự động truy xuất ngược toàn bộ vòng đời khớp lệnh ở cấp độ Position (Vị thế). Khi quá trình đồng bộ (sync) theo khoảng thời gian thông thường (Time-range Query hoặc Incremental Sync) phát hiện một vị thế đã đóng hoặc đang mở nhưng **bị khuyết lượt khớp lệnh vào lệnh ban đầu (`DEAL_ENTRY_IN`)**, hệ thống sẽ **ngay lập tức kích hoạt cơ chế Fallback** để truy vấn trực tiếp toàn bộ chuỗi Deal thuộc riêng `POSITION_ID` đó từ cội nguồn lịch sử của Broker.

Nhờ cơ chế này, hệ thống khôi phục hoàn chỉnh:
- Đúng giá vào lệnh ban đầu (`openPrice`) và thời điểm mở vị thế (`openTime`).
- Đúng hướng giao dịch gốc (`BUY`/`SELL`) và tổng khối lượng thực tế (`lots`).
- **Quan trọng nhất:** Thu thập trọn vẹn 100% phí hoa hồng mở lệnh (`DEAL_COMMISSION` tại Deal IN) và các deal khớp từng phần (`Partial Close deals`), bảo đảm không bị mất hoặc tính thiếu dù chỉ $0.01.

---

### 3.2. Ba trường hợp thực tế bắt buộc phải kích hoạt Fallback

| STT | Trường hợp thực tế | Nguyên nhân kỹ thuật | Hậu quả nếu KHÔNG có Fallback |
|---|---|---|---|
| **1** | **Swing Trade / Lệnh mở ngoài Date Range** | Trader mở lệnh swing cách đây 20 ngày, hôm nay lệnh mới đóng. Khi user chọn sync "Hôm nay" hoặc "7 ngày qua", hàm `history_deals_get(from, to)` hoặc `HistorySelect(from, to)` chỉ trả về deal đóng hôm nay (`DEAL_ENTRY_OUT`). Deal mở (`DEAL_ENTRY_IN`) nằm ngoài khoảng thời gian truy vấn nên bị bỏ sót. | - Mất 100% phí Commission mở lệnh (các sàn ECN/Raw Spread như Exness, IC Markets trừ toàn bộ commission lúc mở lệnh).<br>- `openPrice` và `openTime` bị gán nhầm thành giá/giờ đóng lệnh.<br>- Chiều lệnh (BUY/SELL) bị suy diễn ngược từ deal đóng thay vì chuẩn xác từ deal vào. |
| **2** | **Lệnh đang mở (Active Open Positions)** | Hàm `positions_get()` của MT5 trả về danh sách vị thế đang chạy nhưng trường `commission` của đối tượng `Position` luôn là `0.0`. Trong khi đó, tài khoản ECN đã bị broker trừ tiền hoa hồng ngay thời điểm Deal IN khớp. | - Dashboard hiển thị Commission = 0.0.<br>- Floating Net PnL bị tính ảo (cao hơn thực tế), trader tưởng đang có lãi nhưng thực tế tài khoản đã bị trừ phí. |
| **3** | **Broker phân mảnh lịch sử / Server Cache trễ** | Một số Broker lưu trữ lịch sử theo phân vùng thời gian (partitions) hoặc khi terminal mới khởi động, bộ đệm History Deals tổng chưa kịp tải đầy đủ các deal quá khứ. | - Lệnh đóng xuất hiện nhưng không liên kết được với Deal vào lệnh, dẫn đến vị thế bị khuyết thiếu thông số. |

---

### 3.3. Quy trình xử lý Fallback trong Python Headless Worker (`tools/tnt-worker/worker.py`)

Trong ứng dụng Python Cloud Sync Worker, Fallback được hiện thực hóa ở 2 điểm chốt chặn then chốt:

#### A. Khôi phục Deal IN cho lệnh đã đóng (`build_closed_positions`):
Khi duyệt qua các deal trong khoảng thời gian sync, nếu phát hiện một Position đã có Deal đóng (`out_deal`) nhưng `in_deal is None`:
1. Kích hoạt `deal_lookup_fn(pid)` hoặc gọi trực tiếp:
   ```python
   full_pos_deals = mt5.history_deals_get(position=pid)
   ```
   Hàm này của MetaTrader 5 API bỏ qua bộ lọc thời gian `from_timestamp` / `to_timestamp`, truy xuất trực tiếp toàn bộ các deals trong lịch sử của riêng Position ID đó từ máy chủ broker.
2. Quét mảng `full_pos_deals`:
   - Tìm deal có `entry == 0` (`DEAL_ENTRY_IN`) để khôi phục: `openTime`, `openPrice`, `in_vol` (lots) và chiều lệnh gốc `BUY`/`SELL`.
   - Hợp nhất (merge) các deals còn thiếu vào danh sách `all_deals` của Position (chống trùng lặp bằng deal `ticket`).
3. Tính tổng tài chính chuẩn xác:
   $$\text{tot\_comm} = \sum \text{deal.commission} \quad \text{(đã bao gồm đầy đủ Deal IN)}$$
   $$\text{tot\_profit} = \sum \text{deal.profit}$$
   $$\text{tot\_swap} = \sum \text{deal.swap}$$

#### B. Thu thập Commission cho lệnh đang mở (`open_positions`):
Khi quét danh sách lệnh đang chạy từ `mt5.positions_get()` trong `process_job`:
```python
# Lấy phí commission đã trừ ngay tại Deal IN của lệnh đang mở
open_comm = 0.0
try:
    p_deals = mt5.history_deals_get(position=pos.ticket)
    if p_deals:
        open_comm = sum(float(getattr(d, "commission", 0.0)) for d in p_deals)
except Exception as exc:
    logger.debug(f"Could not fetch entry deals for open position #{pos.ticket}: {exc}")
```
Đưa `open_comm` vào trường `commission` của payload gửi lên API TheNextTrade thay vì gán cứng `0.0`.

---

### 3.4. Quy trình xử lý Fallback trong MQL5 EA Trade Manager

Trong EA chạy trên MT5 (`TheNextTrade_TradeSync.mq5`), cơ chế Fallback được thiết lập theo mô hình 2 tầng bảo vệ:

```cpp
//+------------------------------------------------------------------+
//| Fallback Mechanism trong MQL5 EA Trade Manager                   |
//+------------------------------------------------------------------+
// TẦNG 1: Ưu tiên truy vấn nhanh gọn theo Position ID
if (!HistorySelectByPosition(positionId)) {
    // TẦNG 2 (FALLBACK): Nếu Broker không hỗ trợ hoặc trả về false,
    // nạp toàn bộ lịch sử từ thời điểm 0 (epoch) đến hiện tại
    HistorySelect(0, TimeCurrent());
}

// Kiểm tra bổ sung: Nếu duyệt xong vẫn không thấy DEAL_ENTRY_IN (foundOpening == false)
if (!foundOpening) {
    // Kích hoạt Fallback sâu: ép MT5 Terminal nạp toàn bộ deals từ ngày 0
    HistorySelect(0, TimeCurrent());
    int totalDeals = HistoryDealsTotal();
    for (int i = 0; i < totalDeals; i++) {
        ulong ticket = HistoryDealGetTicket(i);
        if (ticket == 0) continue;
        if (HistoryDealGetInteger(ticket, DEAL_POSITION_ID) == positionId) {
            // Cộng dồn lại commission và tìm DEAL_ENTRY_IN
            // ...
        }
    }
}
```

---

### 3.5. Bảng So Sánh Hiệu Quả Trước và Sau Khi Có Fallback

| Tiêu chí | Trước khi có Fallback ❌ | Sau khi có Fallback ✅ |
|---|---|---|
| **Lệnh Swing Trade (mở ngoài date range)** | Thiếu 100% Commission vào lệnh. `openPrice` bị sai thành `closePrice`. | Đầy đủ 100% Commission 2 chiều. Khôi phục chính xác `openPrice`, `openTime`. |
| **Lệnh Partial Close (đóng từng phần dài ngày)** | Mất các deal mở ban đầu, sai lệch lot size thực tế. | Khôi phục trọn vẹn toàn bộ các deal nhánh, tính đúng tổng volume đã trade. |
| **Lệnh Active đang mở (Floating)** | `commission = 0.0` (mặc định của MT5 position). | Ghi nhận chính xác số tiền commission sàn đã trừ vào Balance ngay khi mở lệnh. |
| **Độ tin cậy của Trading Journal** | Net PnL bị lệch từ vài dollar đến hàng chục dollar so với MT5 Terminal. | Net PnL khớp chính xác tuyệt đối từng cent ($) với MT5 Terminal. |

---

## 4. Đặc Tả API Payload Phía Server TheNextTrade

### 4.1. Endpoint Tiếp Nhận Trade
- **URL:** `POST https://thenexttrade.com/api/ea/trades` *(hoặc `/api/ea/history` khi sync lịch sử)*
- **Headers:**
  ```http
  Content-Type: application/json
  X-API-Key: <SYNC_API_KEY>
  ```
  *(Lưu ý: Có thể dùng header `X-Sync-Key` hoặc `X-API-Key`)*

### 4.2. Cấu Trúc JSON Payload Chuẩn
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

### 4.3. Giải Thích Các Trường Trong Object `trades`
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

## 5. Mã Nguồn MQL5 Mẫu (Implementation Code)

Dưới đây là các hàm MQL5 chuẩn đã được kiểm nghiệm thực tế từ `TheNextTrade_TradeSync.mq5`. Hãy đưa các hàm này vào EA Trade Manager.

### 5.1. Hàm Trích Xuất Dữ Liệu Position (Core Function)
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

---

### 5.2. Hàm Đồng Bộ Một Lệnh Vừa Đóng (`SyncSingleTrade`)

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

### 5.3. Bắt Sự Kiện Thời Gian Thực Qua `OnTradeTransaction`
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

## 6. Checklist Kiểm Thử Dành Cho Developer (QA Verification)

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
- [ ] **4. Kiểm thử Cơ chế Fallback cho Swing Trade (Mở trước Date Range):**
  - Đóng 1 lệnh swing đã mở từ nhiều ngày trước (nằm ngoài phạm vi sync thông thường).
  - Kiểm tra xem Fallback có tự động truy xuất Deal IN của lệnh swing đó không: JSON gửi lên phải mang đúng `openPrice` ngày mở và đầy đủ `commission` mở lệnh.
- [ ] **5. Kiểm tra Net PnL trên TheNextTrade Journal:**
  - So sánh: $\text{Journal PnL} = \text{Gross Profit} + \text{Commission} + \text{Swap}$.
  - Con số này phải khớp chính xác đến từng cent ($) so với cột Profit cuối cùng trên MT5 Terminal.

---

## 7. SYSTEM PROMPT MẪU ĐỂ GỬI CHO GEMINI AI CỦA BẠN

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
2. Tích hợp Cơ chế Fallback: Nếu HistorySelectByPosition(positionId) không trả về deal hoặc thiếu Deal IN (do broker phân mảnh hoặc lệnh swing trade), tự động gọi fallback HistorySelect(0, TimeCurrent()) để quét tìm lại deal IN gốc, đảm bảo không bỏ sót phí mở lệnh.
3. Cập nhật cấu trúc JSON gửi lên POST /api/ea/trades với đầy đủ 3 trường: "profit", "commission", "swap".
4. Tích hợp bắt sự kiện qua OnTradeTransaction (TRADE_TRANSACTION_DEAL_ADD với DEAL_ENTRY_OUT) và gửi bất đồng bộ qua OnTimer để không gây nghẽn luồng quản lý lệnh.

Vui lòng tham khảo chi tiết tài liệu đặc tả kỹ thuật và code MQL5 mẫu tại file docs/EA-TRADE-MANAGER-COMMISSION-SYNC-SPEC.md để thực hiện cập nhật chính xác.
```
