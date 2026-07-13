# Bàn giao ngữ cảnh Web Sync và Windows MT5 Worker

## 1. Mục đích tài liệu

Tài liệu này mô tả phần chức năng nhập lịch sử giao dịch MT5 theo yêu cầu, hiện được triển khai trong hai thư mục:

```text
LocalHistoryImportTest/
WindowsWorkerBootstrap/
```

Mục tiêu là giúp tiếp tục phát triển chức năng trong source website mà không cần đọc lại toàn bộ lịch sử trao đổi của workspace Trade Manager.

Đây là một **vertical slice dùng để kiểm thử kiến trúc**, gồm API cục bộ, Windows Worker, bộ cài đặt VPS, script vận hành và kiểm thử tự động. Hệ thống đã chứng minh được luồng kỹ thuật cơ bản, nhưng chưa phải bản production hoàn chỉnh.

Chức năng này độc lập với EA Trade Manager. EA không trực tiếp đăng nhập tài khoản MT5 thay người dùng và không tham gia vào luồng nhập lịch sử mô tả trong tài liệu này.

## 2. Bài toán cần giải quyết

Website chạy trên Linux cần cho phép người dùng:

1. Khai báo tài khoản MT5 bằng số đăng nhập, máy chủ broker và Investor Password.
2. Yêu cầu nhập lịch sử giao dịch trong một khoảng thời gian.
3. Theo dõi tiến độ và kết quả nhập dữ liệu.
4. Xem orders/deals đã nhập và sau này tạo nhật ký giao dịch.

Linux không thể dùng trực tiếp Python package `MetaTrader5` để vận hành terminal theo mô hình hiện tại. Vì vậy hệ thống sử dụng một Windows VPS làm máy thực thi:

```text
Người dùng
  -> Website/API trên Linux
  -> Hàng đợi import job
  -> Windows Worker nhận job
  -> MT5 terminal đăng nhập bằng Investor Password
  -> Worker lấy orders/deals
  -> Worker tải dữ liệu về API
  -> Website lưu dữ liệu và cập nhật trạng thái
```

Windows Worker chủ động gọi ra backend qua HTTPS. Website không cần kết nối RDP vào VPS và không điều khiển desktop từ xa.

## 3. Vai trò của từng thư mục

### 3.1 `LocalHistoryImportTest`

Thư mục này chứa một hệ thống kiểm thử đầu cuối thu nhỏ.

```text
LocalHistoryImportTest/
  api/       API FastAPI và cơ sở dữ liệu SQLite cục bộ
  worker/    Windows Worker dùng Python và MetaTrader5
  scripts/   Script quản trị, tạo job và đóng gói bundle
  tests/     Kiểm thử API và vòng đời Worker
  README.md  Runbook kiểm thử trên cùng PC hoặc VPS từ xa
```

Các thành phần trong thư mục không có cùng nơi triển khai production:

| Thành phần | Nơi triển khai dự kiến |
|---|---|
| `api/` | Backend website trên Linux hoặc dịch vụ sidecar |
| `worker/` | Windows VPS |
| Script quản trị API | Source website hoặc kho công cụ vận hành |
| Script đóng gói Worker | Pipeline phát hành Windows Worker |
| Test API | Source website |
| Test Worker | Source Windows Worker |

### 3.2 `WindowsWorkerBootstrap`

Thư mục này là bộ bootstrap để biến một Windows VPS mới thành máy chạy MT5 Worker có cấu trúc ổn định.

Bootstrap chịu trách nhiệm:

- Kiểm tra cấu hình và quyền Administrator.
- Tạo cấu trúc `C:\GSN`.
- Cài hoặc chuẩn bị Python và virtual environment.
- Cài các dependency cần thiết.
- Tìm, cài hoặc sao chép MT5 terminal vào đường dẫn được kiểm soát.
- Triển khai gói Worker.
- Tạo cấu hình cục bộ cho Worker.
- Tạo Scheduled Task chạy khi tài khoản Windows đăng nhập.
- Xác minh, sửa chữa và gỡ cài đặt.

Bootstrap không chứa backend API và không thay thế logic nghiệp vụ trong `worker/worker.py`.

## 4. Luồng hoạt động hoàn chỉnh

### 4.1 Cài đặt Windows VPS

