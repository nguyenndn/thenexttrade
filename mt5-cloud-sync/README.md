# MT5 Mobile Cloud Sync Module (`C:\laragon\www\gsn-crm\mt5-cloud-sync`)

Module độc lập phục vụ **User chỉ sử dụng Mobile (không có PC/EA)** đăng nhập và đồng bộ lịch sử giao dịch MT5 lên **GSN-CRM** theo chuẩn `TRADE_SYNC_SPECIFICATION.md`.

---

## 1. Cấu trúc thư mục

- `CloudSyncService.js` — Orchestrator chính gồm 2 bước:
  1. **`step1Login({ serverName, login, password })`**: Xác thực tài khoản theo `Server Name`, `Account ID (login)`, và `Password` (hỗ trợ cả **Master Password** lẫn **Investor Password / Passview**).
  2. **`step2GetHistoryAndSync({ serverName, login, password, from, to, days, syncKey, crmBaseUrl, autoPush })`**: Lọc lịch sử giao dịch theo khoảng thời gian `from -> to`, tái tạo `HistoryPosition`, đóng gói `heartbeatEnvelope` + `syncEnvelope` (tự động chia batch `<= 500 trades/request`) và đẩy vào `/api/ea/heartbeat` & `/api/ea/trades`.
- `apk/` — Bộ class port 1:1 từ `metatrader5.apk` (`classes.dex` + cấu trúc nhị phân `.dat` của `libcommon.so`):
  - `apk/brokers/BrokerInfoAPI.js` & `BrokerInfo.js` (`Lnet/metaquotes/brokers/BrokerInfoAPI;`)
  - `apk/terminal/ServersBase.js`, `AccountsBase.js`, `NetworkManager.js`, `TradesBase.js`
  - `apk/types/TradeTypes.js` (`TradeDeal` `0x2a8=680B`, `TradeOrder` `0x288=648B`, `HistoryPosition`, `PositionViewInfo`, `DealsInfoRecord`, `HistoryInfoRecord`)
  - `apk/ui/LoginViewModel_Lyk2.js`, `BrokerSearchViewModel_Lkv.js`
- `bases/<Server>/trades/<login>/` — Lưu trữ file container nhị phân `deals_YYYY.MM.dat` và `history_YYYY.MM.dat`.

---

## 2. Cách gọi trong GSN-CRM (Next.js Server Action / API Route)

```js
const { CloudSyncService } = require('../../../mt5-cloud-sync');
const cloudSync = CloudSyncService.getInstance();

// BƯỚC 1: User Mobile nhập Server Name, Account ID, Password (hoặc Passview)
const loginRes = await cloudSync.step1Login({
  serverName: 'STARTRADERFinancial-Demo',
  login: '1610076507',
  password: 'Fzb*6Xsm' // Hoặc Investor Password (passview)
});

// BƯỚC 2: Lấy lịch sử giao dịch theo mốc thời gian (from -> to) và Sync lên GSN-CRM
const syncRes = await cloudSync.step2GetHistoryAndSync({
  serverName: 'STARTRADERFinancial-Demo',
  login: '1610076507',
  password: 'Fzb*6Xsm',
  from: '2026-10-15',
  to: '2026-11-06',
  syncKey: userSyncKey, // X-Sync-Key của user hoặc TradingAccount.apiKey
  crmBaseUrl: 'http://localhost:3000',
  autoPush: true
});
```
