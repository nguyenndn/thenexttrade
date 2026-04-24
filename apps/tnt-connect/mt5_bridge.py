"""
TheNextTrade Connect — MT5 Bridge
Manages connection to MetaTrader 5 terminal.
Reads account info, positions, and deal history.
"""

import logging
import os
import time
import glob
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger("tnt-connect.mt5")

try:
    import MetaTrader5 as mt5
except ImportError:
    mt5 = None
    logger.warning("MetaTrader5 package not installed. Install with: pip install MetaTrader5")


def find_all_mt5_paths() -> list[dict]:
    """Scan all common locations for MT5 terminal installations.
    Returns list of {path, name} for each unique installation found.
    """
    candidates = set()

    # Standard paths
    for base in [
        os.path.expandvars(r"%PROGRAMFILES%"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%"),
        os.path.expandvars(r"%APPDATA%\..\Local\Programs"),
    ]:
        if not os.path.isdir(base):
            continue
        # Glob for any folder containing terminal64.exe
        for exe in glob.glob(os.path.join(base, "*", "terminal64.exe")):
            candidates.add(os.path.normpath(exe))

    # Also check Desktop shortcuts' targets? Too complex. Just scan known patterns.
    # User's custom paths from AppData\Roaming\MetaQuotes
    mq_data = os.path.expandvars(r"%APPDATA%\MetaQuotes\Terminal")
    if os.path.isdir(mq_data):
        for entry in os.listdir(mq_data):
            origin_file = os.path.join(mq_data, entry, "origin.txt")
            if os.path.isfile(origin_file):
                try:
                    with open(origin_file, "r", encoding="utf-8") as f:
                        origin_path = f.read().strip()
                    exe_path = os.path.join(origin_path, "terminal64.exe")
                    if os.path.isfile(exe_path):
                        candidates.add(os.path.normpath(exe_path))
                except Exception:
                    pass

    # Build result with display names
    results = []
    for exe_path in sorted(candidates):
        folder = os.path.basename(os.path.dirname(exe_path))
        results.append({"path": exe_path, "name": folder})
        logger.info(f"Found MT5: {folder} → {exe_path}")

    return results


def find_mt5_path() -> Optional[str]:
    """Auto-detect first MT5 terminal path (backward compat)."""
    paths = find_all_mt5_paths()
    return paths[0]["path"] if paths else None


class MT5Bridge:
    def __init__(self, mt5_path: str = ""):
        self.mt5_path = mt5_path or find_mt5_path() or ""
        self.connected = False
        self.accounts: list[dict] = []

    @staticmethod
    def _is_mt5_running() -> bool:
        """Check if MT5 terminal process is already running."""
        try:
            import subprocess
            result = subprocess.run(
                ['tasklist', '/FI', 'IMAGENAME eq terminal64.exe'],
                capture_output=True, text=True, timeout=5,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            return 'terminal64.exe' in result.stdout.lower()
        except Exception:
            return False

    def initialize(self) -> bool:
        """Initialize connection to MT5 terminal.
        Uses Win32-Hidden-GUI-Pattern: PowerShell hide loop (outside GIL)
        + ctypes safety net after initialize.
        """
        if mt5 is None:
            logger.error("MetaTrader5 package not available")
            return False

        was_running = self._is_mt5_running()
        logger.info(f"MT5 process already running: {was_running}")

        # Start PowerShell hide loop BEFORE mt5.initialize()
        # PowerShell runs as separate OS process — NOT blocked by Python GIL
        if not was_running:
            logger.info("MT5 not running — starting PowerShell hide loop...")
            self._start_ps_hide_loop()

        # mt5.initialize() connects to existing or launches new MT5
        # WARNING: This call BLOCKS the Python GIL while MT5 starts
        kwargs = {}
        if self.mt5_path:
            kwargs["path"] = self.mt5_path

        if not mt5.initialize(**kwargs):
            error = mt5.last_error()
            logger.error(f"MT5 initialize failed: {error}")
            return False

        self.connected = True
        logger.info("MT5 initialized successfully")

        # Safety net: ctypes hide AFTER initialize returns (GIL released)
        if not was_running:
            self._hide_mt5_by_pid()

        return True

    @staticmethod
    def _start_ps_hide_loop():
        """Start PowerShell background hide loop.
        Based on Win32-Hidden-GUI-Pattern.md:
        - Runs as SEPARATE PROCESS (not blocked by Python GIL)
        - Uses Get-Process -Name terminal64 (finds by process name, not title)
        - Uses ShowWindowAsync (non-blocking, no deadlock)
        - Polls every 500ms for 20 seconds
        """
        import subprocess as sp
        import tempfile
        import os

        ps_script = r'''
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
            if (pidsSet.Contains(pid) && GetWindowTextLength(h) > 0) {
                ShowWindowAsync(h, 0);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@
for ($i = 0; $i -lt 40; $i++) {
    $pids = Get-Process -Name terminal64 -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty Id
    if ($pids) {
        $pidArray = [uint[]]@($pids)
        [W32H]::HideWindowsForPids($pidArray)
    }
    Start-Sleep -Milliseconds 500
}
'''
        fd, script_path = tempfile.mkstemp(suffix='.ps1', prefix='tnt_hide_')
        os.close(fd)
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(ps_script)

        sp.Popen(
            ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
             '-WindowStyle', 'Hidden', '-File', script_path],
            creationflags=sp.CREATE_NO_WINDOW,
            stdout=sp.DEVNULL, stderr=sp.DEVNULL, stdin=sp.DEVNULL,
        )
        logger.info(f"PowerShell hide loop started: {script_path}")

    @staticmethod
    def _hide_mt5_by_pid():
        """Safety net: hide MT5 windows using ctypes after GIL is released.
        Finds terminal64.exe PIDs, then EnumWindows to hide matching windows.
        """
        import ctypes
        from ctypes import wintypes
        import subprocess

        try:
            # Get terminal64.exe PIDs
            result = subprocess.run(
                ['tasklist', '/FI', 'IMAGENAME eq terminal64.exe', '/FO', 'CSV', '/NH'],
                capture_output=True, text=True, timeout=5,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
            mt5_pids = set()
            for line in result.stdout.strip().split('\n'):
                parts = line.replace('"', '').split(',')
                if len(parts) >= 2 and parts[1].strip().isdigit():
                    mt5_pids.add(int(parts[1].strip()))

            if not mt5_pids:
                return

            user32 = ctypes.windll.user32
            ENUM_PROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

            def callback(hwnd, _lparam):
                pid = wintypes.DWORD()
                user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                if pid.value in mt5_pids:
                    if user32.GetWindowTextLengthW(hwnd) > 0:
                        user32.ShowWindow(hwnd, 0)  # SW_HIDE
                        logger.info(f"ctypes safety net: hidden PID={pid.value}")
                return True

            user32.EnumWindows(ENUM_PROC(callback), 0)
        except Exception as e:
            logger.warning(f"ctypes hide failed: {e}")

    def shutdown(self):
        """Shutdown MT5 connection."""
        if mt5 and self.connected:
            mt5.shutdown()
            self.connected = False
            logger.info("MT5 shutdown")

    def get_account_info(self) -> Optional[dict]:
        """Get current account info from MT5."""
        if not self.connected or mt5 is None:
            return None

        info = mt5.account_info()
        if info is None:
            return None

        tz_offset = self.get_broker_timezone_offset()
        tz_str = self._offset_to_iana(tz_offset)

        return {
            "accountNumber": str(info.login),
            "balance": info.balance,
            "equity": info.equity,
            "currency": info.currency,
            "leverage": str(info.leverage),
            "server": info.server,
            "broker": info.company,
            "connected": True,
            "brokerTimezone": tz_str,
            "brokerTimezoneOffset": tz_offset,
        }

    def get_broker_timezone_offset(self) -> int:
        """Auto-detect broker timezone offset in seconds.

        MT5's tick.time encodes broker server time as if it were UTC.
        By comparing with real UTC (time.time()), we get the offset.

        Returns offset in seconds (e.g. 10800 for GMT+3, 7200 for GMT+2).
        """
        if not self.connected or mt5 is None:
            return 0

        broker_ts = self.get_broker_timestamp()  # broker time as fake UTC
        real_utc = int(time.time())               # real UTC now
        raw_offset = broker_ts - real_utc

        # Round to nearest 30 min (standard timezone increments)
        offset = round(raw_offset / 1800) * 1800
        logger.info(f"Broker timezone offset: {offset}s = GMT{'+' if offset >= 0 else ''}{offset // 3600}")
        return offset

    @staticmethod
    def _offset_to_iana(offset_seconds: int) -> str:
        """Convert offset in seconds to Etc/GMT format for DB storage.
        Note: Etc/GMT signs are inverted per IANA convention.
        E.g. offset +10800 (GMT+3) = 'Etc/GMT-3'
        """
        hours = offset_seconds // 3600
        if hours == 0:
            return "Etc/UTC"
        # IANA Etc/GMT uses inverted sign
        return f"Etc/GMT{'+' if hours < 0 else '-'}{abs(hours)}"

    def get_broker_timestamp(self) -> int:
        """Get current broker server time as raw Unix timestamp.
        Returns the same convention as deal.time — no timezone conversion needed.
        """
        if not self.connected or mt5 is None:
            return int(datetime.now().timestamp())

        for symbol in ["XAUUSD", "EURUSD", "GBPUSD"]:
            tick = mt5.symbol_info_tick(symbol)
            if tick and tick.time > 0:
                return tick.time

        # Fallback: try any visible symbol
        symbols = mt5.symbols_get()
        if symbols:
            for sym in symbols[:10]:
                tick = mt5.symbol_info_tick(sym.name)
                if tick and tick.time > 0:
                    return tick.time

        logger.warning("Could not get broker time, falling back to local")
        return int(datetime.now().timestamp())

    def get_positions(self) -> list[dict]:
        """Get all open positions."""
        if not self.connected or mt5 is None:
            return []

        positions = mt5.positions_get()
        if positions is None:
            return []

        result = []
        for pos in positions:
            result.append({
                "ticket": pos.ticket,
                "symbol": pos.symbol,
                "type": "SELL" if pos.type == 1 else "BUY",
                "lots": pos.volume,
                "openTime": pos.time,  # Unix timestamp
                "openPrice": pos.price_open,
                "closeTime": None,
                "closePrice": pos.price_current,
                "sl": pos.sl,
                "tp": pos.tp,
                "commission": 0,  # Not available in position
                "swap": pos.swap,
                "profit": pos.profit,
                "comment": pos.comment,
                "magic": pos.magic,
            })

        return result

    def get_closed_deal(self, position_ticket: int) -> Optional[dict]:
        """Fetch a single closed trade by position ID.
        Used when auto-sync detects a position was closed.
        """
        if not self.connected or mt5 is None:
            return None

        try:
            deals = mt5.history_deals_get(position=position_ticket)
            if not deals:
                return None

            trade = {
                "ticket": position_ticket,
                "symbol": "",
                "type": "BUY",
                "lots": 0,
                "openTime": None,
                "openPrice": 0,
                "closeTime": None,
                "closePrice": 0,
                "sl": 0,
                "tp": 0,
                "commission": 0,
                "swap": 0,
                "profit": 0,
                "comment": "",
                "magic": 0,
            }

            for deal in deals:
                if deal.entry == 0:  # DEAL_ENTRY_IN (open)
                    trade["openTime"] = deal.time
                    trade["openPrice"] = deal.price
                    trade["type"] = "SELL" if deal.type == 1 else "BUY"
                    trade["lots"] = deal.volume
                    trade["symbol"] = deal.symbol
                    trade["comment"] = deal.comment
                    trade["magic"] = deal.magic
                elif deal.entry == 1:  # DEAL_ENTRY_OUT (close)
                    trade["closeTime"] = deal.time
                    trade["closePrice"] = deal.price

                trade["commission"] += deal.commission
                trade["swap"] += deal.swap
                trade["profit"] += deal.profit

            # Must have both open and close to be valid
            if trade["openTime"] and trade["closeTime"]:
                logger.info(f"Closed deal #{position_ticket}: {trade['symbol']} {trade['type']} P&L={trade['profit']:.2f}")
                return trade

            return None
        except Exception as e:
            logger.error(f"Error fetching closed deal #{position_ticket}: {e}")
            return None

    def get_deals(self, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> list[dict]:
        """Get closed deals (trade history)."""
        if not self.connected or mt5 is None:
            return []

        # Accept both datetime and int timestamps
        if isinstance(from_date, int):
            from_ts = from_date
        elif from_date is not None:
            from_ts = int(from_date.timestamp())
        else:
            from_ts = self.get_broker_timestamp() - 86400  # 1 day ago

        if isinstance(to_date, int):
            to_ts = to_date
        elif to_date is not None:
            to_ts = int(to_date.timestamp())
        else:
            to_ts = self.get_broker_timestamp() + 3600  # 1 hour ahead

        # Pass raw timestamps to avoid timezone confusion
        deals = mt5.history_deals_get(from_ts, to_ts)
        if deals is None:
            return []

        # Group deals by position_id to reconstruct trades
        # MT5 deals: DEAL_ENTRY_IN (open) + DEAL_ENTRY_OUT (close) = 1 trade
        position_map: dict[int, dict] = {}

        for deal in deals:
            pos_id = deal.position_id
            if pos_id == 0:
                continue  # Skip balance/credit operations

            if pos_id not in position_map:
                position_map[pos_id] = {
                    "ticket": pos_id,
                    "symbol": deal.symbol,
                    "type": "SELL" if deal.type == 1 else "BUY",
                    "lots": deal.volume,
                    "openTime": None,
                    "openPrice": 0,
                    "closeTime": None,
                    "closePrice": 0,
                    "sl": 0,
                    "tp": 0,
                    "commission": 0,
                    "swap": 0,
                    "profit": 0,
                    "comment": deal.comment,
                    "magic": deal.magic,
                }

            trade = position_map[pos_id]

            # DEAL_ENTRY_IN = 0 (open), DEAL_ENTRY_OUT = 1 (close)
            if deal.entry == 0:  # Entry
                trade["openTime"] = deal.time
                trade["openPrice"] = deal.price
                trade["type"] = "SELL" if deal.type == 1 else "BUY"
                trade["lots"] = deal.volume
            elif deal.entry == 1:  # Exit
                trade["closeTime"] = deal.time
                trade["closePrice"] = deal.price

            # Accumulate P&L components
            trade["commission"] += deal.commission
            trade["swap"] += deal.swap
            trade["profit"] += deal.profit

        # Fill missing openTime: look up OPEN deal from full history
        for pos_id, trade in position_map.items():
            if trade["closeTime"] and not trade["openTime"]:
                try:
                    # Search full history for the OPEN deal of this position
                    open_deals = mt5.history_deals_get(position=pos_id)
                    if open_deals:
                        for d in open_deals:
                            if d.entry == 0:  # DEAL_ENTRY_IN
                                trade["openTime"] = d.time
                                trade["openPrice"] = d.price
                                trade["type"] = "SELL" if d.type == 1 else "BUY"
                                trade["lots"] = d.volume
                                break
                except Exception:
                    pass
                # Last resort: use closeTime as fallback
                if not trade["openTime"]:
                    trade["openTime"] = trade["closeTime"]

        # Return trades that have at least a close deal
        # (open-only deals without close = still open, handled by positions)
        return [
            t for t in position_map.values()
            if t["closeTime"]
        ]

    def get_resync_deals(self, period: str, from_date=None, to_date=None) -> list[dict]:
        """Get deals for a resync period.
        Uses raw broker timestamps (same convention as deal.time).
        No timezone conversion = no timezone bugs.
        """
        if period == "CUSTOM" and from_date and to_date:
            return self.get_deals(from_date=from_date, to_date=to_date)

        broker_ts = self.get_broker_timestamp()

        if period == "TODAY":
            # Midnight in broker convention: strip time-of-day from timestamp
            midnight_ts = broker_ts - (broker_ts % 86400)
            logger.info(f"TODAY range: {midnight_ts} -> {broker_ts} (broker ts)")
            return self.get_deals(from_date=midnight_ts, to_date=broker_ts + 60)

        period_seconds = {
            "3D": 3 * 86400,
            "1W": 7 * 86400,
            "1M": 30 * 86400,
            "3M": 90 * 86400,
            "6M": 180 * 86400,
            "ALL": 3650 * 86400,
        }
        delta = period_seconds.get(period, 86400)
        return self.get_deals(from_date=broker_ts - delta, to_date=broker_ts + 60)

