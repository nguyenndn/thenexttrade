# Admin — Revenue (IB Commission) Pipeline

> **Loại doc:** Implementation plan cho Gemini/Antigravity.
> **Người tạo:** rà soát đường ống doanh thu IB (2026-09-10).
> **Nguồn dữ liệu:** đọc trực tiếp source + `prisma/schema.prisma`. Mọi con số/đường dẫn đã verify.
>
> **Đọc kèm (bắt buộc):** `docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md` (**nguồn chuẩn về mô hình kinh doanh**), `AGENTS.md`, `design/ui-guide.md`.
>
> **Doc liên quan:** `docs/features/admin-user-behavior-segmentation-plan.md` (màn phân loại hành vi — **không phụ thuộc doc này**).
>
> **Trạng thái:** Đã dev

---

## 1. Mô hình kinh doanh — xác nhận từ tài liệu gốc

Trích trực tiếp [docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md:36](docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md#L36):

> "TheNextTrade vận hành theo mô hình **Introducing Broker (IB)** hợp tác với các sàn đối tác được cấp phép (Vantage, Exness, VTMarkets, Ultima Markets). **Người dùng không trả phí đăng ký/khóa học.**"

Và [:48](docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md#L48):

> "**Doanh thu IB chỉ phát sinh khi tài khoản mở qua link IB của mình và giao dịch thật** — mọi chính sách phải bám theo 2 điều kiện này."

**Nghĩa là:** user trả $0. Doanh thu duy nhất = **hoa hồng trên mỗi lot giao dịch** từ tài khoản mở qua IB code của chủ site.

---

## 2. Bảng rate — CHỐT (số thật do chủ site cung cấp)

| Sàn | Commission / lot **XAUUSD (vàng)** |
|---|---|
| VTMarkets | **$17** |
| Vantage | **$17** |
| Ultima Markets | **$17** |
| Exness | **$6** |

> ⚠️ **Cả 4 con số trên là cho VÀNG (XAUUSD).** Các cặp khác (EURUSD, GBPJPY, …) thường có rate rất khác — thường thấp hơn đáng kể. **Chủ site chưa cung cấp rate cho các cặp khác.**
>
> → Hệ quả: nếu hệ thống chỉ có 1 rate cho mọi symbol, **mọi user trade forex (không phải vàng) sẽ bị tính sai**. Xem mục 3 để biết cách xử lý.

### 2.1 Vì sao chênh lệch $17 vs $6 quan trọng

Cùng 10 lot/tháng:
- user Vantage → **$170**
- user Exness → **$60**

Chênh **~2.8 lần**. Nếu màn hình nào xếp hạng user theo *số lot* mà không nhân rate theo sàn, nó coi hai user này **ngang nhau** — sai gần 3 lần. Đây là lý do **bắt buộc** phải có rate theo sàn.

---

## 3. Trạng thái hiện tại — đường ống đang ĐỨT ở đâu

Chuỗi doanh thu gồm 4 mắt. Hiện trạng:

### Mắt 1 — Sàn biết account nào là của mình → ❌ **ĐỨT**

`EABroker.ibCode` ([schema.prisma:709](prisma/schema.prisma#L709)) là mã IB của chủ site ở từng sàn. Nhưng đây là cờ **cấp SÀN**, không phải cấp **tài khoản**.

Hệ quả: user mở tài khoản Vantage **không qua link** chủ site, cắm vào web, trade 20 lot/tháng → hệ thống vẫn đếm 20 lot, coi như có doanh thu. Thực tế chủ site nhận **$0**.

`isVipEligible` ([schema.prisma:711](prisma/schema.prisma#L711)) cũng chỉ là cờ cấp sàn.

**[docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md:62](docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md#L62)** đã tự cảnh báo điều này và yêu cầu metric *"tỷ lệ active-ngoài-IB"* — **metric đó chưa được code**.

### Mắt 2 — Biết mỗi lot trả bao nhiêu → ❌ **ĐỨT**

`EABroker.commissionPerLot` ([schema.prisma:711](prisma/schema.prisma#L711)) là `Float?` **nullable**, và:
- **Chưa bao giờ được ghi giá trị** — không có trong [seed-ea-brokers.ts](prisma/seed-ea-brokers.ts) (chỉ seed `ibCode` + `affiliateUrl`)
- **Không có UI nhập** — `createEABroker`/`updateEABroker` ([brokers/actions.ts:37-99](src/app/admin/trading-systems/brokers/actions.ts#L37-L99)) **không có field này**
- Chỉ xuất hiện ở 4 chỗ toàn repo: schema, migration, 1 lần đọc trong [ib-snapshot.service.ts:144](src/lib/services/ib-snapshot.service.ts#L144), và 1 prop hardcode

**Hệ quả trực tiếp:** công thức duy nhất `estimatedIbRevenue = closedLotVolume × commissionPerLot` ([ib-snapshot.service.ts:148-150](src/lib/services/ib-snapshot.service.ts#L148-L150)) → vì `commissionPerLot` luôn NULL → **`estimatedIbRevenue` luôn = 0 cho mọi user, mọi kỳ.**

Chỗ duy nhất đọc con số đó là `RevenueOpportunityPanel` → đang hiện tổng doanh thu **$0**.

**Con số `$6.0/lot` hiển thị ở `/admin/ib`** (IbTargetTrackerHero) là **hardcode trong JSX** ([ib/client.tsx:279-284](src/app/admin/ib/client.tsx#L279-L284)) — hoàn toàn tách rời database. Thanh "target revenue $10,000" đang tính bằng hằng số không có thật.

### Mắt 3 — Đếm đúng số lot → ❌ **ĐỨT**

[admin/page.tsx:72](src/app/admin/page.tsx#L72):
```ts
prisma.journalEntry.aggregate({ _sum: { lotSize: true } }),
```
Cộng **toàn bộ** `lotSize`, không lọc `syncSource`, không lọc broker. **Kể cả lệnh user tự gõ tay trên web** (`syncSource: "MANUAL"`) — lệnh này không phải giao dịch thật ở sàn, không sinh com.

→ Con số "Volume" trên dashboard admin **lớn hơn** con số thật.

**Điểm sáng duy nhất:** [pro-access.ts:274-299](src/lib/pro-access.ts#L274-L299) **đã lọc đúng**:
- `syncSource ∈ VALID_SYNC_SOURCES`
- `isEligibleBrokerAccount` check
- `normalizeLotSize(rawLots, isCent)` xử lý tài khoản cent

→ **Đây là logic phải tái dùng**, không viết lại.

### Mắt 4 — Đối chiếu với tiền sàn trả → ❌ **CHƯA CÓ**

Không có bảng nào ghi tiền **thực nhận**. Có một luồng import CSV thủ công: [POST /api/admin/ib/import](src/app/api/admin/ib/import/route.ts#L41) → [ib-import.service.ts:209](src/lib/services/ib-import.service.ts#L209), chờ các cột `account_number, broker, lots, commission, trades, period`. Đây là **cách duy nhất** tiền com thật từng vào được DB.

> **Lưu ý:** `IbActivitySnapshot` có `@@unique([userId, periodStart, periodEnd])` — **không có chiều account**. Một user có nhiều account sẽ bị gộp vào 1 row. Importer có xử lý ([ib-import.service.ts:230-251](src/lib/services/ib-import.service.ts#L230)) nhưng đây là hạn chế thiết kế cần biết.

### Việc phụ — cron có thể không chạy

[api/cron/ib-snapshots/route.ts](src/app/api/cron/ib-snapshots/route.ts) viết đúng (có `CRON_SECRET` guard, gọi `generateActivitySnapshots()`), nhưng **`vercel.json` không có mảng `crons`** — chỉ có `headers`. Nghĩa là lịch chạy nằm ngoài repo này. **Phải xác minh trước khi tin vào `IbActivitySnapshot`.**

---

## 4. ⚠️ Hạn chế nghiêm trọng của `TradingAccount`

**KHÔNG có cờ real/demo.** Model ([schema.prisma:383-454](prisma/schema.prisma#L383)) không có `isDemo`, không có `isReal`, không có enum. Chỉ có:
- `accountType String @default("PERSONAL") @db.VarChar(30)` — **chuỗi tự do, không ràng buộc**
- `server String?`

→ Việc phân biệt demo/real phải suy ra trong code: [capital.server.ts:19-24](src/lib/admin/ib/capital.server.ts#L19-L24) `isDemoTradingAccount()` = `accountType` chứa `DEMO` **hoặc** `server` chứa `demo`.

**Cũng KHÔNG có `isActive`.** Trạng thái sống là `status String @default("PENDING")` — **KHÔNG phải enum**, nên không ràng buộc giá trị. Các giá trị thấy trong code: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `SUSPENDED`, `CONNECTED`, `SYNCING`.

**[capital.server.ts:26-44](src/lib/admin/ib/capital.server.ts#L26-L44)** `isLiveCapitalAccount()` — loại `PENDING`/`REJECTED`/`SUSPENDED`/demo, yêu cầu `REAL`|`PERSONAL`|`FUNDED`. **Dùng hàm này, đừng tự viết điều kiện.**

---

## 5. Kế hoạch — 5 bước

### BƯỚC 1 — Rate theo sàn × symbol (nền tảng của mọi thứ)

**Vấn đề cần chủ site quyết:** rate chỉ có cho vàng. Cần cơ chế cho các cặp khác.

**Thiết kế đề xuất** (chủ site cần duyệt trước khi code):

Thêm model `BrokerCommissionRate`:
```prisma
model BrokerCommissionRate {
  id            String   @id @default(uuid())
  brokerId      String                    // FK → EABroker
  symbol        String   @db.VarChar(30)  // "XAUUSD" | "EURUSD" | "*" (mặc định)
  commissionPerLot Float
  currency      String   @default("USD") @db.VarChar(10)
  effectiveFrom DateTime @default(now()) @db.Timestamptz(6)
  createdAt     DateTime @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @db.Timestamptz(6)

  broker EABroker @relation(fields: [brokerId], references: [id], onDelete: Cascade)

  @@unique([brokerId, symbol, effectiveFrom])
  @@index([brokerId, symbol])
  @@map("broker_commission_rates")
}
```

**Tra rate:** tìm `(brokerId, symbol)` chính xác trước → nếu không có, fallback về `(brokerId, "*")`.

**Vì sao có `effectiveFrom`:** rate thay đổi theo thời gian (sàn đổi chính sách). Không có nó, mọi tính toán lịch sử sẽ sai khi rate đổi. Nếu chủ site thấy phức tạp, có thể bỏ ở đợt đầu — nhưng phải biết là sau này thêm vào sẽ phải migrate dữ liệu.

**UI:** thêm tab "Commission Rates" trong `/admin/trading-systems/brokers` — bảng nhập rate theo sàn, có ô symbol. Sửa [brokers/actions.ts:37-99](src/app/admin/trading-systems/brokers/actions.ts#L37-L99) thêm server action `upsertCommissionRate` + ghi `AuditLog`.

**Seed giá trị thật:** vtmarkets=`$17`, vantage=`$17`, ultima=`$17`, exness=`$6` cho `XAUUSD`.

**Verify:** `npx tsc --noEmit`; nhập rate cho 1 sàn, reload, giá trị còn đúng.

---

### BƯỚC 2 — Đánh dấu account thuộc IB ở cấp TÀI KHOẢN

**⚠️ ĐÂY LÀ CÂU HỎI CHƯA CÓ LỜI ĐÁP — CHỦ SITE PHẢI QUYẾT TRƯỚC KHI CODE.**

Vấn đề: làm sao biết một tài khoản cụ thể được mở qua IB code của chủ site?

Ba khả năng:
- **(a) Tick thủ công** — chủ site đối chiếu portal của sàn rồi tick trong web. Chính xác nhất, tốn công.
- **(b) Suy từ `IbLead`** — user đã click link affiliate + `convertedAt` != null. Có sẵn dữ liệu ([schema.prisma:1190-1212](prisma/schema.prisma#L1190)), nhưng **click link không đảm bảo** đã dùng đúng link đó để mở tài khoản.
- **(c) Suy từ `SupportSyncTicket`** — [schema.prisma:2024](prisma/schema.prisma#L2024), có `status` + `verifiedBy` + `verifiedAt`. Ticket `VERIFIED` nghĩa là admin đã xác minh tài khoản → **đây là bằng chứng mạnh nhất hiện có**.

**Đề xuất:** thêm 3 field vào `TradingAccount`:
```prisma
ibAttribution        String   @default("UNKNOWN") @db.VarChar(20)  // CONFIRMED | LIKELY | UNKNOWN | NOT_OURS
ibAttributionSource  String?  @db.VarChar(30)                      // MANUAL | IB_LEAD | SYNC_TICKET
ibAttributionAt      DateTime? @db.Timestamptz(6)
ibAttributionBy      String?  @db.Uuid
```

**Đây là thay đổi schema — cần chủ site duyệt rõ ràng.** Không tự thêm.

**Trước khi code, phải làm:** đo xem hiện có bao nhiêu account rơi vào mỗi nguồn (a/b/c) bằng script `.cjs` đọc DB. Nếu nguồn (b) và (c) bao phủ được phần lớn → không cần tick thủ công nhiều.

---

### BƯỚC 3 — Sửa mọi con số lot/volume phải lọc nguồn

**Tái dùng [pro-access.ts:274-299](src/lib/pro-access.ts#L274-L299)** — đã lọc đúng. Trích logic ra thành hàm dùng chung:

```ts
// src/lib/admin/ib/eligible-volume.server.ts (MỚI)
export const ELIGIBLE_SYNC_SOURCES = ["EA_SYNC", "EA_HISTORY", "SUPPORT_SYNC", "CLOUD_WORKER"] as const;

export function buildEligibleJournalWhere(opts: {
  userIds?: string[];
  since?: Date;
  until?: Date;
}): Prisma.JournalEntryWhereInput
```

Sau đó **thay thế/toàn bộ** các chỗ đang đếm lot không lọc:

| File | Dòng | Hiện tại | Sửa thành |
|---|---|---|---|
| [admin/page.tsx](src/app/admin/page.tsx#L72) | 72 | `_sum.lotSize` toàn bộ | dùng `buildEligibleJournalWhere()` |
| [ib-lead.ts](src/actions/ib-lead.ts#L277) | 277-286 | 2 aggregate không lọc | dùng helper |
| [ib-monitor.server-v2.ts](src/lib/admin/ib/ib-monitor.server-v2.ts#L283) | 283 | `groupBy` không lọc | dùng helper |

> **⚠️ Không được chỉ sửa 1 chỗ.** Đây là lý do phải viết helper dùng chung — sửa rải rác sẽ khiến các màn hiển thị số khác nhau cho cùng một user, và chủ site mất niềm tin vào toàn bộ dashboard.

**Sau khi sửa, số trên dashboard SẼ GIẢM** (vì bỏ lệnh gõ tay). Đây là điều đúng, không phải lỗi. Phải nói rõ với chủ site trước khi deploy.

**Verify:** script `.cjs` so sánh tổng lot cũ vs mới; độ chênh lệch phải giải thích được (đúng bằng số lot từ lệnh `MANUAL`).

---

### BƯỚC 4 — Tính doanh thu ước tính đúng

Sau 3 bước trên, `estimatedIbRevenue` mới có nghĩa. Sửa [ib-snapshot.service.ts:148-150](src/lib/services/ib-snapshot.service.ts#L148-L150):

```ts
// HIỆN TẠI (chỉ 1 rate, luôn NULL)
estimatedIbRevenue = closedLotVolume * brokerConfig.commissionPerLot

// SỬA THÀNH (rate theo symbol, chỉ tính account thuộc IB)
// Gom lot theo (broker, symbol) → nhân rate tương ứng → chỉ cộng account ibAttribution="CONFIRMED"
```

**Phải ghi rõ trên UI là "Estimated"** — đây là ước tính từ lot × rate, không phải số sàn đã trả. [docs/FEATURE_CATALOG.md:120](docs/FEATURE_CATALOG.md#L120) đã có quy tắc: `/admin/users/[id]` — *"Must avoid: Est. IB revenue without API evidence"*.

**Cùng lúc, sửa 2 chỗ hardcode:**
- [ib/client.tsx:279-284](src/app/admin/ib/client.tsx#L279-L284) — đọc `commissionPerLot` + target từ cấu hình, không hardcode
- [IbTargetTrackerHero.tsx:22](src/components/admin/ib/IbTargetTrackerHero.tsx#L22) — bỏ default `6.0`

---

### BƯỚC 5 — Metric "tỷ lệ active-ngoài-IB" (đã được yêu cầu từ trước)

[docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md:64](docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md#L64) yêu cầu theo dõi *"tỷ lệ active-ngoài-IB"* — **chưa được code**. Sau bước 2, metric này tính được:

```
tỷ lệ active-ngoài-IB = (số user active có account ibAttribution != "CONFIRMED")
                      / (tổng số user active)
```

Hiển thị ở `/admin/reports` (thêm vào panel có sẵn) hoặc `/admin/ib`. Đây là chỉ số cảnh báo: tỷ lệ cao = nhiều user đang trade mà chủ site **không nhận được com**.

---

## 6. ⚠️ Điều KHÔNG được làm

### 6.1 KHÔNG hiển thị doanh thu như số chắc chắn

Luôn ghi "Estimated". Không có API nào xác nhận tiền sàn trả. Chênh lệch giữa ước tính và thực nhận có thể đến từ: clawback, active-client tối thiểu, rate thay đổi, account không thuộc IB.

### 6.2 KHÔNG dùng `estimatedIbRevenue` khi chưa xong bước 1+2

Nếu Gemini đọc doc này rồi đi build màn doanh thu **trước** khi có rate và IB attribution, nó sẽ hiển thị **$0** hoặc số sai. Thứ tự 5 bước là bắt buộc.

### 6.3 KHÔNG tự thêm field vào `TradingAccount`

Bước 2 là **thay đổi schema** — cần chủ site duyệt rõ ràng trước. Không tự ý chạy migration.

### 6.4 KHÔNG dùng `VipRequest.balance`

`String @db.VarChar(50)`, user tự khai, chưa xác minh. Dùng `TradingAccount.fundingAmount` ([schema.prisma:446-449](prisma/schema.prisma#L446)) — đã verify.

### 6.5 KHÔNG dùng `IbActivitySnapshot` làm nguồn lot toàn cục

Chỉ chứa user có `ProEntitlement` ACTIVE/GRACE ([ib-snapshot.service.ts:53](src/lib/services/ib-snapshot.service.ts#L53)). User free không có row.

### 6.6 KHÔNG tự commit / không chạy `npm run build`

---

## 7. Verify & Definition of Done

- `npx tsc --noEmit` → exit 0
- `npm run lint` → pass
- Migration chạy được, **có backup trước** (script `.cjs` dump dữ liệu liên quan ra JSON timestamp)
- Rate đã seed đúng: kiểm tra bằng script `.cjs` đọc DB — vtmarkets/vantage/ultima = 17, exness = 6, symbol = XAUUSD
- Tổng lot sau khi lọc **nhỏ hơn hoặc bằng** trước; độ chênh khớp với tổng lot lệnh `MANUAL`
- `estimatedIbRevenue` **khác 0** với ít nhất 1 user test có account CONFIRMED
- Mọi chỗ hiển thị doanh thu đều có chữ "Estimated"
- Không còn hardcode `6.0` trong bất kỳ file `.tsx` nào

---

## 8. Thứ tự & phụ thuộc

```
BƯỚC 1 (rate)  ──┐
                 ├──→ BƯỚC 4 (tính doanh thu) ──→ BƯỚC 5 (metric ngoài-IB)
BƯỚC 2 (IB attr)─┘
BƯỚC 3 (lọc lot) ──── độc lập, làm song song được
```

**Bước 3 độc lập** — có thể làm ngay, không chờ bước 2 (là bước cần chủ site quyết). Nếu chủ site chưa quyết được cách xác định IB attribution, **làm bước 3 trước** vì nó sửa một lỗi đang tồn tại (số lot sai).

---

## 9. Tóm tắt để không hiểu sai

| Chốt | Nội dung |
|---|---|
| Mô hình | IB — user trả $0, doanh thu = com/lot từ account mở qua link IB |
| Rate | VTMarkets/Vantage/Ultima = $17/lot vàng · Exness = $6/lot vàng |
| Chưa có | Rate cho cặp khác vàng — **cần chủ site cung cấp** |
| Hiện trạng | `estimatedIbRevenue` luôn = 0; lot không lọc nguồn; không biết account nào thuộc IB |
| Thứ tự | Rate → IB attribution (cần duyệt schema) → lọc lot → tính doanh thu → metric ngoài-IB |
| Bước 3 | **Làm được ngay**, độc lập, sửa lỗi đang tồn tại |
| Bước 2 | **Cần chủ site duyệt** vì đổi schema |
| Không làm | Hiển thị doanh thu như số chắc chắn; tự thêm field; tự commit |
