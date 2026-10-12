# Specification: EA Trade Manager Balance Check ($200 USD Minimum)

> **Tài liệu bàn giao kỹ thuật:** Dành cho Developer phụ trách phát triển EA Trade Manager (MetaTrader 5 - MQL5).
> **Hệ thống áp dụng:** TheNextTrade VIP Platform & GSN Trade Manager EA.
> **Mục tiêu:** Đồng bộ yêu cầu số dư ký quỹ tối thiểu **$200 USD** giữa Server (Next.js API) và Client (MT5 EA) ngay từ lần kết nối đầu tiên.

---

## 1. Tổng quan Luồng Logic (Architecture Flow)

```
[MT5 EA Init / Heartbeat]
         │
         ├── 1. Đọc AccountInfoDouble(ACCOUNT_BALANCE) & ACCOUNT_TRADE_MODE
         │
         ├── 2. Gửi Heartbeat lên Server: POST /api/ea/heartbeat
         │      (kèm balance, equity, currency, broker, server, tradeMode)
         │
         ▼
[TheNextTrade Server API]
         │
         ├── Chuẩn hóa Cent/USC -> USD (nếu tài khoản Cent: chia 100)
         │
         ├── Kiểm tra Trade Mode:
         │     ├── DEMO Account  ──► Cho phép kết nối (Testing tự do)
         │     │
         │     └── REAL Account  ──► Kiểm tra Balance >= $200 USD
         │                             ├── Balance >= 200 ──► HTTP 200 OK (Kích hoạt VIP)
         │                             └── Balance < 200  ──► HTTP 403 Forbidden (Từ chối)
         ▼
[EA Trade Manager Nhận Phản Hồi]
         │
         ├── Nhận 200 OK  ──► Bật Trade Manager, hiển thị trạng thái "TheNextTrade VIP: CONNECTED"
         │
         └── Nhận 403 / BALANCE_TOO_LOW ──►
               1. Hiện thông báo cảnh báo rõ trên biểu đồ (Chart Object / Alert):
                  "Tài khoản cần tối thiểu $200 để kết nối TheNextTrade VIP"
               2. Tắt các tính năng auto-trade / trade manager bảo vệ tài khoản
               3. Ngắt hoặc tạm dừng chu kỳ gửi lệnh
```

---

## 2. Đặc tả API Phía Server

### Endpoint Heartbeat
- **URL:** `POST https://thenexttrade.com/api/ea/heartbeat` *(hoặc domain staging tương ứng)*
- **Headers:**
  ```http
  Content-Type: application/json
  X-Sync-Key: <USER_OR_ACCOUNT_SYNC_KEY>
  ```

### Request Payload (Gửi từ EA)
```json
{
  "eaVersion": "2.4.0",
  "accountNumber": 12345678,
  "broker": "Vantage Markets",
  "server": "Vantage-Live",
  "currency": "USD",
  "balance": 150.00,
  "equity": 150.00,
  "leverage": 500,
  "accountTradeMode": "REAL",
  "clientTime": "2026-09-25T11:45:00Z"
}
```

> **Lưu ý quan trọng về tài khoản Cent/USC:**
> Server đã tích hợp logic chuẩn hóa tự động:
> - Nếu `currency == "USC"` hoặc server chứa từ khóa `"cent"`, server tự quy đổi: `effectiveUsdBalance = balance / 100`.
> - Do đó, với tài khoản Cent, balance gửi lên là `20,000 USC` thì server nhận diện đúng là `$200 USD` (đủ điều kiện). Nếu gửi `15,000 USC` = `$150 USD` (chưa đủ điều kiện).

---

### Response từ Server

#### Trường hợp 1: Đủ điều kiện (Balance >= $200 hoặc DEMO)
- **HTTP Status:** `200 OK`
- **Body:**
```json
{
  "success": true,
  "autoSync": true,
  "serverTime": "2026-09-25T11:45:01.123Z",
  "balanceEligible": true,
  "minBalanceRequired": 200
}
```

#### Trường hợp 2: Số dư không đủ (REAL Account có Balance < $200 USD)
- **HTTP Status:** `403 Forbidden`
- **Body:**
```json
{
  "success": false,
  "error": "INSUFFICIENT_BALANCE",
  "code": "BALANCE_TOO_LOW",
  "message": "Tài khoản cần tối thiểu $200 để kết nối TheNextTrade VIP.",
  "currentBalance": 150,
  "minBalanceRequired": 200,
  "autoSync": false,
  "serverTime": "2026-09-25T11:45:01.123Z"
}
```

---

## 3. Hướng dẫn Lập trình phía EA MT5 (MQL5)

### Bước 1: Kiểm tra cục bộ ngay tại `OnInit()` (Client-side Fast Check)

EA nên kiểm tra số dư ngay khi load lên chart để cảnh báo sớm cho trader mà chưa cần đợi mạng:

