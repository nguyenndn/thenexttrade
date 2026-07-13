# GSN - Kiểm thử nhập lịch sử MT5 cục bộ

Thư mục này chứa một vertical slice hoàn chỉnh để kiểm thử luồng nhập lịch sử MT5 trước khi tích hợp vào backend website chính thức.

```text
Website/API cục bộ
  -> lưu thông tin tài khoản đã mã hóa
  -> tạo tác vụ nhập dữ liệu
  -> Worker Windows nhận tác vụ
  -> đăng nhập MT5 bằng Investor Password
  -> tải orders/deals theo lô gzip
  -> lưu bản ghi thô vào SQLite
  -> cập nhật trạng thái tác vụ
```

Bộ kiểm thử không đặt lệnh và không cần mật khẩu giao dịch chính. Chỉ sử dụng Investor Password của tài khoản kiểm thử.

## 1. Các thành phần đã triển khai

### API cục bộ

- FastAPI chạy tại `127.0.0.1:8765`.
- SQLite tự động khởi tạo lược đồ dữ liệu.
- Tự động tạo token cục bộ cho người dùng và Admin.
- Mã hóa Investor Password bằng Fernet trước khi ghi vào cơ sở dữ liệu.
- Cấp enrollment token dùng một lần cho Worker.
- Xác thực Worker bằng token riêng.
- Quản lý hàng đợi, lease, nhận lại tác vụ hết hạn và tiến độ xử lý.
- Trao đổi thông tin đăng nhập một lần theo từng lease.
- Nhận lô orders/deals dạng gzip.
- Kiểm tra SHA-256 và ngăn xung đột idempotency.
- Upsert bản ghi theo `account_id + ticket`.
- Hỗ trợ hoàn tất, thất bại, xem trạng thái và xem dữ liệu thô.
- Cho phép Admin xem heartbeat và thu hồi Worker của VPS đã mất.

### Worker Windows

- Mã hóa Worker token bằng Windows DPAPI theo tài khoản Windows hiện tại.
- Gửi heartbeat, thăm dò và nhận tác vụ.
- Gọi `MetaTrader5.initialize()` bằng đường dẫn terminal được kiểm soát và `portable=True`.
- Xác minh chính xác số tài khoản và tên máy chủ broker.
- Lấy dữ liệu bằng `history_orders_get()` và `history_deals_get()`.
- Chuyển số thực thành chuỗi thập phân để hạn chế sai số JSON.
- Chia dữ liệu thành lô 500 bản ghi, nén gzip và gắn checksum.
- Chỉ tắt những tiến trình terminal mới được tác vụ khởi tạo.
- Chỉ đánh dấu tác vụ hoàn tất sau khi MT5 đã được dọn dẹp.

## 2. Cấu trúc thư mục

```text
LocalHistoryImportTest/
  api/
    app.py
    run_api.py
    RUN_LOCAL_API.bat
    data/                         được tạo khi chạy, có chứa bí mật
  worker/
    worker.py
    token_store.py
    Enroll-GSNWorker.ps1
  scripts/
    Build-VpsTestBundle.ps1
    New-EnrollmentToken.ps1
    New-TestImport.ps1
    Get-ImportStatus.ps1
    Get-Workers.ps1
    Revoke-Worker.ps1
  tests/
  dist/                           bundle VPS được tạo tự động
```

## 3. Kiểm thử A - Toàn bộ trên cùng một PC Windows

Nên chạy kịch bản này trước để xác minh luồng ứng dụng mà chưa phải xử lý kết nối mạng giữa hai máy.

### Bước 1 - Khởi động API

Chạy:

```text
api\RUN_LOCAL_API.bat
```

Khi thành công, tài liệu Swagger có tại:

```text
http://127.0.0.1:8765/docs
```

Giữ cửa sổ API hoạt động trong suốt quá trình kiểm thử. Các bí mật cục bộ được tạo tại:

```text
api\data\local-secrets.json
```

