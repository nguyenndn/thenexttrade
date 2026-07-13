# GSN - Bộ bootstrap cho Windows Worker

Bộ bootstrap này dùng để biến một Windows VPS mới thành máy chủ GSN MT5 Worker với cấu trúc thư mục ổn định. Có thể chạy lại để sửa chữa mà không làm thay đổi `workerId` đã tạo trên máy đó.

## 1. Giới hạn quan trọng

Bootstrap chịu trách nhiệm cài hạ tầng và triển khai gói Worker. Nó không thay thế backend API hoặc logic nghiệp vụ của Worker.

- Không có gói Worker: kết quả là `INFRASTRUCTURE_READY`.
- Có gói Worker và Scheduled Task: kết quả là `READY_FOR_ENROLLMENT`.
- Chỉ khi backend chấp nhận heartbeat thì Worker mới được xem là `ONLINE`.

Worker kiểm thử hiện có tại `LocalHistoryImportTest/worker`. Builder trong `LocalHistoryImportTest/scripts` sẽ đóng gói Worker này cùng bootstrap để kiểm thử trên PC hoặc VPS.

Không đặt Investor Password, API key, enrollment token hoặc Worker token vào BAT, JSON cấu hình hay URL tải gói.

## 2. Cấu trúc thư mục cố định

