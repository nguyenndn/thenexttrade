# Tài Liệu Toàn Tập Hệ Thống EA: Bản Quyền 3 Tầng (`GSN_EA_License.mqh`), EA Farm Telemetry & Đồng Bộ Trade/Commission/Swap (`GSN_EA_Telemetry.mqh`)

> **Tài liệu kỹ thuật hợp nhất (Single Source of Truth)** cho toàn bộ hệ sinh thái MQL5 Expert Advisors (**Trade Manager**, **GoldScalperNinja**, **Apex Gold Sentinel / Shadow Matrix**) và các API Backend (`/api/ea/*`) trên nền tảng **TheNextTrade**.
> *(Đã gộp đầy đủ nội dung từ `EA-TELEMETRY-INTEGRATION-GUIDE.md`, `EA-TRADE-MANAGER-COMMISSION-SYNC-SPEC.md` và `EA-TRADE-MANAGER-BALANCE-CHECK-SPEC.md`).*

---

## 📌 PHẦN 1. Kiến Trúc Tổng Thể & Nguyên Lý "1 Tài Khoản IB = 1 License Key = Mở Khóa Cả 3 EA"

Hệ thống được chuẩn hóa theo nguyên lý tinh gọn:
- **1 Trading Account (đã duyệt IB) = 1 Mã `License Key` duy nhất (`TNT-XXXX-XXXX-XXXX`) = Sử dụng được đồng thời cả 3 EA (`Trade Manager`, `GoldScalperNinja`, `Apex Gold Sentinel / Shadow Matrix`)**.
- Khi một tài khoản MT4/MT5 của user được duyệt IB (qua `/admin/trading-systems/accounts`, duyệt `VIP Request`, hoặc xác nhận `ibAttribution = CONFIRMED / VERIFIED`), hệ thống tự động cấp quyền `EAProductAccess (GRANTED)` cho toàn bộ các EA đang hoạt động mà không cần cấp lẻ từng EA.
- **EA tuyệt đối không tự tạo `TradingAccount`**: Mọi request `/api/ea/heartbeat`, `/api/ea/trades`, `/api/ea/history` gửi `accountNumber` chưa tồn tại trong DB sẽ nhận `HTTP 404 Account not found`. `TradingAccount` chỉ được tạo khi User chủ động thêm tại `/dashboard/accounts` hoặc khi Admin bấm `Approve` / `Grant License`.

Hệ thống gồm 2 thư viện MQL5 độc lập viết theo chuẩn Hướng Đối Tượng (OOP) đặt tại `public/Include/`:

1. **`Include\GSN_EA_License.mqh`** (`class CGSNLicenseValidator` & lớp kế thừa tương thích ngược `class CAccountValidator`)
   - Xác thực quyền sử dụng EA theo mô hình **3 tầng chịu lỗi (3-Tier High-Availability)**: Web Primary API $\rightarrow$ GitHub Cloud Backup (`accounts.csv`) $\rightarrow$ Signed Local Cache 72h.
2. **`Include\GSN_EA_Telemetry.mqh`** (`class CGSNTradeSyncEngine`)
   - Sử dụng chung mã `License Key` để đẩy **Heartbeat định kỳ 5 phút/lần** về **Admin EA Farm** (phân biệt từng EA qua `productSlug`), kiểm tra cấu hình từ `/api/ea/config`, và đồng bộ lệnh giao dịch (`OPEN` & `CLOSED`) kèm đầy đủ **Gross Profit, Commission 2 chiều (`DEAL_COMMISSION`), Swap (`DEAL_SWAP`)** về `/api/ea/trades`.

### Sơ Đồ Luồng Xác Thực Bản Quyền 3 Tầng (3-Tier High-Availability)