Không commit, tải lên hoặc chụp ảnh file này.

### Bước 2 - Tạo bundle dùng trên cùng PC

Chạy file:

```text
BUILD_SAME_PC_BUNDLE.bat
```

Hoặc chạy trực tiếp:

```powershell
.\scripts\Build-VpsTestBundle.ps1 -BackendBaseUrl http://127.0.0.1:8765
```

Kết quả được tạo tại:

```text
dist\GSN-VPS-Test-Bundle
```

### Bước 3 - Cài đặt máy Worker

Chạy với quyền Administrator:

```text
dist\GSN-VPS-Test-Bundle\GSN_INSTALL_WINDOWS_WORKER.bat
```

Trạng thái mong đợi:

```text
READY_FOR_ENROLLMENT
```

Lấy `workerId` từ:

```text
C:\GSN\config\installation-report.json
```

### Bước 4 - Tạo enrollment token dùng một lần

Từ thư mục `scripts`, chạy:

```powershell
.\New-EnrollmentToken.ps1 -WorkerId <worker-id-trong-report>
```

Token chỉ hiển thị một lần và hết hạn sau 15 phút.

### Bước 5 - Đăng ký Worker

Chạy bằng đúng tài khoản Windows sẽ vận hành Scheduled Task:

```powershell
C:\GSN\worker\Enroll-GSNWorker.ps1
```

Dán enrollment token khi được yêu cầu. Worker token sau đó được DPAPI mã hóa tại:

```text
C:\GSN\config\worker-token.dpapi
```

Không thể sao chép token DPAPI này sang máy hoặc tài khoản Windows khác.

### Bước 6 - Khởi động Worker

Để quan sát log trực tiếp, chạy:

```bat
C:\GSN\runtime\Start-GSNWorker.cmd
```

Scheduled Task sẽ tự khởi động Worker ở lần đăng nhập Windows tiếp theo.

### Bước 7 - Tạo tác vụ nhập dữ liệu

```powershell
.\New-TestImport.ps1 `
  -Login 12345678 `
  -BrokerName "Tên broker" `
  -Server "Tên-Máy-Chủ-Chính-Xác"
```

Nhập Investor Password khi được nhắc. Lần đầu chỉ nên chọn lịch sử từ 1 đến 7 ngày.

### Bước 8 - Xem trạng thái và dữ liệu

```powershell
.\Get-ImportStatus.ps1 -JobId imp_xxxxxxxxxxxxxxxx
```

Dữ liệu thô có thể xem qua Swagger:

```text
GET /v1/imports/{jobId}/records?entity_type=ORDERS
GET /v1/imports/{jobId}/records?entity_type=DEALS
```

## 4. Kiểm thử B - API trên PC cục bộ, Worker trên VPS từ xa

`127.0.0.1` trên VPS là chính VPS, không phải PC đang chạy website. Vì vậy Worker từ xa cần một URL HTTPS riêng tư có thể truy cập được.

Mô hình được khuyến nghị cho giai đoạn kiểm thử:

```text
PC cục bộ: API 127.0.0.1:8765
PC cục bộ: Tailscale Serve làm HTTPS reverse proxy
Windows VPS: tham gia cùng tailnet
Worker: backendBaseUrl=https://<pc-cục-bộ>.<tailnet>.ts.net
```

### Bước 1 - Cài đặt và kết nối Tailscale

Cài Tailscale trên cả PC cục bộ và Windows VPS. Hai máy phải xuất hiện trong cùng tailnet; ACL của tailnet phải cho phép VPS truy cập endpoint trên PC.

Trên VPS, sau khi đăng nhập Tailscale, bật chế độ hoạt động không cần người dùng đăng nhập:

```powershell
tailscale up --unattended=true
```

Lưu ý: Tailscale có thể chạy unattended, nhưng MT5 Worker trong kiến trúc hiện tại vẫn cần Windows session tương tác của tài khoản chuyên dụng.

### Bước 2 - Cung cấp API riêng tư qua HTTPS

Trên PC cục bộ, trong lúc API đang chạy:

```powershell
tailscale serve --bg http://127.0.0.1:8765
tailscale serve status
```

Ghi lại URL HTTPS do Tailscale cung cấp, ví dụ:

```text
https://my-pc.my-tailnet.ts.net
```

Không dùng Tailscale Funnel hoặc mở API công khai trên Internet cho bài kiểm thử này.

### Bước 3 - Xác minh kết nối từ VPS

```powershell
Invoke-RestMethod https://my-pc.my-tailnet.ts.net/health
```

Kết quả phải có `ok: true`.

### Bước 4 - Tạo bundle cho VPS từ xa

Trên PC chứa source code:

```powershell
.\scripts\Build-VpsTestBundle.ps1 `
  -BackendBaseUrl https://my-pc.my-tailnet.ts.net `
  -Mt5InstallerUrl https://broker.example.com/mt5setup.exe