1. Bộ bootstrap đọc `bootstrap.config.json`.
2. Script tạo cây thư mục chuẩn tại `C:\GSN`.
3. Python, virtual environment, MT5 terminal và Worker package được chuẩn bị.
4. Một `workerId` được tạo tự động nếu chưa tồn tại.
5. Chạy lại bộ cài trên cùng máy sẽ giữ nguyên `workerId` hiện có.
6. Scheduled Task được tạo để khởi động Worker ở lần đăng nhập Windows.
7. Kết quả cài đặt được ghi vào `installation-report.json`.

Các trạng thái cần phân biệt:

```text
INFRASTRUCTURE_READY
  Hạ tầng Python, MT5 và thư mục đã sẵn sàng.

READY_FOR_ENROLLMENT
  Worker package và Scheduled Task đã sẵn sàng.

ONLINE
  Trạng thái do backend xác định khi Worker đã đăng ký và heartbeat còn mới.
```

### 4.2 Đăng ký Worker

1. Admin tạo enrollment token cho một `workerId`.
2. Enrollment token có thời hạn ngắn và chỉ được sử dụng một lần.
3. Worker gửi token đến endpoint đăng ký.
4. Backend cấp Worker token dài hạn.
5. Worker token được mã hóa bằng Windows DPAPI và lưu trên VPS.
6. Token chỉ giải mã được bởi đúng tài khoản Windows trên đúng máy đã đăng ký.

Khi thay VPS hoặc tài khoản Windows, phải tạo enrollment token mới và thu hồi Worker cũ.

### 4.3 Tạo yêu cầu nhập lịch sử

1. Người dùng gửi thông tin tài khoản MT5 cho website.
2. Backend mã hóa Investor Password trước khi lưu.
3. Người dùng chọn khoảng thời gian và tạo import job.
4. Job ban đầu ở trạng thái `QUEUED`.
5. Website trả `jobId` để giao diện theo dõi tiến độ.

### 4.4 Worker nhận và xử lý job

1. Worker gửi heartbeat và báo capacity bằng `1`.
2. Worker gọi endpoint claim để nhận một job cùng lease.
3. Backend trả `lease_id` và secret exchange token dùng một lần.
4. Worker đổi secret token lấy thông tin đăng nhập MT5.
5. Worker gọi `MetaTrader5.initialize()` với terminal được kiểm soát và `portable=True`.
6. Worker xác minh số tài khoản và tên máy chủ sau khi đăng nhập.
7. Worker gọi `history_orders_get()` và `history_deals_get()`.
8. Dữ liệu được chuẩn hóa, chia lô, nén gzip và gắn SHA-256.
9. Worker tải lần lượt orders và deals về backend.
10. Worker gọi `mt5.shutdown()` và dọn những PID terminal do job vừa tạo.
11. Chỉ sau khi cleanup xong, Worker mới gọi endpoint hoàn tất job.

Nếu có lỗi, Worker cố gắng báo mã lỗi cho backend, shutdown MT5, dọn PID và quay lại trạng thái `IDLE`.

### 4.5 Backend nhận dữ liệu

Backend thực hiện các kiểm tra sau:

- Worker token còn hiệu lực.
- Job thuộc đúng Worker và đúng lease.
- Lease chưa hết hạn.
- Payload không vượt giới hạn.
- Số bản ghi trong lô hợp lệ.
- Checksum khớp nội dung sau giải nén.
- Cùng `batch_index` và cùng checksum được xem là gửi lại hợp lệ.
- Cùng `batch_index` nhưng checksum khác bị từ chối vì xung đột.
- Raw orders/deals được upsert theo tài khoản và ticket.
- Job chỉ hoàn tất khi đủ manifest lô của cả orders và deals.

## 5. Trạng thái import job

Luồng trạng thái hiện tại:

```text
QUEUED
  -> CLAIMED
  -> AUTHENTICATING
  -> FETCHING_ORDERS
  -> FETCHING_DEALS
  -> UPLOADING
  -> CLEANING_UP
  -> COMPLETED
```

Job có thể chuyển sang `FAILED` khi thông tin đăng nhập sai, terminal không khởi động được, lấy lịch sử thất bại, upload lỗi hoặc xảy ra lỗi nội bộ.

Lease được dùng để tránh hai Worker đồng thời xử lý cùng một job. Job đang hoạt động có lease hết hạn có thể được backend đưa trở lại hàng đợi để Worker khác nhận lại.

## 6. API hiện có

API kiểm thử nằm tại `LocalHistoryImportTest/api/app.py` và sử dụng FastAPI.

### 6.1 Health check