```mermaid
flowchart TD
    A["EA Khởi Động / Định Kỳ 30 Phút (ValidateAccount)"] --> B["Tầng 1: Web Server Primary API\nPOST /api/ea/license/verify\n(Gửi LicenseKey + AccountLogin + Broker + Server)"]
    B -->|HTTP 200 & valid = true| C["✅ HỢP LỆ (TIER1_WEB)\nCập nhật Signed Cache 72h\nCho phép giao dịch theo quyền hợp lệ"]
    B -->|HTTP 200/401/403 & valid = false\n(Sai Key / Khác Số TK / Chưa duyệt IB / Bị Khóa)| D["❌ TỪ CHỐI NGAY LẬP TỨC (REVOKED)\nXóa sạch Cache, khóa mở lệnh mới\n(Không nhảy sang GitHub để tránh lách luật)"]
    B -->|Web Server Sập / Bảo Trì / Timeout\n(HTTP -1, 500, 502, 503, 504)| E["Tầng 2: GitHub Cloud Backup\nĐọc nguyenndn/ea-accounts/accounts.csv\n(Qua GitHub API Raw + Fallback Raw CDN)"]
    E -->|Tìm thấy AccountLogin & status = active\nvà chưa hết hạn end_date| F["✅ HỢP LỆ DỰ PHÒNG (TIER2_GITHUB)\nCập nhật Signed Cache 72h\nEA tiếp tục chạy bình thường"]
    E -->|Tìm thấy AccountLogin nhưng status = inactive\nhoặc đã quá hạn end_date| D
    E -->|Cả Web & GitHub đều mất kết nối mạng\nhoặc dính GitHub Rate Limit| G["Tầng 3: Signed Local Cache 72h\nKiểm tra chữ ký băm FNV-1a\n(GSN_Lic_Sig_<AccountLogin>)"]
    G -->|Chữ ký khớp & Cache < 72 giờ| H["⚠️ GRACE CACHE (TIER3_CACHE)\nCho phép EA duy trì hoạt động an toàn"]
    G -->|Không có Cache / Giả mạo / Quá 72 giờ| D
```

---

## 🛡️ PHẦN 2. Chi Tiết 8 Kịch Bản Bản Quyền (Edge Cases) & Quản Lý License

### 2.1. 8 Kịch Bản Thực Chiến Đã Xử Lý

