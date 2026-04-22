"""
TheNextTrade Connect v3 — PyWebView Desktop App
Beautiful web-based UI with Python MT5 backend.
"""

import logging
import os
import sys
import json
import threading
import webbrowser
import webview
from typing import Optional
from mt5_bridge import find_all_mt5_paths
from updater import AutoUpdater

from PIL import Image, ImageDraw

from config import load_config, save_config, get_log_path, get_config_dir, acquire_lock, release_lock
from sync_engine import SyncEngine

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(get_log_path(), encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("tnt-connect")

VERSION = "1.0.0"

try:
    import pystray
    from pystray import MenuItem as Item
except ImportError:
    pystray = None


def get_web_dir():
    """Get the web assets directory."""
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, 'web')
    return os.path.join(os.path.dirname(__file__), 'web')


def create_tray_icon(color="gray"):
    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = {"green": (0, 200, 136), "yellow": (255, 193, 7), "red": (239, 68, 68), "gray": (156, 163, 175)}.get(color, (156, 163, 175))
    d.ellipse([4, 4, 60, 60], fill=c)
    d.ellipse([16, 16, 48, 48], fill=(15, 17, 23))
    d.ellipse([24, 24, 40, 40], fill=c)
    return img


class API:
    """Python API exposed to JavaScript via pywebview."""

    def __init__(self, window_ref):
        self._window_ref = window_ref
        self.config = load_config()
        self.engine: Optional[SyncEngine] = None
        self.tray_icon = None
        self.paused_accounts: set = set()
        self._status = "disconnected"
        self._status_msg = ""
        self._logs: list[str] = []
        self._web_accounts: list[dict] = []
        self._mt5_account: Optional[str] = None
        self.updater = AutoUpdater(
            current_version=VERSION,
            api_base_url=self.config.get("api_base_url", "https://thenexttrade.com"),
        )

    def get_version(self):
        return VERSION

    def check_for_updates(self):
        """Check for app updates. Only runs in frozen (exe) mode."""
        if not getattr(sys, 'frozen', False):
            return {"hasUpdate": False, "currentVersion": VERSION, "dev": True}
        result = self.updater.check_for_updates()
        if result.get("hasUpdate"):
            self._emit("onUpdateAvailable", result)
        return result

    def install_update(self):
        """Download and install the update."""
        def on_progress(pct):
            self._emit("onUpdateProgress", {"progress": pct})

        def on_complete(success, message):
            self._emit("onUpdateComplete", {"success": success, "message": message})
            if success:
                # Give frontend a moment to show message, then exit
                import time
                time.sleep(2)
                self.quit_app()

        self.updater.download_and_install(on_progress=on_progress, on_complete=on_complete)
        return {"ok": True}

    def get_config(self):
        return self.config

    def save_config(self, config_json: str):
        data = json.loads(config_json)
        self.config.update(data)
        save_config(self.config)
        return {"ok": True}

    def get_status(self):
        return {
            "status": self._status,
            "message": self._status_msg,
            "accounts": self._web_accounts,
            "mt5Account": self._mt5_account,
            "pausedAccounts": list(self.paused_accounts),
        }

    def get_logs(self):
        return self._logs[-100:]

    def detect_mt5(self):
        """Scan for all MT5 installations on this PC."""
        installations = find_all_mt5_paths()
        saved_path = self.config.get("mt5_path", "")
        return {
            "installations": installations,
            "savedPath": saved_path,
        }

    def connect(self, api_key: str, api_url: str, mt5_path: str = ""):
        self.config["api_key"] = api_key
        self.config["api_base_url"] = api_url
        if mt5_path:
            self.config["mt5_path"] = mt5_path
        save_config(self.config)

        if self.engine:
            self.engine.stop()

        self._set_status("connecting", "Connecting to TheNextTrade...")

        self.engine = SyncEngine(
            config=self.config,
            on_status_change=self._on_engine_status,
            on_accounts_loaded=self._on_accounts_loaded,
            on_log=self._on_log,
        )
        self.engine.start()
        return {"ok": True}

    def disconnect(self):
        if self.engine:
            self.engine.stop()
            self.engine = None
        self._set_status("disconnected", "Disconnected")
        self._web_accounts = []
        self._mt5_account = None
        self._emit("onDisconnected", {})
        return {"ok": True}

    def refresh_accounts(self):
        """Re-fetch account list from web API."""
        if not self.engine or not self.engine.api:
            return {"ok": False, "error": "Not connected"}
        connect_data = self.engine.api.connect()
        if connect_data:
            self._web_accounts = connect_data.get("accounts", [])
            self.engine.web_accounts = self._web_accounts
            self._on_log(f"Refreshed: {len(self._web_accounts)} accounts")
            self._emit("onAccountsUpdated", self.get_status())
            return {"ok": True, "count": len(self._web_accounts)}
        return {"ok": False, "error": "Failed to fetch"}

    def sync_account(self, account_number: str):
        if self.engine:
            threading.Thread(target=self.engine.sync_account_now, args=(account_number,), daemon=True).start()
        return {"ok": True}

    def sync_period(self, account_number: str, period: str, from_date: str = "", to_date: str = ""):
        if self.engine:
            from datetime import datetime
            fd = datetime.strptime(from_date, "%Y-%m-%d") if from_date else None
            td = datetime.strptime(to_date, "%Y-%m-%d") if to_date else None
            threading.Thread(
                target=self.engine.sync_account_period,
                args=(account_number, period, fd, td), daemon=True
            ).start()
        return {"ok": True}

    def pause_account(self, account_number: str, pause: bool):
        if pause:
            self.paused_accounts.add(account_number)
        else:
            self.paused_accounts.discard(account_number)
        if self.engine:
            self.engine.set_paused(account_number, pause)
        self._on_log(f"{'Paused' if pause else 'Resumed'} #{account_number}")
        self._emit("onAccountsUpdated", self.get_status())
        return {"ok": True}

    def browse_mt5_path(self):
        result = self._window_ref().create_file_dialog(
            webview.OPEN_DIALOG,
            file_types=('MT5 Terminal (terminal64.exe)',),
        )
        if result and len(result) > 0:
            return result[0]
        return ""

    def open_dashboard(self):
        url = self.config.get("api_base_url", "https://thenexttrade.com")
        webbrowser.open(f"{url}/dashboard/accounts")
        return {"ok": True}

    def minimize_to_tray(self):
        window = self._window_ref()
        if window and pystray:
            window.hide()
            self._start_tray()
        return {"ok": True}

    def minimize_window(self):
        window = self._window_ref()
        if window:
            window.minimize()
        return {"ok": True}

    def close_window(self):
        self.quit_app()

    def quit_app(self):
        if self.engine:
            self.engine.stop()
        if self.tray_icon:
            try: self.tray_icon.stop()
            except: pass
        release_lock()
        window = self._window_ref()
        if window:
            window.destroy()
        return {"ok": True}

    # ── Internal ──
    def _set_status(self, status: str, message: str = ""):
        self._status = status
        self._status_msg = message
        self._emit("onStatusChanged", {"status": status, "message": message})

    def _on_engine_status(self, status: str, message: str):
        self._status = status
        self._status_msg = message
        self._emit("onStatusChanged", {"status": status, "message": message})

    def _on_accounts_loaded(self, accounts: list, mt5_account: Optional[str]):
        self._web_accounts = accounts
        self._mt5_account = mt5_account
        self._emit("onAccountsUpdated", self.get_status())

    def _on_log(self, msg: str):
        from datetime import datetime
        entry = f"{datetime.now().strftime('%H:%M:%S')}  {msg}"
        self._logs.append(entry)
        if len(self._logs) > 200:
            self._logs = self._logs[-100:]
        self._emit("onLog", {"message": entry})

    def _emit(self, event: str, data: dict):
        try:
            window = self._window_ref()
            if window:
                window.evaluate_js(f"window.dispatchEvent(new CustomEvent('{event}', {{detail: {json.dumps(data)}}}));")
        except Exception:
            pass

    def _start_tray(self):
        if not pystray or self.tray_icon:
            return
        def run():
            menu = pystray.Menu(
                Item("Open TheNextTrade Connect", lambda: self._show_from_tray(), default=True),
                Item("Dashboard", lambda: self.open_dashboard()),
                pystray.Menu.SEPARATOR,
                Item("Quit", lambda: self.quit_app()),
            )
            self.tray_icon = pystray.Icon("TNTConnect", create_tray_icon("green"), title="TheNextTrade Connect", menu=menu)
            self.tray_icon.run()
        threading.Thread(target=run, daemon=True).start()

    def _show_from_tray(self):
        window = self._window_ref()
        if window:
            window.show()
        if self.tray_icon:
            try: self.tray_icon.stop()
            except: pass
            self.tray_icon = None


def main():
    if not acquire_lock():
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showwarning("TheNextTrade Connect", "TheNextTrade Connect is already running!\nCheck the system tray.")
        root.destroy()
        sys.exit(0)

    window = None
    api = API(lambda: window)

    web_dir = get_web_dir()
    index_path = os.path.join(web_dir, "index.html")

    logger.info(f"TheNextTrade Connect v{VERSION} starting...")
    logger.info(f"Web dir: {web_dir}")

    window = webview.create_window(
        f"TheNextTrade Connect v{VERSION}",
        url=index_path,
        js_api=api,
        width=860,
        height=740,
        min_size=(760, 600),
        background_color="#0F1117",
    )

    try:
        webview.start(debug=False)
    finally:
        release_lock()


if __name__ == "__main__":
    main()