| Endpoint | Mục đích |
|---|---|
| `GET /health` | Xác minh API có thể truy cập |

### 6.2 API dành cho người dùng website

| Endpoint | Mục đích |
|---|---|
| `POST /v1/mt5-accounts` | Lưu tài khoản và Investor Password đã mã hóa |
| `POST /v1/mt5-accounts/{accountId}/imports` | Tạo import job |
| `GET /v1/imports/{jobId}` | Xem trạng thái và tiến độ |
| `GET /v1/imports/{jobId}/records` | Xem raw orders hoặc raw deals |

### 6.3 API nội bộ dành cho Windows Worker

| Endpoint | Mục đích |
|---|---|
| `POST /internal/v1/mt5-workers/enroll` | Đổi enrollment token lấy Worker token |
| `POST /internal/v1/mt5-workers/heartbeat` | Báo trạng thái Worker |
| `POST /internal/v1/mt5-jobs/claim` | Nhận job và lease |
| `POST /internal/v1/mt5-jobs/{jobId}/secret` | Nhận thông tin đăng nhập một lần |
| `POST /internal/v1/mt5-jobs/{jobId}/progress` | Cập nhật tiến độ và gia hạn lease |
| `POST /internal/v1/mt5-jobs/{jobId}/batches` | Tải lô orders/deals |
| `POST /internal/v1/mt5-jobs/{jobId}/complete` | Hoàn tất sau khi cleanup |
| `POST /internal/v1/mt5-jobs/{jobId}/fail` | Báo lỗi đã chuẩn hóa |

### 6.4 API dành cho Admin

| Endpoint | Mục đích |
|---|---|
| `POST /admin/v1/workers/enrollment-tokens` | Cấp enrollment token dùng một lần |
| `GET /admin/v1/workers` | Xem danh sách và heartbeat Worker |
| `POST /admin/v1/workers/{workerId}/revoke` | Thu hồi Worker |
| `GET /admin/v1/jobs` | Theo dõi danh sách import job |

## 7. Dữ liệu đang được lưu

API cục bộ dùng SQLite và tự tạo các bảng:

| Bảng | Nội dung |
|---|---|
| `workers` | Identity, token hash, trạng thái và heartbeat Worker |
| `enrollment_tokens` | Enrollment token đã hash, hạn dùng và thời điểm sử dụng |
| `accounts` | Tài khoản MT5 và Investor Password đã mã hóa |
| `jobs` | Trạng thái, lease, tiến độ, lỗi và số lượng dữ liệu |
| `batches` | Manifest lô, checksum và idempotency |
| `raw_orders` | Raw MT5 orders theo tài khoản và ticket |
| `raw_deals` | Raw MT5 deals theo tài khoản và ticket |

Raw orders/deals là nguồn dữ liệu chuẩn để sau này xây dựng journal projector. Không nên tạo nhật ký trực tiếp trong Worker.

## 8. Cấu trúc Windows sau khi bootstrap

```text
C:\GSN\
  config\
    bootstrap.config.json
    worker.json
    installation-report.json
    worker-token.dpapi
  runtime\
    python\
    venv\
    downloads\
    Start-GSNWorker.cmd
  mt5\
    terminal\
      terminal64.exe
  terminals\
    slot-01\
  worker\
  logs\
  temp\
  backups\
```

Website không gửi đường dẫn Windows trong job. Worker tự đọc toàn bộ đường dẫn cục bộ từ `C:\GSN\config\worker.json`.

## 9. Các file quan trọng

### 9.1 Backend/API

| File | Vai trò |
|---|---|
| `LocalHistoryImportTest/api/app.py` | API, auth kiểm thử, SQLite schema, queue, lease, upload và lưu raw data |
| `LocalHistoryImportTest/api/run_api.py` | Tạo secret cục bộ và khởi động Uvicorn |
| `LocalHistoryImportTest/api/requirements.txt` | Dependency của API |
| `LocalHistoryImportTest/api/RUN_LOCAL_API.bat` | Chạy API kiểm thử trên Windows |

### 9.2 Windows Worker

| File | Vai trò |
|---|---|
| `LocalHistoryImportTest/worker/worker.py` | Heartbeat, claim, đăng nhập MT5, lấy dữ liệu, upload và cleanup |
| `LocalHistoryImportTest/worker/token_store.py` | Mã hóa/giải mã Worker token bằng DPAPI |
| `LocalHistoryImportTest/worker/Enroll-GSNWorker.ps1` | Nhập enrollment token và đăng ký Worker |
| `LocalHistoryImportTest/worker/requirements.txt` | Dependency của Worker |