| # | Kịch Bản (Edge Case) | Cách Hệ Thống Xử Lý Chi Tiết |
|---|---|---|
| **1** | **User có 3 tài khoản MT5 nhưng chỉ đăng ký 1 TK dưới IB, rồi lấy `License Key` của TK A gắn sang TK B (ngoài IB)** | API `/api/ea/license/verify` đối chiếu `TradingAccount.apiKey` (Key của TK A) với `accountNumber` đang chạy thực tế trên MT5 (`AccountInfoInteger(ACCOUNT_LOGIN)` là TK B). Phát hiện `dbAccountNumber !== cleanAccountNumber`, API trả về `code: "ACCOUNT_MISMATCH"` (`HTTP 403`). EA lập tức chuyển sang trạng thái `GSN_LIC_REVOKED`, xóa sạch cache và khóa EA. |
| **2** | **Tài khoản đã tạo trên Web nhưng chưa được Admin duyệt IB (`PENDING` / `REJECTED` / `SUSPENDED`)** | Cả bảng `EALicense` (`status === APPROVED`) và `TradingAccount` (`ibAttribution === VERIFIED / CONFIRMED`) đều được kiểm tra. Nếu chưa duyệt, API trả `ACCOUNT_NOT_APPROVED_UNDER_IB` hoặc `ACCOUNT_NOT_LICENSED_UNDER_IB`; nếu license đã bị thu hồi/hết hạn, API trả `LICENSE_REVOKED`; key không tồn tại trả `INVALID_LICENSE_KEY`. Đồng thời trên GitHub `accounts.csv`, cột `status` của tài khoản đó được ghi là `inactive`, nên Tầng 2 cũng từ chối. |
| **3** | **Phân biệt Tài khoản Demo vs Real** | EA đọc trực tiếp `AccountInfoInteger(ACCOUNT_TRADE_MODE)` (`REAL`, `DEMO`, `CONTEST`) và gửi lên cả `/api/ea/license/verify` lẫn `/api/ea/heartbeat`. Demo account **được phép chạy EA có chủ đích** và nhận `DEMO_AUTHORIZED`; tuy nhiên Demo/contest/evaluation/trial **không bao giờ** được tính vào funding, VIP rolling volume, `Confirmed EA Farm Capital`, `User Pool Capital` hoặc commission/eligible volume. |
| **4** | **Tài khoản bị Admin thu hồi quyền (`SUSPENDED`) đúng lúc EA đang có lệnh mở** | `GSN_EA_License.mqh` cung cấp 3 hàm tách biệt:<br>• `IsAccountValid()`: Trả về `true` khi `VALID` hoặc `GRACE_CACHE`.<br>• `CanOpenNewTrades()`: Trả về `false` ngay khi bị khóa (`ALLOW_CLOSE_ONLY` / `REVOKED`) $\rightarrow$ Chặn mở lệnh mới.<br>• `CanManageExistingTrades()`: Vẫn trả về `true` ở trạng thái `ALLOW_CLOSE_ONLY` để EA/User có thể đóng lệnh hoặc quản lý SL/TP bảo toàn vốn. |
| **5** | **Web Server bị sập, bảo trì hoặc lỗi mạng (`HTTP -1`, `500`, `502`, `503`, `504`)** | Class `CGSNLicenseValidator` phân biệt rõ **Lỗi từ chối bản quyền** (`valid: false` do sai key/khác TK) với **Lỗi hạ tầng Web** (`HTTP -1` hoặc `HTTP >= 500`). Chỉ khi Web lỗi hạ tầng, EA mới tự động failover sang **Tầng 2 (GitHub Backup `accounts.csv`)**. Nếu tài khoản có `status = active` trên GitHub, EA tiếp tục hoạt động theo bản ghi backup hợp lệ. |
| **6** | **User treo 5–10 biểu đồ (Charts) trên cùng 1 VPS gây nguy cơ dính GitHub Rate Limit (60 requests/giờ/IP)** | Kết quả xác thực được lưu vào bộ nhớ đệm kèm dấu thời gian (`m_check_interval = 1800` giây = 30 phút) và hai biến toàn cục `GlobalVariable` của Terminal: `GSN_Lic_Sig_<login>` (chữ ký) và `GSN_Lic_Time_<login>` (timestamp). Các chart thứ 2, 3, 4... trên cùng MT5 sẽ đọc chung trạng thái đã xác thực mà không spam request lên Web hay GitHub. |
| **7** | **User copy toàn bộ thư mục MT5 hoặc chỉnh sửa `GlobalVariable` (F3 trên MT5) để bẻ khóa** | Tầng 3 không lưu biến `1` hay `0` đơn thuần mà tạo chữ ký băm **FNV-1a 32-bit** (`ComputeLicenseSignature`) kết hợp từ: `AccountLogin + cache timestamp + LicenseKey + SecretSalt ("TNT_GSN_IB_SALT_2026_V2")`. Nếu user sửa timestamp trong F3 hoặc bê thư mục MT5 sang tài khoản khác, chữ ký lập tức lệch và bị từ chối. |
| **8** | **Lộ `License Key` hoặc Admin cần cấp lại mã Key mới (`Regenerate Key`)** | Trong `/admin/trading-systems/accounts`, Admin bấm nút **Regenerate License Key** (`🔑`). Hệ thống lập tức sinh mã `TNT-XXXX-XXXX-XXXX` mới cho tài khoản đó, lưu `AuditLog`, và mã cũ bị vô hiệu hóa ngay ở lần kiểm tra tiếp theo. |

### 2.2. Mã Phản Hồi Thực Tế Từ `POST /api/ea/license/verify`

| `code` | Ý nghĩa |
|---|---|
| `MISSING_ACCOUNT_NUMBER` | Request thiếu `accountNumber` hợp lệ. |
| `ACCOUNT_MISMATCH` | License Key thuộc một Real account khác. |
| `DEMO_AUTHORIZED` | Demo account được phép chạy EA nhưng không tham gia business metrics. |
| `LICENSE_REVOKED` | License đã bị reject/suspend/expire hoặc quá `expiryDate`. |
| `ACCOUNT_NOT_APPROVED_UNDER_IB` | Account đi kèm License Key chưa được duyệt IB. |
| `ACCOUNT_NOT_LICENSED_UNDER_IB` | `User.syncApiKey` hợp lệ nhưng account cụ thể chưa được duyệt IB. |
| `INVALID_LICENSE_KEY` | Không tìm thấy License Key hoặc user sync key tương ứng. |
| `LICENSE_VALID` | Account đã được duyệt và license còn hiệu lực. |
| `ACCOUNT_NOT_AUTHORIZED` | Legacy validation không tìm thấy account đã duyệt IB. |

