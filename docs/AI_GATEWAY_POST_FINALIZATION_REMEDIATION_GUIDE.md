# Chỉ thị xử lý các vấn đề còn lại sau Finalization Review

> Tài liệu này là phần bổ sung bắt buộc sau `GEMINI_AI_GATEWAY_FINALIZATION_GUIDE.md`. Gemini phải luôn bám sát từng task trong tài liệu này, không được bỏ qua test, không được tự mở rộng phạm vi và tuyệt đối không được in bất kỳ API key thật nào vào source, terminal output, ảnh chụp hoặc báo cáo.

## 1. Mục đích

Sau khi kiểm tra độc lập source website và Trade Manager, các phần chính đã hoạt động:

```text
Website TypeScript          : PASS
AI Gateway/Admin lint       : PASS
Vitest                      : PASS - 19 files, 87 tests
Next.js production build    : PASS - 176/176 pages
Trade Manager compile       : PASS - 0 errors, 0 warnings
Runtime Health              : online
Database                    : online
DeepSeek provider           : online
Routable model              : 1
```

Website đã gọi DeepSeek thành công. Database có ba request thử nghiệm bằng script:

```text
1 request  : COMPLETED, action WAIT
2 requests : REJECTED bởi SAFETY_REJECTED
Provider   : DeepSeek trả HTTP 200
```

Tuy nhiên, chưa được kết luận toàn bộ luồng production đã final vì còn các vấn đề:

1. Sync API Key đã xuất hiện dưới dạng plaintext trong scratch script.
2. Token đã lộ vẫn còn hiệu lực tại thời điểm kiểm tra.
3. Routing policy đang có fallback bị disable.
4. Request attempt logging đang sai thứ tự quan sát.
5. Route/integration tests chưa đủ theo finalization guide.
6. Ba request thật được gửi từ script EURUSD, chưa phải từ Trade Manager trên XAUUSD.

## 2. Giải thích chính xác về sự cố token bị lộ

### 2.1. Token nào bị lộ?

Token bị lộ là:

```text
User.syncApiKey
```

Định dạng nhận diện:

```text
tnt_<48 ký tự hex>
```

Đây là **Sync API Key dùng giữa Trade Manager/TNT Connect và website**.

Đây **không phải**:

- DeepSeek API key.
- OpenAI API key.
- Google/Gemini API key.
- Mật khẩu đăng nhập website.
- Supabase service role key.
- `ENCRYPTION_SECRET`.

Rotate Sync API Key không làm thay đổi provider API key được quản lý tại `/admin/ai/providers`.

### 2.2. Token đã xuất hiện ở đâu?

Trong quá trình Gemini kiểm thử, token thật đã được hardcode nguyên văn trong file:

```text
C:\laragon\www\gsn-crm\scratch_check_final.ts
```

File này dùng token để gọi:

```http
GET /api/v1/ai/usage
Authorization: Bearer <SYNC_API_KEY>
```

Một file khác cũng có hành vi không an toàn:

```text
C:\laragon\www\gsn-crm\scratch_test.ts
```

File `scratch_test.ts`:

- Đọc `syncApiKey` thật từ database.
- In token ra terminal bằng `console.log`.
- Có nhánh tự gán một token test vào user đầu tiên nếu chưa tìm thấy key.
- Gửi request AI thật bằng token lấy từ database.

File thứ ba:

```text
C:\laragon\www\gsn-crm\scratch_patch.ts
```

File này không làm lộ token nhưng tạo routing policy trực tiếp trong database, bỏ qua validation của Admin action.

Ba file scratch trên đã được xóa khỏi source trong lần review độc lập.

### 2.3. Token có bị public lên Internet hay bị hacker lấy không?

Hiện **không có bằng chứng** cho thấy:

- Token đã được commit lên Git.
- Token đã được push lên GitHub/GitLab.
- Token đã được gửi cho bên thứ ba.
- Website đã bị xâm nhập.
- Có người lạ sử dụng token.

Tại thời điểm phát hiện, các file scratch là file local chưa được Git track.

Vì vậy, cách diễn đạt chính xác là:

```text
Token đã bị exposed trong plaintext local source và có khả năng xuất hiện trong terminal/log.
```

