# Admin — Sync Cloud: Ticket yêu cầu + Đường sync tay cho Admin

> **Trạng thái:** Đã dev (Completed on 2026-09-10)
> **Loại doc:** Implementation plan cho Gemini/Antigravity.
> **Người tạo:** yêu cầu trực tiếp của chủ site (2026-09-10).
> **Nguồn dữ liệu:** đọc trực tiếp `src/actions/support-sync.ts`, `src/actions/admin-sync-requests.ts`, `src/app/api/worker/jobs/pull/route.ts`, `src/app/api/worker/jobs/fail/route.ts`, `tools/tnt-worker/worker.py` (2157 dòng), `prisma/schema.prisma`. Không suy đoán.
>
> **Đọc kèm (bắt buộc):** `AGENTS.md` (7 rules), `design/ui-guide.md`, `docs/PRODUCT.md`, `tools/tnt-worker/README.md`.
>
> **Bộ 4 doc Admin (2026-09-10):** `admin-user-data-coverage-plan.md` · `admin-user-behavior-segmentation-plan.md` · `admin-revenue-pipeline-plan.md` · `admin-user-narrative-summary-plan.md`. **Doc này độc lập với cả 4.**

---

## 1. Vấn đề & quyết định

### 1.1 Hiện trạng

User bấm **Sync Cloud** → tạo `Mt5ImportJob` PENDING → app Python trên laptop/VPS poll về → **ON/OFF MT5** để login bằng investor password (passview) → đọc lịch sử → submit về web.

Chủ site báo: **luồng này không ổn định.** Mong muốn: thêm đường dự phòng — user tạo request gửi support/admin, kèm đủ thông tin (broker, server, account number, passview), để **admin tự login MT5 bằng tay** sync cho user.

### 1.2 Phát hiện quan trọng: 70% đã có sẵn

