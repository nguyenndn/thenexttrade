# TNT Connect

Lightweight system tray app that syncs MT5 trades to [TheNextTrade](https://thenexttrade.com).

## Features

- 🔗 **Auto-connect**: Detects MT5 terminal on your PC
- 🔄 **Auto-sync**: Polls positions & deals, sends to web dashboard
- 🟢 **System tray**: Color-coded status icon (green/yellow/red)
- 🔑 **One API key**: Single user-level key for all trading accounts
- 🖥️ **Background**: MT5 runs silently — trade on mobile, sync on PC

## Architecture

```
main.py          → System tray app (pystray)
sync_engine.py   → Core sync loop
mt5_bridge.py    → MetaTrader5 connection
api_client.py    → TheNextTrade API client
config.py        → Settings manager
ui_components.py → Settings UI (pywebview)
updater.py       → Auto-update check
```

---

## For End Users

1. Go to [TheNextTrade Settings](https://thenexttrade.com/dashboard/settings) → **TNT Connect** → Generate API Key
2. Download `TNTConnect.exe`
3. Run → Right-click tray icon → **Settings** → Paste API Key → Save
4. Done! ✅

---

## For Developers

### Prerequisites

- **Python 3.10+** (Download: https://www.python.org/downloads/)
  - ⚠️ During install, check **"Add Python to PATH"**
- **MetaTrader 5** terminal installed and running
- **Git Bash** (recommended for commands below)

---

### Setup (First Time)

Open terminal in the `apps/tnt-connect` folder:

```bash
# 1. Navigate to the app folder
cd C:\laragon\www\gsn-crm\apps\tnt-connect

# 2. Create virtual environment (isolated Python — won't mess up your system)
python -m venv venv

# 3. Activate virtual environment
venv\Scripts\activate
# You should see (venv) at the beginning of your terminal prompt

# 4. Install all dependencies
pip install -r requirements.txt

# 5. Run the app
python main.py
```

> **What is `venv`?**
> A virtual environment (`venv`) is an isolated folder that contains its own Python + packages.
> This way, TNT Connect's dependencies don't conflict with other Python projects on your PC.
> Think of it as a "sandbox" — everything stays inside the `venv/` folder.

---

### Daily Development

After the first-time setup, you only need 2 commands:

```bash
# 1. Activate the virtual environment
cd C:\laragon\www\gsn-crm\apps\tnt-connect
venv\Scripts\activate

# 2. Run
python main.py
```

To **deactivate** the virtual environment when done:

```bash
deactivate
```

---

### If You Get Errors

#### "Module not found" error

```bash
# Make sure venv is active (you should see "(venv)" in prompt)
venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### "MetaTrader5 not found" error

- Make sure MT5 terminal is **installed and has been opened at least once**
- MT5 does NOT need to be running — the app will connect automatically

#### "Python not found" error

- Install Python 3.10+ from https://www.python.org/downloads/
- Make sure to check **"Add Python to PATH"** during installation
- Restart your terminal after installing

#### Want to start fresh

```bash
# Delete the virtual environment and recreate
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### Build .exe (for distribution)

```bash
# Make sure venv is active
venv\Scripts\activate

# Install build tool
pip install pyinstaller

# Build
pyinstaller build.spec --clean --noconfirm

# Output: dist/TNTConnect.exe
```

Or simply double-click `build.bat` (handles everything automatically).

---

### Cheat Sheet

| Task | Command |
|------|---------|
| Activate venv | `venv\Scripts\activate` |
| Deactivate venv | `deactivate` |
| Install deps | `pip install -r requirements.txt` |
| Run app | `python main.py` |
| Add new package | `pip install <package>` then `pip freeze > requirements.txt` |
| Build .exe | `pyinstaller build.spec --clean --noconfirm` |
| Delete venv | `rmdir /s /q venv` |
| Recreate venv | `python -m venv venv` |