### 2.3. Quản Lý License Trên User Dashboard & Admin

#### A. Trang User (`/dashboard/trading-systems`)
- Khu vực **"IB Account Licenses & EA Activation Keys"** hiển thị toàn bộ tài khoản MT4/MT5 của user cùng nhãn **`Unlocks All 3 EAs`**.
- Mỗi tài khoản `APPROVED` (hoặc `IB Verified / Confirmed`) hiển thị mã **`License Key` (`TNT-XXXX-XXXX-XXXX`)** riêng kèm nút **Copy Key** và ẩn/hiện mã.
- Khi bấm **"Register IB Account"**:
  - Hiển thị danh sách toàn bộ tài khoản giao dịch hiện có của user (hỗ trợ tích chọn 1 hoặc nhiều tài khoản cùng lúc để gửi yêu cầu duyệt License hàng loạt).
  - Nếu tài khoản chưa có Số MT4/MT5 (`No Login ID`), có nút **`Set MT4/MT5 #`** ngay trên thẻ.
  - Nếu user chưa có tài khoản nào, hiển thị nút điều hướng sang **`/dashboard/accounts`** (`Go to Trading Accounts`).
- Nút **`Remove` / `Cancel`** gỡ bỏ đồng bộ trên cả `EALicense`, `TradingAccount.ibAttribution`, `ProEntitlement`, `EAProductAccess` và GitHub `accounts.csv`.
- Nút **`MT5 WebRequest Setup (30s)`** hướng dẫn 3 bước bằng tiếng Anh kèm nút Copy nhanh 3 URL.

#### B. Trang Admin (`/admin/trading-systems/accounts`)
Admin có đầy đủ 9 quyền quản trị vòng đời License:
1. **Approve (`✓`)**: Duyệt tài khoản `PENDING` $\rightarrow$ Tự động tạo `TradingAccount` (nếu chưa có), sinh mã `TNT-XXXX-XXXX-XXXX`, gửi thông báo cho user, và đẩy job đồng bộ `accounts.csv` lên GitHub.
2. **Reject (`✕`)**: Từ chối yêu cầu kèm lý do $\rightarrow$ Đánh dấu `inactive` trên GitHub `accounts.csv`.
3. **Grant License (`+ Grant License` — Modal `Grant EA License Key`)**: Admin chủ động cấp mới License + sinh mã `TNT-XXXX-XXXX-XXXX` cho bất kỳ user nào (nhập Email, chọn Broker, nhập số TK MT5). Trường `Expiry Date` được ẩn trên UI và tự động gán mặc định **`2040-12-31`**.
4. **Copy & Reveal License Key (`👁` / `📋`)**: Xem và copy mã `TNT-XXXX-XXXX-XXXX` của từng tài khoản.
5. **Regenerate License Key (`🔑`)**: Thu hồi mã Key cũ và tạo mã `TNT-XXXX-XXXX-XXXX` mới.
6. **Suspend License (`🚫`)**: Tạm khóa quyền sử dụng EA $\rightarrow$ chuyển trạng thái trên GitHub `accounts.csv` thành `inactive`.
7. **Reactivate License (`↺`)**: Mở khóa lại cho tài khoản `SUSPENDED`, `REJECTED` hoặc `EXPIRED` $\rightarrow$ đồng bộ `active` lên GitHub `accounts.csv`.
8. **Delete License & Account (`🗑` — `deleteAccountLicense`)**: Xóa triệt để tài khoản License khỏi hệ thống (dọn dẹp đồng bộ `EALicense`, `TradingAccount` placeholder, `ProEntitlement`, `EAProductAccess`, `EAProductUsageEvent` và GitHub `accounts.csv`).
9. **Sync GitHub Backup (`Sync GitHub Backup`)**: Đồng bộ tức thời danh sách tài khoản lên `accounts.csv` của repo GitHub (`nguyenndn/ea-accounts`), đồng thời bảo toàn các dòng VIP lịch sử.

---

## 💰 PHẦN 3. Heartbeat, EA Farm Telemetry & Kiểm Tra Vốn Tối Thiểu (`$200 USD`)

### 3.1. Endpoint Heartbeat (`POST /api/ea/heartbeat`)
- Định kỳ mỗi **5 phút**, `GSN_EA_Telemetry.mqh` gửi nhịp heartbeat kèm:
  - `accountNumber`, `balance`, `equity`, `currency`, `leverage`
  - `broker` (`ACCOUNT_COMPANY`), `server` (`ACCOUNT_SERVER`), `accountTradeMode` (`REAL` / `DEMO` / `CONTEST`)
  - `productSlug` (`"trade-manager"` | `"goldscalperninja"` | `"gsn-phoenix-grid"`), `eaName`, `eaVersion`, `platform`
  - `gmtOffset` (giây = `TimeCurrent() - TimeGMT()`) và `clientTime` (ISO UTC `TimeGMT()`)

### 3.2. Chuẩn Hóa Tài Khoản Cent (`USC`) & Trust Gate Cho Funding (`>= $200 USD`)
`POST /api/ea/heartbeat` **không tin trực tiếp** `balance` hoặc `accountType` tự khai từ client để mở khóa Pro, mà áp dụng **Trust Gate 4 lớp**:
1. **Xác thực IB**: Account phải có `ibAttribution = VERIFIED / CONFIRMED` hoặc có `EALicense` đang `APPROVED` khớp đúng `userId`, `accountNumber` và `broker` đã lưu.
2. **Sàn đối tác hợp lệ**: Broker nằm trong danh sách `EABroker.isVipEligible` (Vantage, Exness, VTMarkets, Ultima Markets).
3. **Tài khoản REAL thực**: `isLiveTradingPayload` xác nhận là `REAL` và không mang marker Demo/contest/evaluation/trial đã lưu trong DB (`src/lib/trading-account-classification.ts`). Sau lần kết nối đầu, các trường định danh `broker`/`server`/`accountType` đã lưu trong DB được khóa, không bị ghi đè bởi heartbeat.
4. **Chuẩn hóa Cent/USC & Ngưỡng vốn `$200 USD`**:
   - Nếu `currency === "USC"` hoặc tên server chứa `"cent"`, backend tự động quy đổi: `effectiveUsdBalance = balance / 100` (ví dụ `25,000 USC` = `$250 USD` $\rightarrow$ Đạt; `15,000 USC` = `$150 USD` $\rightarrow$ Chưa đạt).
   - Khi hội đủ 4 điều kiện và `effectiveUsdBalance >= 200`, hệ thống ghi nhận `fundingVerifiedAt` / `fundingLastVerifiedAt` và trả về:
     ```json
     {
       "success": true,
       "autoSync": true,
       "serverTime": "2026-10-21T12:00:00.000Z",
       "balanceEligible": true,
       "vipEligible": true,
       "minBalanceRequired": 200
     }
     ```
   - Telemetry & Capital Snapshot (`recordEaProductTelemetry` trong `src/lib/ea/telemetry.server.ts`): Chỉ cập nhật các bản ghi `EAProductAccess` đã `GRANTED` (không bao giờ tự cấp quyền mới từ telemetry) và chỉ lưu `TradingAccountCapitalSnapshot` cho tài khoản `REAL`.

---

## 🔄 PHẦN 4. Đồng Bộ Giao Dịch (Trade Sync), Commission & Swap Đa Deal (`GSN_EA_Telemetry.mqh`)

### 4.1. Bài Toán Multi-Deal Trên MetaTrader 5 & Công Thức Chuẩn
Trên MT5, mỗi vị thế (`POSITION_IDENTIFIER`) gồm nhiều lượt khớp lệnh (`Deals`): Deal mở (`DEAL_ENTRY_IN`), Deal đóng (`DEAL_ENTRY_OUT`), đóng từng phần (`Partial Close`), đảo chiều (`DEAL_ENTRY_INOUT`) hoặc đóng đối ứng (`DEAL_ENTRY_OUT_BY`). Trên các sàn ECN/Raw Spread, phí `DEAL_COMMISSION` thường bị trừ ngay ở Deal mở (`DEAL_ENTRY_IN`).