`SupportSyncTicket` ([schema.prisma:2047](prisma/schema.prisma#L2047)) **đã tồn tại** với đủ field: `broker`, `accountNumber`, `server`, `notes`, `status` (`PENDING|VERIFIED|FAILED|CANCELLED`), `scheduledFor`, `verifiedAt`, `verifiedBy`.

> **Cập nhật 2026-09-10 — chốt hard delete (chủ site xác nhận).** Ticket **bị xoá cứng** khi user huỷ, không dùng soft delete. Hệ quả đã kiểm tra và chấp nhận:
> - `SupportSyncStatus.CANCELLED` **không còn được set ở đâu** trong code — enum vẫn giữ trong schema (không migrate production cho một giá trị thừa), nhưng đừng dùng nó cho luồng mới.
> - `getUserSupportSyncTickets()` là hàm **chỉ đọc** — đã bỏ `deleteMany` dọn ticket CANCELLED (việc dọn trở nên vô nghĩa, và ghi DB từ đường đọc là lỗi).
> - Đã verify **không có FK nào trỏ tới `SupportSyncTicket`** (chỉ 2 chiều đi ra: `User`, `TradingAccount`) và **không có Notification nào link tới ticket** → hard delete không để lại bản ghi mồ côi.
> - **Đánh đổi đã biết:** `SecurityLog` giữ vết `ADMIN_VIEW_CREDENTIAL` cho một ticket có thể không còn tồn tại. Chấp nhận — log bảo mật phải bất biến, và nó vẫn ghi đủ `ticketId`/`accountNumber`/`broker` để truy vết.

Đã có sẵn:
- Action user: `createSupportSyncTicket()`, `getUserSupportSyncTickets()`, `cancelSupportSyncTicket()` ([support-sync.ts](src/actions/support-sync.ts))
- Action admin: `resolveSupportTicketAdmin()` + 4 hàm khác ([admin-sync-requests.ts](src/actions/admin-sync-requests.ts))
- Màn admin: `/admin/ib/sync-requests` ([client.tsx](src/app/admin/ib/sync-requests/client.tsx)), đã có nav ([navigation.ts:227](src/config/navigation.ts#L227))
- Banner "Urgent Support Tickets: 5x Connection Timeouts" ([client.tsx:312](src/app/admin/ib/sync-requests/client.tsx#L312))

### 1.3 Ba lỗ hổng phải bịt

| # | Lỗ hổng | Bằng chứng |
|---|---|---|
| **H1** | `createSupportSyncTicket()` **không được gọi ở đâu cả** — user không có UI để chủ động tạo request. Chỗ duy nhất tạo ticket là khi worker **fail**. | grep `createSupportSyncTicket` toàn repo: chỉ 2 file, cả 2 đều không gọi từ UI. [fail/route.ts:84](src/app/api/worker/jobs/fail/route.ts#L84) là nguồn tạo duy nhất. |
| **H2** | Ticket **không có passview**, và **chặn cứng 4 sàn VIP**. | `CreateSupportSyncInput` ([support-sync.ts:21-27](src/actions/support-sync.ts#L21)) không có field mật khẩu; dòng 39 chặn bằng `isVipEligibleBroker`. |
| **H3** | **Không có đường sync tay cho admin.** Admin chỉ resolve ticket, không login MT5 được. | `resolveSupportTicketAdmin()` ([admin-sync-requests.ts:212](src/actions/admin-sync-requests.ts#L212)) chỉ đổi status → `VERIFIED`. |

### 1.4 Quyết định đã chốt (chủ site xác nhận 2026-09-10)

| Hạng mục | Chốt |
|---|---|
| **Nguồn passview** | **Trỏ vào `TradingAccountCredential` có sẵn** — KHÔNG lưu mật khẩu vào ticket, KHÔNG đổi schema ticket để thêm cột mật khẩu |
| **Phạm vi broker** | **Bỏ chặn 4 sàn VIP.** Lý do chủ site: user free chỉ được tối đa **3 account** ([accounts.ts:238](src/actions/accounts.ts#L238) — đã verify), nên tải bị giới hạn tự nhiên |
| **Phạm vi đợt** | **Làm đầy đủ** — nối dây UI + sửa worker fail-fast + **thêm đường sync tay cho admin** |

---

## 2. Nguồn passview — thiết kế CHỐT

### 2.1 Nguyên tắc

**Ticket không chứa mật khẩu. Ticket chỉ trỏ tới account. Passview đọc từ `TradingAccountCredential`.**

`TradingAccountCredential` ([schema.prisma:1833](prisma/schema.prisma#L1833)) đã lưu passview per-account (`encryptedPassword`, `keyVersion`), do user nhập ở Cloud Sync settings.

### 2.2 Vì sao KHÔNG lưu mật khẩu vào ticket

- **Nhân bản secret:** cùng 1 passview nằm 2 bảng. User đổi ở settings → ticket cũ giữ bản cũ → admin login bằng bản cũ → fail → mất niềm tin vào cả 2.
- **Bảng ticket là log lịch sử:** ticket ở lại vĩnh viễn. Mật khẩu nằm trong log là rò rỉ theo thời gian.
- **Không cần:** credential đã có sẵn ngay cạnh account.

### 2.3 ⚠️ Vấn đề mã hoá — PHẢI XỬ LÝ

Đây là **cạm bẫy nặng nhất trong doc này**, đọc kỹ.

`saveCloudSyncCredentials()` ([cloud-sync.ts:42-55](src/actions/cloud-sync.ts#L42)) lưu mật khẩu với `keyVersion: "plain"` — **KHÔNG mã hoá**. Trong khi `TradingAccountCredential.keyVersion` mặc định là `"v1"` ([schema.prisma:1836](prisma/schema.prisma#L1836)) và worker có nhánh giải mã cho `"v1"` ([jobs/pull/route.ts:69-78](src/app/api/worker/jobs/pull/route.ts#L69)).

Nghĩa là DB hiện có **2 loại bản ghi**:
- `keyVersion === "plain"` → `encryptedPassword` là plaintext thật
- `keyVersion === "v1"` → cần `decryptPassword()` ([lib/crypto](src/lib/crypto))

**Yêu cầu bắt buộc:** hàm đọc passview cho admin **phải xử lý cả 2 nhánh**, theo đúng logic của [jobs/pull/route.ts:67-78](src/app/api/worker/jobs/pull/route.ts#L67). Nếu chỉ đọc thẳng `encryptedPassword` → admin nhận chuỗi mã hoá → login fail → ticket "không work" mà không rõ vì sao.

**Tốt nhất:** tách logic này thành **một hàm dùng chung**, cả worker pull route và đường admin đều gọi — xem mục 5.1.

> **Không được** tự ý migrate toàn bộ `"plain"` → `"v1"` trong đợt này. Đó là thao tác trên secret production, cần kế hoạch riêng và xác nhận riêng. Ghi nhận là nợ kỹ thuật.

### 2.4 Ai được xem passview

- **CHỈ ADMIN.** `TradingAccountCredential` là secret — không lộ cho user khác, không lộ trong API trả về cho non-admin.
- Mọi lần xem passview **phải ghi `SecurityLog`** (bảng đã có, dùng ở `/admin/security`): ai xem, account nào, lúc nào.
- Trên UI admin: passview **ẩn mặc định**, có nút "Hiện" — không hiện thẳng khi load trang (tránh lộ qua screenshot/screen-share).

---

## 3. Luồng nghiệp vụ sau khi sửa

```
[USER]  /dashboard/accounts
   │  Account chưa sync được, hoặc worker fail
   │  → bấm "Request Support Sync"
   ▼
[FORM]  Chọn account có sẵn (hoặc nhập tay broker/server/accountNumber)
   │  Ghi chú: "Lịch sử từ 01/08 đến nay"
   │  ← KHÔNG nhập mật khẩu ở đây
   ▼
[TICKET] SupportSyncTicket { status: PENDING, scheduledFor: null }
   │
   ▼
[ADMIN] /admin/ib/sync-requests → tab "Support Tickets"
   │  Mở ticket → thấy broker/server/accountNumber
   │  → bấm "Hiện passview" (đọc TradingAccountCredential + ghi SecurityLog)
   │  → bấm "Copy thông tin" → dán vào MT5 trên máy mình
   │  → login MT5 bằng tay, tự đọc lịch sử
   ▼
[ADMIN] Quay lại ticket, bấm:
   ├─ "Đã sync xong"  → status VERIFIED, verifiedBy = admin, verifiedAt = now
   └─ "Không sync được" → status FAILED + notes lý do
   │
   ▼
[USER]  Thấy ticket đổi trạng thái + ghi chú của admin
```

### 3.1 Hai điều KHÔNG làm trong luồng này

1. **Admin KHÔNG nhập dữ liệu trade vào hệ thống.** Admin chỉ login MT5 đọc lịch sử, rồi **đánh dấu ticket xong**. Việc đưa dữ liệu vào `JournalEntry` vẫn do worker/EA làm. Lý do: nhập tay hàng trăm lệnh là nguồn sai số khổng lồ, và không có cách nào kiểm chứng.

   > Nếu chủ site muốn admin đẩy được file lịch sử vào hệ thống, đó là **tính năng riêng** (import file MT5), làm sau, cần thiết kế riêng. Ghi ở mục 9.

2. **KHÔNG tự động hoá việc admin login.** Không có "worker trên máy admin". Admin login bằng tay — đó chính là điểm mạnh của đường này.

---

## 4. ⚠️ Sự thật về "chắc chắn work 100%" — PHẢI ĐỌC

Chủ site kỳ vọng đường sync tay "chắc chắn work 100%". Doc này **không hứa điều đó**, và đây là lý do kỹ thuật:

### 4.1 Ba lỗi phổ biến nhất của worker KHÔNG phải lỗi tài khoản

| Mã lỗi | Dòng | Bản chất |
|---|---|---|
| `SERVERS_DAT_PROVISION_FAILED` | [worker.py:726](tools/tnt-worker/worker.py#L726), [:793](tools/tnt-worker/worker.py#L793) | MT5 thiếu catalog sàn (`servers.dat` sơ khai) |
| `MT5_INIT_FAILED` | [worker.py:748](tools/tnt-worker/worker.py#L748), [:807](tools/tnt-worker/worker.py#L807) | IPC treo, MT5 zombie |
| `LOGIN_TIMEOUT_5X` | [worker.py:903](tools/tnt-worker/worker.py#L903) | Không kết nối được trong 5 lần thử |
| `INVALID_CREDENTIALS` | [worker.py:700](tools/tnt-worker/worker.py#L700), [:869](tools/tnt-worker/worker.py#L869) | Passview/account sai — **chỉ cái này là lỗi tài khoản** |

Hàm `ensure_broker_server_available()` chạy **trên máy đang chạy worker**. Admin login tay trên máy admin → **gặp đúng 3 lỗi đầu** nếu máy admin cũng thiếu catalog sàn đó.

### 4.2 Vậy đường admin khác gì?

**Khác ở chỗ: admin biết đường sửa.** Worker gặp `-10005` thì chỉ log hướng dẫn rồi bỏ cuộc ([worker.py:893-898](tools/tnt-worker/worker.py#L893)). Admin đọc hướng dẫn đó và **tự bấm File → Open an Account** trong MT5 → catalog được nạp → login lại thành công.

→ Giá trị thật của đường admin là **"có người biết xử lý"**, không phải "100%". Điều cam kết được là:

> **100% KHÔNG IM LẶNG.** Mọi lần fail đều sinh ticket, có mã lỗi, có người biết. User không bao giờ bị treo ở trạng thái "đang sync" vô tận.

### 4.3 Hệ quả cho UI

Trên màn admin, cạnh mỗi ticket **phải hiện hướng dẫn sửa lỗi tương ứng mã lỗi** (lấy từ log worker). Cụ thể với `LOGIN_TIMEOUT_5X` + `-10005`: hiện đúng 4 bước ở [worker.py:893-898](tools/tnt-worker/worker.py#L893). Đây là thứ biến đường admin từ "thử xem sao" thành "làm được".

---

## 5. Việc phải làm

### 5.1 ⭐ Hàm đọc passview dùng chung

**Tạo:** `src/lib/credentials/investor-password.server.ts`

```
export async function getInvestorPasswordForAccount(accountId: string)
  : Promise<{ ok: true; password: string } | { ok: false; reason: string }>
```

Xử lý **cả 2 nhánh `keyVersion`** theo đúng logic [jobs/pull/route.ts:67-78](src/app/api/worker/jobs/pull/route.ts#L67):
- `"plain"` → dùng thẳng
- `"v1"` → `decryptPassword()`, fallback raw nếu lỗi
- Không có credential → `{ ok: false, reason: "NO_CREDENTIALS" }`

**Sau đó sửa** [jobs/pull/route.ts:67-78](src/app/api/worker/jobs/pull/route.ts#L67) để gọi hàm này — **một nguồn logic duy nhất**. Nếu để 2 chỗ tự xử lý, sớm muộn lệch nhau và worker đọc được passview mà admin thì không (hoặc ngược lại).

### 5.2 Nối UI user — bịt H1

**File:** `src/components/trading-accounts/CloudSyncModal.tsx` (đã đọc — hiện **không** có gì liên quan support sync).

- Thêm khối "Không sync được?" ở cuối modal, có nút mở form request.
- **Tạo mới:** `src/components/trading-accounts/SupportSyncRequestModal.tsx`
  - Chọn account có sẵn từ danh sách (đổ từ `tradingAccounts`) → tự điền `broker`/`server`/`accountNumber`
  - Hoặc nhập tay nếu account chưa có trong hệ thống
  - Ô ghi chú (khoảng thời gian muốn lấy, mô tả lỗi)
  - **KHÔNG có ô mật khẩu** (mục 2.1)
  - Nếu account chưa có credential → hiện cảnh báo: *"Tài khoản này chưa có Investor Password. Vào Cloud Sync settings nhập trước, nếu không admin không sync được."* → đây là **chốt chặn UX** cho nhánh `NO_CREDENTIALS`.
- **Hiển thị danh sách ticket của user** ở `/dashboard/accounts`: status + ghi chú admin. Dùng `getUserSupportSyncTickets()` (đã có).

**Sửa `createSupportSyncTicket()`** ([support-sync.ts:29](src/actions/support-sync.ts#L29)):
- **Bỏ** chặn `isVipEligibleBroker` (dòng 39-44) — quyết định 1.4
- **Bỏ** `scheduledFor = getNextSaturdayBatch()` (dòng 62). Lý do: mục đích ban đầu là gộp batch tối thứ 7, nhưng với đường admin thủ công thì **gom batch không còn nghĩa** — admin xử lý khi rảnh. Đặt `scheduledFor: null` và sắp xếp theo `createdAt`.
  > Nếu chủ site muốn giữ batch tối thứ 7, báo lại — nhưng khi đó phải ghi rõ trên UI cho user biết họ chờ tới cuối tuần.
- Giữ nguyên check trùng ticket PENDING cho cùng account (dòng 47-60) — hợp lý.

### 5.3 Màn admin — bịt H2 + H3

**File:** `src/app/admin/ib/sync-requests/client.tsx` + `src/actions/admin-sync-requests.ts`

**a) Tách 2 khu vực rõ ràng** — hiện tại `pendingTickets` bị nhét trong banner "Urgent" (dòng 304-340), lẫn với job fail:

| Khu vực | Nội dung |
|---|---|
| **Support Tickets** (mới, tab riêng) | Ticket user tự tạo. Sắp theo `createdAt` |
| **Worker Alerts** (giữ, đổi tên) | Ticket tự sinh khi worker fail — banner hiện có |

Đổi tiêu đề banner hiện tại từ *"Urgent Support Tickets: 5x Connection Timeouts"* → *"Worker Alerts: Auto-detected sync failures"*. Lý do: sau khi có ticket user tự tạo, tiêu đề cũ gây hiểu sai (tưởng ticket nào cũng do timeout).

**b) Trong mỗi ticket, hiện:**
- `broker` · `server` · `accountNumber` (đã có)
- Nút **"Hiện passview"** → gọi action mới `getTicketCredentials(ticketId)` → trả passview (ẩn mặc định, mục 2.4)
- Nút **"Copy toàn bộ"** → copy 4 dòng `broker/server/account/passview` để dán
- **Hướng dẫn sửa lỗi** theo `errorCode` (mục 4.3) — với ticket auto-sinh từ worker
- Nút **"Đã sync xong"** (giữ `resolveSupportTicketAdmin`, đổi nhãn cho rõ) và **"Không sync được"** → `status: FAILED` + bắt buộc nhập lý do

**c) Action mới trong `admin-sync-requests.ts`:**

```
export async function getTicketCredentials(ticketId: string)
```
- Check `profile.role === "ADMIN"` (theo đúng pattern 4 hàm đã có trong file này)
- Đọc ticket → lấy `tradingAccountId`
- Gọi `getInvestorPasswordForAccount()` (mục 5.1)
- **Ghi `SecurityLog`** — ai xem, ticket nào, account nào
- Trả `{ success, broker, server, accountNumber, password }` hoặc `{ success: false, error }`

**d) Action mới:** `markTicketFailedAdmin(ticketId, reason)` — set `status: FAILED`, ghi `notes`. Hiện chưa có (chỉ có `resolve` → `VERIFIED`).

### 5.4 Worker — fail-fast cho lỗi không cứu được

**File:** `tools/tnt-worker/worker.py`

Hiện tại: khi `ensure_broker_server_available()` lỗi → **return ngay** (đúng rồi, dòng 722-727, 789-795). Nhưng khi login fail, worker **thử 5 lần**, mỗi lần chờ tới 8 giây + 2 giây nghỉ (dòng 832-883) → user chờ **~50-60 giây** cho một lỗi không thể tự khỏi.

**Sửa:** phân biệt 2 loại lỗi login:

| Loại | Nhận biết | Hành vi |
|---|---|---|
| **Không thể tự khỏi** | `err_code == -10005` (server chưa có trong MT5) | **Dừng ngay sau lần 1**, `report_fail("SERVERS_DAT_PROVISION_FAILED")`, log hướng dẫn File → Open an Account |
| **Tạm thời** | Timeout mạng, server đang bảo trì | Giữ 5 lần thử |

Lý do: `-10005` là lỗi **thiếu catalog sàn**, thử lại 5 lần không bao giờ thành công — nó chỉ làm user chờ lâu hơn.

> **Đây là thay đổi ở file Python, không phải TypeScript.** `npx tsc --noEmit` không kiểm tra được. Phải test thật bằng 1 account ở sàn chưa có trong catalog, hoặc giả lập bằng cách đổi tên server thành rác.

### 5.5 Thông báo

- Khi ticket đổi trạng thái → tạo `Notification` cho user (bảng đã có, dùng ở `/admin/notifications/create`).
- Khi user tạo ticket → thông báo admin. Đã có `notifyAdminsOfSyncFailure()` ([fail/route.ts:100](src/app/api/worker/jobs/fail/route.ts#L100)) — tái dùng hoặc viết biến thể.

---

## 6. Luật bảo mật — BẮT BUỘC

| # | Luật |
|---|---|
| 1 | Passview **không bao giờ** nằm trong payload trả về của API không phải admin |
| 2 | Mọi lần đọc passview **phải** ghi `SecurityLog` — không có ngoại lệ |
| 3 | Trên UI admin: **ẩn mặc định**, bấm mới hiện, không tự ẩn lại sau timeout (admin đang đọc mà mất thì bực) |
| 4 | KHÔNG log passview ra console/server log. Khi log lỗi, che: `****${pw.slice(-2)}` |
| 5 | Bảng `SupportSyncTicket` **không thêm cột mật khẩu** — quyết định 1.4, không được đảo |
| 6 | KHÔNG migrate `keyVersion` "plain" → "v1" trong đợt này (mục 2.3) |
| 7 | KHÔNG ghi DB từ đường **chỉ đọc**. Hàm `get*` phải thuần đọc — không `deleteMany`, không upsert, không bump `updatedAt` |
| 8 | `SecurityLog` là **bất biến** — không xoá log khi xoá ticket. Vết audit phải sống lâu hơn đối tượng nó mô tả |

---

## 7. File cần tạo / sửa

| File | Việc |
|---|---|
| `src/lib/credentials/investor-password.server.ts` | **Tạo** — `getInvestorPasswordForAccount()`, xử lý 2 nhánh keyVersion |
| `src/components/trading-accounts/SupportSyncRequestModal.tsx` | **Tạo** — form tạo ticket (không có ô mật khẩu) |
| `src/components/trading-accounts/CloudSyncModal.tsx` | **Sửa** — thêm nút "Không sync được?" mở form |
| `src/app/dashboard/accounts/page.tsx` | **Sửa** — hiện danh sách ticket của user |
| `src/actions/support-sync.ts` | **Sửa** — bỏ chặn `isVipEligibleBroker`, bỏ `getNextSaturdayBatch` |
| `src/actions/admin-sync-requests.ts` | **Sửa** — thêm `getTicketCredentials()`, `markTicketFailedAdmin()` |
| `src/app/admin/ib/sync-requests/client.tsx` | **Sửa** — tách Support Tickets / Worker Alerts, nút hiện passview, hướng dẫn lỗi |
| `src/app/api/worker/jobs/pull/route.ts` | **Sửa** — dùng hàm dùng chung ở 5.1 |
| `tools/tnt-worker/worker.py` | **Sửa** — fail-fast cho `-10005` (mục 5.4) |
| `docs/FEATURE_SPECS.md` | **Sửa** — cập nhật luồng sync |

**Không** đổi `prisma/schema.prisma` — `SupportSyncTicket` đã đủ field.

---

## 8. Verify & Definition of Done

### 8.1 TypeScript
- `npx tsc --noEmit` → exit 0. **KHÔNG chạy `npm run build`** (AGENTS.md).
- `npm run lint` → sạch.

### 8.2 Python (mục 5.4) — verify riêng
- Test với 1 account ở sàn **chưa có** trong catalog → worker phải **dừng sau lần thử 1**, không phải sau 5.
- Đo thời gian: trước ~50-60s → sau **< 20s**.
- `npx tsc --noEmit` **không** kiểm tra file này — phải chạy worker thật.

### 8.3 Bảo mật — test bắt buộc
- **Gọi `getTicketCredentials()` bằng tài khoản KHÔNG phải admin** → phải trả `Forbidden`, không được lộ passview. Test bằng cách gọi trực tiếp action, không qua UI.
- **Xem passview 1 lần → kiểm tra `SecurityLog`** có bản ghi mới, đúng `userId` admin + đúng account.
- **Kiểm tra không log passview:** grep server log sau khi xem → không được có passview dạng plaintext.

### 8.4 Nghiệp vụ
- Tạo ticket với account **có** credential → admin xem được passview.
- Tạo ticket với account **chưa có** credential → form phải cảnh báo trước khi cho submit; nếu vẫn tạo được thì admin mở ra phải thấy `NO_CREDENTIALS` rõ ràng, **không** phải màn hình trắng.
- Tạo ticket với broker **ngoài 4 sàn VIP** (vd IC Markets) → phải thành công (đã bỏ chặn).
- Tạo 2 ticket cùng account → ticket thứ 2 bị chặn.
- Admin "Đã sync xong" → user thấy status đổi.
- Admin "Không sync được" + lý do → user thấy lý do.

### 8.5 Hồi quy — QUAN TRỌNG
- **Luồng sync tự động qua worker phải còn nguyên.** Sau khi sửa [jobs/pull/route.ts](src/app/api/worker/jobs/pull/route.ts) dùng hàm chung, chạy 1 job thật end-to-end → phải `COMPLETED`.
- Ticket auto-sinh khi worker fail phải vẫn hoạt động ([fail/route.ts:84](src/app/api/worker/jobs/fail/route.ts#L84)).

---

## 9. Ngoài phạm vi — ghi rõ để KHÔNG tự thêm

1. **Không cho admin nhập dữ liệu trade vào hệ thống** (mục 3.1). Đường admin chỉ để *đọc và xác nhận*.
2. **Không tự động hoá login MT5 trên máy admin.**
3. **Không thêm cột mật khẩu vào ticket** (mục 2.1, 6.5).
4. **Không migrate `keyVersion`** (mục 2.3, 6.6).
5. **Không sửa giới hạn 3 account** ([accounts.ts:238](src/actions/accounts.ts#L238)) — quyết định sản phẩm, không thuộc doc này.
6. **Không xây hàng đợi ưu tiên / SLA / phân công admin.** Đợt này ai rảnh người đó làm.
7. **Không đụng `Mt5ImportJob`** ngoài việc đọc.

---

## 10. Thứ tự thực hiện

1. **`investor-password.server.ts`** (5.1) — nền tảng, làm trước. Sửa [jobs/pull/route.ts](src/app/api/worker/jobs/pull/route.ts) gọi hàm chung → **chạy hồi quy 8.5 ngay** để chắc không vỡ luồng cũ.
2. **Sửa `support-sync.ts`** (5.2) — bỏ 2 chặn. Nhỏ.
3. **Action admin** (5.3c, 5.3d) — `getTicketCredentials()` + `markTicketFailedAdmin()` + SecurityLog.
4. **UI user** (5.2) — modal + danh sách ticket.
5. **UI admin** (5.3a, 5.3b) — tách 2 khu, nút hiện passview, hướng dẫn lỗi.
6. **Worker fail-fast** (5.4) — làm cuối vì phải test riêng, không dùng `tsc`.
7. **Thông báo** (5.5).
8. **FEATURE_SPECS.md** + báo cáo theo AGENTS.md RULE 7.

> **Nhắc chủ site:** em không commit. Anh tự commit.