```text
C:\GSN\
  config\
    bootstrap.config.json
    worker.json
    installation-report.json
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

Website không gửi đường dẫn Windows trong nội dung tác vụ. Website chỉ gửi `job_id`, tham chiếu tài khoản và khoảng thời gian. Worker tự đọc đường dẫn từ `C:\GSN\config\worker.json`; vì vậy thay VPS không làm thay đổi đặc tả API.

## 3. Cài đặt trên VPS mới

1. Sao chép toàn bộ thư mục bundle sang VPS.
2. Kiểm tra file `bootstrap.config.json`.
3. Xác nhận `backendBaseUrl` là URL HTTPS mà VPS truy cập được.
4. Ưu tiên dùng `mt5.installerUrl` do đúng broker cung cấp.
5. Xác nhận `workerPackage.localSourceDirectory` hoặc `workerPackage.packageUrl` hợp lệ.
6. Đặt `workerPackage.requirePackage=true` khi cần Worker hoạt động thật.
7. Chạy `GSN_INSTALL_WINDOWS_WORKER.bat` với quyền Administrator.
8. Chạy `Verify-GSNWorker.ps1`.
9. Đăng ký Worker bằng enrollment token dùng một lần.
10. Chỉ bật định tuyến tác vụ sau khi Admin thấy Worker `ONLINE`.

Cấu hình production tham khảo:

```json
{
  "backendBaseUrl": "https://api.goldscalperninja.com",
  "allowInsecureLocalhost": false,
  "workerPackage": {
    "packageUrl": "https://api.goldscalperninja.com/releases/windows-worker/1.0.0/gsn-worker.zip",
    "sha256": "REQUIRED_RELEASE_SHA256",
    "localSourceDirectory": "",
    "entrypoint": "worker.py",
    "requirementsFile": "requirements.txt",
    "requirePackage": true
  }
}
```

Tên miền backend và endpoint phát hành ở trên chỉ là ví dụ cho đến khi dịch vụ production được triển khai.

## 4. Kiểm thử trên cùng PC

HTTP loopback bị tắt theo mặc định. Chỉ bật cho API chạy trên cùng máy:

```json
{
  "backendBaseUrl": "http://127.0.0.1:8765",
  "allowInsecureLocalhost": true
}
```

Mọi URL HTTP không phải loopback đều bị từ chối. Môi trường production phải dùng HTTPS.

Nếu chỉ kiểm thử hạ tầng, có thể để nguồn gói Worker trống và đặt `requirePackage=false`. Trạng thái này chỉ chứng minh Python, MT5, cấu trúc file và dependency đã sẵn sàng; chưa chứng minh website có thể giao tác vụ.

## 5. Lưu ý về MT5

- Mặc định bootstrap dùng web installer chính thức của MetaQuotes.
- Nên dùng installer riêng của broker nếu terminal chung không tìm thấy máy chủ broker.
- Tham số dòng lệnh của installer có thể khác nhau giữa các broker; điều chỉnh `mt5.installArguments` khi cần.
- `sourceTerminalDirectory` có thể trỏ đến thư mục terminal đã cài sẵn; bootstrap sẽ sao chép vào `C:\GSN\mt5\terminal`.
- Worker phải khởi động `terminal64.exe` ở portable mode bằng một Windows session chuyên dụng có quyền ghi.

MetaQuotes có tài liệu chính thức cho tham số `/portable`, nhưng không chuẩn hóa tham số cài silent của mọi installer broker. Vì vậy bootstrap sẽ báo lỗi nếu không tìm thấy `terminal64.exe`, thay vì báo thành công giả.

## 6. Scheduled Task và khởi động lại

Mặc định bootstrap tạo Scheduled Task `ONLOGON` dưới tài khoản chạy bộ cài. Kiến trúc hiện tại yêu cầu MT5 hoạt động trong Windows session tương tác.

Sau khi VPS khởi động lại, tài khoản Windows chuyên dụng phải có session đăng nhập. Các phương án production cần được đánh giá bảo mật riêng:

- Tài khoản hạn chế với automatic logon được kiểm soát và mã hóa ổ đĩa.
- Session supervisor chủ động thiết lập phiên người dùng.
- Kiến trúc service/session đã được kiểm thử với terminal của broker mục tiêu.

Không tự ý đổi task sang tài khoản `SYSTEM`; session 0 có thể làm MT5 không hoạt động đúng.

## 7. Sửa chữa và xác minh

```powershell
powershell -ExecutionPolicy Bypass -File .\Repair-GSNWorker.ps1 -ConfigPath .\bootstrap.config.json
powershell -ExecutionPolicy Bypass -File .\Verify-GSNWorker.ps1
```

Trình xác minh kiểm tra:

- Cấu trúc đường dẫn `C:\GSN`.
- Python virtual environment.
- Các package `MetaTrader5`, `requests` và `psutil`.
- `terminal64.exe`.
- URL backend.
- Entrypoint của Worker.
- Scheduled Task.

Kết quả được ghi tại:

```text
C:\GSN\logs\verification-latest.json
```

## 8. Gỡ cài đặt

Chỉ xóa Scheduled Task và giữ dữ liệu:

```powershell
.\Uninstall-GSNWorker.ps1
```

Xóa toàn bộ cây thư mục chính xác `C:\GSN` sau khi xác nhận:

```powershell
.\Uninstall-GSNWorker.ps1 -RemoveData
```

Script từ chối xóa đệ quy nếu đường dẫn không đúng chính xác `C:\GSN`.

## 9. Kiểm thử khôi phục khi mất VPS

1. Tạo Windows VPS hoặc snapshot sạch.
2. Cung cấp cùng phiên bản bootstrap và cấu hình không chứa bí mật.
3. Chạy file BAT.
4. Đăng ký VPS bằng enrollment token mới.
5. Xác nhận heartbeat và phiên bản Worker trên Admin.
6. Chạy tác vụ nhập lịch sử từ 1 đến 7 ngày bằng tài khoản kiểm thử.
7. Đối chiếu ticket, số lượng và P/L với MT5.
8. Chạy lại bootstrap và xác nhận `workerId` không đổi trên cùng máy.
9. Thu hồi identity của VPS cũ trên Admin.

Bootstrap, template cấu hình, gói Worker và checksum phải được lưu ngoài VPS trong source control hoặc object storage. VPS phải được xem là tài nguyên có thể thay thế.

## 10. Lưu ý bảo mật và khả năng tái tạo

- Python và MT5 installer phải có chữ ký Authenticode hợp lệ.
- Gói Worker tải từ xa phải có SHA-256 được pin.
- Không lưu token hoặc mật khẩu vào source code và log.
- `workerId=AUTO` chỉ tạo ID một lần rồi tái sử dụng khi sửa chữa cùng máy.
- Chỉ cho phép HTTP loopback khi `allowInsecureLocalhost=true`.
- Trạng thái `ONLINE` phải do backend xác nhận qua heartbeat, không dựa vào báo cáo bootstrap.
- Khi mất VPS, phải thu hồi Worker cũ trước khi định tuyến tác vụ cho máy thay thế.

## 11. Tài liệu tham khảo chính thức

- Python silent installer: https://docs.python.org/3/using/windows.html
- Python 3.12.10: https://www.python.org/downloads/release/python-31210/
- MetaTrader 5 portable mode: https://www.metatrader5.com/en/terminal/help/start_advanced/start
- MT5 installer chính thức: https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe
