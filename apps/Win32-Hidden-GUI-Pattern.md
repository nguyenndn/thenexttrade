# 🖥️ Win32 Hidden GUI — Design Pattern

> Điều khiển ẩn/hiện window của ứng dụng Windows từ Node.js/Electron thông qua Win32 API.

## Bối Cảnh

Pattern này được phát triển cho **PVSRC Station** — một Electron app quản lý fleet 20+ MT5 terminals chạy headless trên Windows. Mỗi terminal cần khởi động ẩn hoàn toàn, nhưng user có thể bấm nút **GUI** để hiện/ẩn bất kỳ terminal nào on-demand.

**Ứng dụng rộng hơn**: Bất kỳ dự án nào cần spawn child process trên Windows mà giấu GUI — ví dụ: bot automation, trading platform, monitoring daemon, game launcher background mode...

---

## Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│  RENDERER (UI)                                              │
│  ┌──────────────────┐                                       │
│  │  [GUI] Button     │──onClick──► toggleGui(id)            │
│  │  (toggle style)   │            ├─ showGui → IPC invoke   │
│  └──────────────────┘            └─ hideGui → IPC invoke   │
├─────────────────────────────────────────────────────────────┤
│  PRELOAD (Bridge)                                           │
│  showGui: (id) => ipcRenderer.invoke('client:show-gui', id) │
│  hideGui: (id) => ipcRenderer.invoke('client:hide-gui', id) │
├─────────────────────────────────────────────────────────────┤
│  MAIN PROCESS (Backend)                                     │
│  ipcMain.handle('client:show-gui') → processManager.show() │
│  ipcMain.handle('client:hide-gui') → processManager.hide() │
│  + update registry { guiVisible: true/false }               │
├─────────────────────────────────────────────────────────────┤
│  PROCESS MANAGER (OS Interface)                             │
│  showWindow(pid) → _setVisibility(pid, SW_RESTORE=9)       │
│  hideWindow(pid) → _setVisibility(pid, SW_HIDE=0)          │
│  ↓                                                          │
│  Generate .ps1 temp file → PowerShell exec → Win32 API     │
├─────────────────────────────────────────────────────────────┤
│  WIN32 API (user32.dll)                                     │
│  EnumWindows → GetWindowThreadProcessId → filter by PID     │
│  → ShowWindowAsync(hwnd, cmdShow)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3 Vấn Đề Phải Giải Quyết

### 1. Process Forking
Nhiều app Windows (MT5, Chrome, etc.) **tự fork** khi khởi động. PID gốc chết, PID mới thay thế.
```
spawn() → PID 1234 (gốc, chết sau 2s)
         → PID 5678 (thật, chạy tiếp)
```
→ Không thể ghi nhớ PID/Handle từ `spawn()`.

### 2. Hidden Window Mất Handle
Khi window bị `SW_HIDE`, `Process.MainWindowHandle` trở thành `null`. Không tìm lại được bằng API thông thường.

→ Phải dùng `EnumWindows` — duyệt **tất cả** windows kể cả ẩn.

### 3. Window Flash
Từ lúc `spawn()` đến lúc code ẩn window → có vài trăm ms window hiện ra rồi biến mất (nhấp nháy).

→ **Chiến lược 3 pha** bên dưới.

---

## Chiến Lược 3 Pha Khởi Động (Zero Flash)

Đây là core innovation — đảm bảo **không có frame nào** của window hiển thị cho user:

```
PHA 1: spawn({ windowsHide: true })
       ↓ hint cho OS ẩn, nhưng không guarantee cho GUI apps
       
PHA 2: Background Hide Loop (PowerShell nền)
       ↓ polling mỗi 500ms × 40 lần = 20 giây
       ↓ EnumWindows → tìm mọi window của process → SW_HIDE
       ↓ bắt được cả PID mới do fork
       
PHA 3: Explicit Hide (sau khi có real PID)
       ↓ await sleep(4000) — đợi fork xong
       ↓ findRunningPID → _setVisibility(realPid, SW_HIDE)
       ↓ safety net cuối cùng ✅
```

### Tại sao cần cả 3 pha?

| Pha | Xử lý vấn đề | Hạn chế |
|-----|--------------|---------|
| 1 | Console apps | Không guarantee cho GUI apps |
| 2 | Fork timing bất định | Chạy nền 20s, overhead nhỏ |
| 3 | Đảm bảo cuối | Chỉ hiệu quả khi đã tìm được real PID |

---

## Win32 API Reference

### Các API sử dụng (user32.dll)

