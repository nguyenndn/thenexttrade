# Tích hợp Hệ Thống PVSR Capital x Đối Tác (Ninja Team)

Tài liệu này cung cấp kiến trúc dữ liệu và hướng dẫn về cách thức kết nối giữa hệ thống **PVSR Capital** và website của đối tác (cụ thể là **Ninja Team** cũng như các Đối tác/Partners khác trong tương lai).

Mục tiêu chính là cho phép khách hàng đăng ký liền mạch từ website đối tác, được tự động thiết lập hệ thống giao dịch tại PVSR, đồng thời đối tác có thể lấy dữ liệu hiệu suất (Performance) thực tế về để tự thiết kế giao diện hiển thị trên website của họ mà không phải bóc tách dữ liệu phức tạp.

> **Phiên bản:** 2.1 — Bổ sung đặc tả chi tiết phần việc phía Ninja Team.
> **Cập nhật lần cuối:** 2026-04-09

---

## 📌 1. Bức Tranh Tổng Thể (Architecture Overview)

Hệ thống PVSR Capital áp dụng mô hình kiến trúc sử dụng **Website PVSR** (Next.js — với tên miền chính thức đã được mã hóa SSL/Cloudflare Tunnel) làm **Cổng Giao Tiếp API (API Gateway)** tập trung để xử lý kết nối với bên ngoài.

**Lý do lựa chọn kiến trúc này:**
- **Thống nhất Hạ tầng:** Website (Next.js), Station (Node.js xử lý MT5 Terminal) và Database (PostgreSQL cục bộ) được đặt chung trên một máy chủ vật lý.
- **Bảo mật tuyệt đối Lõi Giao dịch:** Station và Database sẽ CHỈ chạy ngầm (Background) ở Localhost, không bao giờ phơi ra ngoài Internet. Giúp hệ thống Core an toàn 100% trước DDoS hay quét lỗi.
- **Quy hoạch API Mở Rộng (Multi-Tenant):** Mọi luồng truy cập từ Ninja Team (hoặc Đối tác khác) đều sẽ gõ cửa từ Cổng Website chính. Website bóc tách bảo mật, truy vấn xuống Local Database và trả kết quả về chuẩn chỉnh với độ trễ tối thiểu.
- **Bảo vệ Chiến lược Giao dịch (IP Protection):** API chỉ trả về JSON thành phẩm đã được tổng hợp. Đối tác **TUYỆT ĐỐI KHÔNG** có khả năng dò ngược Ticket/Giá vào-ra cụ thể của từng lệnh.

```
[Ninja Website] ─── (POST Registration) ──► [PVSR Website / Next.js API]
                                                       │
[Ninja Website] ◄── (GET Performance JSON) ──          │
                                                       ▼
                                              [PostgreSQL LocalDB]
                                                       │
                                              [PVSR Station / Node.js]
                                                       │
                                               [MT5 Terminals]
```

---

## 🔁 2. Luồng Giải Pháp & Dữ Liệu (The Workflow)

Sự kết hợp này hoạt động dựa trên cơ chế kết nối API 2 chiều (**Inbound** và **Outbound**) chạy qua **Website PVSR**:

1. **Đăng ký (Client Onboarding):**
   - Khách hàng điền form đăng ký trực tiếp trên website của Ninja Team.
   - Website Ninja sẽ gọi `Inbound Registration API` trên Domain Website của PVSR để truyền thông tin.

2. **Xử lý nền (Background Operations):**
   - **Website PVSR** nhận request đăng ký, kiểm tra API Key (`x-api-key` header), tiếp nhận thông tin và ghi xuống bảng `registrations` trong Database với trường `partner_code: "ninja_team"`.
   - Lõi **Station** (đang quét Local DB ngầm liên tục) sẽ phát hiện hồ sơ mới có `status: "PENDING"`, tự động thao tác trên MT5 để thiết lập tài khoản Client cho đối tác. Cập nhật `status: "APPROVED"` và tạo bản ghi vào `trading_accounts` liên tục vào Database.

3. **Chia sẻ và Hiển thị Hiệu suất (Performance Sharing):**
   - ĐỂ BẢO VỆ CHIẾN LƯỢC GIAO DỊCH (Intellectual Property - IP): Hệ thống **TUYỆT ĐỐI KHÔNG** chia sẻ File lịch sử lệnh (Trade Logs chi tiết giá vào/ra/Ticket).
   - ĐỔI LẠI: Trách nhiệm tính toán dữ liệu quá khứ phức tạp sẽ do PVSR Backend lo liệu hoàn toàn (Data Aggregation từ `trade_history` + `daily_stats` + `transactions` tables).
   - PVSR cung cấp bộ `Outbound Performance APIs` trả về một khối JSON THÀNH PHẨM. Ninja Team lập tức dùng khối dữ liệu "ăn liền" này để render Dashboard Website của họ mượt mà y hệt chất lượng trang Performance của PVSR.

---

## ⚙️ 3. Kiến Trúc API Được Đề Xuất (Mở rộng cho nhiều Partner)

Dưới đây là đặc tả sơ bộ để giúp team lập trình hai bên nắm bắt luồng cấu trúc. `{partner_code}` dùng làm tham số định tuyến (Ví dụ đoạn này sẽ là `ninja_team`).

### 3.1. Inbound API: Xử lý Đăng Ký (Từ Đối Tác 👉 Website PVSR)
Endpoint này dùng để tiếp nhận form đăng ký. Dữ liệu được ghi vào bảng `registrations` (đã tồn tại) với trường `partner_code` bổ sung mới.

- **Endpoint:** `POST https://[pvsr-website-domain.com]/api/v1/partners/{partner_code}/clients`
- **Headers:** 
  - `x-api-key`: `[Đối_Tác_Secret_API_Key]` (Mỗi đối tác 1 mã bí mật — lưu trong bảng `partners`)
  - `Content-Type`: `application/json`
- **Body Request:**
  ```json
  {
     "clientName": "Nguyen Van A",
     "email": "nva@gmail.com",
     "phone": "+84912345678",
     "telegram": "@nguyenvana",
     "mt5Account": "12345678",
     "mt5Server": "ICMarkets-Live01",
     "broker": "ICMarkets"
  }
  ```
- **Response Success:** `201 Created`
  ```json
  { "success": true, "message": "Registration received", "registrationId": 42 }
  ```
- **Response Error (Invalid Key):** `401 Unauthorized`
  ```json
  { "success": false, "error": "Invalid or missing API key" }
  ```
- **Response Error (Conflict):** `409 Conflict`
  ```json
  { "success": false, "error": "MT5 account already registered" }
  ```

### 3.2. Outbound API: Kéo Dữ Liệu Hiệu Suất Tổng Quan (Từ Website PVSR 👉 Đối Tác)
Chỉ một Endpoint duy nhất nhưng bao gồm TOÀN BỘ dữ liệu đã nhào nặn hoàn chỉnh. Logic tính toán dựa trực tiếp trên hàm `getClientPerformance()` đang có trong `src/lib/actions.ts`.

- **Endpoint:** `GET https://[pvsr-website-domain.com]/api/v1/partners/{partner_code}/performance`
  - _Tùy chọn:_ `?accountCode=ACC001` để lấy data của 1 account cụ thể trong pool của partner đó.
- **Headers:** `x-api-key`: `[Đối_Tác_Secret_API_Key]`
- **Query Params (tùy chọn):**
  - `accountCode` — Lọc theo account code cụ thể
  - `period` — `"all"` | `"3m"` | `"6m"` | `"1y"` (mặc định: `"all"`)

