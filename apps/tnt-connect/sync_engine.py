"""
TheNextTrade Connect — Sync Engine v2
Per-account sync control, manual sync, period sync, pause/resume.
"""

import logging
import time
import threading
from datetime import datetime, timedelta
from typing import Optional, Callable

from mt5_bridge import MT5Bridge
from api_client import APIClient

logger = logging.getLogger("tnt-connect.sync")


class SyncEngine:
    def __init__(self, config: dict,
                 on_status_change: Optional[Callable] = None,
                 on_accounts_loaded: Optional[Callable] = None,
                 on_log: Optional[Callable] = None):
        self.config = config
        self.on_status_change = on_status_change
        self.on_accounts_loaded = on_accounts_loaded
        self.on_log = on_log

        self.api = APIClient(api_key=config["api_key"], base_url=config["api_base_url"])
        self.mt5 = MT5Bridge(mt5_path=config.get("mt5_path", ""))

        self.running = False
        self.connected = False
        self.web_accounts: list[dict] = []
        self.mt5_account: Optional[str] = None
        self.paused_accounts: set[str] = set()
        self.last_sync: Optional[datetime] = None
        self.sync_thread: Optional[threading.Thread] = None
        self.prev_positions: dict[str, dict] = {}  # ticket → position data

    def _notify(self, status: str, message: str = ""):
        if self.on_status_change:
            self.on_status_change(status, message)

    def _log(self, msg: str):
        logger.info(msg)
        if self.on_log:
            self.on_log(msg)

    def start(self):
        if self.running:
            return
        self.running = True
        self.sync_thread = threading.Thread(target=self._run_loop, daemon=True)
        self.sync_thread.start()

    def stop(self):
        self.running = False
        self.mt5.shutdown()
        self._log("Sync engine stopped")

    def set_paused(self, account_number: str, paused: bool):
        if paused:
            self.paused_accounts.add(account_number)
        else:
            self.paused_accounts.discard(account_number)

    def sync_account_now(self, account_number: str):
        """Manual sync — triggered from GUI Sync button.
        Syncs today's closed deals (like EA's SyncPeriodAndNotify for Today).
        """
        if account_number != self.mt5_account:
            self._log(f"#{account_number} not active in MT5, skipping")
            return
        self._notify("syncing", f"Syncing #{account_number}...")
        self.sync_account_period(account_number, "TODAY")

    def sync_account_period(self, account_number: str, period: str,
                            from_date=None, to_date=None):
        """Sync specific period — triggered from Select Period dialog."""
        if account_number != self.mt5_account:
            self._log(f"#{account_number} not active in MT5")
            return

        self._notify("syncing", f"Syncing #{account_number} ({period})...")
        self._log(f"Fetching {period} history for #{account_number}...")

        deals = self.mt5.get_resync_deals(period, from_date, to_date)
        mt5_info = self.mt5.get_account_info()

        if not mt5_info:
            self._notify("error", "MT5 disconnected")
            return

        if not deals:
            self._log(f"No trades found for period {period}")
            self._notify("idle", f"#{account_number} — No trades in {period}")
            return

        # Batch send
        batch_size = 200
        total = len(deals)
        total_imported = 0
        total_updated = 0
        total_errors = []

        for i in range(0, total, batch_size):
            batch = deals[i:i + batch_size]
            result = self.api.sync_trades([{
                "accountNumber": account_number,
                "balance": mt5_info["balance"],
                "equity": mt5_info["equity"],
                "broker": mt5_info.get("broker"),
                "server": mt5_info.get("server"),
                "currency": mt5_info.get("currency"),
                "leverage": mt5_info.get("leverage"),
                "brokerTimezone": mt5_info.get("brokerTimezone"),
                "brokerTimezoneOffset": mt5_info.get("brokerTimezoneOffset"),
                "trades": batch,
            }])

            if result:
                r = result.get(account_number, {})
                total_imported += r.get("imported", 0)
                total_updated += r.get("updated", 0)
                errors = r.get("errors", [])
                if errors:
                    total_errors.extend(errors)
                    for err in errors:
                        self._log(f"  ⚠ {err}")
            else:
                self._log(f"  ⚠ API returned no result for batch")

        # Log detailed result
        self._log(f"#{account_number}: {period} → {total_imported} imported, {total_updated} updated, {len(total_errors)} errors")
        if total_errors:
            self._notify("warning", f"#{account_number}: {total_imported} new, {len(total_errors)} errors")
        elif total_imported > 0:
            self._notify("synced", f"#{account_number}: +{total_imported} new, {total_updated} updated")
        else:
            self._notify("idle", f"#{account_number}: {total_updated} up to date")

    def _run_loop(self):
        """Main sync loop."""
        # Step 1: Connect to API
        self._notify("connecting", "Connecting to TheNextTrade...")
        connect_data = self.api.connect()
        if not connect_data:
            self._notify("error", "Failed to connect. Check API key.")
            self._log("API connection failed — invalid key?")
            self.running = False
            return

        self.web_accounts = connect_data.get("accounts", [])
        user_name = connect_data.get("user", {}).get("name", "User")
        self._log(f"Connected as {user_name} ({len(self.web_accounts)} accounts)")
        self._notify("connected", f"Welcome {user_name}!")

        # Step 2: Initialize MT5
        self._notify("connecting", "Connecting to MT5...")
        if not self.mt5.initialize():
            self._notify("warning", "MT5 not available — accounts shown as offline")
            self._log("MT5 not available — showing accounts as offline")
            # Still show accounts even without MT5
            if self.on_accounts_loaded:
                self.on_accounts_loaded(self.web_accounts, None)
            self._main_loop_no_mt5()
            return

        # Step 3: Match accounts
        mt5_info = self.mt5.get_account_info()
        if mt5_info:
            self.mt5_account = mt5_info["accountNumber"]
            web_numbers = [str(a.get("accountNumber", "")) for a in self.web_accounts]

            if self.mt5_account in web_numbers:
                self._log(f"MT5 account #{self.mt5_account} matched!")
            else:
                self._log(f"MT5 account #{self.mt5_account} NOT registered on web")
                self._notify("warning", f"Account #{self.mt5_account} not on web")

        # Notify GUI with accounts
        if self.on_accounts_loaded:
            self.on_accounts_loaded(self.web_accounts, self.mt5_account)

        self.connected = True

        # Step 4: Main loop
        # Poll positions every 2s for near-instant close detection
        # (like EA's InpSyncDelay=5 + OnTick, but faster)
        poll_interval = 2  # seconds — fast position check
        heartbeat_interval = self.config.get("heartbeat_interval", 60)
        last_hb = 0.0
        last_config = 0.0

        while self.running:
            try:
                now = time.time()

                # Check if MT5 account changed
                mt5_info = self.mt5.get_account_info()
                if mt5_info:
                    new_acct = mt5_info["accountNumber"]
                    if new_acct != self.mt5_account:
                        self.mt5_account = new_acct
                        self._log(f"MT5 account changed to #{new_acct}")
                        if self.on_accounts_loaded:
                            self.on_accounts_loaded(self.web_accounts, self.mt5_account)

                # Check for closed positions (fast — just positions_get())
                if (self.mt5_account and
                    self.mt5_account not in self.paused_accounts and
                    self.mt5_account in [str(a.get("accountNumber", "")) for a in self.web_accounts]):
                    self._do_sync(self.mt5_account)

                # Heartbeat (balance/equity update — every 60s)
                if now - last_hb >= heartbeat_interval:
                    self._send_heartbeat()
                    last_hb = now

                # Config check (resync requests from web)
                if now - last_config >= 300:
                    self._check_config()
                    last_config = now

                time.sleep(poll_interval)

            except Exception as e:
                logger.error(f"Sync loop error: {e}")
                self._notify("error", str(e))
                time.sleep(30)

        self.mt5.shutdown()
        self._notify("disconnected", "Sync stopped")

    def _main_loop_no_mt5(self):
        """Run loop without MT5 — just heartbeat and config checks."""
        while self.running:
            try:
                time.sleep(30)
                # Retry MT5 connection
                if self.mt5.initialize():
                    mt5_info = self.mt5.get_account_info()
                    if mt5_info:
                        self.mt5_account = mt5_info["accountNumber"]
                        self._log(f"MT5 reconnected! Account #{self.mt5_account}")
                        if self.on_accounts_loaded:
                            self.on_accounts_loaded(self.web_accounts, self.mt5_account)
                        self.connected = True
                        # Switch to main loop
                        self._run_main_loop_body()
                        return
            except Exception as e:
                logger.error(f"MT5 retry error: {e}")

    def _run_main_loop_body(self):
        """Extracted main loop body for reuse after MT5 reconnect."""
        sync_interval = self.config.get("sync_interval", 10)
        heartbeat_interval = self.config.get("heartbeat_interval", 60)
        last_hb = 0.0

        while self.running:
            try:
                now = time.time()
                if (self.mt5_account and
                    self.mt5_account not in self.paused_accounts and
                    self.mt5_account in [str(a.get("accountNumber", "")) for a in self.web_accounts]):
                    self._do_sync(self.mt5_account)
                if now - last_hb >= heartbeat_interval:
                    self._send_heartbeat()
                    last_hb = now
                time.sleep(sync_interval)
            except Exception as e:
                logger.error(f"Loop error: {e}")
                time.sleep(30)

    def _do_sync(self, account_number: str):
        """Auto-sync: detect closed positions and sync them.
        Matches EA pattern (OnTradeTransaction + CheckNewTrades):
        - Track open positions each cycle
        - When a position disappears → it was closed
        - Fetch the closed deal (open+close info) → sync to web
        - Do NOT sync open positions every cycle (heartbeat handles balance/equity)
        """
        mt5_info = self.mt5.get_account_info()
        if not mt5_info or mt5_info["accountNumber"] != account_number:
            return

        # Get current open positions
        current_positions = self.mt5.get_positions()
        current_tickets = {str(p["ticket"]) for p in current_positions}
        prev_tickets = set(self.prev_positions.keys())

        # Update tracking FIRST (so next cycle has fresh state)
        self.prev_positions = {str(p["ticket"]): p for p in current_positions}

        # First run: just populate tracking, don't sync
        if not prev_tickets:
            self._notify("idle", f"#{account_number}: Tracking {len(current_tickets)} open position(s)")
            return

        # Detect closed positions (was open before, now gone)
        closed_tickets = prev_tickets - current_tickets
        if not closed_tickets:
            return  # No changes — silent, no spam

        self._log(f"Detected {len(closed_tickets)} closed position(s): {closed_tickets}")

        # Fetch closed deals and sync them (like EA's SyncSingleTrade)
        closed_deals = []
        for ticket in closed_tickets:
            deal = self.mt5.get_closed_deal(int(ticket))
            if deal:
                closed_deals.append(deal)

        if not closed_deals:
            self._log(f"Could not fetch deal data for closed positions")
            return

        result = self.api.sync_trades([{
            "accountNumber": account_number,
            "balance": mt5_info["balance"],
            "equity": mt5_info["equity"],
            "broker": mt5_info.get("broker"),
            "server": mt5_info.get("server"),
            "currency": mt5_info.get("currency"),
            "leverage": mt5_info.get("leverage"),
            "trades": closed_deals,
        }])

        if result:
            r = result.get(account_number, {})
            imp, upd = r.get("imported", 0), r.get("updated", 0)
            self.last_sync = datetime.now()
            self._notify("synced", f"#{account_number}: +{imp} new, {upd} updated")
            self._log(f"#{account_number}: +{imp} new, {upd} updated")

    def _send_heartbeat(self):
        mt5_info = self.mt5.get_account_info()
        if not mt5_info:
            return
        self.api.heartbeat([{
            "accountNumber": mt5_info["accountNumber"],
            "connected": True,
            "balance": mt5_info["balance"],
            "equity": mt5_info["equity"],
            "broker": mt5_info.get("broker"),
            "server": mt5_info.get("server"),
        }])

    def _check_config(self):
        config_data = self.api.get_config()
        if not config_data:
            return
        for acct in config_data.get("accounts", []):
            resync = acct.get("resyncRequest")
            acct_num = str(acct.get("accountNumber", ""))
            if resync and acct_num == self.mt5_account:
                self._log(f"Web requested resync #{acct_num}: {resync}")
                self.sync_account_period(acct_num, resync)