| API | Mục đích |
|-----|----------|
| `EnumWindows(callback, lParam)` | Duyệt tất cả top-level windows (kể cả hidden) |
| `GetWindowThreadProcessId(hwnd, out pid)` | Lấy PID sở hữu window |
| `GetWindowTextLength(hwnd)` | Lọc: chỉ window có title (bỏ system/tooltip windows) |
| `ShowWindowAsync(hwnd, cmdShow)` | Ẩn/Hiện window — **non-blocking**, tránh deadlock |
| `SetForegroundWindow(hwnd)` | Đưa lên foreground (chỉ dùng khi show) |
| `IsWindowVisible(hwnd)` | Kiểm tra trạng thái |

### ShowWindow Constants

```
SW_HIDE    = 0  → Ẩn hoàn toàn (biến mất khỏi taskbar)
SW_SHOW    = 5  → Hiện window
SW_RESTORE = 9  → Khôi phục (xử lý cả minimized) ← LUÔN DÙNG CÁI NÀY
SW_MINIMIZE= 6  → Thu nhỏ xuống taskbar
SW_MAXIMIZE= 3  → Phóng to
```

### Tại sao `ShowWindowAsync` chứ không phải `ShowWindow`?

- `ShowWindow`: **synchronous** — block thread cho đến khi target process phản hồi
- `ShowWindowAsync`: gửi message rồi **return ngay** — không bao giờ deadlock
- Nếu target app bị treo → `ShowWindow` sẽ kéo caller treo theo

---

## Code — WindowVisibilityManager

Class standalone, copy-paste vào bất kỳ Node.js project nào:

