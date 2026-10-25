# SPECIFICATION: CLOUD DIRECT MT5 MOBILE TRADE MANAGER (NO-PC / NO-VPS)

> **Phiên bản:** 2.0 (Cloud Direct Socket Architecture — Benchmark: `docs/IMG_1992.MP4`)  
> **Mục tiêu:** Cung cấp ứng dụng Web Mobile / PWA giúp Trader quản trị vị thế, bảo vệ vốn (`Breakeven`, `Secure Profit`, `Derisk`, `Trim`, `Hold to Close All`) và đặt cảnh báo tự động cắt/dời SL 24/5 (`BE at price`, `Close at price`, `Daily Loss Limit`) **trực tiếp trên điện thoại mà KHÔNG cần bật PC và KHÔNG tốn tiền thuê VPS**.  
> **Mô hình kinh doanh đi kèm:** Hỗ trợ kiểm tra trạng thái **Under IB** (hoặc gói thành viên) để mở khoá tính năng miễn phí cho khách hàng mở tài khoản dưới mã IB đối tác.

---

## 1. BÀI TOÁN & SỰ KHÁC BIỆT KIẾN TRÚC

### 1.1. Tại sao bỏ mô hình cũ (EA chạy trên PC/VPS của khách)?
- Mô hình cũ bắt khách hàng phải có máy tính, phải thuê VPS (\$15–\$20/tháng), phải biết cài file `.ex5` và bật `Allow WebRequest`.
- Độ trễ phụ thuộc vào vòng lặp `OnTimer` (1 giây) của MQL5 `WebRequest()`.
- Khi máy tính/VPS của khách tắt hoặc mất mạng, mọi quy tắc bảo vệ tài khoản đều ngừng hoạt động.