```

Sao chép toàn bộ thư mục `dist\GSN-VPS-Test-Bundle` sang VPS và chạy file BAT với quyền Administrator.

Nếu broker không cung cấp installer riêng, có thể giữ URL MetaQuotes mặc định nhưng phải tự xác minh terminal tìm thấy đúng máy chủ broker.

### Bước 5 - Đăng ký và chạy Worker

1. Lấy `workerId` từ `C:\GSN\config\installation-report.json` trên VPS.
2. Trên PC cục bộ, chạy `New-EnrollmentToken.ps1` cho Worker đó.
3. Trên VPS, chạy `C:\GSN\worker\Enroll-GSNWorker.ps1`.
4. Trên VPS, chạy `C:\GSN\runtime\Start-GSNWorker.cmd`.
5. Trên PC cục bộ, tạo tác vụ bằng `New-TestImport.ps1`.

## 5. Trách nhiệm của API

| Endpoint | Trách nhiệm |
|---|---|
| `GET /health` | Kiểm tra khả năng truy cập cục bộ hoặc qua tunnel |
| `POST /admin/v1/workers/enrollment-tokens` | Cấp enrollment token dùng một lần |
| `POST /internal/v1/mt5-workers/enroll` | Đổi enrollment token lấy Worker token |
| `POST /internal/v1/mt5-workers/heartbeat` | Cập nhật trạng thái Worker |
| `GET /admin/v1/workers` | Xem trạng thái và heartbeat của Worker |
| `POST /admin/v1/workers/{id}/revoke` | Thu hồi identity của VPS đã mất hoặc bị thay thế |
| `POST /v1/mt5-accounts` | Mã hóa và lưu thông tin tài khoản MT5 |
| `POST /v1/mt5-accounts/{id}/imports` | Tạo tác vụ nhập dữ liệu |
| `GET /v1/imports/{id}` | Trả trạng thái cho người dùng |
| `POST /internal/v1/mt5-jobs/claim` | Cấp lease cho Worker nhận tác vụ |
| `POST /internal/v1/mt5-jobs/{id}/secret` | Trao đổi thông tin đăng nhập một lần |
| `POST /internal/v1/mt5-jobs/{id}/progress` | Cập nhật giai đoạn, tiến độ và gia hạn lease |
| `POST /internal/v1/mt5-jobs/{id}/batches` | Nhận bản ghi có gzip/checksum/idempotency |
| `POST /internal/v1/mt5-jobs/{id}/complete` | Kiểm tra manifest và hoàn tất tác vụ |
| `POST /internal/v1/mt5-jobs/{id}/fail` | Lưu lỗi đã được chuẩn hóa |

Website cục bộ có thể gọi các endpoint `/v1` bằng token người dùng kiểm thử. Khi tích hợp production, phải thay token cố định bằng session người dùng, phân quyền tenant và cơ chế xác thực của website.

## 6. Trách nhiệm của Windows VPS

1. Duy trì một tài khoản Windows chuyên dụng có session tương tác.
2. Giữ kết nối Tailscale hoạt động.
3. Chạy Worker bằng đúng tài khoản Windows đã đăng ký DPAPI token.
4. Chỉ cho Worker, Administrator và SYSTEM truy cập `C:\GSN`.
5. Dùng đúng tên máy chủ broker và Investor Password.
6. Mỗi thời điểm chỉ xử lý một tác vụ.
7. Không lưu Investor Password ra file hoặc log.
8. Dọn dẹp terminal sau cả trường hợp thành công và thất bại.
9. Đăng ký lại bằng token mới khi thay máy hoặc thay tài khoản Windows.

## 7. Tiêu chí đạt yêu cầu

- VPS truy cập được `/health` của API.
- Enrollment token không thể dùng lại.
- Admin thấy heartbeat gần nhất của Worker.
- Investor Password dạng rõ không xuất hiện trong SQLite, log hoặc file tạm.
- Worker xác minh đúng số tài khoản và máy chủ.
- Số lượng orders/deals khớp với tab History của MT5 trong cùng khoảng thời gian.
- Profit, commission, swap và fee khớp trên các deal được lấy mẫu.
- Gửi lại cùng một lô không tạo bản ghi trùng.
- Tác vụ chỉ chuyển sang `COMPLETED` sau khi MT5 đã shutdown.
- Không còn PID `terminal64.exe` mới sau khi xử lý xong.
- Mật khẩu sai tạo trạng thái `FAILED` nhưng không làm lộ thông tin xác thực.

## 8. Các giới hạn quan trọng

- SQLite và token cố định chỉ phục vụ kiểm thử, không phù hợp với môi trường production nhiều người dùng.
- Chưa có journal projector hoặc giao diện nhật ký; hiện chỉ xem trạng thái và dữ liệu thô.
- Bộ nhập lịch sử không đồng bộ vị thế đang mở theo thời gian thực.
- Scheduled Task `ONLOGON` chưa có watchdog tự khởi động lại khi Worker crash.
- Tham số cài silent của MT5 có thể khác nhau giữa các broker.
- Không thể kiểm thử đăng nhập MT5 thật trong CI nếu không có tài khoản và máy chủ broker kiểm thử.

## 9. Xác minh tự động

Chạy:

```text
RUN_TESTS.bat
```

Phạm vi kiểm thử gồm:

- Enrollment token dùng một lần.
- Xác thực người dùng, Admin và Worker.
- Mã hóa thông tin đăng nhập khi lưu trữ.
- Nhận tác vụ và trao đổi bí mật.
- Gzip, checksum, idempotency và xung đột lô.
- Số lượng bản ghi và trạng thái hoàn tất.
- Chuẩn hóa và chia lô dữ liệu Worker.
- Vòng đời MT5 giả lập: lấy dữ liệu, tải lên, shutdown rồi mới hoàn tất.

## 10. Đặt lại môi trường kiểm thử

Dừng API và Worker trước, sau đó lưu trữ hoặc xóa:

```text
api\data
C:\GSN
```

Xóa `api\data` sẽ làm mất toàn bộ tài khoản, tác vụ, Worker token và token API cục bộ. API sẽ tạo môi trường mới ở lần chạy tiếp theo.

## 11. Lưu ý bảo mật

- Không sử dụng mật khẩu giao dịch chính.
- Không chia sẻ `api\data\local-secrets.json`.
- Không mở trực tiếp cổng `8765` ra Internet.
- Dùng Tailscale Serve riêng tư, không dùng Funnel công khai.
- Thu hồi Worker cũ bằng `Revoke-Worker.ps1 -WorkerId <old-id>` trước khi kích hoạt VPS thay thế.
- Bộ kiểm thử này cần được rà soát bảo mật lại trước khi chuyển thành dịch vụ production.

## Tài liệu mạng chính thức

- Tailscale Serve: https://tailscale.com/docs/reference/tailscale-cli/serve