```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class WindowVisibilityManager {
  constructor() {
    this._hideLoopPids = new Map(); // key → { pid, script }
  }

  // ──────────────── PUBLIC API ────────────────

  /** Ẩn tất cả windows của PID */
  hideWindow(pid) {
    return this._setVisibility(pid, 0); // SW_HIDE
  }

  /** Hiện tất cả windows của PID */
  showWindow(pid) {
    // QUAN TRỌNG: Tắt mọi hide loop trước (tránh fight)
    for (const [key] of this._hideLoopPids) {
      this._stopHideLoop(key);
    }
    return this._setVisibility(pid, 9); // SW_RESTORE
  }

  /** Kiểm tra window đang visible hay không */
  isWindowVisible(pid) {
    return new Promise((resolve) => {
      if (!pid) return resolve(false);
      const script = this._writeTempScript(`
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W32V {
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  public delegate bool EWNP(IntPtr h, IntPtr lp);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EWNP cb, IntPtr lp);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  public static bool Check(uint tp) {
    bool v = false;
    EnumWindows((h, lp) => { 
      uint wp; GetWindowThreadProcessId(h, out wp);
      if (wp == tp && GetWindowTextLength(h) > 0) { if (IsWindowVisible(h)) v = true; }
      return true; 
    }, IntPtr.Zero);
    return v;
  }
}
"@
if ([W32V]::Check(${pid})) { Write-Output 'VISIBLE' } else { Write-Output 'HIDDEN' }
`);
      const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      let out = '';
      child.stdout.on('data', (d) => { out += d.toString(); });
      child.on('close', () => {
        this._deleteTempScript(script);
        resolve(out.includes('VISIBLE'));
      });
    });
  }

  /**
   * Background Hide Loop — polling ẩn window liên tục
   * Dùng khi app target tự fork (PID thay đổi runtime)
   *
   * @param {string} key          - ID duy nhất (vd: folder name)
   * @param {string} processName  - Tên process (không có .exe)
   * @param {string} pathFilter   - Wildcard cho process path
   * @param {number} durationMs   - Tổng thời gian poll (default 20000)
   * @param {number} intervalMs   - Khoảng giữa mỗi poll (default 500)
   */
  startHideLoop(key, processName, pathFilter, durationMs = 20000, intervalMs = 500) {
    this._stopHideLoop(key); // Tắt loop cũ nếu có
    const iterations = Math.ceil(durationMs / intervalMs);

    const script = this._writeTempScript(`
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class W32H {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int c);
  public delegate bool EWNP(IntPtr h, IntPtr lp);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EWNP cb, IntPtr lp);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  public static void HideWindowsForPids(uint[] pids) {
    var pidsSet = new HashSet<uint>(pids);
    EnumWindows((h, lp) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pidsSet.Contains(pid) && GetWindowTextLength(h) > 0) { ShowWindowAsync(h, 0); }
      return true;
    }, IntPtr.Zero);
  }
}
"@
for ($$i = 0; $$i -lt ${iterations}; $$i++) {
  $$pids = Get-Process -Name ${processName} -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like '${pathFilter}' } | Select-Object -ExpandProperty Id
  if ($$pids) {
    $$pidArray = [uint[]]@($$pids)
    [W32H]::HideWindowsForPids($$pidArray)
  }
  Start-Sleep -Milliseconds ${intervalMs}
}
`);

    const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], {
      detached: true,
      windowsHide: true,
      stdio: 'ignore',
    });
    child.unref();
    this._hideLoopPids.set(key, { pid: child.pid, script });

    // Auto cleanup sau khi hết thời gian
    setTimeout(() => {
      if (this._hideLoopPids.has(key)) this._stopHideLoop(key);
    }, durationMs + 1000);
  }

  stopHideLoop(key) {
    this._stopHideLoop(key);
  }

  // ──────────────── PRIVATE ────────────────

  _setVisibility(pid, cmdShow) {
    return new Promise((resolve, reject) => {
      if (!pid) return reject(new Error('No PID'));

      // Chỉ bring to foreground khi SHOW (không cần khi HIDE)
      const foreground = cmdShow !== 0
        ? '[W32]::SetForegroundWindow($hwnd) | Out-Null'
        : '';

      const script = this._writeTempScript(`
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class W32 {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  public delegate bool EWNP(IntPtr h, IntPtr lp);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EWNP cb, IntPtr lp);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  public static List<IntPtr> FindByPid(uint tp) {
    var r = new List<IntPtr>();
    EnumWindows((h, lp) => { uint wp; GetWindowThreadProcessId(h, out wp);
      if (wp == tp && GetWindowTextLength(h) > 0) r.Add(h); return true; }, IntPtr.Zero);
    return r;
  }
}
"@
$$wins = [W32]::FindByPid(${pid})
if ($$wins.Count -gt 0) {
  foreach ($$hwnd in $$wins) {
    [W32]::ShowWindowAsync($$hwnd, ${cmdShow}) | Out-Null
    ${foreground}
  }
  Write-Output 'OK'
} else { Write-Output 'NOTFOUND' }
`);

      const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      let out = '';
      child.stdout.on('data', (d) => { out += d.toString(); });
      child.on('close', () => {
        this._deleteTempScript(script);
        out.includes('OK') ? resolve(true) : reject(new Error(`Window not found for PID ${pid}`));
      });
    });
  }

  _stopHideLoop(key) {
    const info = this._hideLoopPids.get(key);
    if (!info) return;
    try { process.kill(info.pid); } catch {}
    this._deleteTempScript(info.script);
    this._hideLoopPids.delete(key);
  }

  _writeTempScript(content) {
    // $$ in JS template → single $ for PowerShell
    const psContent = content.replace(/\$\$/g, '$');
    const scriptPath = path.join(
      os.tmpdir(),
      `wvm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.ps1`
    );
    fs.writeFileSync(scriptPath, psContent, 'utf8');
    return scriptPath;
  }

  _deleteTempScript(scriptPath) {
    try { fs.unlinkSync(scriptPath); } catch {}
  }
}

module.exports = WindowVisibilityManager;
```

---

## Cách Sử Dụng

### 1. Khởi chạy process ẩn hoàn toàn (3 pha)

```javascript
const { spawn } = require('child_process');
const WindowVisibilityManager = require('./window-visibility-manager');
const wvm = new WindowVisibilityManager();

async function startHidden(exePath, folder, processName) {
  // PHA 1 — Spawn với hint ẩn
  const child = spawn(exePath, [], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
    cwd: folder,
  });
  child.unref();

  // PHA 2 — Background hide loop (bắt fork)
  wvm.startHideLoop(
    folder,                                    // unique key
    processName,                               // e.g. 'terminal64'
    `*\\${require('path').basename(folder)}\\*`, // path wildcard
    20000,                                     // 20s polling
    500                                        // mỗi 500ms
  );

  // Đợi process fork xong
  await new Promise(r => setTimeout(r, 4000));
  const realPid = await findRunningPID(processName, folder);

  // PHA 3 — Explicit hide (safety net)
  await wvm.hideWindow(realPid).catch(() => {});

  return realPid;
}
```

### 2. Toggle GUI on-demand

```javascript
// Hiện GUI
await wvm.showWindow(pid);  // SW_RESTORE + SetForegroundWindow

// Ẩn GUI
await wvm.hideWindow(pid);  // SW_HIDE

// Kiểm tra trạng thái
const visible = await wvm.isWindowVisible(pid); // true/false
```