### 9.3 Công cụ vận hành

| File | Vai trò |
|---|---|
| `scripts/New-EnrollmentToken.ps1` | Admin cấp token đăng ký Worker |
| `scripts/New-TestImport.ps1` | Tạo tài khoản và import job kiểm thử |
| `scripts/Get-ImportStatus.ps1` | Xem trạng thái job |
| `scripts/Get-Workers.ps1` | Xem Worker |
| `scripts/Revoke-Worker.ps1` | Thu hồi Worker |
| `scripts/Build-VpsTestBundle.ps1` | Đóng gói Worker và bootstrap cho VPS |

### 9.4 Bootstrap VPS

| File | Vai trò |
|---|---|
| `WindowsWorkerBootstrap/GSN_INSTALL_WINDOWS_WORKER.bat` | Entry point cài đặt có quyền Administrator |
| `WindowsWorkerBootstrap/Install-GSNWorker.ps1` | Logic cài đặt chính |
| `WindowsWorkerBootstrap/Repair-GSNWorker.ps1` | Chạy lại quy trình để sửa môi trường |
| `WindowsWorkerBootstrap/Verify-GSNWorker.ps1` | Kiểm tra Python, MT5, Worker, cấu hình và Scheduled Task |
| `WindowsWorkerBootstrap/Uninstall-GSNWorker.ps1` | Gỡ Scheduled Task, tùy chọn xóa đúng `C:\GSN` |
| `WindowsWorkerBootstrap/bootstrap.config.example.json` | Cấu hình mẫu |

## 10. Bảo mật hiện tại

Vertical slice đã có các biện pháp sau:

- Chỉ sử dụng Investor Password, không yêu cầu mật khẩu giao dịch chính.
- Investor Password được Fernet mã hóa trước khi ghi SQLite.
- Enrollment token được hash, có TTL và chỉ dùng một lần.
- Worker token được hash ở backend và mã hóa DPAPI trên Windows.
- Thông tin đăng nhập chỉ được cấp sau khi Worker sở hữu lease hợp lệ.
- Secret exchange token chỉ dùng một lần.
- Worker xóa chuỗi Investor Password khỏi object sau khi gọi MT5 initialize.
- API giới hạn kích thước payload và số bản ghi mỗi lô.
- Batch có checksum và idempotency.
- HTTP chỉ được chấp nhận cho loopback khi bật rõ `allowInsecureLocalhost`.
- Môi trường từ xa được thiết kế để dùng HTTPS, trong thử nghiệm có thể dùng Tailscale Serve riêng tư.

Các cơ chế trên chưa đủ cho production. Fernet key và token cục bộ hiện được tạo trong `api/data/local-secrets.json`; file này tuyệt đối không được chuyển sang source Web hoặc commit vào Git.

## 11. Những phần chỉ dành cho kiểm thử

Các lựa chọn sau phải được thay khi tích hợp website thật:

| Hiện tại | Production cần có |
|---|---|
| FastAPI độc lập | Tích hợp framework backend hiện có hoặc triển khai sidecar chính thức |
| SQLite | PostgreSQL và migration có version |
| User/Admin bearer token cố định | Session/JWT và phân quyền thật của website |
| `owner_id` kiểm thử | Tenant/user ownership của hệ thống thật |
| Fernet key trong file local | KMS/Vault và key rotation |
| Polling một Worker | Queue/orchestrator có backpressure và monitoring |
| Raw records viewer | Journal projector và giao diện lịch sử |
| Scheduled Task `ONLOGON` | Giải pháp session supervision đã kiểm thử trên VPS |
| Log file cục bộ | Log tập trung, redaction, retention và cảnh báo |

Không nên chép trực tiếp `app.py` vào backend production rồi xem là hoàn tất. `app.py` là implementation tham chiếu cho contract và luồng nghiệp vụ.

## 12. Phân chia source khi chuyển workspace

### 12.1 Phần đưa vào source website

```text
LocalHistoryImportTest/api/
LocalHistoryImportTest/tests/test_api_flow.py
LocalHistoryImportTest/scripts/New-EnrollmentToken.ps1
LocalHistoryImportTest/scripts/New-TestImport.ps1
LocalHistoryImportTest/scripts/Get-ImportStatus.ps1
LocalHistoryImportTest/scripts/Get-Workers.ps1
LocalHistoryImportTest/scripts/Revoke-Worker.ps1
Docs/MT5_ON_DEMAND_HISTORY_IMPORT_PLAN.md
Docs/MT5_WEB_SYNC_HANDOVER.md
```