- **Payload Response (JSON Mẫu Chuẩn):**
  ```json
  {
    "meta": {
      "generatedAt": "2026-04-09T15:00:00Z",
      "partnerCode": "ninja_team",
      "cacheExpiresIn": 300
    },
    "accountInfo": {
      "accountCode": "ACC001",
      "maskedAccountNumber": "123***89",
      "maskedClientName": "Ng** V** A",
      "currency": "USD",
      "leverage": "1:500",
      "status": "ONLINE",
      "lastUpdated": "2026-04-09T10:00:00Z"
    },
    "coreMetrics": {
      "balance": 15000.50,
      "equity": 15120.00,
      "totalDeposits": 10000.00,
      "totalWithdrawals": 2000.00,
      "highestBalance": 16000.00,
      "netDeposits": 8000.00
    },
    "advancedStats": {
      "growthPercent": 50.05,
      "maxDrawdownPercent": 12.50,
      "maxDrawdownUsd": 1250.00,
      "totalNetProfit": 5000.50,
      "grossProfit": 7500.00,
      "grossLoss": -2500.00,
      "profitFactor": 1.85,
      "winRatePercent": 68.5,
      "totalTrades": 1520,
      "winCount": 1041,
      "lossCount": 479,
      "bestTrade": 320.50,
      "worstTrade": -180.20,
      "recoveryFactor": 4.0,
      "avgHoldTime": "2h 15m"
    },
    "dailyCalendar": {
      "2026-03-01": { "profit": 150.50, "tradesCount": 5 },
      "2026-03-02": { "profit": -50.00, "tradesCount": 3 }
    },
    "monthlyCalendar": {
      "2026-01": { "profit": 1500, "growthPct": 15.0 },
      "2026-02": { "profit": 800, "growthPct": 8.0 }
    },
    "growthChartArray": [
      { "date": "2026-03-01", "balance": 10150.50, "drawdownPct": 0.0, "dailyProfit": 150.50 },
      { "date": "2026-03-02", "balance": 10100.50, "drawdownPct": 0.49, "dailyProfit": -50.00 }
    ],
    "instrumentDistribution": [
      { "symbol": "XAUUSD", "profit": 4500, "winRate": 65, "totalTrades": 500 },
      { "symbol": "EURUSD", "profit": 500.5, "winRate": 70, "totalTrades": 100 }
    ]
  }
  ```

> **Lưu ý bảo mật:** Tất cả dữ liệu trong response đều đã được Masking (che tên, che số tài khoản). Không có ticket lệnh, không có giá vào/ra — đối tác chỉ nhận được số liệu tổng hợp.

### 3.3. Webhook (Tùy chọn — Giai đoạn 2)
Thay vì đối tác phải polling liên tục, PVSR chủ động **đẩy thông báo** về phía đối tác khi có cập nhật quan trọng.

- **Đăng ký Webhook:** `POST /api/v1/partners/{partner_code}/webhook`
  ```json
  { "url": "https://ninja-site.com/hooks/pvsr", "events": ["performance_updated", "client_registered"] }
  ```
- **Payload PVSR đẩy về Ninja:** `POST {ninja_webhook_url}`
  ```json
  { "event": "performance_updated", "partnerCode": "ninja_team", "timestamp": "2026-04-09T10:00:00Z" }
  ```

---

## 🔒 4. Bảo Mật API (Security Model)

### 4.1. Xác thực (Authentication)
- Mỗi đối tác có 1 khóa `api_secret_key` duy nhất, lưu trong bảng `partners` (bcrypt hash).
- Mọi request PHẢI đính kèm header: `x-api-key: [key]`
- Middleware Next.js (`src/middleware.ts`) sẽ bắt và validate key trước khi request đến Route Handler.

### 4.2. Rate Limiting
- Giới hạn: **60 request/phút** cho mỗi API key (tránh spam/DDoS từ phía đối tác).
- Gợi ý dùng: Upstash Redis + `@upstash/ratelimit` hoặc bộ đếm trong-memory nếu traffic thấp.

### 4.3. IP Whitelist (Khuyến nghị)
- Cho phép đối tác đăng ký danh sách IP Server của họ → lưu vào bảng `partners.allowed_ips`.
- Middleware chặn nếu IP không nằm trong whitelist.

### 4.4. CORS Policy
- Chỉ cho phép origin từ domain đã đăng ký của từng đối tác.
- Configure trong `next.config.ts` headers section.

---

## 💾 5. Cấu Trúc Database Bổ Sung (Schema Changes)

Dựa trên schema hiện tại (`schema.prisma`), cần thêm/sửa các bảng sau:

### 5.1. Bảng Mới: `partners`
```prisma
model Partner {
  id              Int       @id @default(autoincrement())
  partner_code    String    @unique                // "ninja_team", "eagle_fund"
  partner_name    String                           // "Ninja Team Vietnam"
  api_secret_key  String                           // Hashed bcrypt key
  webhook_url     String?                          // URL để PVSR đẩy event về
  allowed_ips     String?                          // JSON array of whitelisted IPs
  status          String    @default("ACTIVE")     // "ACTIVE" | "SUSPENDED"
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  registrations   Registration[]
  trading_accounts TradingAccount[]

  @@map("partners")
}
```