### 1.2. Kiến trúc Mới: Cloud Direct MT5 Bridge (No-PC, No-VPS)
Thay vì chạy phần mềm đồ hoạ `terminal64.exe` (mỗi cửa sổ chỉ mở được 1 tài khoản và tốn ~200MB RAM), hệ thống sử dụng một **Multi-Account MT5 Direct Socket Service** (viết bằng C# `.NET mtapi5`) đặt trên máy chủ Cloud (London / Singapore — sát máy chủ của các sàn HFM, Exness, IC Markets... với ping chỉ `5ms – 15ms`).

- **Không bật giao diện MT5:** Kết nối trực tiếp với máy chủ Broker bằng giao thức TCP Socket của MT5 (giống hệt cách ứng dụng MT5 trên điện thoại kết nối với sàn).
- **Chạy đồng thời hàng trăm tài khoản:** Mỗi tài khoản khách hàng chỉ là 1 `Mt5QuoteClient` / `Mt5TradeClient` object trong RAM (tốn **~3MB – 5MB RAM / tài khoản**). Một VPS 4GB RAM có thể duy trì kết nối 24/5 cho **200 – 500 tài khoản MT5 cùng lúc**.
- **Độ trễ cực thấp (`10ms – 50ms`):** Mọi lệnh `Breakeven`, `Close All`, `Trim`, `Derisk` được bắn thẳng từ Cloud Server tới máy chủ Broker qua kết nối TCP đang mở sẵn.
- **Canh lệnh 24/5 (`The EA watches it 24/5`):** Kể cả khi khách hàng tắt điện thoại đi ngủ, dịch vụ Cloud vẫn theo dõi giá từng mili-giây (`OnQuote`) để tự động dời SL về hoà vốn (`BE at price`), đóng lệnh tại mức giá định trước (`Close at price`), hoặc cắt toàn bộ khi chạm ngưỡng lỗ ngày (`Daily Loss Limit %`).

---

## 2. SƠ ĐỒ KIẾN TRÚC & LUỒNG DI CHUYỂN DỮ LIỆU

```
┌─────────────────────────┐          WebSocket / SSE (Realtime)          ┌─────────────────────────┐
│    MOBILE WEB / PWA     │ ◄──────────────────────────────────────────► │   NEXT.JS WEB SERVER    │
│  (Điện thoại của khách) │ ───────── REST / Server Actions ───────────► │  (Auth, DB, IB Check)   │
└─────────────────────────┘                                              └───────────┬─────────────┘
                                                                                     │
                                                                    Internal gRPC / HTTP + Redis PubSub
                                                                                     │
                                                                                     ▼
                                                                         ┌─────────────────────────┐
                                                                         │   MT5 DIRECT BRIDGE     │
                                                                         │ (.NET Multi-Account Svc)│
                                                                         │  RAM: 3-5MB / Account   │
                                                                         └─────┬──────┬──────┬─────┘
                                                                               │      │      │
                                                          Direct MT5 TCP Socket (Ping 10ms to Broker)
                                                                               │      │      │
                                                                   ┌───────────┘      │      └───────────┐
                                                                   ▼                  ▼                  ▼
                                                            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                                                            │ HFM Server  │    │Exness Server│    │ IC Markets  │
                                                            │  (Live 5)   │    │ (MT5Real14) │    │ (SC-MT5-2)  │
                                                            └─────────────┘    └─────────────┘    └─────────────┘
```

### 2.1. Luồng 1: Kết nối tài khoản MT5 lần đầu (`Connect MT5` — 10 giây)
1. Khách hàng mở trang Mobile Trade Manager trên điện thoại $\rightarrow$ vào tab **More / Accounts** $\rightarrow$ bấm **`[Connect MT5]`**.
2. Khách nhập 3 thông tin:
   - `Account Number (Login)`: ví dụ `105585787`
   - `MT5 Password`: Mật khẩu giao dịch (Master Password để có quyền đóng/sửa lệnh)
   - `Broker Server`: chọn từ danh sách gợi ý (ví dụ `HFMarketsGlobal-Live5`, `Exness-MT5Real14`...)
3. **Next.js Server** mã hoá mật khẩu bằng chuẩn **AES-256-GCM** (với Master Key nằm trong biến môi trường bảo mật) và gọi sang **MT5 Direct Bridge Service**.
4. **MT5 Direct Bridge Service** khởi tạo một phiên kết nối TCP tới máy chủ sàn (`Connect(login, password, server)`):
   - Nếu sai mật khẩu hoặc sai server $\rightarrow$ trả về lỗi ngay trong 1 giây.
   - Nếu thành công $\rightarrow$ trả về thông tin tài khoản (`Balance`, `Equity`, `MarginLevel`, `Currency`, `Leverage`, danh sách lệnh đang mở `OpenPositions` và ` latencyMs` tới máy chủ sàn, ví dụ `London • 10 ms to HFM`).
5. Tài khoản được lưu vào DB và giữ kết nối 24/5 trong bộ nhớ của **MT5 Direct Bridge**.

### 2.2. Luồng 2: Hiển thị Realtime khi khách mở màn hình Điện thoại (`Live Stream`)
1. Khi khách mở màn hình Mobile (`Trade`, `Chart`, hoặc `Positions`), trình duyệt mở kết nối **SSE / WebSocket** lên Server.
2. Mỗi khi máy chủ sàn gửi nhịp giá mới (`OnQuote`) hoặc có thay đổi lệnh (`OnOrderUpdate`), **MT5 Direct Bridge** tính toán lại:
   - `Equity`, `Floating P&L ($ và %)`, `Margin Level %`, `Free Margin`.
   - Giá `Bid / Ask` hiện tại và vị thế từng lệnh đang mở (`76 open`, `7.58 Lots`).
3. Dữ liệu được đẩy thẳng xuống màn hình điện thoại (nhảy số mượt theo từng nhịp giá mà không cần ghi xuống ổ cứng Database).

### 2.3. Luồng 3: Khách bấm nút hành động 1 chạm trên Điện thoại (`Instant Execution`)
Ví dụ khách đang có **76 lệnh BUY XAUUSD** và bấm nút **`Breakeven (SL to entry on winners)`** hoặc nhấn giữ **`Hold to CLOSE ALL`**:
1. **Điện thoại** gửi lệnh `POST /api/remote/execute` (`action: "BREAKEVEN_ALL"` hoặc `"CLOSE_ALL"`).
2. **Next.js Server** kiểm tra quyền sở hữu tài khoản (`userId`) và chuyển tiếp lệnh ngay lập tức sang **MT5 Direct Bridge Service** qua kết nối nội bộ.
3. **MT5 Direct Bridge Service** đang nắm sẵn kết nối TCP với máy chủ sàn:
   - Duyệt danh sách 76 lệnh đang mở trong RAM (mất `< 1ms`).
   - Lọc ra các lệnh đang có lãi (`Profit > 0`) và chưa có SL tại Entry (ví dụ 63 lệnh đủ điều kiện, 13 lệnh bỏ qua).
   - Bắn gói lệnh sửa SL (`OrderModify` / `OrderClose` đồng thời dạng Batch/Async) thẳng tới máy chủ sàn với ping `10ms`.
4. **Kết quả trả về Điện thoại:**
   - Màn hình điện thoại hiện Toast thông báo giống hệt video:
     `✅ Done on •••• 5787: BE (all symbols) — Moved: 63 • Skipped: 13`.
   - Ghi 1 dòng lịch sử vào tab **`Activity`** để khách tra cứu lại.

### 2.4. Luồng 4: Canh giá & Bảo vệ tài khoản 24/5 khi khách TẮT Điện thoại (`Armed Rules 24/5`)
1. Trên điện thoại, khách cài đặt:
   - **Price Alerts That Act:** Nhập giá `4140.00` $\rightarrow$ bấm **`[BE at]`** (hoặc **`[Close at]`**).
   - **Daily Limits:** Bật **`Loss -5%`** (hoặc `Profit target %`).
2. Quy tắc này được lưu vào DB và nạp trực tiếp vào bộ nhớ của **MT5 Direct Bridge Service** (trạng thái **`ARMED`**).
3. Khách hàng tắt điện thoại, đi ngủ:
   - Trên Cloud Server, **MT5 Direct Bridge** vẫn nhận từng tick giá 24/5 từ máy chủ sàn.
   - Ngay mili-giây giá `Bid/Ask` chạm `4140.00` (hoặc `Floating P&L` chạm `-5%` Balance đầu ngày), **MT5 Direct Bridge** tự động bắn lệnh dời BE hoặc đóng toàn bộ lệnh ngay lập tức.
   - Đẩy thông báo kết quả về **Telegram** của khách và lưu vào tab **`Activity`**.

---

## 3. CHI TIẾT CÁC TÍNH NĂNG TRÊN GIAO DIỆN MOBILE (5 TABS)

Thiết kế chuẩn **Mobile-First Dark Gold/Emerald Theme** theo bố cục 5 tab dưới đáy màn hình:

### Tab 1: `Trade` (Bảng Điều Khiển Rủi Ro 1 Chạm)
1. **Header Bar:**
   - Bên trái: Số tài khoản rút gọn (`•••• 5787`), nhãn `LIVE`, tên Server (`HFMarketsGlobal-Live5`).
   - Bên phải: Trạng thái kết nối & độ trễ (`🟢 London • 10 ms to HFM`).
2. **Hero Equity Card:**
   - `EQUITY` cỡ chữ lớn (ví dụ `$359,819.61`), `Floating P&L` (`+$8,401.58 (+2.39%) floating`).
   - Thanh tiến trình `MARGIN LEVEL` (`3,475%`).
   - 4 chỉ số chân trang: `BALANCE` | `OPEN (76)` | `LOTS (7.58)` | `FREE MARGIN`.
3. **Khối `PROTECT` (Bảo vệ lệnh thắng):**
   - `Breakeven`: Dời SL về giá Entry (+0 pips) cho toàn bộ các lệnh đang dương.
   - `BE +2`: Dời SL về Entry + 2 pips (khoá 2 pips lợi nhuận).
4. **Khối `SECURE PROFIT` (Chốt lời từng phần):**
   - Các nút nhanh: `$25 (25% each)`, `$50 (50% each)`, `$70 (70% each)`, `C50 (% profit)`.
5. **Khối `CUT RISK` (Cắt giảm rủi ro & tỉa lệnh):**
   - `Derisk`: Đóng lệnh lỗ nặng nhất kết hợp lệnh lời đối ứng để hạ khối lượng ròng.
   - `Trim 2`: Đóng 2 lớp lệnh (layers) mới nhất vừa khớp.
   - `Cut -5 pips`: Đóng các lệnh đang âm vượt quá -5 pips.
   - `Cancel orders`: Huỷ toàn bộ các lệnh chờ (`Buy Limit`, `Sell Limit`, `Buy Stop`, `Sell Stop`).
6. **Khối `DAILY LIMITS` (Giới hạn Lãi/Lỗ trong ngày):**
   - Nút chọn nhanh: `Loss -5%`, `Loss -10%`, `Loss off`.
   - Ô đặt `Profit target %` + nút `[Set]` và `Loss limit %` + nút `[Set]`.
7. **Khối `PRICE ALERTS THAT ACT` (Hẹn mức giá hành động 24/5):**
   - Nhập mức giá mục tiêu $\rightarrow$ chọn **`[BE at]`** (Chạm giá tự động dời SL về Entry) hoặc **`[Close at]`** (Chạm giá tự động đóng hết lệnh).
   - Nút `[See armed]` (xem các mức giá đang canh) và `[Clear all]`.

### Tab 2: `Chart` (Biểu Đồ Trực Tiếp & Điều Khiển Ngay Trên Nến)
- Tích hợp **TradingView Lightweight Charts** hiển thị nến trực tiếp từ luồng giá MT5 (`M1`, `M5`, `M15`, `H1`, `H4`, `D1`).
- Vẽ trực tiếp các đường ngang biểu diễn từng vị thế đang mở (`Buy 0.10 @ 4126.93`, đường `SL`, đường `TP`, đường `BE`).
- **Tương tác 1 chạm vào đường lệnh trên Chart:** Hiện Bottom Sheet chi tiết của lệnh đó (`Entry`, `Now`, `SL`, `TP`, `P/L +$88.40`) kèm:
  - Nút `[Close this trade only]`
  - Nút `[Breakeven]` | `[$50 (50% of each trade)]`
  - Nút nhấn giữ an toàn: **`[Hold to CLOSE ALL — keep pressing for 1 second]`**.

### Tab 3: `Positions` (Danh Sách Lệnh Đang Mở)
- Tóm tắt tổng vị thế theo Symbol (`XAUUSD 76 open`, `Buy 6.30`, `Sell 1.28`, tổng `P&L +$8,386.60`).
- Danh sách từng lệnh (`Ticket`, `BUY/SELL`, `Lot`, `Entry -> Now`, `SL`, `TP`, `P&L`) kèm nút `[Close]` từng lệnh.

### Tab 4: `Activity` (Nhật Ký Hành Động Tự Động & Thủ Công)
- Lưu lại toàn bộ lịch sử thực thi lệnh từ Mobile hoặc từ quy tắc tự động 24/5:
  - Ví dụ: `Breakeven • done — Moved: 63, Skipped: 13 (14:20:05)`.
  - Ví dụ: `Price Alert Triggered @ 4140.00 — Closed 12 positions (+$1,240.00)`.

### Tab 5: `More` (Quản Lý Tài Khoản MT5, IB & Telegram)
- **Danh sách Accounts:** Hiển thị tài khoản đang kết nối (`105585787 • HFMarketsGlobal-Live5 • Under IB • Active until...`), nút **`[Connect MT5]`** và **`[Unlink this one]`**.
- **Switch to my IB:** Hướng dẫn chuyển tài khoản về dưới mã IB đối tác để được gia hạn sử dụng miễn phí.
- **Telegram Username:** Nhận thông báo tức thì qua Telegram mỗi khi hệ thống tự động dời BE hoặc cắt lệnh 24/5.

---

## 4. TRANG GIÁM SÁT DÀNH RIÊNG CHO ADMIN (`/admin/mt5-cloud`)

Tạo một mục Menu riêng biệt trên thanh Sidebar của Admin (**`MT5 Cloud Monitor`** tại đường dẫn `/admin/mt5-cloud` trong `src/config/navigation.ts`) để Admin theo dõi toàn bộ khách hàng đang sử dụng tính năng này theo thời gian thực:

1. **System & Bridge Health Cards (4 KPI Cards trên cùng):**
   - **Bridge Status:** Trạng thái kết nối tới dịch vụ C# `.NET mt5-bridge` (`🟢 Online` / `🔴 Offline`), Uptime, và mức tiêu thụ RAM hiện tại (`ví dụ: 142 MB`).
   - **Connected Accounts:** Tổng số tài khoản MT5 đang duy trì kết nối 24/5 (`ví dụ: 48 Active / 62 Total`).
   - **Total Live Equity (AUM):** Tổng vốn `Equity` và `Floating P&L` thực tế của toàn bộ các tài khoản đang kết nối.
   - **Armed 24/5 Rules:** Tổng số quy tắc tự động (`BE at price`, `Close at price`, `Daily Loss Limit`) đang được hệ thống canh gác.

2. **Bảng Danh Sách User Đang Kết Nối (Live Connected Users Table):**
   - **User:** Tên, Email, Avatar, nhãn `Under IB` / `VIP`.
   - **MT5 Account & Server:** Số tài khoản (`105585787`), tên Server sàn (`HFMarketsGlobal-Live5`, `Exness-MT5Real...`), loại tài khoản (`REAL` / `DEMO`).
   - **Connection & Ping:** Trạng thái `🟢 LIVE (10 ms)` / `🟡 Reconnecting` / `🔴 Auth Failed`.
   - **Live Capital & Exposure:** `Balance`, `Equity`, `Floating P&L ($ & %)`, số lệnh đang mở (`76 open • 7.58 lots`), `Margin Level %`.
   - **Active Rules (24/5):** Hiển thị các mức giá khách đang cài tự động (`BE @ 4140`, `Loss -5%`).
   - **Access Expiry & Actions:** Ngày hết hạn quyền sử dụng (`Active until...`) + các nút thao tác cho Admin:
     - `Reconnect` (Khởi động lại kết nối TCP cho tài khoản đó).
     - `Disconnect` (Ngắt kết nối khỏi Bridge).
     - `Extend Access` (Gia hạn ngày sử dụng / bật cờ `Under IB`).
     - `Activity Log` (Xem lịch sử các lệnh `Breakeven`, `Close All`, `Trim` mà User đó đã bấm).

---

## 5. BẢO MẬT & AN TOÀN HỆ THỐNG

1. **Mã hoá thông tin đăng nhập MT5 (`AES-256-GCM`):**
   - Mật khẩu MT5 của khách không bao giờ được lưu dạng văn bản thuần (plaintext) trong Database và không bao giờ trả ngược về trình duyệt sau khi lưu.
   - Chỉ dịch vụ nội bộ `MT5 Direct Bridge` mới có khoá giải mã trong RAM để duy trì phiên kết nối với Broker.
2. **Chống bấm nhầm trên di động (`Hold-to-Confirm 1s`):**
   - Mọi thao tác đóng toàn bộ lệnh (`Hold to CLOSE ALL`) bắt buộc người dùng nhấn giữ đủ `1000ms` (có thanh chạy tiến trình trên nút) mới phát lệnh đi.
3. **Cơ chế Tự Động Kết Nối Lại (Auto-Reconnect):**
   - Nếu máy chủ Broker bảo trì hoặc rớt kết nối tạm thời, `MT5 Direct Bridge` tự động kết nối lại với thuật toán Exponential Backoff (`1s -> 2s -> 5s`) để đảm bảo quy tắc canh giá 24/5 luôn hoạt động xuyên suốt.