Nếu website không dùng Python/FastAPI, nên đặt API hiện tại vào thư mục tham chiếu, ví dụ:

```text
_reference/mt5-import-fastapi/
```

Sau đó chuyển endpoint, state machine và validation sang framework thật của website.

### 12.2 Phần đưa vào source Windows Worker riêng

```text
LocalHistoryImportTest/worker/
LocalHistoryImportTest/tests/test_worker_helpers.py
LocalHistoryImportTest/tests/test_worker_job.py
LocalHistoryImportTest/scripts/Build-VpsTestBundle.ps1
LocalHistoryImportTest/BUILD_SAME_PC_BUNDLE.bat
WindowsWorkerBootstrap/
```

Cấu trúc repository đề xuất:

```text
GoldScalperNinja-MT5-Worker/
  worker/
  bootstrap/
  packaging/
  tests/
  docs/
```

## 13. File và dữ liệu không được chuyển

Không copy hoặc commit:

```text
LocalHistoryImportTest/api/data/
LocalHistoryImportTest/dist/
.venv/
.test-venv/
__pycache__/
.pytest_cache/
*.db
local-secrets.json
worker-token.dpapi
```

Không chuyển bất kỳ API key, Investor Password, enrollment token hoặc Worker token đã dùng thật nào sang workspace mới.

## 14. Cách chạy kiểm thử hiện tại

Hướng dẫn chi tiết nằm trong `LocalHistoryImportTest/README.md`. Luồng ngắn gọn trên cùng một PC:

1. Chạy `api\RUN_LOCAL_API.bat`.
2. Chạy `BUILD_SAME_PC_BUNDLE.bat`.
3. Cài bundle bằng quyền Administrator.
4. Lấy `workerId` trong `C:\GSN\config\installation-report.json`.
5. Tạo enrollment token bằng `New-EnrollmentToken.ps1`.
6. Chạy `C:\GSN\worker\Enroll-GSNWorker.ps1`.
7. Chạy `C:\GSN\runtime\Start-GSNWorker.cmd`.
8. Tạo job bằng `New-TestImport.ps1`.
9. Xem kết quả bằng `Get-ImportStatus.ps1` hoặc Swagger tại `/docs`.

Chạy kiểm thử tự động bằng:

```text
LocalHistoryImportTest\RUN_TESTS.bat
```

## 15. Những gì đã được kiểm thử tự động

- Enrollment token không thể dùng lại.
- Phân biệt xác thực user, Admin và Worker.
- Investor Password không xuất hiện dạng rõ trong SQLite.
- Worker claim job và nhận secret theo lease.
- Gzip, checksum, upload lại idempotent và batch conflict.
- Chuẩn hóa và chia lô orders/deals.
- Mock MT5 initialize, fetch, upload và shutdown.
- Worker shutdown trước khi gọi complete.
- DPAPI token round-trip trên Windows.

## 16. Những gì vẫn cần kiểm thử thủ công

- Đăng nhập Investor Password thật trên broker mục tiêu.
- Khả năng tìm đúng server của từng broker.
- Đối chiếu số lượng order/deal với tab History của MT5.
- Đối chiếu profit, commission, swap và fee.
- Partial close, hedging, netting và `DEAL_ENTRY_INOUT`.
- Cleanup PID thật trên Windows VPS sạch.
- Hoạt động sau reboot và đăng nhập Windows.
- Kết nối HTTPS giữa Linux website và Windows VPS.
- Thu hồi VPS cũ và thay VPS mới.

## 17. Các việc ưu tiên khi tiếp tục ở source Web

1. Xác định framework backend, database, auth và mô hình tenant hiện có.
2. Chuyển API contract sang module/service đúng convention của website.
3. Tạo PostgreSQL migrations cho workers, accounts, credentials, jobs, attempts, batches, raw orders và raw deals.
4. Thay token cố định bằng auth thật và kiểm tra ownership trên mọi endpoint người dùng.
5. Thiết kế KMS/Vault cho Investor Password.
6. Sinh OpenAPI/JSON Schema dùng chung giữa website và Worker.
7. Xây Admin UI quản lý Worker, heartbeat, enrollment, revoke, queue và job detail.
8. Xây giao diện người dùng để kết nối MT5, tạo import, xem tiến độ, retry và ngắt kết nối.
9. Tạo journal projector từ raw deals/orders; không đưa logic projection vào Worker.
10. Thiết lập log, metric, cảnh báo và runbook production.