### 5.2. Sửa bảng `registrations` (đã tồn tại)
Thêm trường `partner_code` để tracking nguồn đăng ký:
```prisma
// Thêm vào model Registration hiện tại:
partner_code    String?   // NULL cho khách PVSR tự nhiên, "ninja_team" cho khách Ninja
partner         Partner?  @relation(fields: [partner_code], references: [partner_code])
```

### 5.3. Sửa bảng `trading_accounts` (đã tồn tại)
Thêm trường `partner_code` để lọc data theo đối tác:
```prisma
// Thêm vào model TradingAccount hiện tại:
partner_code    String?   // NULL cho khách PVSR, gán "ninja_team" cho tài khoản Ninja
partner         Partner?  @relation(fields: [partner_code], references: [partner_code])
```

> **Lý do thiết kế:** Dùng `partner_code` làm FK thay vì `partner_id` (Int) để dễ debug và JOIN mà không cần lookup thêm bảng.

---

## 🗂️ 6. Cấu Trúc File Code Đề Xuất (Next.js)

```
src/
├── app/
│   └── api/
│       └── v1/
│           └── partners/
│               └── [partner_code]/
│                   ├── clients/
│                   │   └── route.ts        ← Inbound: POST đăng ký
│                   ├── performance/
│                   │   └── route.ts        ← Outbound: GET performance JSON
│                   └── webhook/
│                       └── route.ts        ← Webhook registration (Giai đoạn 2)
├── lib/
│   ├── partner-auth.ts     ← Middleware validate API Key + Rate Limit
│   ├── partner-actions.ts  ← Server actions cho partner data queries
│   └── masking.ts          ← Module che tên/số tài khoản
└── middleware.ts            ← Protect /api/v1/partners/* routes
```

---

## 🔄 7. Caching Strategy (Hiệu Suất)

Dữ liệu Performance không thay đổi từng giây — có thể được cache an toàn:

| Loại Data | Cache TTL | Lý do |
|---|---|---|
| `growthChartArray` | 5 phút | Trade mới đẩy vào liên tục từ Station |
| `advancedStats` | 5 phút | Tính toán nặng từ `trade_history` |
| `monthlyCalendar` | 1 giờ | Chỉ thay đổi khi có trade mới trong tháng |
| `dailyCalendar` | 5 phút | Cập nhật xuyên ngày |
| `accountInfo` | 30 giây | Balance/Equity thay đổi liên tục |

**Giải pháp:** Dùng Next.js `unstable_cache` hoặc `revalidate` tag trong Route Handler, hoặc Upstash Redis cho distributed cache nếu cần.

---

## 🛠️ 8. Checklist Triển Khai (Chi Tiết Kỹ Thuật)

### Phase 1 — Database & Core Infrastructure
- [ ] Thêm model `Partner` vào `schema.prisma`
- [ ] Thêm trường `partner_code` vào model `Registration` và `TradingAccount`
- [ ] Chạy `prisma migrate dev --name add_partner_support`
- [ ] Tạo seed data: 1 bản ghi Partner cho `ninja_team` với API key thử nghiệm

### Phase 2 — API Routes (Website)
- [ ] Tạo file `src/lib/partner-auth.ts` — validate `x-api-key` header, check bảng `partners`
- [ ] Tạo file `src/lib/masking.ts` — hàm che số tài khoản (`123***89`) và tên (`Ng** V** A`)
- [ ] Tạo file `src/lib/partner-actions.ts` — query lấy data theo `partner_code`, tái sử dụng `getClientPerformance()` đang có
- [ ] Code Route: `POST /api/v1/partners/[partner_code]/clients` — ghi `registrations` với `partner_code`
- [ ] Code Route: `GET /api/v1/partners/[partner_code]/performance` — trả JSON thành phẩm
- [ ] Thêm Rate Limiting vào `partner-auth.ts`
- [ ] Cập nhật `next.config.ts` — thêm CORS headers cho partner domains