Không nên khẳng định:

```text
Website đã bị hack hoặc token đã bị public.
```

Tuy nhiên, secret đã xuất hiện ở nơi không được phép thì phải coi là **compromised**. Không thể chứng minh chắc chắn mọi terminal buffer, tool output, clipboard hoặc log đều đã được xóa. Do đó token bắt buộc phải rotate.

### 2.4. Token này có quyền làm gì?

`User.syncApiKey` đang được dùng để xác thực các nhóm chức năng:

```text
POST /api/v1/ai/analyze
GET  /api/v1/ai/usage
POST /api/sync/trades
POST /api/sync/connect
POST /api/sync/heartbeat
GET  /api/sync/config
```

Tùy endpoint và payload, người có token có thể:

- Gọi AI Analyze dưới danh nghĩa user.
- Tiêu hao quota AI của user.
- Đọc thông tin quota AI.
- Giả lập client đồng bộ.
- Gửi dữ liệu trade sync nếu vượt qua validation của endpoint.
- Gọi heartbeat/config cho kết nối sync.

Token này không tự động cấp quyền đăng nhập giao diện website, nhưng phạm vi sync và AI đủ quan trọng để phải rotate ngay.

### 2.5. Trạng thái token tại thời điểm review

Database check chỉ trả kết quả boolean, không in token:

```text
Compromised Sync API Key still active: true
```

Điều này có nghĩa token cũ vẫn có thể xác thực request cho đến khi được revoke hoặc regenerate.

## 3. Task 1 - Rotate Sync API Key

### 3.1. Quy tắc bắt buộc

Gemini phải:

1. Không in token cũ hoặc token mới vào chat, log hay tài liệu.
2. Không hardcode token trong script test.
3. Không query token rồi `console.log`.
4. Không tự rotate trước khi chủ dự án xác nhận thời điểm, vì key cũ sẽ mất hiệu lực ngay.
5. Không nhầm nút regenerate legacy Trading Account API Key với Unified Sync API Key.

### 3.2. Vị trí rotate đúng

Đăng nhập website bằng đúng user sở hữu Trade Manager và mở:

```text
/dashboard/settings/sync-settings
```

Khu vực đúng có tiêu đề:

```text
Sync API Key
```

Luồng API phía sau:

```http
DELETE /api/sync/api-key
POST   /api/sync/api-key
```

Quy trình:

1. Tạm dừng Auto Sync/Auto Scan trên EA nếu đang chạy.
2. Bấm revoke Sync API Key cũ.
3. Tạo Sync API Key mới.
4. Chỉ hiển thị key mới tại giao diện quản trị an toàn.
5. Cập nhật key mới vào Trade Manager:

```text
Input name : InpSyncApiKey
UI         : tab SYNC, ô API Key
```

6. Không chụp ảnh chứa toàn bộ key.
7. Không lưu key trong `.mq5`, `.md`, `.ts` hoặc Git.
8. Khởi động lại EA hoặc thực hiện reconnect/sync theo luồng hiện tại.
9. Chỉ bật lại Auto Scan sau khi heartbeat và AI usage hoạt động.

### 3.3. Test bắt buộc sau rotate

Không in token trong output. Chỉ báo status code và error code.

```text
Old token -> GET /api/v1/ai/usage    -> 401 INVALID_LICENSE
Old token -> POST /api/v1/ai/analyze -> 401 INVALID_LICENSE
New token -> GET /api/v1/ai/usage    -> 200
New token -> sync heartbeat/connect  -> success
```

Database proof:

```text
syncApiKeyCreatedAt đã thay đổi
old token match count = 0
new token match count = 1
```

Không đưa giá trị token vào report.

### 3.4. Dọn dấu vết local

Sau khi rotate:

1. Xác nhận ba file `scratch_*.ts` không còn tồn tại.
2. Kiểm tra Git status không có scratch script.
3. Kiểm tra source không có chuỗi token định dạng `tnt_...`.
4. Xóa log test local có chứa token nếu xác định được.
5. Không chỉnh sửa lịch sử Git nếu token chưa từng được commit.
6. Nếu phát hiện token đã từng commit/push, phải rotate trước rồi xử lý Git history riêng.