## 18. Nguyên tắc không được phá vỡ khi tái triển khai

- Chỉ dùng Investor Password cho chức năng đọc lịch sử.
- Website là nguồn sự thật cho job, lease, trạng thái và dữ liệu đã nhập.
- Worker không tự tạo job và không tự chọn tài khoản ngoài job được cấp.
- Worker chỉ xử lý tối đa một job tại một thời điểm trong MVP.
- Secret chỉ được cấp sau khi claim thành công và phải có TTL ngắn.
- Upload phải idempotent và có checksum.
- Raw MT5 data phải được giữ tách biệt với dữ liệu journal đã projection.
- Complete chỉ được gửi sau khi MT5 shutdown và cleanup hoàn tất.
- VPS bị mất hoặc thay thế phải có thể revoke ngay từ Admin.
- Website không gửi hoặc phụ thuộc vào đường dẫn cục bộ của Windows VPS.

## 19. Tóm tắt dành cho workspace mới

Khi đọc tài liệu này trong source Web, cần hiểu ngắn gọn như sau:

```text
`LocalHistoryImportTest/api` là backend tham chiếu.
`LocalHistoryImportTest/worker` là Worker thực thi trên Windows.
`WindowsWorkerBootstrap` là bộ cài và quản trị môi trường VPS.

Website Linux tạo và quản lý job.
Windows Worker chủ động claim job qua HTTPS.
Worker đăng nhập MT5 bằng Investor Password, lấy orders/deals và upload theo lô.
Backend lưu raw data, quản lý lease/idempotency và cung cấp tiến độ cho người dùng.
```

Việc đầu tiên ở workspace Web là khảo sát framework và schema hiện có, sau đó ánh xạ API tham chiếu vào kiến trúc thật. Không cần sửa EA Trade Manager để hoàn thành luồng nhập lịch sử này.

## 20. Current implementation notes

- The history worker does not open charts or draw graphs in the MT5 terminal. It reads orders and deals through the MetaTrader5 Python API; charts and analytics are rendered by the website after journal projection.
- The worker must use a dedicated portable terminal copy owned by the worker. Do not point a production worker at a normal interactive installation under `Program Files`.
- For local setup, run `worker\\Prepare-ControlledTerminal.ps1`, change `paths.terminal` to `C:\\GSN\\mt5\\terminal\\terminal64.exe`, close the source MT5 instance, and start a new import job.
- For the repository test worker, run from `apps\\LocalHistoryImportTest\\worker`: `python worker.py --config config.json`. The local `config.json` is committed beside the worker and points to the local Next app plus the controlled MT5 copy.
- For the simplest local flow, double-click `apps\\LocalHistoryImportTest\\worker\\START_LOCAL_WORKER.bat`. It asks for an enrollment token only when `worker-token.dpapi` is missing, enrolls automatically, and starts the worker. Use `START_LOCAL_WORKER.bat --re-enroll` only after revoking the previous Worker in Admin.
- If the controlled terminal is already running, the worker fails with `MT5_TERMINAL_ALREADY_RUNNING`. Close that instance and create a new import job before retrying. This prevents `IPC send failed` and prevents attaching to another session.
- The worker gives MT5 initialization up to `initializeTimeoutMs` (default `180000` ms) because a fresh portable copy may compile MQL5 files before IPC is ready. `loginTimeoutMs` defaults to `60000` ms.
- Initialization and account login are separate stages. The log must show `terminal IPC ready` and then `logging in to server=...`; an IPC timeout is not treated as an account-password failure.
- The terminal does not need to show a visual login dialog: the worker performs the account login through `mt5.login`. Verify success from the `connected login/server` log and `account_info` validation.
- Worker logs include the Python executable, terminal path, connected login/server, fetched order/deal counts, upload stages, and cleanup stages.
- If the worker is installed under `C:\GSN`, run `windows-worker\worker\Update-ControlledWorker.ps1` from this repository after source changes, or start the repository worker explicitly with `python worker.py --config C:\GSN\config\worker.json`. Do not keep an older `C:\GSN\worker\worker.py` running.
- The completion endpoint waits for journal projection before returning `COMPLETED`, keeping import status and dashboard data consistent.