### 3. Tích hợp Electron IPC

```javascript
// ─── preload.js ───
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  showGui: (id) => ipcRenderer.invoke('process:show-gui', id),
  hideGui: (id) => ipcRenderer.invoke('process:hide-gui', id),
});

// ─── main.js ───
const { ipcMain } = require('electron');

ipcMain.handle('process:show-gui', async (_, id) => {
  const item = registry.get(id);
  if (!item?.pid) return { success: false, error: 'Not running' };
  try {
    await wvm.showWindow(item.pid);
    item.guiVisible = true;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('process:hide-gui', async (_, id) => {
  const item = registry.get(id);
  if (!item?.pid) return { success: false, error: 'Not running' };
  try {
    await wvm.hideWindow(item.pid);
    item.guiVisible = false;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── renderer.js ───
async function toggleGui(id) {
  const client = clients.find(c => c.id === id);
  if (!client || client.status !== 'running') return;

  if (!client.guiVisible) {
    await window.api.showGui(id);
  } else {
    await window.api.hideGui(id);
  }
}
```

---

## Lưu Ý Quan Trọng (Gotchas)

### ⚠️ PowerShell `$$` Escaping

PowerShell dùng `$` cho biến, JS template literals cũng dùng `${}`. Giải pháp:

```javascript
// Trong JS template:
$$wins = [W32]::FindByPid(${pid})
// ${pid}  → JS interpolation → giá trị thật (vd: 12345)
// $$      → replace thành $ → biến PowerShell

// Output ra file .ps1:
$wins = [W32]::FindByPid(12345)
```

### ⚠️ Show/Hide Loop Conflict

Nếu user bấm **Show GUI** khi hide loop đang chạy → 2 script sẽ "fight" nhau (show ↔ hide mỗi 500ms).

**Giải pháp**: `showWindow()` **PHẢI** stop tất cả hide loops trước khi set visibility.

### ⚠️ UAC & Privileges

- `EnumWindows` + `ShowWindowAsync` chỉ hoạt động với process **cùng privilege level**
- Nếu target chạy **elevated (Admin)**, caller cũng phải elevated
- Process cùng user, cùng session → không cần quyền đặc biệt

### ⚠️ Temp Script Cleanup

- Mỗi lần gọi Win32 API → tạo 1 file `.ps1` trong `%TEMP%`
- Luôn cleanup trong `on('close')` callback
- App crash → temp rác tích lũy (OS dọn định kỳ)

### ⚠️ Multiple GUI Windows

`EnumWindows` filter `GetWindowTextLength > 0` sẽ bắt **tất cả** windows có title của PID đó. Nếu app có nhiều cửa sổ (main + dialog), tất cả sẽ bị ẩn/hiện cùng lúc.

---

## State Management

Theo dõi trạng thái `guiVisible` trong registry:

```javascript
// Registry entry
{
  id: 'client_01',
  pid: 12345,
  status: 'running',
  guiVisible: false,   // ← Track trạng thái GUI
}

// Khi nào đổi:
// start()             → guiVisible = false (mặc định ẩn)
// showGui thành công  → guiVisible = true
// hideGui thành công  → guiVisible = false
// stop()              → reset, không còn relevant

// Cleanup stale state (renderer side):
onClientsUpdated((clients) => {
  for (const c of clients) {
    if (c.status !== 'running') c.guiVisible = false;
  }
});
```

---

## Yêu Cầu Hệ Thống

| Yêu cầu | Chi tiết |
|----------|----------|
| **OS** | Windows 10+ (có PowerShell 5.1+) |
| **Runtime** | Node.js 16+ |
| **PowerShell** | ExecutionPolicy phải cho phép Bypass (dùng flag `-ExecutionPolicy Bypass`) |
| **Privileges** | Cùng level với target process (thường không cần Admin) |

---

## Checklist Triển Khai Nhanh

```
□ Copy WindowVisibilityManager class vào project
□ Implement start flow 3 pha (windowsHide → hide loop → explicit hide)
□ Tạo IPC routes: show-gui / hide-gui
□ Track guiVisible state trong registry/store
□ UI toggle button với visual feedback (active/inactive)
□ showWindow() tắt hide loops trước khi show
□ Cleanup hide loop khi process stop
□ Reset guiVisible khi process crash/stop
□ Test UAC: nếu target app cần Admin → caller cần Admin
```

---

*Design pattern by PVSR Capital — April 2026*