```mql5
//+------------------------------------------------------------------+
//| Helper kiểm tra số dư tối thiểu $200                             |
//+------------------------------------------------------------------+
bool CheckMinBalanceLocal()
{
    // Kiểm tra loại tài khoản (Demo cho phép bỏ qua)
    ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
    if(tradeMode == ACCOUNT_TRADE_MODE_DEMO || tradeMode == ACCOUNT_TRADE_MODE_CONTEST)
    {
        return true; // Demo không bắt buộc $200
    }

    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    string currency = AccountInfoString(ACCOUNT_CURRENCY);
    string server = AccountInfoString(ACCOUNT_SERVER);

    // Chuẩn hóa tài khoản Cent
    double effectiveUsd = balance;
    StringToUpper(currency);
    StringToUpper(server);
    if(currency == "USC" || StringFind(server, "CENT") >= 0)
    {
        effectiveUsd = balance / 100.0;
    }

    if(effectiveUsd < 200.0)
    {
        PrintFormat("[TheNextTrade VIP] CẢNH BÁO: Số dư hiện tại $%.2f USD < $200 USD yêu cầu.", effectiveUsd);
        ShowChartWarning("Tài khoản cần tối thiểu $200 để kết nối TheNextTrade VIP");
        return false;
    }

    return true;
}
```

---

### Bước 2: Xử lý phản hồi từ API `/api/ea/heartbeat`

Khi hàm gửi WebRequest của EA nhận response từ server:

```mql5
//+------------------------------------------------------------------+
//| Xử lý mã phản hồi HTTP từ Heartbeat API                         |
//+------------------------------------------------------------------+
void HandleHeartbeatResponse(int httpCode, const string &responseBody)
{
    if(httpCode == 200)
    {
        // Kết nối hợp lệ và VIP kích hoạt
        ClearChartWarning();
        ShowChartStatus("TheNextTrade VIP: CONNECTED", clrLimeGreen);
        g_IsVipActive = true;
    }
    else if(httpCode == 403)
    {
        // Kiểm tra xem có phải mã từ chối do Balance < $200 không
        if(StringFind(responseBody, "BALANCE_TOO_LOW") >= 0 || 
           StringFind(responseBody, "INSUFFICIENT_BALANCE") >= 0)
        {
            g_IsVipActive = false;
            
            // 1. In log cảnh báo vào Terminal Experts
            Print("[TheNextTrade VIP] Kết nối bị từ chối: Số dư tài khoản dưới $200 USD.");
            
            // 2. Hiển thị thông báo màu đỏ nổi bật trực tiếp trên Chart
            ShowChartWarning("Tài khoản cần tối thiểu $200 để kết nối TheNextTrade VIP");
            
            // 3. Tắt tính năng tự động giao dịch của Trade Manager
            DisableTradeManagement();
        }
        else
        {
            ShowChartWarning("Kết nối TheNextTrade bị từ chối (HTTP 403)");
            g_IsVipActive = false;
        }
    }
    else
    {
        PrintFormat("[TheNextTrade] Heartbeat status code: %d", httpCode);
    }
}
```

---

### Bước 3: Hàm hiển thị cảnh báo lên Chart (`ShowChartWarning`)

Để trader nắm rõ lý do và nạp đủ tiền, EA nên vẽ 1 Label hoặc Rectangle Banner ở góc trên biểu đồ:

```mql5
void ShowChartWarning(const string text)
{
    string objName = "TNT_Warning_Label";
    if(ObjectFind(0, objName) < 0)
    {
        ObjectCreate(0, objName, OBJ_LABEL, 0, 0, 0);
        ObjectSetInteger(0, objName, OBJPROP_CORNER, CORNER_LEFT_UPPER);
        ObjectSetInteger(0, objName, OBJPROP_XDISTANCE, 20);
        ObjectSetInteger(0, objName, OBJPROP_YDISTANCE, 40);
        ObjectSetInteger(0, objName, OBJPROP_FONTSIZE, 11);
        ObjectSetString(0, objName, OBJPROP_FONT, "Arial Bold");
    }
    
    ObjectSetInteger(0, objName, OBJPROP_COLOR, clrRed);
    ObjectSetString(0, objName, OBJPROP_TEXT, "⚠️ " + text);
    ChartRedraw(0);
}

void ClearChartWarning()
{
    ObjectDelete(0, "TNT_Warning_Label");
    ChartRedraw(0);
}
```

---

## 4. Bảng kiểm tra Nghiệm thu (Test Cases cho Dev EA)

| STT | Kịch bản kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi trên MT5 | Kết quả Server |
|---|---|---|---|---|
| **1** | Tài khoản Real có Balance $250 USD | `balance: 250`, `mode: REAL` | EA kết nối thành công, badge xanh "VIP CONNECTED" | HTTP 200, `balanceEligible: true` |
| **2** | Tài khoản Real có Balance $150 USD | `balance: 150`, `mode: REAL` | EA hiện chữ đỏ: *"Tài khoản cần tối thiểu $200 để kết nối TheNextTrade VIP"*, ngắt trade manager | HTTP 403, `code: BALANCE_TOO_LOW` |
| **3** | Tài khoản Cent có Balance 25,000 USC ($250 USD) | `balance: 25000`, `currency: USC` | Server nhận diện $250 USD -> Kết nối thành công | HTTP 200, `balanceEligible: true` |
| **4** | Tài khoản Cent có Balance 15,000 USC ($150 USD) | `balance: 15000`, `currency: USC` | Server nhận diện $150 USD -> Bị từ chối < $200 | HTTP 403, `code: BALANCE_TOO_LOW` |
| **5** | Tài khoản Demo có Balance $50 USD | `balance: 50`, `mode: DEMO` | Cho phép chạy bình thường để test tính năng EA | HTTP 200, `balanceEligible: true` |

---

## 5. Hỗ trợ & Liên hệ
Nếu có bất kỳ thắc mắc nào trong quá trình tích hợp payload WebRequest hoặc xử lý mã lỗi HTTP 403, vui lòng liên hệ Admin qua kênh nội bộ.