### Phase 3 — Admin Management
- [ ] Thêm tab "Đối Tác" vào Admin Dashboard để CRUD danh sách Partners
- [ ] UI tạo/revoke API Key cho từng đối tác
- [ ] UI xem lịch sử request (audit log) của từng đối tác

### Phase 4 — Swagger/API Docs
- [ ] Viết tài liệu API chuẩn (JSON OpenAPI 3.0 hoặc Notion page) bàn giao cho Ninja Team Dev
- [ ] Tạo Postman Collection mẫu để test nhanh

### Phase 5 — Testing & Handoff
- [ ] Test luồng đầu-cuối: Form Đăng Ký Ninja → API PVSR → DB → Station xử lý → API Performance trả JSON → Ninja render Chart
- [ ] Bàn giao API Key thực sự cho Ninja Team Dev

---

## 🥷 9. Phần Việc Phía Ninja Team (Ninja Implementation Guide)

Đây là đặc tả chi tiết những gì **team phát triển Ninja** cần xây dựng để tích hợp hoàn chỉnh với hệ thống PVSR Capital.

> **Nguyên tắc:** Ninja Team chỉ cần lo về UI/UX và gọi API. PVSR lo toàn bộ logic tính toán, bảo mật, và xử lý MT5.

---

### Phase N1 — Chuẩn Bị & Kết Nối API

#### N1.1. Nhận credentials từ PVSR
- [ ] Nhận `api_secret_key` từ PVSR Admin (key dạng: `pvsr_live_xxxxxxxxxxxxxxxx`)
- [ ] Nhận `partner_code` chính thức: `ninja_team`
- [ ] Nhận domain endpoint PVSR: `https://[pvsr-domain.com]/api/v1/partners/ninja_team/`
- [ ] Nhận Postman Collection mẫu để test sandbox trước

#### N1.2. Lưu trữ API Key an toàn
- [ ] Lưu `api_secret_key` vào **biến môi trường server** (`.env` hoặc Secret Manager) — **KHÔNG** hardcode trong frontend code
- [ ] Mọi request tới PVSR API phải đi qua **Backend Ninja** (server-side), không gọi trực tiếp từ browser để tránh lộ key

---

### Phase N2 — Form Đăng Ký Khách Hàng

#### N2.1. Thiết kế Form đăng ký trên Website Ninja
Form cần thu thập các trường sau (map với Inbound API của PVSR):

| Trường hiển thị | Field name gửi API | Bắt buộc | Ghi chú |
|---|---|---|---|
| Họ và tên | `clientName` | ✅ | |
| Email | `email` | ✅ | Validate format |
| Số điện thoại | `phone` | ✅ | Format `+84xxxxxxxxx` |
| Telegram | `telegram` | ✅ | Format `@username` |
| Số tài khoản MT5 | `mt5Account` | ✅ | Chỉ chấp nhận số |
| Server MT5 | `mt5Server` | ✅ | Dropdown từ danh sách broker |
| Sàn giao dịch | `broker` | ✅ | Dropdown |

#### N2.2. Logic gọi Inbound API khi submit form
```javascript
// Chạy ở Backend Ninja (Node.js / Next.js API route / server action)
async function registerClient(formData) {
  const response = await fetch(
    'https://[pvsr-domain]/api/v1/partners/ninja_team/clients',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PVSR_API_KEY,  // từ .env
      },
      body: JSON.stringify({
        clientName: formData.clientName,
        email: formData.email,
        phone: formData.phone,
        telegram: formData.telegram,
        mt5Account: formData.mt5Account,
        mt5Server: formData.mt5Server,
        broker: formData.broker,
      }),
    }
  );

  const result = await response.json();

  if (response.status === 201) {
    // ✅ Thành công → Hiển thị thông báo "Đăng ký thành công, đang kích hoạt..."
    return { success: true, registrationId: result.registrationId };
  }
  if (response.status === 409) {
    // ⚠️ Tài khoản MT5 đã tồn tại
    return { success: false, error: 'Số tài khoản MT5 đã được đăng ký trước đó.' };
  }
  if (response.status === 401) {
    // 🔴 Lỗi API Key — báo cho PVSR Admin ngay
    return { success: false, error: 'Lỗi xác thực hệ thống. Vui lòng liên hệ hỗ trợ.' };
  }
}
```

