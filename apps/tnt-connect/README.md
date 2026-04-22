# TNT Connect

Lightweight system tray app that syncs MT5 trades to [TheNextTrade](https://thenexttrade.com).

## Features

- 🔗 **Auto-connect**: Detects MT5 terminal on your PC
- 🔄 **Auto-sync**: Polls positions & deals, sends to web dashboard
- 🟢 **System tray**: Color-coded status icon (green/yellow/red)
- 🔑 **One API key**: Single user-level key for all trading accounts
- 🖥️ **Background**: MT5 runs silently — trade on mobile, sync on PC

## Quick Start

1. Go to [TheNextTrade Settings](https://thenexttrade.com/dashboard/settings) → **TNT Connect** → Generate API Key
2. Download `TNTConnect.exe`
3. Run → Right-click tray icon → **Settings** → Paste API Key → Save
4. Done! ✅

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run
python main.py
```

## Build .exe

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name TNTConnect --icon icon.ico main.py
```

## Architecture

```
main.py          → System tray app (pystray)
sync_engine.py   → Core sync loop
mt5_bridge.py    → MetaTrader5 connection
api_client.py    → TheNextTrade API client
config.py        → Settings manager
```
