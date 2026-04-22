"""TNT Connect — UI Components (Select Period Dialog + Account Card widgets)"""
import tkinter as tk
from tkinter import ttk
from datetime import datetime, timedelta
from typing import Optional, Callable

# Colors
BG = "#0F1117"; CARD = "#151925"; INPUT = "#1E2235"
WHITE = "#FFF"; GRAY = "#9CA3AF"; DIM = "#6B7280"
GREEN = "#00C888"; YELLOW = "#F59E0B"; RED = "#EF4444"
BORDER = "#2A2F3E"; BLUE = "#3B82F6"

STATE_COLORS = {
    "ACTIVE": GREEN, "SYNCING": YELLOW, "PAUSED": "#F97316",
    "OFFLINE": "#6B7280", "ERROR": RED, "NOT_REGISTERED": "#6B7280",
}
STATE_LABELS = {
    "ACTIVE": "● Active in MT5", "SYNCING": "◌ Syncing...", "PAUSED": "⏸ Paused",
    "OFFLINE": "○ Offline", "ERROR": "✕ Error", "NOT_REGISTERED": "○ Not Registered",
}


class SelectPeriodDialog:
    """Modal dialog for selecting sync period — matches EA UI."""
    def __init__(self, parent, on_select: Callable):
        self.result = None
        self.on_select = on_select

        self.win = tk.Toplevel(parent)
        self.win.title("Select Period")
        self.win.geometry("280x520")
        self.win.resizable(False, False)
        self.win.configure(bg=BG)
        self.win.transient(parent)
        self.win.grab_set()

        # Center
        self.win.update_idletasks()
        x = parent.winfo_rootx() + (parent.winfo_width() // 2) - 140
        y = parent.winfo_rooty() + 60
        self.win.geometry(f"+{x}+{y}")

        # Title
        hdr = tk.Frame(self.win, bg=CARD, padx=12, pady=10)
        hdr.pack(fill="x")
        tk.Label(hdr, text="Select Period", font=("Segoe UI", 13, "bold"), fg=WHITE, bg=CARD).pack(side="left")
        tk.Button(hdr, text="✕", font=("Segoe UI", 11), fg=GRAY, bg=CARD,
                  relief="flat", command=self.win.destroy, cursor="hand2", bd=0).pack(side="right")

        body = tk.Frame(self.win, bg=BG, padx=16, pady=12)
        body.pack(fill="both", expand=True)

        periods = [
            ("Today", "TODAY"), ("Last 3 Days", "3D"), ("Last Week", "1W"),
            ("Last Month", "1M"), ("Last 3 Months", "3M"), ("Last 6 Months", "6M"),
            ("Entire History", "ALL"),
        ]
        for label, code in periods:
            color = GREEN if code == "ALL" else CARD
            fg = BG if code == "ALL" else WHITE
            btn = tk.Button(body, text=label, font=("Segoe UI", 10, "bold"),
                            bg=color, fg=fg, relief="flat", cursor="hand2", pady=8, bd=0,
                            activebackground=GREEN, activeforeground=BG,
                            command=lambda c=code: self._select(c))
            btn.pack(fill="x", pady=2)

        # Custom range
        tk.Label(body, text="Custom Range", font=("Segoe UI", 9, "bold"), fg=DIM, bg=BG).pack(anchor="w", pady=(12, 6))
        date_row = tk.Frame(body, bg=BG)
        date_row.pack(fill="x")

        tk.Label(date_row, text="From", font=("Segoe UI", 9), fg=GRAY, bg=BG).pack(side="left")
        self.from_var = tk.StringVar(value=(datetime.now() - timedelta(days=7)).strftime("%Y.%m.%d"))
        tk.Entry(date_row, textvariable=self.from_var, width=12, font=("Consolas", 9),
                 bg=INPUT, fg=WHITE, relief="flat", bd=4, insertbackground=GREEN).pack(side="left", padx=4)
        tk.Label(date_row, text="To", font=("Segoe UI", 9), fg=GRAY, bg=BG).pack(side="left", padx=(8, 0))
        self.to_var = tk.StringVar(value=datetime.now().strftime("%Y.%m.%d"))
        tk.Entry(date_row, textvariable=self.to_var, width=12, font=("Consolas", 9),
                 bg=INPUT, fg=WHITE, relief="flat", bd=4, insertbackground=GREEN).pack(side="left", padx=4)

        tk.Button(body, text="Sync Range", font=("Segoe UI", 10, "bold"), bg=GREEN, fg=BG,
                  relief="flat", cursor="hand2", pady=8, bd=0, command=self._select_custom).pack(fill="x", pady=(10, 0))

    def _select(self, period: str):
        self.on_select(period, None, None)
        self.win.destroy()

    def _select_custom(self):
        try:
            fd = datetime.strptime(self.from_var.get(), "%Y.%m.%d")
            td = datetime.strptime(self.to_var.get(), "%Y.%m.%d")
            self.on_select("CUSTOM", fd, td)
            self.win.destroy()
        except ValueError:
            pass  # Invalid date format


class AccountCard:
    """A single trading account card widget."""
    def __init__(self, parent, account: dict, state: str = "OFFLINE",
                 on_sync: Optional[Callable] = None,
                 on_period: Optional[Callable] = None,
                 on_pause: Optional[Callable] = None):
        self.account = account
        self.state = state
        self.on_sync = on_sync
        self.on_period = on_period
        self.on_pause = on_pause

        color = STATE_COLORS.get(state, DIM)

        # Card frame
        self.frame = tk.Frame(parent, bg=CARD, highlightbackground=BORDER, highlightthickness=1, padx=14, pady=10)

        # Row 1: Account number + status
        row1 = tk.Frame(self.frame, bg=CARD)
        row1.pack(fill="x")

        acct_num = account.get("accountNumber", "???")
        broker = account.get("broker") or account.get("name", "Unknown")
        tk.Label(row1, text=f"#{acct_num}", font=("Consolas", 12, "bold"), fg=WHITE, bg=CARD).pack(side="left")
        tk.Label(row1, text=f"  {broker}", font=("Segoe UI", 10), fg=GRAY, bg=CARD).pack(side="left")

        self.state_label = tk.Label(row1, text=STATE_LABELS.get(state, state),
                                     font=("Segoe UI", 9, "bold"), fg=color, bg=CARD)
        self.state_label.pack(side="right")

        # Row 2: Server
        server = account.get("server", "")
        if server:
            tk.Label(self.frame, text=server, font=("Segoe UI", 9), fg=DIM, bg=CARD).pack(anchor="w")

        # Row 3: Balance / Equity
        row3 = tk.Frame(self.frame, bg=CARD)
        row3.pack(fill="x", pady=(6, 0))

        bal = account.get("balance", 0)
        eq = account.get("equity", 0)
        cur = account.get("currency", "USD")
        tk.Label(row3, text=f"Balance: ", font=("Segoe UI", 9), fg=DIM, bg=CARD).pack(side="left")
        tk.Label(row3, text=f"${bal:,.2f}", font=("Segoe UI", 9, "bold"), fg=GREEN, bg=CARD).pack(side="left")
        tk.Label(row3, text=f"   Equity: ", font=("Segoe UI", 9), fg=DIM, bg=CARD).pack(side="left")
        tk.Label(row3, text=f"${eq:,.2f}", font=("Segoe UI", 9, "bold"), fg=GREEN, bg=CARD).pack(side="left")

        # Row 4: Last sync
        last_sync = account.get("lastSync")
        sync_text = "Never" if not last_sync else self._format_time(last_sync)
        tk.Label(self.frame, text=f"Last sync: {sync_text}", font=("Segoe UI", 8), fg=DIM, bg=CARD).pack(anchor="w", pady=(4, 0))

        # Row 5: Action buttons (only for ACTIVE/ERROR state)
        if state in ("ACTIVE", "ERROR", "PAUSED"):
            btn_row = tk.Frame(self.frame, bg=CARD)
            btn_row.pack(fill="x", pady=(8, 0))

            if state == "ACTIVE":
                tk.Button(btn_row, text="▶ Sync Now", font=("Segoe UI", 9, "bold"),
                          bg=GREEN, fg=BG, relief="flat", cursor="hand2", bd=0, padx=10, pady=4,
                          command=lambda: on_sync and on_sync(acct_num)).pack(side="left", padx=(0, 6))
                tk.Button(btn_row, text="📅 Select Period", font=("Segoe UI", 9),
                          bg=INPUT, fg=WHITE, relief="flat", cursor="hand2", bd=0, padx=10, pady=4,
                          command=lambda: on_period and on_period(acct_num)).pack(side="left", padx=(0, 6))
                tk.Button(btn_row, text="⏸ Pause", font=("Segoe UI", 9),
                          bg=INPUT, fg=YELLOW, relief="flat", cursor="hand2", bd=0, padx=10, pady=4,
                          command=lambda: on_pause and on_pause(acct_num, True)).pack(side="left")
            elif state == "PAUSED":
                tk.Button(btn_row, text="▶ Resume", font=("Segoe UI", 9, "bold"),
                          bg=GREEN, fg=BG, relief="flat", cursor="hand2", bd=0, padx=10, pady=4,
                          command=lambda: on_pause and on_pause(acct_num, False)).pack(side="left")
            elif state == "ERROR":
                tk.Button(btn_row, text="🔄 Retry", font=("Segoe UI", 9, "bold"),
                          bg=YELLOW, fg=BG, relief="flat", cursor="hand2", bd=0, padx=10, pady=4,
                          command=lambda: on_sync and on_sync(acct_num)).pack(side="left")
        elif state == "OFFLINE":
            tk.Label(self.frame, text="Login this account in MT5 to sync",
                     font=("Segoe UI", 9, "italic"), fg=DIM, bg=CARD).pack(anchor="w", pady=(6, 0))
        elif state == "NOT_REGISTERED":
            tk.Label(self.frame, text="Add this account on TheNextTrade web first",
                     font=("Segoe UI", 9, "italic"), fg=DIM, bg=CARD).pack(anchor="w", pady=(6, 0))

    def pack(self, **kwargs):
        self.frame.pack(**kwargs)

    @staticmethod
    def _format_time(ts) -> str:
        try:
            if isinstance(ts, str):
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            else:
                dt = ts
            diff = datetime.now() - dt.replace(tzinfo=None)
            if diff.total_seconds() < 60: return "Just now"
            if diff.total_seconds() < 3600: return f"{int(diff.total_seconds()//60)} min ago"
            if diff.total_seconds() < 86400: return f"{int(diff.total_seconds()//3600)}h ago"
            return dt.strftime("%b %d, %H:%M")
        except Exception:
            return str(ts)