Để không mất 50%–100% Commission và Swap, `CGSNTradeSyncEngine::FindOpeningDealWithSLTP` và `BuildTradeJson` trong [`public/Include/GSN_EA_Telemetry.mqh`](file:///c:/laragon/www/gsn-crm/public/Include/GSN_EA_Telemetry.mqh) thực hiện:
1. Gọi `HistorySelectByPosition(positionId)` (kèm Fallback sâu `HistorySelect(0, TimeCurrent()) + 3600` nếu thiếu `DEAL_ENTRY_IN` đối với các lệnh Swing Trade mở ngoài khoảng thời gian truy vấn).
2. Cộng dồn toàn bộ các deal thuộc cùng `DEAL_POSITION_ID == positionId`:
   $$\text{Total Gross Profit} = \sum \text{DEAL\_PROFIT}_i$$
   $$\text{Total Commission} = \sum \text{DEAL\_COMMISSION}_i$$
   $$\text{Total Swap} = \sum \text{DEAL\_SWAP}_i$$
   $$\text{Net PnL (Server)} = \text{Gross Profit} + \text{Commission} + \text{Swap}$$
3. **Fallback Swap**: Nếu tổng `posSwap` cộng dồn bằng `0` nhưng deal đóng có ghi nhận `DEAL_SWAP` khác `0`, bảo toàn giá trị `fallbackSwap` từ deal đóng.
4. **Quét Order History**: Duyệt `HistoryOrdersTotal()` của position để lấy `stopLoss` và `takeProfit` cuối cùng.

### 4.2. Hợp Đồng Payload `POST /api/ea/trades` & Các Quy Tắc Bảo Vệ Dữ Liệu (`B1` $\rightarrow$ `B12`)

```json
{
  "trades": [
    {
      "ticket": "12345678",
      "symbol": "XAUUSD",
      "type": 0,
      "volume": 0.30,
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
  "productSlug": "trade-manager",
  "eaName": "Trade Manager",
  "eaVersion": "2.4.0",
  "platform": "MT5",
  "accountTradeMode": "REAL",
  "clientTime": "2026-10-21T10:00:00Z",
  "gmtOffset": 10800,
  "accountNumber": "53062951",
  "broker": "Exness Technologies Ltd",
  "server": "Exness-MT5Real8",
  "currency": "USD",
  "balance": 1000.00,
  "equity": 1010.00,
  "leverage": 500
}
```

Các quy tắc chuẩn hóa & bảo vệ tại [`src/lib/ea/utils.ts`](file:///c:/laragon/www/gsn-crm/src/lib/ea/utils.ts), [`src/app/api/ea/trades/route.ts`](file:///c:/laragon/www/gsn-crm/src/app/api/ea/trades/route.ts) và [`src/app/api/ea/history/route.ts`](file:///c:/laragon/www/gsn-crm/src/app/api/ea/history/route.ts):
- **Chuẩn hóa múi giờ UTC (`B1` & `B6`)**: EA gửi `openTime`/`closeTime` theo epoch giây của broker kèm `gmtOffset` (giây) và `clientTime` chuẩn ISO UTC (`Z`). Backend trừ `gmtOffsetSeconds` **đúng 1 lần** khi ingest để lưu `entryDate`/`exitDate` chuẩn UTC vào DB. Các mốc epoch `<= 0` (như `0` hoặc `"1970.01.01 00:00:00"`) luôn được hiểu là `closeTime = null` (lệnh đang mở).
- **Chặn Floating PnL trên lệnh `OPEN` (`B2`)**: Với lệnh đang mở (`closeTime === null`), EA gửi `"profit": 0.00` + `"unrealizedPnl": <floating>`, và Backend ép cứng `pnl = 0`, `result = null`. Khi lọc `status = OPEN` trên `/dashboard/journal`, `totalPnL` realized luôn bằng `0`.
- **Tôn trọng cấu hình `syncOpenTrades` (`B3`)**: EA gọi `GET /api/ea/config?accountNumber=...` khi khởi tạo (và mỗi 15 phút) để đọc `syncOpenTrades`. Nếu `syncOpenTrades === false`, cả EA lẫn Backend đều bỏ qua các lệnh đang mở (`closeTime === null`).
- **Nhận diện Broker chuẩn (`B4`)**: Cả `/api/ea/trades`, `/api/ea/heartbeat` và `/api/ea/history` đều chạy `detectBroker(server, broker)` trước khi xác thực account (ví dụ `"Exness Technologies Ltd"` $\rightarrow$ `"Exness"`).
- **Cô lập từng trade lỗi số học (`B5`)**: Mọi trade thiếu `ticket`, `volume <= 0`, hoặc có trường số `NaN`/`Infinity` sẽ bị tách riêng vào mảng `errors: [{ ticket, reason, message }]` mà không làm hỏng các trade hợp lệ cùng batch.
- **Bảo toàn `initialVolume` cho lệnh `OPEN` & Partial Close (`B7` — Option PA)**: Lệnh đang mở gửi kèm `initialVolume` và `remainingVolume`; DB giữ nguyên `lotSize = initialVolume` khi còn `OPEN`, và khi `CLOSED` sẽ cập nhật `lotSize` bằng tổng volume thực tế đã đóng.
- **Giới hạn Payload & chống ZIP Bomb (`B8`)**: Tối đa `500` trades/request và tối đa `5 MB` (cả trước và sau giải nén `zlib`), vượt ngưỡng trả về `HTTP 413`.
- **Công thức bộ đếm bất biến (`B9`) & Chống ghi đè ngược `OPEN` lên `CLOSED` (`B10`)**: Khử trùng `ticket` trong cùng batch; đảm bảo `received === imported + updated + skipped` (`updated = closed + backfilled`). Nếu một gói tin `OPEN` đến trễ cho một `ticket` đã `CLOSED`, hệ thống tự động bỏ qua và ghi cảnh báo.
- **Chặn tự bịa dữ liệu khi mất deal mở (`B11`)**: Nếu không tìm thấy deal mở (`DEAL_ENTRY_IN`), EA gửi `"entryDataMissing": true` và Backend từ chối vào `errors[]` thay vì tạo lệnh 0 giây `entry = exit`.

### 4.3. Hiển Thị Commission & Swap Trên Giao Diện (`/dashboard/journal` & `/dashboard/analytics`)
- **Trang `/dashboard/journal`**:
  - Thẻ KPI **`Total Swap`** nằm cạnh thẻ **`Commission`** trên thanh 8 thẻ thống kê đầu trang ([`JournalStats.tsx`](file:///c:/laragon/www/gsn-crm/src/components/journal/JournalStats.tsx)).
  - Cột **`Swap`** riêng biệt nằm cạnh cột **`Comm`** trong bảng danh sách lệnh ([`JournalList.tsx`](file:///c:/laragon/www/gsn-crm/src/components/journal/JournalList.tsx)).
- **Trang `/dashboard/analytics`**:
  - Header biểu đồ [`EquityCurve.tsx`](file:///c:/laragon/www/gsn-crm/src/components/analytics/EquityCurve.tsx), popup chi tiết ngày trên lịch ([`DayTradeList.tsx`](file:///c:/laragon/www/gsn-crm/src/components/analytics/DayTradeList.tsx)) và bảng [`RecentTradesTable.tsx`](file:///c:/laragon/www/gsn-crm/src/components/analytics/RecentTradesTable.tsx) đều hiển thị đầy đủ 2 chỉ số/cột **`Comm`** và **`Swap`**.

---

## ⚙️ PHẦN 5. Cấu Hình `.env`, MT5 WebRequest & Cách Include Vào 3 EA

### 5.1. Biến Môi Trường `.env` & Danh Sách URL MT5 WebRequest
Trong `.env` / Vercel:
```env
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GITHUB_LICENSE_REPO="nguyenndn/ea-accounts"
GITHUB_LICENSE_PATH="accounts.csv"
GITHUB_LICENSE_BRANCH="main"
```

Trong MT5 (`Tools` $\rightarrow$ `Options` $\rightarrow$ `Expert Advisors` $\rightarrow$ `Allow WebRequest for listed URL`), thêm 3 URL:
1. `https://thenexttrade.com` *(hoặc `http://localhost:3500` khi test dưới local)*
2. `https://api.github.com`
3. `https://raw.githubusercontent.com`

### 5.2. Bảng Tóm Tắt Cách Include Vào Từng EA

| Tên EA | Mã `productSlug` | Cách Include Chuẩn Trong File `.mq5` |
|---|---|---|
| **1. Trade Manager**<br>*(EA đã có sẵn Tab `SYNC`)* | `"trade-manager"` | • Thêm `#include "Include\GSN_EA_Telemetry.mqh"`<br>• Thay thế `#include <AccountValidator.mqh>` cũ bằng:<br>`#include "Include\GSN_EA_License.mqh"` |
| **2. GoldScalperNinja**<br>*(EA chưa có Tab `SYNC`)* | `"goldscalperninja"` | Thay `#include <AccountValidator.mqh>` bằng **4 dòng** sau:<br>`#define GSN_AUTO_TELEMETRY`<br>`#define GSN_EA_SLUG "goldscalperninja"`<br>`#include "Include\GSN_EA_Telemetry.mqh"`<br>`#include "Include\GSN_EA_License.mqh"` |
| **3. Shadow Matrix / Apex Gold Sentinel**<br>*(EA chưa có Tab `SYNC`)* | `"gsn-phoenix-grid"` | Thay `#include <AccountValidator.mqh>` bằng **4 dòng** sau:<br>`#define GSN_AUTO_TELEMETRY`<br>`#define GSN_EA_SLUG "gsn-phoenix-grid"`<br>`#include "Include\GSN_EA_Telemetry.mqh"`<br>`#include "Include\GSN_EA_License.mqh"` |

### 5.3. Prompt Mẫu Copy-Paste Gửi Cho AI Khác (Khi Tích Hợp Vào Các EA Còn Lại)

```markdown
### TASK: Integrate `Include\GSN_EA_License.mqh` & `Include\GSN_EA_Telemetry.mqh`

You are integrating our unified OOP 3-Tier License Validator (`Include\GSN_EA_License.mqh`) and Telemetry/Trade Sync Engine (`Include\GSN_EA_Telemetry.mqh`) into our MQL5 Expert Advisor(s).

#### CRITICAL RULES (DO NOT VIOLATE):
1. **ZERO TRADING LOGIC CHANGES**: Do NOT modify, refactor, or touch any entry signal logic, DCA/grid math, stop-loss/take-profit calculations, lot sizing, trailing stops, or existing chart UI controls.
2. **DROP-IN COMPATIBILITY**: Place `GSN_EA_License.mqh` and `GSN_EA_Telemetry.mqh` inside the EA's `Include/` folder (`Include\GSN_EA_License.mqh` and `Include\GSN_EA_Telemetry.mqh`). Because `GSN_EA_License.mqh` provides a drop-in `CAccountValidator` subclass backed by `CGSNLicenseValidator`, existing calls to `account_validator.ValidateAccount()`, `IsAccountValid()`, and `GetLicenseState()` continue to work with zero changes.

#### STEP-BY-STEP IMPLEMENTATION:

- **Case A — For `GoldScalperNinja` EA**:
  Replace `#include <AccountValidator.mqh>` with:
  ```mql5
  #define GSN_AUTO_TELEMETRY
  #define GSN_EA_SLUG "goldscalperninja"
  #include "Include\GSN_EA_Telemetry.mqh"
  #include "Include\GSN_EA_License.mqh"
  ```

- **Case B — For `Shadow Matrix` / `Apex Gold Sentinel` / `Phoenix Grid` EA**:
  Replace `#include <AccountValidator.mqh>` with:
  ```mql5
  #define GSN_AUTO_TELEMETRY
  #define GSN_EA_SLUG "gsn-phoenix-grid"
  #include "Include\GSN_EA_Telemetry.mqh"
  #include "Include\GSN_EA_License.mqh"
  ```

- **Case C — For `Trade Manager` (which already has the SYNC tab UI)**:
  Use `#include "Include\GSN_EA_Telemetry.mqh"` and replace `#include <AccountValidator.mqh>` with `#include "Include\GSN_EA_License.mqh"`.

Finally, compile the `.mq5` file with `MetaEditor64.exe` and verify `0 errors, 0 warnings`.
```