#### N2.3. UX sau khi submit
- **Thành công (201):** Hiển thị trang "Đăng ký thành công" — thông báo khách hàng chờ kích hoạt trong vòng 24h.
- **Trùng MT5 (409):** Hiển thị lỗi ngay trên form: *"Số tài khoản MT5 này đã được đăng ký. Vui lòng kiểm tra lại."*
- **Lỗi server (5xx):** Hiển thị: *"Hệ thống đang bận, vui lòng thử lại sau."* và **không** retry tự động.

---

### Phase N3 — Dashboard Hiệu Suất (Performance Dashboard)

#### N3.1. Luồng lấy dữ liệu
```
[Người dùng vào trang Dashboard Ninja]
         │
         ▼
[Backend Ninja gọi PVSR Performance API]
  GET /api/v1/partners/ninja_team/performance?accountCode=ACC001
  Header: x-api-key: pvsr_live_xxx
         │
         ▼
[PVSR trả về JSON block hoàn chỉnh]
         │
         ▼
[Backend Ninja nhận JSON, chuyển về Frontend]
         │
         ▼
[Frontend Ninja render Charts/Stats từ JSON]
```

> ⚠️ **Quan trọng:** Backend Ninja nên **cache response** từ PVSR trong **5 phút** (dùng Redis hoặc in-memory cache). Tránh gọi API PVSR mỗi khi user F5 trang → không bị rate limit.

#### N3.2. Mapping JSON → UI Components

Dưới đây là hướng dẫn render từng phần dữ liệu từ JSON PVSR:

**A. Thẻ chỉ số tổng quan (Stats Cards)**
```javascript
// Nguồn: data.advancedStats + data.coreMetrics
const stats = [
  { label: 'Tăng trưởng',    value: `${data.advancedStats.growthPercent}%` },
  { label: 'Lợi nhuận',      value: `$${data.advancedStats.totalNetProfit}` },
  { label: 'Win Rate',       value: `${data.advancedStats.winRatePercent}%` },
  { label: 'Max Drawdown',   value: `${data.advancedStats.maxDrawdownPercent}%` },
  { label: 'Profit Factor',  value: data.advancedStats.profitFactor },
  { label: 'Tổng lệnh',      value: data.advancedStats.totalTrades },
];
```

**B. Biểu đồ đường tăng trưởng (Line/Area Chart)**
```javascript
// Nguồn: data.growthChartArray
// Dùng Recharts / ApexCharts / Chart.js
const chartData = data.growthChartArray.map(point => ({
  date: point.date,                 // Trục X
  balance: point.balance,           // Đường balance
  drawdown: point.drawdownPct,      // Vùng drawdown (optional)
  dailyProfit: point.dailyProfit,   // Bar chart phụ
}));
```

**C. Lịch Heatmap lợi nhuận theo ngày**
```javascript
// Nguồn: data.dailyCalendar
// Render calendar grid, mỗi ô tô màu theo profit:
// profit > 0  → xanh lá (gradient theo độ lớn)
// profit < 0  → đỏ
// profit === 0 → xám (nghỉ / không giao dịch)
const calendarData = Object.entries(data.dailyCalendar).map(([date, val]) => ({
  date,
  profit: val.profit,
  trades: val.tradesCount,
}));
```

**D. Bảng lợi nhuận theo tháng (Monthly Table)**
```javascript
// Nguồn: data.monthlyCalendar
const monthlyRows = Object.entries(data.monthlyCalendar).map(([month, val]) => ({
  month,                  // "2026-01" → format thành "Tháng 1/2026"
  profit: val.profit,
  growthPct: val.growthPct,
}));
```

**E. Biểu đồ tròn phân bổ cặp tiền (Donut/Pie Chart)**
```javascript
// Nguồn: data.instrumentDistribution
const instruments = data.instrumentDistribution.map(item => ({
  name: item.symbol,      // "XAUUSD"
  profit: item.profit,
  winRate: item.winRate,
  trades: item.totalTrades,
}));
```

**F. Thông tin tài khoản (Account Info Card)**
```javascript
// Nguồn: data.accountInfo + data.coreMetrics
// accountInfo.maskedAccountNumber → "123***89" (PVSR đã mask sẵn, hiển thị trực tiếp)
// accountInfo.maskedClientName    → "Ng** V** A"
// accountInfo.status              → "ONLINE" | "OFFLINE"
// coreMetrics.balance             → Số dư hiện tại
```