## 4. Task 2 - Chỉnh routing policy

### 4.1. Hiện trạng

Policy runtime hiện tại:

```text
Name         : DeepSeek Primary
Mode         : AUTO_FAILOVER
Primary      : deepseek-chat
Fallback     : một model Google/Gemini
Max Attempts : 2
Timeout      : 30000 ms
```

Nhưng provider Google đang:

```text
enabled = false
```

Health hiện trả `online` vì DeepSeek routable, nhưng có diagnostic:

```text
PROVIDER_DISABLED: Provider is disabled
```

### 4.2. Phương án khuyến nghị hiện tại

Trong giai đoạn chỉ sử dụng DeepSeek, chuyển policy sang:

```text
Mode         : FIXED
Primary      : deepseek-chat
Fallback     : []
Max Attempts : 1
Timeout      : 30000 ms
```

Thực hiện qua:

```text
/admin/ai/routes
```

Không chạy SQL hoặc scratch script để tạo policy trực tiếp.

### 4.3. Khi nào mới dùng AUTO_FAILOVER?

Chỉ dùng khi provider fallback đã đủ:

- Provider enabled.
- Base URL HTTPS hợp lệ.
- Model enabled.
- Credential được mã hóa bằng secret hiện tại.
- Credential đã Test.
- Credential đã Activate.
- `testedAt != null`.
- `activatedAt != null`.
- Health resolver xác nhận routable.
- Adapter test và provider router test đều pass.

### 4.4. Test bắt buộc

Với policy FIXED:

```text
Health status             : online
policy_configured         : true
routable_models           : 1
skipped_models            : []
Request actual attempts   : 1
Primary model             : deepseek-chat
fallback_used             : false
```

## 5. Task 3 - Sửa thứ tự và ý nghĩa attempt logging

### 5.1. Lỗi hiện tại

Trong `provider-router.ts`, code đang tạo attempts từ toàn bộ `plan.skipped` trước:

```ts
const attempts = plan.skipped.map(...)
```

Sau đó mới gọi provider candidates:

```ts
for (const candidate of plan.candidates) { ... }
```

Hậu quả với policy hiện tại:

```text
Attempt 1 : Google fallback - FAILED - PROVIDER_DISABLED - latency 0
Attempt 2 : DeepSeek primary - SUCCESS - HTTP 200
```

Timeline này gây hiểu nhầm rằng Gateway thử Google trước DeepSeek, trong khi DeepSeek là primary.

Nghiêm trọng hơn, nếu primary thành công thì fallback không cần được xem là một provider attempt của request đó.

### 5.2. Hành vi đúng

Phân biệt hai khái niệm:

```text
Routing diagnostic
  Trạng thái sẵn sàng của tất cả model/provider trong policy.

Request attempt
  Provider/model thực sự được gọi hoặc thực sự được xét sau khi attempt trước thất bại.
```

Quy tắc:

1. Primary thành công thì request chỉ có một attempt thành công.
2. Fallback không được ghi attempt nếu chưa cần dùng.
3. Primary thất bại transient thì ghi primary attempt thất bại, sau đó mới xét fallback.
4. Nếu fallback disabled tại thời điểm cần fallback, ghi skip/failure sau primary.
5. `attemptNumber` phải đúng thứ tự execution thực tế.
6. `fallback_used=true` chỉ khi có ít nhất một provider call thất bại trước provider call thành công sau đó.
7. Health vẫn có thể hiển thị toàn bộ routing diagnostic độc lập với request attempts.

### 5.3. Hướng sửa đề xuất

Không prepend `plan.skipped` vào request attempts.

Resolver nên trả cấu trúc giữ đúng thứ tự policy, ví dụ:

```ts
type ExecutionStep =
  | { kind: "candidate"; candidate: ResolvedExecutionCandidate }
  | { kind: "skipped"; diagnostic: SkippedExecutionCandidate };
```

Router duyệt `steps` theo thứ tự và dừng ngay khi có success. Diagnostic chưa được đi tới không trở thành request attempt.

Không bắt buộc dùng đúng type trên nếu có thiết kế tương đương, nhưng hành vi và test phải đúng.

### 5.4. Regression tests bắt buộc

- Primary success: một attempt, attempt 1 là primary.
- Primary transient failure + fallback success: hai attempts đúng thứ tự.
- Primary auth failure: không fallback nếu policy cấm.
- Primary failure + fallback disabled: primary attempt trước, fallback diagnostic sau.
- Disabled fallback không xuất hiện trong attempts khi primary đã success.
- `fallback_used` false cho primary success.
- `fallback_used` true cho fallback success sau primary provider call thất bại.
- Quota chỉ tính provider call thực tế, không tính diagnostic latency 0.

## 6. Task 4 - Bổ sung route và integration tests

### 6.1. Thiếu sót hiện tại

Các route test mới chỉ kiểm tra một phần:

```text
Analyze : thiếu token, token sai, snapshot thiếu symbol
Usage   : thiếu token, token sai
Health  : no policy/degraded và candidate/online
```

Chưa đủ tiêu chí của finalization guide.

### 6.2. Analyze route tests bắt buộc

- Thiếu Bearer token -> `401 INVALID_LICENSE`.
- Token sai -> `401 INVALID_LICENSE`.
- Snapshot invalid -> `400 SNAPSHOT_INVALID`.
- Request ID duplicate -> `409`, provider adapter không được gọi.
- Quota exceeded -> `429`, provider adapter không được gọi.
- Gateway success -> persist `AiRequest`, `AiRequestAttempt`, response schema đúng.
- Provider failure -> request `FAILED`, có `completedAt` và error code.
- Safety rejection -> request `REJECTED`, action WAIT.
- Attempt metadata lưu credential/model/provider IDs, latency, token và finish reason.
- Error redaction không chứa fake secret.
- Outer exception không để request kẹt ở `ROUTING`.

### 6.3. Usage route tests bắt buộc

- Thiếu/sai token -> `401`.
- User Free -> limit 10 và remaining đúng.
- User Pro -> limit 100 và remaining đúng.
- Usage dùng cùng quota service với Analyze.
- Request không gọi provider không bị tính quota sau khi kết thúc.

### 6.4. Health route tests bắt buộc

- Database offline -> HTTP 503, `database=offline`.
- Không policy -> degraded.
- Credential invalid/decrypt fail -> degraded.
- Provider disabled -> degraded hoặc fallback hợp lệ theo resolver.
- Candidate hợp lệ -> online.
- Public response không chứa credential/API key.

### 6.5. Credential/Admin tests bắt buộc

- Add credential tạo `DRAFT`.
- Test success chuyển sang `TESTED`.
- Activate chỉ nhận `TESTED`.
- Activate/revoke cũ trong transaction.
- Rotate không revoke key cũ trước khi key mới active.
- Test thất bại không làm provider online giả.

### 6.6. Quy tắc test

- Automated tests không gọi AI thật.
- Dùng fake secret rõ ràng.
- Không dùng database production.
- Không hardcode Sync API Key thật.
- Mỗi code fix phải có regression test tương ứng.
- Sau test riêng phải chạy full Vitest, typecheck, lint và production build.

## 7. Task 5 - Nghiệm thu từ Trade Manager trên XAUUSD

### 7.1. Điều kiện trước khi test

- Sync API Key đã rotate.
- EA đã dùng key mới.
- Routing policy đã chuyển FIXED DeepSeek hoặc fallback đã thực sự routable.
- Health online và không có skipped fallback ngoài dự kiến.
- Auto Apply/Auto Trade vẫn locked off.
- Chủ dự án đồng ý thực hiện một AI request thật.

### 7.2. Quy trình

1. Attach Trade Manager vào chart XAUUSD.
2. Mở tab AI.
3. Xác nhận trạng thái gateway/sync bình thường.
4. Bấm Analyze đúng một lần.
5. Ghi request ID nhưng không ghi Sync API Key.
6. Xác nhận request đi tới:

```text
POST /api/v1/ai/analyze
```

7. Xác nhận website trả response schema `1.0`.
8. Xác nhận EA parse:

```text
ok
request_id
action
confidence
entry/sl/tp1/tp2/tp3
reference fields
server_validation.schema_valid
server_validation.safety_valid
usage
```

9. Nút Apply chỉ được bật khi schema và safety đều valid.
10. Không bấm Apply nếu mục tiêu chỉ là test AI transport.

### 7.3. Database proof

Theo request ID vừa tạo:

```text
AiRequest count        = 1
AiRequest status       = COMPLETED hoặc REJECTED an toàn
AiRequest completedAt  != null
Actual provider calls  = 1 với FIXED DeepSeek
HTTP status            = 200 nếu DeepSeek thành công
Credential ID          != null cho actual provider attempt
Error message          không chứa secret
```

### 7.4. Duplicate test

Không double-click thật trên EA. Dùng integration test với cùng request ID và adapter mock để chứng minh request thứ hai không gọi provider.

## 8. Thứ tự thực hiện bắt buộc

Gemini phải luôn bám sát thứ tự:

```text
Task 1: Rotate Sync API Key
Task 2: Chỉnh routing policy
Task 3: Sửa attempt logging + viết regression tests
Task 4: Bổ sung route/integration tests
Task 5: Full regression
Task 6: Một E2E request thật từ Trade Manager XAUUSD
Task 7: Security scan và báo cáo final
```

Không chuyển task nếu task trước chưa có bằng chứng pass.

## 9. Full regression bắt buộc

Website:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit --incremental false
.\node_modules\.bin\eslint.cmd src/actions/admin/ai-gateway.ts src/app/api/v1/ai src/lib/encryption.ts src/lib/ai-gateway src/components/admin/ai --no-warn-ignored
.\node_modules\.bin\vitest.cmd run
.\node_modules\.bin\next.cmd build
```

Trade Manager:

```text
Compile bằng MetaEditor
Expected: 0 errors, 0 warnings
```

Runtime:

```text
Health             : online
Database           : online
Provider           : online
Routable models    : 1 hoặc nhiều hơn nếu fallback thật sự hợp lệ
Old Sync API Key   : 401
New Sync API Key   : 200 cho Usage
```

Production build phải chạy sau lần sửa code cuối cùng.

## 10. Format báo cáo bắt buộc dành cho Gemini

```text
TASK <số> - <tên>
Status         : VERIFIED / BLOCKED
Root cause     : <nguyên nhân>
Files changed  : <danh sách>
Tests added    : <test và hành vi>
Commands       : <lệnh đã chạy>
Results        : <số test, typecheck, lint, build>
Runtime proof  : <status đã che secret>
Security proof : <không có secret trong source/log/report>
Remaining risk : <rủi ro còn lại>
```

Gemini không được viết token, API key hoặc encryption secret thật trong báo cáo.

## 11. Definition of Done

- [ ] Sync API Key cũ đã bị revoke và không còn xác thực được.
- [ ] Sync API Key mới đã được cập nhật vào Trade Manager.
- [ ] Không có token thật trong source, scratch script, log hoặc Git diff.
- [ ] Policy là FIXED DeepSeek hoặc fallback đã thực sự được cấu hình đầy đủ.
- [ ] Health online và diagnostic đúng trạng thái thật.
- [ ] Request attempts phản ánh đúng thứ tự provider execution.
- [ ] Fallback không được ghi attempt khi primary đã thành công.
- [ ] Analyze route có test success, duplicate, quota, failure và safety rejection.
- [ ] Usage route có test success và quota consistency.
- [ ] Health route có test database offline và credential invalid.
- [ ] Credential lifecycle có server-action/transaction tests.
- [ ] TypeScript pass.
- [ ] AI Gateway/Admin lint pass.
- [ ] Toàn bộ Vitest pass.
- [ ] Production build pass sau lần sửa cuối.
- [ ] Trade Manager compile `0 errors, 0 warnings`.
- [ ] Có một request thật từ Trade Manager trên XAUUSD.
- [ ] Request ID được đối chiếu thành công với database.
- [ ] Không có secret trong report final.

Chỉ khi toàn bộ checklist trên được chứng minh thì mới được kết luận luồng `Trade Manager -> Website -> AI` đã final và an toàn cho production.