#### N3.3. Gợi ý thư viện Chart
| Biểu đồ | Thư viện gợi ý |
|---|---|
| Line/Area Chart tăng trưởng | `Recharts` (React) hoặc `ApexCharts` |
| Heatmap Calendar | `react-calendar-heatmap` hoặc tự build grid CSS |
| Donut Chart cặp tiền | `Recharts PieChart` hoặc `Chart.js` |
| Monthly Table | Tailwind/CSS table thuần — không cần thư viện |
| Stats Cards | Component tự build — đơn giản |

---

### Phase N4 — Xử Lý Lỗi & Edge Cases

- [ ] **Tài khoản chưa được kích hoạt:** API trả `status: "PENDING"` → Hiển thị banner "Tài khoản đang được kích hoạt, vui lòng quay lại sau"
- [ ] **Không có dữ liệu giao dịch:** `growthChartArray: []` → Hiển thị empty state "Chưa có lịch sử giao dịch"
- [ ] **Rate limit bị chạm (429):** Implement exponential backoff, không retry ngay lập tức
- [ ] **API PVSR timeout/down:** Hiển thị dữ liệu từ cache cũ nếu có, kèm badge "Dữ liệu cập nhật lúc HH:mm"
- [ ] **JSON field thiếu:** Defensive coding — luôn dùng optional chaining (`data?.advancedStats?.winRatePercent ?? 0`)

---

### Phase N5 — Testing & Go-Live

- [ ] **Unit test:** Mock JSON response từ PVSR → verify từng component render đúng
- [ ] **Integration test:** Gọi PVSR Sandbox API với key test → verify end-to-end flow
- [ ] **Load test:** Simulate 100 user xem Dashboard cùng lúc → verify cache hoạt động đúng
- [ ] **UAT với PVSR:** Demo luồng đăng ký + dashboard với team PVSR trước khi go-live
- [ ] **Go-live:** Bật API Key production, deploy, monitor error rate 24h đầu

---

## ⚠️ 9. Rủi Ro & Giải Pháp

| Rủi Ro | Mức độ | Giải Pháp |
|---|---|---|
| API Key bị lộ | 🔴 Cao | Cho phép revoke & tái tạo key qua Admin, log toàn bộ request theo IP |
| Partner spam đăng ký giả | 🟡 Trung bình | Rate limit + validate MT5 account format trước khi ghi DB |
| Performance API trả data nhầm khách PVSR | 🔴 Cao | Luôn filter `WHERE partner_code = ?` — không bao giờ query `findMany()` không có điều kiện |
| Database quá tải khi partner gọi liên tục | 🟡 Trung bình | Cache 5 phút + rate limit 60 req/min |
| Ninja Website bị hack → lộ endpoint | 🟡 Trung bình | IP Whitelist + x-api-key 2 lớp bảo vệ |

---

## ⚠️ 10. Rủi Ro & Giải Pháp

| Rủi Ro | Mức độ | Giải Pháp |
|---|---|---|
| API Key bị lộ | 🔴 Cao | Cho phép revoke & tái tạo key qua Admin, log toàn bộ request theo IP |
| Partner spam đăng ký giả | 🟡 Trung bình | Rate limit + validate MT5 account format trước khi ghi DB |
| Performance API trả data nhầm khách PVSR | 🔴 Cao | Luôn filter `WHERE partner_code = ?` — không bao giờ query `findMany()` không có điều kiện |
| Database quá tải khi partner gọi liên tục | 🟡 Trung bình | Cache 5 phút + rate limit 60 req/min |
| Ninja Website bị hack → lộ endpoint | 🟡 Trung bình | IP Whitelist + x-api-key 2 lớp bảo vệ |
| Ninja gọi API trực tiếp từ browser | 🔴 Cao | Ninja Team PHẢI route qua Backend — PVSR chặn nếu thiếu server IP trong whitelist |

---

*Bản Quy chuẩn Kỹ thuật Đồng bộ API Đối Tác — Ver 2.1*
*Cập nhật bởi: PVSR Capital Engineering Team — 2026-04-09*
