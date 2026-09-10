#!/usr/bin/env python3
"""
TheNextTrade — Headless MT5 Cloud Sync Worker & Desktop Assistant
Polls pending sync jobs from TheNextTrade web API, logs into MT5 via Investor Password,
retrieves open positions and closed trade deals, and submits them back to the database.
Supports both Desktop GUI (with live settings inputs) and Headless/CLI mode.
"""

import os
import sys
import time
import json
import hashlib
import queue
import shutil
import logging
import threading
from datetime import datetime, timezone
import subprocess
import requests
from dotenv import load_dotenv

try:
    import psutil
except ImportError:
    psutil = None

# Try importing numpy
try:
    import numpy
except ImportError:
    pass

# Try importing MetaTrader5
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

# Ensure stdout/stderr flushes immediately and supports utf-8 emojis on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True, encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(line_buffering=True, encoding="utf-8", errors="replace")
    except Exception:
        pass

# Determine base directory (supporting both source script and PyInstaller frozen executable)
if getattr(sys, "frozen", False):
    APP_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_PATH = os.path.join(APP_DIR, "config.json")
ENV_PATH = os.path.join(APP_DIR, ".env")

# Load initial .env if present
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    load_dotenv()


def load_config():
    """Load configuration from config.json, fallback to .env, then defaults."""
    cfg = {
        "api_base_url": os.getenv("API_BASE_URL", "http://localhost:3000").rstrip("/"),
        "worker_key": os.getenv("WORKER_KEY", "tnt-worker-secret-key-2026"),
        "worker_id": os.getenv("WORKER_ID", "laptop-worker-1"),
        "poll_interval": int(os.getenv("POLL_INTERVAL", "10")),
        "mt5_path": os.getenv("MT5_PATH", "").strip(),
        "auto_start": False,
        "theme": "light",
    }
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                saved = json.load(f)
                cfg.update(saved)
        except Exception:
            pass
    return cfg


def save_config(cfg):
    """Save configuration to config.json."""
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Failed to save config: {e}")
        return False


# Setup root logger
logger = logging.getLogger("TNT-Worker")
logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(
    logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%Y-%m-%d %H:%M:%S")
)
logger.addHandler(console_handler)


def sha256_file(path):
    """Compute the sha256 hex digest of a file (chunked, memory-friendly)."""
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for block in iter(lambda: f.read(65536), b""):
                h.update(block)
        return h.hexdigest()
    except OSError:
        return None


def parse_iso_datetime(dt_str):
    """Parse ISO datetime string to datetime object."""
    try:
        if not dt_str:
            return datetime.now(timezone.utc)
        if dt_str.endswith("Z"):
            dt_str = dt_str[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str)
    except Exception:
        return datetime.now(timezone.utc)


def get_servers_pack_dir():
    """Locate the bundled or external servers_pack directory."""
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        meipass_path = os.path.join(sys._MEIPASS, "servers_pack")
        if os.path.exists(meipass_path):
            return meipass_path
    app_path = os.path.join(APP_DIR, "servers_pack")
    if os.path.exists(app_path):
        return app_path
    src_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "servers_pack")
    if os.path.exists(src_path):
        return src_path
    return None


def find_mt5_terminal_data_paths(target_terminal_exe=None, only_matched=False):
    """
    Find MT5 terminal roaming data folders in %APPDATA%\\MetaQuotes\\Terminal\\*.
    If target_terminal_exe is specified, folders whose origin.txt matches are
    considered the terminal(s) owned by that exe ("matched").
    Returns matched folders first, then the rest. With only_matched=True, returns
    ONLY the matched folders (used to avoid injecting into unrelated MT5 installs).
    """
    appdata = os.getenv("APPDATA")
    if not appdata:
        return []
    base = os.path.join(appdata, "MetaQuotes", "Terminal")
    if not os.path.exists(base):
        return []

    matched = []
    others = []

    target_dir = os.path.dirname(os.path.abspath(target_terminal_exe)).lower() if target_terminal_exe else None

    for entry in os.listdir(base):
        full = os.path.join(base, entry)
        if os.path.isdir(full) and len(entry) == 32 and os.path.exists(os.path.join(full, "config")):
            orig_file = os.path.join(full, "origin.txt")
            is_matched = False
            if os.path.exists(orig_file):
                try:
                    with open(orig_file, "r", encoding="utf-16le", errors="ignore") as f:
                        orig_path = f.read().strip().lstrip("\ufeff").lower()
                        is_matched = bool(target_dir) and (orig_path == target_dir or target_dir.startswith(orig_path))
                except Exception:
                    pass
            if is_matched:
                matched.append(full)
            else:
                others.append(full)

    if only_matched:
        return matched
    return matched + others


def resolve_server_name(target_server, manifest=None):
    """
    Resolve server name with case-insensitivity and alias matching against servers_manifest.json.
    """
    if not target_server:
        return target_server
    if not manifest:
        pack_dir = get_servers_pack_dir()
        if pack_dir:
            mpath = os.path.join(pack_dir, "servers_manifest.json")
            if os.path.exists(mpath):
                try:
                    with open(mpath, "r", encoding="utf-8") as f:
                        manifest = json.load(f)
                except Exception:
                    pass

    if not manifest:
        return target_server

    # Exact or case-insensitive match from servers list
    known_servers = manifest.get("servers", [])
    target_lower = target_server.strip().lower()
    for s in known_servers:
        if s.lower() == target_lower:
            return s

    # Common prefix/alias match (e.g. STARTRADER-Demo -> STARTRADERFinancial-Demo)
    for s in known_servers:
        clean_target = target_lower.replace("financial", "").replace("markets", "").replace("-", "")
        clean_s = s.lower().replace("financial", "").replace("markets", "").replace("-", "")
        if clean_target == clean_s:
            return s

    return target_server


def ensure_broker_server_available(cfg, target_server, active_data_path=None):
    """
    Ensure the MT5 terminal we login from has access to ``target_server``.

    Two things must live inside the terminal's roaming data dir before
    ``mt5.login(..., server=...)`` can succeed:
      * ``config/servers.dat`` — the broker network catalog. We replace it with
        the bundled multi-broker master whenever its current sha256 differs from
        the master's (an older catalog may not contain the target access point).
      * ``bases/<server>/`` — broker base dir; provisioned only when the bundled
        pack actually ships files for this server (never creates empty dirs).

    Injection is deliberately limited to the terminal we will use:
    ``active_data_path`` (the running terminal reported by IPC) when given,
    otherwise only terminal dirs whose ``origin.txt`` points at the configured
    MT5 exe. Unrelated MT5 installs are never touched.

    Returns: (resolved_server: str, provisioned: bool, error: str | None)
      * ``error`` is set only when the master servers.dat could NOT be written —
        the caller must fail the job early. The old code swallowed copy errors
        and the failure surfaced later as a confusing -10005 IPC timeout.
    """
    pack_dir = get_servers_pack_dir()
    if not pack_dir or not os.path.exists(pack_dir):
        return target_server, False, "servers_pack folder not found next to the worker"

    manifest = None
    mpath = os.path.join(pack_dir, "servers_manifest.json")
    if os.path.exists(mpath):
        try:
            with open(mpath, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception:
            pass

    resolved_server = resolve_server_name(target_server, manifest)
    if resolved_server != target_server:
        logger.info(f"🔄 [Servers Pack] Resolved server alias '{target_server}' -> '{resolved_server}'")

    pack_servers_dat = os.path.join(pack_dir, "servers.dat")
    if not os.path.exists(pack_servers_dat):
        return resolved_server, False, f"servers_pack/servers.dat missing (master catalog for '{resolved_server}')"

    master_digest = sha256_file(pack_servers_dat)

    # Optional sanity: warn when the actual pack file differs from manifest metadata.
    declared = (manifest or {}).get("serversDat", {}).get("sha256") if manifest else None
    if declared and master_digest and declared != master_digest:
        logger.warning("⚠️ [Servers Pack] servers.dat sha256 differs from servers_manifest.json "
                       f"(actual {master_digest[:12]}… vs declared {declared[:12]}…). Manifest metadata may be stale.")

    # --- Choose injection targets: ONLY the terminal we will login from ---
    targets = []
    if active_data_path and os.path.isdir(active_data_path):
        targets.append(active_data_path)
    else:
        # Pre-initialize: terminal dirs whose origin.txt matches the configured MT5 exe.
        targets = find_mt5_terminal_data_paths(cfg.get("mt5_path"), only_matched=True)

    if not targets:
        # e.g. first run before MT5 has ever launched -> no data dir exists yet.
        # The post-initialize call (active_data_path from terminal_info()) covers it.
        logger.info("ℹ️ [Servers Pack] No terminal data dir to provision yet — "
                    "will retry after initialize with the active data path.")
        return resolved_server, False, None

    pack_server_base = os.path.join(pack_dir, "bases", resolved_server)
    pack_base_has_files = os.path.isdir(pack_server_base) and any(
        os.path.isfile(os.path.join(pack_server_base, n)) for n in os.listdir(pack_server_base)
    )

    provisioned_any = False
    for term_dir in targets:
        cfg_dir = os.path.join(term_dir, "config")
        term_id = os.path.basename(term_dir)
        try:
            os.makedirs(cfg_dir, exist_ok=True)
        except OSError as e:
            logger.warning(f"⚠️ [Servers Pack] Cannot create config dir in {term_id[:8]}: {e}")
            continue

        # 1. Master network catalog — hash-compare, back up, replace.
        dest_servers_dat = os.path.join(cfg_dir, "servers.dat")
        cur_digest = sha256_file(dest_servers_dat)
        if cur_digest == master_digest:
            logger.info(f"✅ [Servers Pack] {term_id[:8]} already holds the master network catalog "
                        "(sha256 match). Skip.")
        else:
            try:
                bak_path = dest_servers_dat + ".bak"
                if os.path.exists(dest_servers_dat) and not os.path.exists(bak_path):
                    shutil.copy2(dest_servers_dat, bak_path)
                    logger.info(f"🗂 [Servers Pack] Backed up previous catalog -> {os.path.basename(bak_path)}")
                shutil.copy2(pack_servers_dat, dest_servers_dat)
                logger.info(f"📦 [Servers Pack] Injected master network catalog into terminal {term_id[:8]} "
                            f"({os.path.getsize(pack_servers_dat)} bytes).")
                provisioned_any = True
            except Exception as e:
                return resolved_server, provisioned_any, (
                    f"Failed to write master servers.dat into terminal data dir '{term_dir}': {e}"
                )

        # 2. Broker base dir — only when the pack actually ships files for it.
        if not pack_base_has_files:
            logger.info(f"ℹ️ [Servers Pack] No bundled base files for '{resolved_server}' — skipping base dir "
                        "(server access points already live in the injected catalog).")
            continue
        dest_base = os.path.join(term_dir, "bases", resolved_server)
        if os.path.isdir(dest_base):
            logger.info(f"✅ [Servers Pack] Base dir '{resolved_server}' already present in {term_id[:8]}. Skip.")
            continue
        try:
            os.makedirs(dest_base, exist_ok=True)
            for item in os.listdir(pack_server_base):
                s = os.path.join(pack_server_base, item)
                if os.path.isfile(s):
                    shutil.copy2(s, os.path.join(dest_base, item))
            logger.info(f"🚀 [Servers Pack] Injected base dir '{resolved_server}' into terminal {term_id[:8]}.")
            provisioned_any = True
        except Exception as e:
            logger.warning(f"⚠️ [Servers Pack] Could not create base dir for '{resolved_server}' in {term_id[:8]}: {e}")

    return resolved_server, provisioned_any, None


def pull_job(cfg):
    """Poll API for the next pending job."""
    url = f"{cfg['api_base_url']}/api/worker/jobs/pull"
    headers = {
        "x-worker-key": cfg["worker_key"],
        "x-worker-id": cfg["worker_id"],
        "Content-Type": "application/json",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("job")
        elif resp.status_code == 401:
            logger.error("Authentication failed! Check Worker Secret Key.")
        else:
            logger.warning(f"Pull jobs returned HTTP {resp.status_code}: {resp.text}")
    except requests.RequestException as e:
        logger.error(f"Network error connecting to API: {e}")
    return None


def submit_deals(cfg, job_id, deals, balance=None, equity=None, company=None, currency=None, leverage=None):
    """Submit retrieved deals back to the API."""
    url = f"{cfg['api_base_url']}/api/worker/jobs/submit"
    headers = {
        "x-worker-key": cfg["worker_key"],
        "x-worker-id": cfg["worker_id"],
        "Content-Type": "application/json",
    }
    payload = {
        "jobId": job_id,
        "deals": deals,
    }
    if balance is not None:
        payload["balance"] = balance
    if equity is not None:
        payload["equity"] = equity
    if company:
        payload["company"] = company
    if currency:
        payload["currency"] = currency
    if leverage:
        payload["leverage"] = leverage

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            imp = data.get("imported", 0)
            upd = data.get("updated", 0)
            logger.info(
                f"✅ [Job {job_id}] Deals submitted: {imp} imported, {upd} updated."
            )
            return True, imp, upd, ""
        else:
            err_text = resp.text
            logger.error(f"❌ [Job {job_id}] Submit deals returned HTTP {resp.status_code}: {err_text}")
            return False, 0, 0, f"HTTP {resp.status_code}: {err_text}"
    except requests.RequestException as e:
        logger.error(f"❌ [Job {job_id}] Network error submitting deals: {e}")
        return False, 0, 0, str(e)


def report_fail(cfg, job_id, error_code, error_message):
    """Report job failure back to the API."""
    url = f"{cfg['api_base_url']}/api/worker/jobs/fail"
    headers = {
        "x-worker-key": cfg["worker_key"],
        "x-worker-id": cfg["worker_id"],
        "Content-Type": "application/json",
    }
    payload = {
        "jobId": job_id,
        "errorCode": error_code,
        "errorMessage": str(error_message),
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        if resp.status_code == 200:
            logger.info(f"ℹ️ [Job {job_id}] Failure status recorded ({error_code}).")
    except requests.RequestException as e:
        logger.error(f"⚠️ [Job {job_id}] Failed to report error to API: {e}")

def check_job_cancelled(cfg, job_id):
    """Check with API if trader or admin has cancelled this job on the web dashboard."""
    try:
        url = f"{cfg['api_base_url']}/api/worker/jobs/check"
        params = {"jobId": job_id}
        headers = {
            "x-worker-key": cfg["worker_key"],
            "x-worker-id": cfg["worker_id"],
        }
        res = requests.get(url, params=params, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            return data.get("isCancelled", False)
    except Exception:
        pass
    return False


def close_mt5_terminal(cfg=None, target_pid=None):
    """
    Gracefully terminate MetaTrader 5 terminal process and disconnect IPC.
    If target_pid is provided, only that specific process is closed to protect
    any other personal MT5 terminals running on the user/Admin's machine.
    """
    if MT5_AVAILABLE:
        try:
            mt5.shutdown()
        except Exception:
            pass

    target_exe = None
    if cfg and cfg.get("mt5_path"):
        target_exe = os.path.normpath(cfg.get("mt5_path")).lower()

    closed = False
    if psutil is not None:
        try:
            for proc in psutil.process_iter(["pid", "name", "exe"]):
                try:
                    pid = proc.info.get("pid")
                    pname = (proc.info.get("name") or "").lower()
                    pexe = (
                        os.path.normpath(proc.info.get("exe") or "").lower()
                        if proc.info.get("exe")
                        else ""
                    )
                    # 1. Strict match if target_pid is known
                    if target_pid is not None:
                        if pid != target_pid:
                            continue
                    else:
                        # 2. Match configured exe path if known
                        if target_exe:
                            if pexe != target_exe:
                                continue
                        else:
                            # 3. Default MT5 executable names
                            if pname not in ("terminal64.exe", "terminal.exe"):
                                continue

                    logger.info(f"🛑 Terminating MT5 terminal PID {pid} ({pname})...")
                    proc.terminate()
                    try:
                        proc.wait(timeout=3)
                    except Exception:
                        proc.kill()
                    closed = True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as exc:
            logger.warning(f"⚠️ Process termination via psutil warning: {exc}")

    # Fallback to Windows taskkill command ONLY if target_pid was specified
    if not closed and target_pid is not None:
        try:
            res = subprocess.run(
                ["taskkill", "/PID", str(target_pid), "/F"],
                capture_output=True,
                timeout=5,
            )
            if res.returncode == 0:
                closed = True
        except Exception:
            pass

    if closed:
        logger.info("🚪 MT5 terminal process closed cleanly.")


def check_mt5_live_connection(login_id, expected_server=None):
    """
    Verify that MT5 terminal is online and actively authenticated with the target broker server.
    Returns: (is_ready: bool, account_info, terminal_info, reason: str)
    """
    if not MT5_AVAILABLE:
        return False, None, None, "MetaTrader5 library is not available"

    term_info = mt5.terminal_info()
    if not term_info:
        return False, None, None, "MT5 terminal is not responding via IPC."
    if not getattr(term_info, "connected", False):
        return False, None, term_info, "MT5 terminal is offline (terminal_info.connected = False)."

    acc_info = mt5.account_info()
    if not acc_info:
        return False, None, term_info, "No account information available from MT5."
    if acc_info.login != login_id:
        return False, acc_info, term_info, f"Terminal is on account #{acc_info.login}, expected #{login_id}."

    # A truly authenticated online session must have currency and broker company
    company = getattr(acc_info, "company", "") or ""
    currency = getattr(acc_info, "currency", "") or ""
    if not company or not currency or company == "Unknown":
        return False, acc_info, term_info, f"Trade server handshake incomplete (company='{company}', currency='{currency}')."

    return True, acc_info, term_info, "OK"


def build_closed_positions(deals_records, open_tickets=None):
    """
    Reconstruct fully-CLOSED positions from raw MT5 history deals.

    Deals are grouped by ``position_id``. A position is emitted only when it is
    fully closed (its ``position_id`` no longer appears in the open-position
    set). This fixes two partial-close bugs:
      * a position closed in several parts used the last closing deal's volume
        while summing profit over the whole life of the position -> lots/profit
        mismatch;
      * a still-open position that had a partial close was emitted twice (once
        OPEN via positions_get, once CLOSED here) with the same ticket -> the
        backend deduped them and overwrote the OPEN row.

    ``open_tickets``: iterable of position tickets that are still OPEN.
    Returns a list of payload dicts (same shape the submit API expects).
    """
    if not deals_records:
        return []
    open_tickets = {int(t) for t in (open_tickets or [])}

    # Aggregate deals by position id.
    positions_map = {}
    for d in deals_records:
        if not d.symbol or not d.position_id:
            continue  # skips DEAL_TYPE_BALANCE (deposit/withdraw) rows too
        pid = int(d.position_id)
        entry = int(getattr(d, "entry", -1))
        rec = positions_map.setdefault(
            pid,
            {
                "in_deal": None,
                "out_deal": None,
                "all_deals": [],
                "in_vol": 0.0,
                "out_vol": 0.0,
            },
        )
        rec["all_deals"].append(d)
        if entry == 0:  # DEAL_ENTRY_IN
            rec["in_deal"] = d
            rec["in_vol"] += float(d.volume)
        elif entry in (1, 2, 3):  # DEAL_ENTRY_OUT / INOUT / OUT_BY
            if rec["out_deal"] is None or int(d.time) >= int(rec["out_deal"].time):
                rec["out_deal"] = d
            rec["out_vol"] += float(d.volume)

    payload = []
    for pid, rec in positions_map.items():
        out_deal = rec["out_deal"]
        in_deal = rec["in_deal"]
        if not out_deal:
            continue  # no closing deal recorded -> nothing to emit here
        if pid in open_tickets:
            # Still open (only a partial close so far) -> reported by positions_get.
            continue

        symbol = out_deal.symbol
        if in_deal:
            deal_type = "BUY" if int(in_deal.type) == 0 else "SELL"
        else:
            deal_type = "SELL" if int(out_deal.type) == 0 else "BUY"

        # Volume = total opened volume; fall back to total closed volume when the
        # opening deal lies outside the requested history range.
        lots = rec["in_vol"] if rec["in_vol"] > 0 else rec["out_vol"]
        tot_profit = sum(float(x.profit) for x in rec["all_deals"])
        tot_swap = sum(float(x.swap) for x in rec["all_deals"])
        tot_comm = sum(float(x.commission) for x in rec["all_deals"])

        open_time = int(in_deal.time) if in_deal else int(out_deal.time)
        open_price = float(in_deal.price) if in_deal else float(out_deal.price)
        comment = str(out_deal.comment or (in_deal.comment if in_deal else ""))

        payload.append(
            {
                "ticket": pid,
                "symbol": symbol,
                "type": deal_type,
                "lots": lots,
                "openTime": open_time,
                "openPrice": open_price,
                "closeTime": int(out_deal.time),
                "closePrice": float(out_deal.price),
                "sl": None,
                "tp": None,
                "profit": tot_profit,
                "swap": tot_swap,
                "commission": tot_comm,
                "comment": comment,
            }
        )
    return payload


def process_job(cfg, job, on_progress=None):
    """Log into MT5 and fetch deals for the given job."""
    job_id = job["id"]
    account_num = job.get("accountNumber")
    server = job.get("server")
    password = job.get("investorPassword")
    mode = job.get("mode", "INCREMENTAL")
    range_from_str = job.get("rangeFrom")
    range_to_str = job.get("rangeTo")

    start_time = time.time()

    def notify(step, status="PROCESSING", details=""):
        if on_progress:
            on_progress({
                "job_id": job_id,
                "accountNumber": str(account_num or "—"),
                "server": str(server or "—"),
                "password": password or "—",
                "mode": mode,
                "step": step,
                "status": status,
                "details": details,
            })

    # Log incoming request prominently
    logger.info("=" * 64)
    logger.info(f"📥 [PULL JOB] Received Job ID: {job_id} | Mode: {mode}")
    logger.info(f"👤 Account Number : #{account_num}")
    logger.info(f"🌐 Broker Server  : '{server}'")
    logger.info(f"🔑 Investor Pass  : '{password}'")
    logger.info(f"📅 Sync Range     : {range_from_str or 'Earliest'} -> {range_to_str or 'Now'}")
    logger.info("=" * 64)

    notify("Job request received", status="PROCESSING")

    if not MT5_AVAILABLE:
        err_msg = "MetaTrader5 library is not installed or not supported on this OS."
        logger.error(f"❌ {err_msg}")
        notify("MT5 library unavailable", status="FAILED", details=err_msg)
        report_fail(cfg, job_id, "MT5_NOT_AVAILABLE", err_msg)
        return

    if not account_num or not server or not password:
        err_msg = "Missing account number, server, or investor password."
        logger.error(f"❌ {err_msg}")
        notify("Missing credentials", status="FAILED", details=err_msg)
        report_fail(cfg, job_id, "INVALID_CREDENTIALS", err_msg)
        return

    try:
        login_id = int(account_num)
    except ValueError:
        report_fail(cfg, job_id, "INVALID_ACCOUNT_FORMAT", f"Account #{account_num} is not a valid integer.")
        notify("Invalid account number format", status="FAILED")
        return

    # Ensure any previous broken IPC state is reset
    try:
        mt5.shutdown()
    except Exception:
        pass

    # Ensure broker server files and network access points are ready in MT5 terminal.
    # (Pre-initialize pass — best effort on the configured exe's terminal dir.)
    notify(f"Verifying broker network for '{server}'...", status="PROCESSING")
    resolved_server, _, pre_error = ensure_broker_server_available(cfg, server)
    if resolved_server:
        server = resolved_server
    if pre_error:
        err_msg = f"Broker provisioning failed before init: {pre_error}"
        logger.error(f"❌ {err_msg}")
        notify("Broker catalog provisioning failed", status="FAILED", details=err_msg)
        report_fail(cfg, job_id, "SERVERS_DAT_PROVISION_FAILED", err_msg)
        return

    # 1. Attach to MT5 terminal via clean IPC (do NOT pass credentials to initialize)
    mt5_custom_path = cfg.get("mt5_path")
    init_kwargs = {}
    if mt5_custom_path and os.path.exists(mt5_custom_path):
        init_kwargs["path"] = mt5_custom_path

    notify(f"Connecting to MT5 terminal...", status="PROCESSING")
    logger.info(f"🔌 Connecting to MT5 terminal (Path: '{mt5_custom_path or 'Default MetaTrader 5'}')...")

    if not mt5.initialize(**init_kwargs):
        # Edge Case 2: Auto-recovery from zombied/hanging MT5 instance
        logger.warning("⚠️ Initial MT5 connection attempt failed. Cleaning up stale instance and retrying...")
        close_mt5_terminal(cfg)
        time.sleep(1.5)
        if not mt5.initialize(**init_kwargs):
            last_err = mt5.last_error()
            err_msg = f"Failed to connect to MT5 terminal: {last_err}. Please ensure MetaTrader 5 is installed and running."
            logger.error(f"❌ {err_msg}")
            notify("MT5 initialization failed", status="FAILED", details=err_msg)
            report_fail(cfg, job_id, "MT5_INIT_FAILED", err_msg)
            close_mt5_terminal(cfg)
            return

    logger.info("✅ MT5 terminal connected via IPC.")

    # Edge Case 4: Track worker's specific MT5 PID to avoid killing Admin's other MT5 terminals
    worker_mt5_pid = None
    try:
        active_term_info = mt5.terminal_info()
        term_exe_path = getattr(active_term_info, "path", None)
        if term_exe_path and psutil is not None:
            norm_term = os.path.normpath(term_exe_path).lower()
            for p in psutil.process_iter(["pid", "exe"]):
                try:
                    pexe = os.path.normpath(p.info.get("exe") or "").lower() if p.info.get("exe") else ""
                    if pexe == norm_term:
                        worker_mt5_pid = p.info.get("pid")
                        break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        if worker_mt5_pid:
            logger.info(f"🎯 Worker attached to MT5 terminal PID {worker_mt5_pid} (Protected from collateral termination).")
    except Exception:
        pass

    # Re-verify against the active terminal data path reported by IPC.
    # If the master catalog had to be injected now, restart MT5 once so the
    # running terminal reloads the new servers.dat; a hard copy failure fails
    # the job with a clear code instead of a later -10005 IPC timeout.
    try:
        active_term_info = mt5.terminal_info()
    except Exception:
        active_term_info = None
    active_data_path = getattr(active_term_info, "data_path", None) if active_term_info else None
    if active_data_path:
        resolved_server, post_provisioned, post_error = ensure_broker_server_available(
            cfg, server, active_data_path=active_data_path
        )
        if resolved_server:
            server = resolved_server
        if post_error:
            err_msg = f"Broker provisioning failed: {post_error}"
            logger.error(f"❌ {err_msg}")
            notify("Broker catalog provisioning failed", status="FAILED", details=err_msg)
            report_fail(cfg, job_id, "SERVERS_DAT_PROVISION_FAILED", err_msg)
            close_mt5_terminal(cfg)
            return
        if post_provisioned:
            logger.info("♻️ [Servers Pack] Master catalog injected post-initialize — restarting MT5 to reload it...")
            try:
                mt5.shutdown()
            except Exception:
                pass
            if not mt5.initialize(**init_kwargs):
                last_err = mt5.last_error()
                err_msg = f"Failed to reconnect MT5 terminal after catalog injection: {last_err}"
                logger.error(f"❌ {err_msg}")
                notify("MT5 re-initialization failed", status="FAILED", details=err_msg)
                report_fail(cfg, job_id, "MT5_INIT_FAILED", err_msg)
                close_mt5_terminal(cfg)
                return
            logger.info("✅ MT5 terminal reconnected after catalog injection.")

    try:
        # 2. Check if terminal is already online and connected to target account
        notify(f"Checking MT5 live network connection...", status="PROCESSING")
        is_ready = False
        account_info = None

        # Give MT5 up to 10s to complete background login/handshake if terminal was just launched
        for wait_i in range(10):
            is_ready, account_info, term_info, reason = check_mt5_live_connection(login_id, server)
            if is_ready:
                logger.info(f"⚡ MT5 is already online and active on target account #{account_num} ({account_info.server}).")
                break
            if wait_i == 0 or wait_i % 3 == 0:
                logger.info(f"⏳ {reason}. Waiting for MT5 network connection ({wait_i + 1}/10s)...")
            time.sleep(1)

        # 3. If not yet online on the target account, perform explicit mt5.login
        if not is_ready:
            last_login_err = None
            max_attempts = 5
            for attempt in range(max_attempts):
                # Edge Case 3: Check if user/admin cancelled sync on web dashboard mid-flight
                if attempt > 0 and check_job_cancelled(cfg, job_id):
                    logger.info(f"🛑 [Job {job_id}] Sync request was cancelled on web dashboard. Aborting immediately.")
                    notify("Sync cancelled by user", status="FAILED", details="Sync job was cancelled on dashboard.")
                    return

                notify(f"Logging into #{account_num} on '{server}' [Attempt {attempt + 1}/{max_attempts}]...", status="PROCESSING")
                logger.info(f"🔐 [Attempt {attempt + 1}/{max_attempts}] Handshake with account #{account_num} on server '{server}'...")
                try:
                    login_ok = mt5.login(login=login_id, password=str(password), server=str(server), timeout=15000)
                except Exception as login_exc:
                    logger.warning(f"⚠️ Exception calling mt5.login: {login_exc}")
                    login_ok = False

                if not login_ok:
                    last_login_err = mt5.last_error()
                    err_code = last_login_err[0] if isinstance(last_login_err, tuple) else None
                    err_desc = str(last_login_err[1] if isinstance(last_login_err, tuple) and len(last_login_err) > 1 else last_login_err).lower()
                    logger.warning(f"⚠️ mt5.login returned False [error: {last_login_err}]. Waiting for connection...")

                    # Edge Case 1: Immediately detect invalid password/credentials vs network timeout
                    is_auth_error = (
                        err_code in (4001, 6002, 10004, -10004) or
                        "invalid account" in err_desc or
                        "invalid password" in err_desc or
                        "wrong password" in err_desc or
                        "authorization failed" in err_desc or
                        "disabled account" in err_desc
                    )
                    if is_auth_error:
                        auth_msg = (
                            f"Authentication failed for account #{account_num}: Invalid Investor Password or Account Number. "
                            "Please check your credentials in Cloud Sync settings."
                        )
                        logger.error(f"❌ {auth_msg}")
                        notify("Invalid credentials", status="FAILED", details=auth_msg)
                        report_fail(cfg, job_id, "INVALID_CREDENTIALS", auth_msg)
                        return

                    # Edge Case 2: Server missing from MT5 server catalog (error -10005) -> Fail fast immediately
                    if err_code == -10005 or "server not found" in err_desc or "not recognized" in err_desc:
                        server_err_msg = (
                            f"Server '{server}' was not recognized by MT5 (error -10005). "
                            "This broker server is missing from the MT5 server catalog. "
                            "Admin can sync this account manually or provision the server in MT5."
                        )
                        logger.warning("=" * 64)
                        logger.warning(f"💡 [HOW TO FIX]: Server '{server}' is missing from this MT5 installation!")
                        logger.warning(f"   1. In MT5 on your screen, click: File -> Open an Account")
                        logger.warning(f"   2. Search for: '{server.split('-')[0]}' -> Click 'Find your broker'")
                        logger.warning(f"   3. Select the broker -> Click Next -> 'Connect with an existing trade account'")
                        logger.warning(f"   4. Enter Login: {account_num} | Server: {server} -> Finish")
                        logger.warning("   Once MT5 has this server saved, synchronization will be instant!")
                        logger.warning("=" * 64)
                        logger.error(f"❌ {server_err_msg}")
                        notify(f"Server '{server}' not recognized", status="FAILED", details=server_err_msg)
                        report_fail(cfg, job_id, "SERVERS_DAT_PROVISION_FAILED", server_err_msg)
                        return

                # Wait up to 8 seconds for terminal to complete authentication after login call
                for poll_i in range(8):
                    time.sleep(1)
                    is_ready, account_info, term_info, reason = check_mt5_live_connection(login_id, server)
                    if is_ready:
                        break

                if is_ready:
                    break

                logger.warning(f"⚠️ Handshake attempt {attempt + 1}/{max_attempts} not authenticated: {reason}. Retrying in 2s...")
                time.sleep(2)

            if not is_ready:
                err_code = last_login_err[0] if isinstance(last_login_err, tuple) else None
                err_msg = (
                    f"Login timed out: MT5 could not establish an authenticated connection to account #{account_num} on server '{server}' after {max_attempts} attempts ({reason})."
                )
                if err_code == -10005:
                    err_msg += f" Server '{server}' was not recognized by MT5."
                    logger.warning("=" * 64)
                    logger.warning(f"💡 [HOW TO FIX]: Server '{server}' is missing from this MT5 installation!")
                    logger.warning(f"   1. In MT5 on your screen, click: File -> Open an Account")
                    logger.warning(f"   2. Search for: '{server.split('-')[0]}' -> Click 'Find your broker'")
                    logger.warning(f"   3. Select the broker -> Click Next -> 'Connect with an existing trade account'")
                    logger.warning(f"   4. Enter Login: {account_num} | Server: {server} -> Finish")
                    logger.warning("   Once MT5 has this server saved, synchronization will be instant!")
                    logger.warning("=" * 64)

                logger.error(f"❌ {err_msg} (Details: {reason})")
                notify(f"Login failed: {reason}", status="FAILED", details=err_msg)
                report_fail(cfg, job_id, "LOGIN_TIMEOUT_5X", err_msg)
                return

        # 4. Read Account Capital & Balance (Wait 1s for balance sync)
        time.sleep(1.0)
        account_info = mt5.account_info()
        balance = account_info.balance if account_info else None
        equity = account_info.equity if account_info else None
        company = getattr(account_info, "company", None) if account_info else None
        currency = getattr(account_info, "currency", None) if account_info else None
        leverage = getattr(account_info, "leverage", None) if account_info else None

        logger.info(f"✅ Authenticated & online as Investor on #{account_num} ({server}).")
        logger.info(
            f"💰 Account Telemetry: Balance = {balance} {currency or ''} | Equity = {equity} | Broker = '{company or 'Unknown'}' | Leverage = 1:{leverage or '—'}"
        )
        bal_display = f"{balance:,.2f} {currency or ''}" if balance is not None else "N/A"
        notify(f"Authorized #{account_num}! Balance: {bal_display}", status="PROCESSING")

        # 5. Fetch Active Positions and Historical Closed Deals
        positions_payload = []

        # 4A. Currently OPEN Positions
        open_positions = mt5.positions_get()
        if open_positions:
            for pos in open_positions:
                deal_type = "BUY" if pos.type == 0 else "SELL"
                positions_payload.append({
                    "ticket": pos.ticket,
                    "symbol": pos.symbol,
                    "type": deal_type,
                    "lots": float(pos.volume),
                    "openTime": int(pos.time),
                    "openPrice": float(pos.price_open),
                    "closeTime": None,
                    "closePrice": None,
                    "sl": float(pos.sl) if pos.sl else None,
                    "tp": float(pos.tp) if pos.tp else None,
                    "profit": float(pos.profit),
                    "swap": float(pos.swap),
                    "commission": 0.0,
                    "comment": str(pos.comment or ""),
                })

        # 4B. CLOSED Positions reconstructed from History Deals
        open_tickets = {int(pos.ticket) for pos in (open_positions or [])}

        from_dt = parse_iso_datetime(range_from_str) if range_from_str else datetime(2020, 1, 1, tzinfo=timezone.utc)
        to_dt = parse_iso_datetime(range_to_str) if range_to_str else datetime.now(timezone.utc)
        from_timestamp = from_dt.timestamp()
        to_timestamp = to_dt.timestamp() + 86400  # include full closing day

        notify("Fetching history deals from MT5...", status="PROCESSING")
        logger.info(f"📜 Querying history deals from {from_dt.strftime('%Y-%m-%d %H:%M:%S')} to {to_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC...")

        deals_records = mt5.history_deals_get(from_timestamp, to_timestamp)
        # If terminal was just connected, history deals may take 1-3 seconds to sync from broker
        if not deals_records:
            for retry_h in range(3):
                time.sleep(1.5)
                deals_records = mt5.history_deals_get(from_timestamp, to_timestamp)
                if deals_records:
                    logger.info(f"⚡ History deals synced from broker ({len(deals_records)} deals).")
                    break

        closed_payload = build_closed_positions(deals_records, open_tickets)
        positions_payload.extend(closed_payload)

        open_cnt = len(open_positions or [])
        closed_cnt = len(closed_payload)
        logger.info(f"📊 Deals extracted: {len(deals_records) if deals_records else 0} raw deals -> {len(positions_payload)} positions ({open_cnt} open, {closed_cnt} closed).")

        # 5. Submit Deals to API
        notify(f"Submitting {len(positions_payload)} deals to platform...", status="PROCESSING")
        logger.info(f"🚀 Submitting {len(positions_payload)} positions to API ({cfg['api_base_url']}/api/worker/jobs/submit)...")

        ok, imported_cnt, updated_cnt, err_detail = submit_deals(
            cfg,
            job_id,
            positions_payload,
            balance=balance,
            equity=equity,
            company=company,
            currency=currency,
            leverage=leverage,
        )

        elapsed = time.time() - start_time
        if ok:
            notify(f"Sync Complete: {imported_cnt} imported, {updated_cnt} updated ({elapsed:.1f}s)", status="SUCCESS", details=f"Total: {len(positions_payload)} deals")
            logger.info(f"🎉 Job [{job_id}] completed successfully in {elapsed:.1f}s.")
        else:
            notify(f"Failed to submit deals: {err_detail}", status="FAILED", details=err_detail)

    except Exception as exc:
        logger.exception(f"💥 Unexpected error processing job {job_id}: {exc}")
        notify(f"Unexpected error: {exc}", status="FAILED", details=str(exc))
        report_fail(cfg, job_id, "UNEXPECTED_ERROR", str(exc))
    finally:
        close_mt5_terminal(cfg, target_pid=worker_mt5_pid)
        logger.info("🔌 MT5 terminal closed and connection released cleanly.")


# ==========================================
# WORKER BACKGROUND THREAD CONTROLLER
# ==========================================
class WorkerThread(threading.Thread):
    def __init__(self, cfg, on_status_change=None, on_task_update=None):
        super().__init__(daemon=True)
        self.cfg = cfg
        self.on_status_change = on_status_change
        self.on_task_update = on_task_update
        self.stop_event = threading.Event()

    def stop(self):
        self.stop_event.set()

    def run(self):
        logger.info(f"Worker started. Polling API at: {self.cfg['api_base_url']}")
        if self.on_status_change:
            self.on_status_change("running")
        if self.on_task_update:
            self.on_task_update({
                "status": "IDLE",
                "step": "Idle — Waiting for sync jobs...",
                "accountNumber": "—",
                "server": "—",
                "password": "—",
                "mode": "—",
            })

        poll_interval = max(3, int(self.cfg.get("poll_interval", 10)))

        while not self.stop_event.is_set():
            try:
                job = pull_job(self.cfg)
                if job:
                    if self.on_status_change:
                        self.on_status_change("processing")
                    if self.on_task_update:
                        self.on_task_update({
                            "status": "PROCESSING",
                            "step": f"Received Job #{job.get('id')} — preparing login for #{job.get('accountNumber')}",
                            "accountNumber": str(job.get("accountNumber") or "—"),
                            "server": str(job.get("server") or "—"),
                            "password": str(job.get("investorPassword") or "—"),
                            "mode": str(job.get("mode") or "—"),
                        })
                    process_job(self.cfg, job, on_progress=self.on_task_update)
                    if self.on_status_change:
                        self.on_status_change("running")
                else:
                    # Sleep in small increments to be quickly responsive to stop_event
                    for _ in range(poll_interval * 2):
                        if self.stop_event.is_set():
                            break
                        time.sleep(0.5)
            except Exception as e:
                logger.error(f"Unexpected error in polling loop: {e}")
                time.sleep(poll_interval)

        logger.info("Worker stopped.")
        if self.on_status_change:
            self.on_status_change("stopped")
        if self.on_task_update:
            self.on_task_update({
                "status": "STOPPED",
                "step": "Worker is stopped.",
            })


# ==========================================
# DESKTOP GUI INTERFACE (TKINTER)
# ==========================================
def launch_gui():
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox, scrolledtext

    root = tk.Tk()
    root.title("TheNextTrade — Cloud Sync Worker")
    root.geometry("1180x750")
    root.minsize(1020, 620)

    cfg = load_config()
    worker_thread = None
    active_theme = cfg.get("theme", "light")  # Default to Light Mode as requested

    # Premium Color Palette (Light Mode by default, with Dark Mode fallback toggle)
    THEMES = {
        "light": {
            "name": "Light",
            "bg": "#F8FAFC",              # Modern Slate 50 background
            "panel_bg": "#FFFFFF",        # Clean white card surfaces
            "card_bg": "#F1F5F9",         # Slate 100 for telemetry specs
            "border": "#E2E8F0",          # Slate 200 crisp border
            "border_focus": "#2563EB",    # Royal blue focus
            "text": "#0F172A",            # Slate 900 high contrast
            "text_muted": "#64748B",      # Slate 500 secondary text
            "input_bg": "#FFFFFF",        # White input
            "input_fg": "#0F172A",        # Slate 900 text
            "input_border": "#CBD5E1",    # Slate 300 border
            "btn_sec_bg": "#F1F5F9",      # Slate 100 button
            "btn_sec_fg": "#334155",      # Slate 700 button text
            "btn_sec_border": "#CBD5E1",  # Slate 300 border
            "log_bg": "#FFFFFF",          # Pure white log area
            "log_fg": "#1E293B",          # Slate 800 readable log text
            "accent_green": "#059669",    # Emerald 600
            "accent_blue": "#2563EB",     # Royal blue 600
            "accent_cyan": "#0284C7",     # Sky 600
            "accent_amber": "#D97706",    # Amber 600
            "accent_red": "#DC2626",      # Red 600
            "badge_bg": "#ECFDF5",        # Emerald 50
            "badge_fg": "#065F46",        # Emerald 800
            "theme_btn_text": "🌙 Dark Mode",
        },
        "dark": {
            "name": "Dark",
            "bg": "#0F1218",
            "panel_bg": "#181C26",
            "card_bg": "#121620",
            "border": "#293042",
            "border_focus": "#3B82F6",
            "text": "#F0F2F7",
            "text_muted": "#8B95A5",
            "input_bg": "#212735",
            "input_fg": "#F0F2F7",
            "input_border": "#293042",
            "btn_sec_bg": "#212735",
            "btn_sec_fg": "#F0F2F7",
            "btn_sec_border": "#293042",
            "log_bg": "#141820",
            "log_fg": "#D1D5DB",
            "accent_green": "#10B981",
            "accent_blue": "#3B82F6",
            "accent_cyan": "#06B6D4",
            "accent_amber": "#F59E0B",
            "accent_red": "#EF4444",
            "badge_bg": "#064E3B",
            "badge_fg": "#6EE7B7",
            "theme_btn_text": "🌞 Light Mode",
        },
    }

    t = THEMES.get(active_theme, THEMES["light"])

    # Custom Queue Logging Handler to display logs in ScrolledText
    class TkLogHandler(logging.Handler):
        def __init__(self, text_widget):
            super().__init__()
            self.text_widget = text_widget

        def emit(self, record):
            msg = self.format(record)
            def append():
                try:
                    self.text_widget.configure(state="normal")
                    tag = "INFO"
                    if record.levelno >= logging.ERROR:
                        tag = "ERROR"
                    elif record.levelno >= logging.WARNING:
                        tag = "WARNING"
                    self.text_widget.insert(tk.END, msg + "\n", tag)
                    self.text_widget.see(tk.END)
                    self.text_widget.configure(state="disabled")
                except Exception:
                    pass
            root.after(0, append)

    # Top Brand Accent Bar (3px)
    accent_bar = tk.Frame(root, height=3, bg=t["accent_blue"])
    accent_bar.pack(fill="x", side="top")

    root.configure(bg=t["bg"])

    # 1. Header Frame (Top span)
    header_frame = tk.Frame(root, bg=t["panel_bg"], padx=20, pady=12, highlightbackground=t["border"], highlightthickness=1)
    header_frame.pack(fill="x", padx=16, pady=(10, 8))

    header_left = tk.Frame(header_frame, bg=t["panel_bg"])
    header_left.pack(side="left", fill="both", expand=True)

    title_label = tk.Label(
        header_left,
        text="TheNextTrade Cloud Sync Worker",
        font=("Segoe UI", 13, "bold"),
        fg=t["text"],
        bg=t["panel_bg"],
    )
    title_label.pack(anchor="w")

    subtitle_label = tk.Label(
        header_left,
        text="⚡ MT5 Investor Telemetry & Trade History Realtime Bridge",
        font=("Segoe UI", 9),
        fg=t["text_muted"],
        bg=t["panel_bg"],
    )
    subtitle_label.pack(anchor="w", pady=(2, 0))

    header_right = tk.Frame(header_frame, bg=t["panel_bg"])
    header_right.pack(side="right", padx=(8, 0))

    badge_version = tk.Label(
        header_right,
        text="● v2.4.0 Live",
        font=("Segoe UI", 8, "bold"),
        fg=t["badge_fg"],
        bg=t["badge_bg"],
        padx=8,
        pady=3,
    )
    badge_version.pack(side="top", anchor="e", pady=(0, 4))

    theme_box = tk.Frame(header_right, bg=t["panel_bg"])
    theme_box.pack(side="bottom", anchor="e")

    def set_theme(theme_name):
        nonlocal active_theme, t
        if active_theme == theme_name:
            return
        active_theme = theme_name
        t = THEMES[active_theme]
        apply_theme_colors()
        current_cfg = get_form_cfg()
        current_cfg["theme"] = active_theme
        save_config(current_cfg)

    btn_light = tk.Button(
        theme_box,
        text="🌞 Light",
        font=("Segoe UI", 8, "bold"),
        relief="flat",
        padx=8,
        pady=2,
        command=lambda: set_theme("light"),
    )
    btn_light.pack(side="left", padx=(0, 3))

    btn_dark = tk.Button(
        theme_box,
        text="🌙 Dark",
        font=("Segoe UI", 8),
        relief="flat",
        padx=8,
        pady=2,
        command=lambda: set_theme("dark"),
    )
    btn_dark.pack(side="left")

    # =========================================================================
    # 2-COLUMN SPLIT CONTAINER (Ratio ~35% Left Info : ~65% Right Terminal Log)
    # =========================================================================
    main_body = tk.Frame(root, bg=t["bg"])
    main_body.pack(fill="both", expand=True, padx=16, pady=(0, 14))
    main_body.columnconfigure(0, weight=0, minsize=470)
    main_body.columnconfigure(1, weight=1)
    main_body.rowconfigure(0, weight=1)

    # -------------------------------------------------------------------------
    # LEFT COLUMN: Configuration, Active Sync 2x2 Specs, Controls & Status
    # -------------------------------------------------------------------------
    left_col = tk.Frame(main_body, bg=t["bg"])
    left_col.grid(row=0, column=0, sticky="nsew", padx=(0, 12))

    # A. Settings Frame (Direct Inputs)
    settings_frame = tk.LabelFrame(
        left_col,
        text="  ⚙️ Worker Configuration  ",
        font=("Segoe UI", 9, "bold"),
        fg=t["text"],
        bg=t["panel_bg"],
        padx=14,
        pady=10,
        highlightbackground=t["border"],
        highlightthickness=1,
    )
    settings_frame.pack(fill="x", pady=(0, 8))

    tracked_input_labels = []
    tracked_entries = []

    def create_input_row(parent, label_text, default_val=""):
        lbl = tk.Label(parent, text=label_text, font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["panel_bg"])
        lbl.pack(anchor="w", pady=(3, 1))
        tracked_input_labels.append(lbl)
        entry = tk.Entry(
            parent,
            font=("Segoe UI", 9),
            bg=t["input_bg"],
            fg=t["input_fg"],
            insertbackground=t["text"],
            relief="flat",
            highlightthickness=1,
            highlightbackground=t["input_border"],
            highlightcolor=t["border_focus"],
        )
        entry.insert(0, str(default_val))
        entry.pack(fill="x", ipady=3)
        tracked_entries.append(entry)
        return entry

    entry_url = create_input_row(settings_frame, "Server API URL (API_BASE_URL):", cfg["api_base_url"])
    entry_key = create_input_row(settings_frame, "Worker Secret Key (WORKER_KEY):", cfg["worker_key"])

    # Row with Worker ID & Poll Interval
    row2 = tk.Frame(settings_frame, bg=t["panel_bg"])
    row2.pack(fill="x", pady=(3, 1))

    col1 = tk.Frame(row2, bg=t["panel_bg"])
    col1.pack(side="left", fill="x", expand=True, padx=(0, 6))
    lbl_id_title = tk.Label(col1, text="Worker Identifier (WORKER_ID):", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["panel_bg"])
    lbl_id_title.pack(anchor="w")
    tracked_input_labels.append(lbl_id_title)
    entry_id = tk.Entry(
        col1,
        font=("Segoe UI", 9),
        bg=t["input_bg"],
        fg=t["input_fg"],
        insertbackground=t["text"],
        relief="flat",
        highlightthickness=1,
        highlightbackground=t["input_border"],
        highlightcolor=t["border_focus"],
    )
    entry_id.insert(0, cfg["worker_id"])
    entry_id.pack(fill="x", ipady=3, pady=(2, 0))
    tracked_entries.append(entry_id)

    col2 = tk.Frame(row2, bg=t["panel_bg"])
    col2.pack(side="right", fill="x", expand=True, padx=(6, 0))
    lbl_poll_title = tk.Label(col2, text="Poll Interval (Sec):", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["panel_bg"])
    lbl_poll_title.pack(anchor="w")
    tracked_input_labels.append(lbl_poll_title)
    entry_poll = tk.Entry(
        col2,
        font=("Segoe UI", 9),
        bg=t["input_bg"],
        fg=t["input_fg"],
        insertbackground=t["text"],
        relief="flat",
        highlightthickness=1,
        highlightbackground=t["input_border"],
        highlightcolor=t["border_focus"],
    )
    entry_poll.insert(0, str(cfg["poll_interval"]))
    entry_poll.pack(fill="x", ipady=3, pady=(2, 0))
    tracked_entries.append(entry_poll)

    # MT5 Path row
    row_mt5 = tk.Frame(settings_frame, bg=t["panel_bg"])
    row_mt5.pack(fill="x", pady=(4, 3))
    lbl_mt5_title = tk.Label(row_mt5, text="Custom MT5 Terminal Path (Optional):", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["panel_bg"])
    lbl_mt5_title.pack(anchor="w")
    tracked_input_labels.append(lbl_mt5_title)

    mt5_input_row = tk.Frame(row_mt5, bg=t["panel_bg"])
    mt5_input_row.pack(fill="x", pady=(2, 0))
    entry_mt5 = tk.Entry(
        mt5_input_row,
        font=("Segoe UI", 9),
        bg=t["input_bg"],
        fg=t["input_fg"],
        insertbackground=t["text"],
        relief="flat",
        highlightthickness=1,
        highlightbackground=t["input_border"],
        highlightcolor=t["border_focus"],
    )
    entry_mt5.insert(0, cfg.get("mt5_path", ""))
    entry_mt5.pack(side="left", fill="x", expand=True, ipady=3)
    tracked_entries.append(entry_mt5)

    def browse_mt5():
        filename = filedialog.askopenfilename(
            title="Select terminal64.exe",
            filetypes=[("Executable Files", "*.exe"), ("All Files", "*.*")],
        )
        if filename:
            entry_mt5.delete(0, tk.END)
            entry_mt5.insert(0, filename)

    btn_browse = tk.Button(
        mt5_input_row,
        text="Browse...",
        font=("Segoe UI", 8, "bold"),
        bg=t["btn_sec_bg"],
        fg=t["btn_sec_fg"],
        relief="flat",
        highlightbackground=t["btn_sec_border"],
        highlightthickness=1,
        padx=8,
        command=browse_mt5,
    )
    btn_browse.pack(side="right", padx=(6, 0))

    # Buttons Frame inside settings (Save Settings + Start Worker)
    btn_frame = tk.Frame(settings_frame, bg=t["panel_bg"])
    btn_frame.pack(fill="x", pady=(8, 2))

    def get_form_cfg():
        try:
            poll_val = int(entry_poll.get().strip() or "10")
        except ValueError:
            poll_val = 10
        return {
            "api_base_url": entry_url.get().strip().rstrip("/"),
            "worker_key": entry_key.get().strip(),
            "worker_id": entry_id.get().strip(),
            "poll_interval": poll_val,
            "mt5_path": entry_mt5.get().strip(),
            "auto_start": cfg.get("auto_start", False),
            "theme": active_theme,
        }

    def on_save_clicked():
        current_cfg = get_form_cfg()
        if save_config(current_cfg):
            messagebox.showinfo("Success", "Settings saved successfully to config.json!")
        else:
            messagebox.showerror("Error", "Failed to save configuration.")

    btn_save = tk.Button(
        btn_frame,
        text="💾 Save Settings",
        font=("Segoe UI", 9, "bold"),
        bg=t["btn_sec_bg"],
        fg=t["btn_sec_fg"],
        relief="flat",
        highlightbackground=t["btn_sec_border"],
        highlightthickness=1,
        padx=12,
        pady=5,
        command=on_save_clicked,
    )
    btn_save.pack(side="left")

    def update_status_ui(state):
        def apply():
            if state == "running":
                status_indicator.configure(text=f"● Worker Active (Polling every {entry_poll.get()}s)", fg=t["accent_green"])
                btn_start.configure(text="⏹ Stop Worker", bg=t["accent_red"], fg="#ffffff")
            elif state == "processing":
                status_indicator.configure(text="● Processing MT5 Sync Job...", fg=t["accent_blue"])
            elif state == "stopped":
                status_indicator.configure(text="● Worker Stopped", fg=t["accent_red"])
                btn_start.configure(text="▶ Start Worker", bg=t["accent_green"], fg="#ffffff")
        root.after(0, apply)

    def on_toggle_worker():
        nonlocal worker_thread
        if worker_thread and worker_thread.is_alive():
            worker_thread.stop()
            worker_thread = None
            update_status_ui("stopped")
        else:
            current_cfg = get_form_cfg()
            if not current_cfg["api_base_url"]:
                messagebox.showerror("Error", "Server API URL cannot be empty.")
                return
            if not current_cfg["worker_key"]:
                messagebox.showerror("Error", "Worker Secret Key cannot be empty.")
                return
            save_config(current_cfg)
            worker_thread = WorkerThread(
                current_cfg,
                on_status_change=update_status_ui,
                on_task_update=update_task_ui,
            )
            worker_thread.start()

    btn_start = tk.Button(
        btn_frame,
        text="▶ Start Worker",
        font=("Segoe UI", 9, "bold"),
        bg=t["accent_green"],
        fg="#ffffff",
        relief="flat",
        padx=16,
        pady=5,
        command=on_toggle_worker,
    )
    btn_start.pack(side="right")

    # B. Active Sync Task & Target Account Monitor (2x2 Matrix Specs Card)
    monitor_frame = tk.LabelFrame(
        left_col,
        text="  📊 Active Sync Task & Target Account  ",
        font=("Segoe UI", 9, "bold"),
        fg=t["accent_blue"],
        bg=t["card_bg"],
        padx=14,
        pady=8,
        highlightbackground=t["border"],
        highlightthickness=1,
    )
    monitor_frame.pack(fill="x", pady=(0, 8))

    monitor_frame.columnconfigure(0, weight=1)
    monitor_frame.columnconfigure(1, weight=1)

    # Row 0: Titles
    lbl_t_acc = tk.Label(monitor_frame, text="Target Account:", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["card_bg"])
    lbl_t_acc.grid(row=0, column=0, sticky="w", pady=(0, 1))

    lbl_t_srv = tk.Label(monitor_frame, text="Broker Server:", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["card_bg"])
    lbl_t_srv.grid(row=0, column=1, sticky="w", padx=(12, 0), pady=(0, 1))

    # Row 1: Values
    lbl_acc_val = tk.Label(monitor_frame, text="—", font=("Segoe UI", 11, "bold"), fg=t["accent_cyan"], bg=t["card_bg"])
    lbl_acc_val.grid(row=1, column=0, sticky="w", pady=(0, 4))

    lbl_srv_val = tk.Label(monitor_frame, text="—", font=("Segoe UI", 10, "bold"), fg=t["text"], bg=t["card_bg"])
    lbl_srv_val.grid(row=1, column=1, sticky="w", padx=(12, 0), pady=(0, 4))

    # Row 2: Titles
    lbl_t_pwd = tk.Label(monitor_frame, text="Investor Password:", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["card_bg"])
    lbl_t_pwd.grid(row=2, column=0, sticky="w", pady=(0, 1))

    lbl_t_mode = tk.Label(monitor_frame, text="Sync Mode:", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["card_bg"])
    lbl_t_mode.grid(row=2, column=1, sticky="w", padx=(12, 0), pady=(0, 1))

    # Row 3: Values
    lbl_pwd_val = tk.Label(monitor_frame, text="—", font=("Segoe UI", 10, "bold"), fg=t["accent_amber"], bg=t["card_bg"])
    lbl_pwd_val.grid(row=3, column=0, sticky="w", pady=(0, 4))

    lbl_mode_val = tk.Label(monitor_frame, text="—", font=("Segoe UI", 9, "bold"), fg=t["text_muted"], bg=t["card_bg"])
    lbl_mode_val.grid(row=3, column=1, sticky="w", padx=(12, 0), pady=(0, 4))

    # Row 4: Progress / Telemetry Step
    lbl_t_step = tk.Label(monitor_frame, text="Current Telemetry / Sync Progress:", font=("Segoe UI", 8, "bold"), fg=t["text_muted"], bg=t["card_bg"])
    lbl_t_step.grid(row=4, column=0, columnspan=2, sticky="w", pady=(2, 1))

    lbl_step_val = tk.Label(
        monitor_frame,
        text="● Worker Idle — Waiting for incoming sync requests...",
        font=("Segoe UI", 9, "bold"),
        fg=t["text_muted"],
        bg=t["card_bg"],
        wraplength=420,
        justify="left",
    )
    lbl_step_val.grid(row=5, column=0, columnspan=2, sticky="w", pady=(0, 2))

    # C. Status Bar & Servers Pack Frame
    status_frame = tk.Frame(left_col, bg=t["panel_bg"], padx=14, pady=8, highlightbackground=t["border"], highlightthickness=1)
    status_frame.pack(fill="x", pady=(0, 0))

    status_indicator = tk.Label(
        status_frame,
        text="● Worker Stopped",
        font=("Segoe UI", 9, "bold"),
        fg=t["accent_red"],
        bg=t["panel_bg"],
    )
    status_indicator.pack(side="left")

    pack_dir = get_servers_pack_dir()
    broker_count = 14
    if pack_dir:
        mpath = os.path.join(pack_dir, "servers_manifest.json")
        if os.path.exists(mpath):
            try:
                with open(mpath, "r", encoding="utf-8") as mf:
                    broker_count = len(json.load(mf).get("brokers", {}))
            except Exception:
                pass
    pack_status_text = f"📦 Servers: Active ({broker_count} Brokers)" if pack_dir else "📦 Servers: Standalone"
    lbl_pack = tk.Label(status_frame, text=pack_status_text, font=("Segoe UI", 8, "bold"), fg=t["accent_green"] if pack_dir else t["accent_amber"], bg=t["panel_bg"])
    lbl_pack.pack(side="right")

    def update_task_ui(info):
        def apply():
            acc = info.get("accountNumber")
            srv = info.get("server")
            pwd = info.get("password")
            mode = info.get("mode")
            step = info.get("step") or "Idle"
            status = info.get("status", "IDLE")

            if acc and acc != "—":
                lbl_acc_val.configure(text=f"#{acc}")
            elif acc == "—" and status == "IDLE" and lbl_acc_val.cget("text") == "":
                lbl_acc_val.configure(text="—")

            if srv and srv != "—":
                lbl_srv_val.configure(text=srv)
            elif srv == "—" and status == "IDLE" and lbl_srv_val.cget("text") == "":
                lbl_srv_val.configure(text="—")

            if pwd and pwd != "—":
                lbl_pwd_val.configure(text=pwd)
            elif pwd == "—" and status == "IDLE" and lbl_pwd_val.cget("text") == "":
                lbl_pwd_val.configure(text="—")

            if mode and mode != "—":
                lbl_mode_val.configure(text=mode)
            elif mode == "—" and status == "IDLE" and lbl_mode_val.cget("text") == "":
                lbl_mode_val.configure(text="—")

            if status == "PROCESSING":
                lbl_step_val.configure(text=f"🔄 {step}", fg=t["accent_blue"])
            elif status == "SUCCESS":
                lbl_step_val.configure(text=f"✅ {step}", fg=t["accent_green"])
            elif status == "FAILED":
                lbl_step_val.configure(text=f"❌ {step}", fg=t["accent_red"])
            elif status == "STOPPED":
                lbl_step_val.configure(text="⏹ Worker is stopped", fg=t["accent_red"])
            else:
                lbl_step_val.configure(text=f"● {step}", fg=t["text_muted"])

        root.after(0, apply)

    # -------------------------------------------------------------------------
    # RIGHT COLUMN: Full-Height Live Activity Terminal Log (~65% width)
    # -------------------------------------------------------------------------
    right_col = tk.Frame(main_body, bg=t["panel_bg"], highlightbackground=t["border"], highlightthickness=1)
    right_col.grid(row=0, column=1, sticky="nsew")

    log_header_frame = tk.Frame(right_col, bg=t["panel_bg"], padx=14, pady=8)
    log_header_frame.pack(fill="x", side="top")

    lbl_log_title = tk.Label(
        log_header_frame,
        text="Live Sync Activity Log",
        font=("Segoe UI", 10, "bold"),
        fg=t["text"],
        bg=t["panel_bg"],
    )
    lbl_log_title.pack(side="left")

    def clear_log():
        log_text.configure(state="normal")
        log_text.delete("1.0", tk.END)
        log_text.configure(state="disabled")

    btn_clear = tk.Button(
        log_header_frame,
        text="Clear Log",
        font=("Segoe UI", 8),
        bg=t["btn_sec_bg"],
        fg=t["btn_sec_fg"],
        relief="flat",
        highlightbackground=t["btn_sec_border"],
        highlightthickness=1,
        padx=10,
        pady=2,
        command=clear_log,
    )
    btn_clear.pack(side="right")

    log_divider = tk.Frame(right_col, height=1, bg=t["border"])
    log_divider.pack(fill="x", side="top")

    log_text = scrolledtext.ScrolledText(
        right_col,
        font=("Consolas", 9),
        bg=t["log_bg"],
        fg=t["log_fg"],
        insertbackground=t["text"],
        relief="flat",
        highlightthickness=0,
        state="disabled",
    )
    log_text.pack(fill="both", expand=True, padx=4, pady=4)

    log_text.tag_config("INFO", foreground=t["accent_green"])
    log_text.tag_config("WARNING", foreground=t["accent_amber"])
    log_text.tag_config("ERROR", foreground=t["accent_red"])

    # Dynamic Theme Applier function
    def apply_theme_colors():
        root.configure(bg=t["bg"])
        accent_bar.configure(bg=t["accent_blue"])
        header_frame.configure(bg=t["panel_bg"], highlightbackground=t["border"])
        header_left.configure(bg=t["panel_bg"])
        header_right.configure(bg=t["panel_bg"])
        title_label.configure(bg=t["panel_bg"], fg=t["text"])
        subtitle_label.configure(bg=t["panel_bg"], fg=t["text_muted"])
        badge_version.configure(bg=t["badge_bg"], fg=t["badge_fg"])
        theme_box.configure(bg=t["panel_bg"])
        if active_theme == "light":
            btn_light.configure(
                bg=t["accent_blue"],
                fg="#FFFFFF",
                font=("Segoe UI", 8, "bold"),
                relief="flat",
                highlightbackground=t["accent_blue"],
                highlightthickness=1,
            )
            btn_dark.configure(
                bg=t["btn_sec_bg"],
                fg=t["text_muted"],
                font=("Segoe UI", 8),
                relief="flat",
                highlightbackground=t["btn_sec_border"],
                highlightthickness=1,
            )
        else:
            btn_light.configure(
                bg=t["btn_sec_bg"],
                fg=t["text_muted"],
                font=("Segoe UI", 8),
                relief="flat",
                highlightbackground=t["btn_sec_border"],
                highlightthickness=1,
            )
            btn_dark.configure(
                bg=t["accent_blue"],
                fg="#FFFFFF",
                font=("Segoe UI", 8, "bold"),
                relief="flat",
                highlightbackground=t["accent_blue"],
                highlightthickness=1,
            )

        main_body.configure(bg=t["bg"])
        left_col.configure(bg=t["bg"])
        right_col.configure(bg=t["panel_bg"], highlightbackground=t["border"])

        settings_frame.configure(bg=t["panel_bg"], fg=t["text"], highlightbackground=t["border"])
        row2.configure(bg=t["panel_bg"])
        col1.configure(bg=t["panel_bg"])
        col2.configure(bg=t["panel_bg"])
        row_mt5.configure(bg=t["panel_bg"])
        mt5_input_row.configure(bg=t["panel_bg"])
        btn_frame.configure(bg=t["panel_bg"])

        for lbl in tracked_input_labels:
            lbl.configure(bg=t["panel_bg"], fg=t["text_muted"])
        for ent in tracked_entries:
            ent.configure(bg=t["input_bg"], fg=t["input_fg"], insertbackground=t["text"], highlightbackground=t["input_border"], highlightcolor=t["border_focus"])

        btn_browse.configure(bg=t["btn_sec_bg"], fg=t["btn_sec_fg"], highlightbackground=t["btn_sec_border"])
        btn_save.configure(bg=t["btn_sec_bg"], fg=t["btn_sec_fg"], highlightbackground=t["btn_sec_border"])

        monitor_frame.configure(bg=t["card_bg"], fg=t["accent_blue"], highlightbackground=t["border"])
        for lbl in [lbl_t_acc, lbl_t_srv, lbl_t_pwd, lbl_t_mode, lbl_t_step]:
            lbl.configure(bg=t["card_bg"], fg=t["text_muted"])
        lbl_acc_val.configure(bg=t["card_bg"], fg=t["accent_cyan"])
        lbl_srv_val.configure(bg=t["card_bg"], fg=t["text"])
        lbl_pwd_val.configure(bg=t["card_bg"], fg=t["accent_amber"])
        lbl_mode_val.configure(bg=t["card_bg"], fg=t["text_muted"])
        lbl_step_val.configure(bg=t["card_bg"])

        status_frame.configure(bg=t["panel_bg"], highlightbackground=t["border"])
        status_indicator.configure(bg=t["panel_bg"])
        lbl_pack.configure(bg=t["panel_bg"], fg=t["accent_green"] if pack_dir else t["accent_amber"])

        log_header_frame.configure(bg=t["panel_bg"])
        lbl_log_title.configure(bg=t["panel_bg"], fg=t["text"])
        log_divider.configure(bg=t["border"])
        btn_clear.configure(bg=t["btn_sec_bg"], fg=t["btn_sec_fg"], highlightbackground=t["btn_sec_border"])
        log_text.configure(bg=t["log_bg"], fg=t["log_fg"], insertbackground=t["text"])
        log_text.tag_config("INFO", foreground=t["accent_green"])
        log_text.tag_config("WARNING", foreground=t["accent_amber"])
        log_text.tag_config("ERROR", foreground=t["accent_red"])

        is_running = worker_thread and worker_thread.is_alive()
        if is_running:
            btn_start.configure(bg=t["accent_red"])
        else:
            btn_start.configure(bg=t["accent_green"])

    # Explicitly apply default Light Mode styling on startup
    apply_theme_colors()

    # Attach Tk logger
    gui_handler = TkLogHandler(log_text)
    gui_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S"))
    logger.addHandler(gui_handler)

    # Initial log line
    logger.info("Application loaded. Ready to sync.")
    if not MT5_AVAILABLE:
        logger.warning("MetaTrader5 library not detected in local python environment.")

    def on_close():
        if worker_thread and worker_thread.is_alive():
            worker_thread.stop()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_close)
    root.mainloop()


def run_headless():
    """Headless CLI mode for servers without display."""
    cfg = load_config()
    print("=" * 60)
    print(" TheNextTrade — Headless MT5 Cloud Sync Worker (CLI Mode)")
    print("=" * 60)
    print(f" Directory     : {APP_DIR}")
    print(f" Worker ID     : {cfg['worker_id']}")
    print(f" API Endpoint  : {cfg['api_base_url']}")
    print(f" Poll Interval : {cfg['poll_interval']} seconds")
    print(f" MT5 Library   : {'Installed' if MT5_AVAILABLE else 'NOT FOUND'}")
    print("=" * 60)
    print("Worker running. Listening for sync requests... (Ctrl+C to quit)\n")

    worker = WorkerThread(cfg)
    worker.start()
    try:
        while worker.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down worker gracefully...")
        worker.stop()
        worker.join()


def run_diagnose():
    """
    Print a broker-provisioning self-check. Makes NO MT5 login and NO broker call —
    it only inspects the bundled servers_pack and the local MT5 terminal data dirs,
    so it can be run on any machine to answer "will provisioning actually work here?".
    """
    line = "=" * 64
    dash = "-" * 64
    print(line)
    print(" TheNextTrade — Broker Provisioning Diagnostics")
    print(line)

    # --- 1. Environment ---
    print("\n[1] Environment")
    print(dash)
    print(f"  Working dir    : {APP_DIR}")
    print(f"  Config file    : {'present' if os.path.exists(CONFIG_PATH) else 'MISSING'}  ({CONFIG_PATH})")
    print(f"  .env file      : {'present' if os.path.exists(ENV_PATH) else 'not used'}  ({ENV_PATH})")
    print(f"  Python         : {sys.version.split()[0]}")
    print(f"  MetaTrader5 pkg: {'available' if MT5_AVAILABLE else 'NOT FOUND'}")
    try:
        import importlib.metadata
        print(f"  MT5 pkg version: {importlib.metadata.version('MetaTrader5')}")
    except Exception:
        pass
    cfg = load_config()
    print(f"  mt5_path (cfg) : {cfg.get('mt5_path') or '(default install)'}")

    # --- 2. Bundled servers_pack ---
    print(f"\n[2] Bundled servers_pack")
    print(dash)
    pack_dir = get_servers_pack_dir()
    if not pack_dir:
        print("  servers_pack: NOT FOUND -> provisioning impossible.")
        print("  Expected next to worker.py (source run) or bundled in the .exe.")
        print("\n  RESULT: pack missing. Fix the deploy before a sync job can auto-login.")
        return

    print(f"  pack dir       : {pack_dir}")
    pack_sd = os.path.join(pack_dir, "servers.dat")
    digest = None
    if os.path.exists(pack_sd):
        size = os.path.getsize(pack_sd)
        digest = sha256_file(pack_sd)
        print(f"  servers.dat    : {size:,} bytes  sha256={digest}")
    else:
        print("  servers.dat    : MISSING -> no master network catalog bundled!")

    manifest = None
    mpath = os.path.join(pack_dir, "servers_manifest.json")
    if os.path.exists(mpath):
        try:
            with open(mpath, "r", encoding="utf-8") as f:
                manifest = json.load(f)
        except Exception as e:
            print(f"  servers_manifest.json: unreadable ({e})")
    else:
        print("  servers_manifest.json: MISSING")

    if manifest:
        sd = manifest.get("serversDat") or {}
        declared = sd.get("sha256")
        if declared:
            flag = "OK" if declared == digest else "MISMATCH (manifest stale / pack tampered)"
            print(f"  manifest sha256: {declared}  -> {flag}")
        base_flags = manifest.get("baseReady") or {}
        servers = manifest.get("servers") or []
        brokers = manifest.get("brokers") or {}
        print(f"  servers listed : {len(servers)}  across {len(brokers)} broker(s)")
        print("  Per-server base bundle  [manifest baseReady vs actual files in bases/]:")
        bases_root = os.path.join(pack_dir, "bases")
        for s in servers:
            sdir = os.path.join(bases_root, s)
            n_files = 0
            if os.path.isdir(sdir):
                try:
                    n_files = sum(
                        1 for f in os.listdir(sdir) if os.path.isfile(os.path.join(sdir, f))
                    )
                except OSError:
                    pass
            man_flag = bool(base_flags.get(s))
            ok = man_flag == (n_files > 0)
            print(f"    {'OK ' if ok else '!! '} {s:<32} manifest={str(man_flag).lower():<5} actual={n_files} file(s)")

    # --- 3. MT5 terminal data dirs on this machine ---
    print(f"\n[3] MT5 terminal data dirs on this machine")
    print(dash)
    terminals = find_mt5_terminal_data_paths(cfg.get("mt5_path"))
    if not terminals:
        print("  No terminal data dir under %APPDATA%\\MetaQuotes\\Terminal.")
        print("  => MT5 has likely never been launched here. The first sync job will")
        print("     create the data dir and the worker injects the catalog post-initialize.")
    for term_dir in terminals:
        term_id = os.path.basename(term_dir)
        origin = ""
        orig_file = os.path.join(term_dir, "origin.txt")
        if os.path.exists(orig_file):
            try:
                with open(orig_file, "r", encoding="utf-16le", errors="ignore") as f:
                    origin = f.read().strip().lstrip("﻿")
            except Exception:
                pass
        print(f"\n  Terminal data dir: {term_dir}")
        if origin:
            print(f"    origin       : {origin}")
        cfg_sd = os.path.join(term_dir, "config", "servers.dat")
        if os.path.exists(cfg_sd):
            t_size = os.path.getsize(cfg_sd)
            t_digest = sha256_file(cfg_sd)
            match = ("MATCH master -> OK, no inject needed" if digest and t_digest == digest
                     else "DIFFERS from master -> would be backed up & re-injected")
            print(f"    servers.dat  : {t_size:,} bytes  sha256={t_digest}  -> {match}")
        else:
            print("    servers.dat  : MISSING -> master catalog would be injected")
        bases_root_term = os.path.join(term_dir, "bases")
        n_bases = 0
        if os.path.isdir(bases_root_term):
            try:
                n_bases = len(
                    [e for e in os.listdir(bases_root_term)
                     if os.path.isdir(os.path.join(bases_root_term, e))]
                )
            except OSError:
                pass
        print(f"    base dirs    : {n_bases} broker base folder(s)")

    print("\n" + line)
    print(" Done. Run one real sync job (--headless) to confirm login end-to-end.")
    print(line)


def pick_catalog_source(candidates, master_digest, min_size=0):
    """
    Choose which terminal's servers.dat to snapshot as the new bundled master.

    ``candidates`` is a list of tuples ``(data_dir, servers_dat_path, size, digest)``.
    Only candidates whose digest differs from the bundled master AND whose size is at
    least ``min_size`` are eligible (a smaller/different catalog is most likely a fresh
    default install with FEWER brokers — never overwrite a richer master with it).
    Among eligible candidates the LARGEST file wins: MT5 appends every broker it ever
    logged into the same catalog, so a bigger file usually means more access points.

    Returns the chosen tuple or ``None``.
    """
    eligible = [c for c in candidates if c[3] and c[3] != master_digest and c[2] >= min_size]
    if not eligible:
        return None
    eligible.sort(key=lambda c: c[2], reverse=True)
    return eligible[0]


def update_manifest_serversdat(pack_dir, size, digest):
    """Refresh servers_manifest.json's serversDat metadata to match a rebuilt catalog."""
    mpath = os.path.join(pack_dir, "servers_manifest.json")
    if not os.path.exists(mpath):
        return False, "servers_manifest.json not found in the pack"
    try:
        with open(mpath, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as e:
        return False, f"servers_manifest.json unreadable: {e}"
    manifest["serversDat"] = manifest.get("serversDat") or {}
    manifest["serversDat"]["file"] = "servers.dat"
    manifest["serversDat"]["bytes"] = size
    manifest["serversDat"]["sha256"] = digest
    manifest["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        with open(mpath, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        return True, None
    except Exception as e:
        return False, f"failed writing servers_manifest.json: {e}"


def rebuild_catalog_pack(source_data_dir, pack_dir=None):
    """
    Snapshot a terminal's ``config/servers.dat`` as the new bundled master catalog and
    refresh the manifest hash. The previous master is kept as ``servers.dat.prev``.

    ``source_data_dir`` must be an MT5 roaming data dir (or a copy) holding a
    ``config/servers.dat`` — typically the terminal where a NEW broker was just logged
    into, so MT5 already merged that broker's access points into its catalog.

    Returns ``(ok: bool, message: str)``.
    """
    pack_dir = pack_dir or get_servers_pack_dir()
    if not pack_dir or not os.path.isdir(pack_dir):
        return False, f"servers_pack folder not found ({pack_dir})"
    master_path = os.path.join(pack_dir, "servers.dat")
    if not os.path.isfile(master_path):
        return False, f"bundled master servers.dat missing: {master_path}"
    src_servers_dat = os.path.join(source_data_dir, "config", "servers.dat")
    if not os.path.isfile(src_servers_dat):
        return False, f"source data dir has no config/servers.dat: {source_data_dir}"

    master_digest = sha256_file(master_path)
    src_digest = sha256_file(src_servers_dat)
    if src_digest == master_digest:
        return False, "source servers.dat is byte-identical to the bundled master — nothing to rebuild"

    bak_path = master_path + ".prev"
    if not os.path.exists(bak_path):
        try:
            shutil.copy2(master_path, bak_path)
        except OSError as e:
            return False, f"failed backing up current master catalog: {e}"
    try:
        shutil.copy2(src_servers_dat, master_path)
    except OSError as e:
        return False, f"failed writing the new master catalog: {e}"

    size = os.path.getsize(master_path)
    ok, err = update_manifest_serversdat(pack_dir, size, src_digest)
    if not ok:
        # Catalog already replaced; the stale manifest only triggers a warning later.
        return True, f"catalog replaced but manifest NOT updated — {err}"
    return True, ""


def run_build_catalog(argv):
    """
    CLI: rebuild servers_pack/servers.dat from a real MT5 terminal catalog.

    Usage:
      worker.py --build-catalog [--source <mt5-data-dir>]

    Without --source, every terminal data dir under %APPDATA%\\MetaQuotes\\Terminal is
    scanned and the largest catalog that differs from (and is at least as big as) the
    current master is chosen automatically.
    """
    line = "=" * 64
    dash = "-" * 64
    print(line)
    print(" TheNextTrade — Rebuild Pre-bundled Broker Catalog (--build-catalog)")
    print(line)

    pack_dir = get_servers_pack_dir()
    if not pack_dir or not os.path.isdir(pack_dir):
        print("  servers_pack folder not found next to the worker -> cannot rebuild.")
        return 1

    source_arg = None
    if "--source" in argv:
        idx = argv.index("--source")
        if idx + 1 < len(argv):
            source_arg = argv[idx + 1]

    chosen_dir = None
    chosen_size = None
    if source_arg:
        ok, msg = rebuild_catalog_pack(source_arg, pack_dir)
        if not ok:
            print(f"  ✗ {msg}")
            if "byte-identical" in msg:
                print("  If you expected a NEWER catalog: log into the new broker in MT5")
                print("  first so its access points are merged, then re-run this command.")
                return 0
            return 1
        if msg:
            print(f"  ⚠ {msg}")
        chosen_dir = source_arg
        master_path = os.path.join(pack_dir, "servers.dat")
        chosen_size = os.path.getsize(master_path)
    else:
        print("\n[1] Scanning MT5 terminal data dirs for a richer catalog...")
        print(dash)
        cfg = load_config()
        terminals = find_mt5_terminal_data_paths(cfg.get("mt5_path"))
        if not terminals:
            print("  No terminal data dir under %APPDATA%\\MetaQuotes\\Terminal.")
            print("  => Log into the new broker in MT5 once, then re-run this command")
            print("     (or pass --source <mt5-data-dir> pointing at a full data dir).")
            return 0
        master_path = os.path.join(pack_dir, "servers.dat")
        master_digest = sha256_file(master_path)
        master_size = os.path.getsize(master_path)
        candidates = []
        for t in terminals:
            sd = os.path.join(t, "config", "servers.dat")
            if os.path.isfile(sd):
                candidates.append((t, sd, os.path.getsize(sd), sha256_file(sd)))
        for (_t, _sd, size, dig) in candidates:
            rel = "== master (skip)" if dig == master_digest else (
                "smaller than master (skip)" if size < master_size else "NEW candidate")
            print(f"    {os.path.basename(_t)[:8]}  {size:>10,} bytes  sha256={dig[:12]}…  {rel}")
        if not candidates:
            print("  No terminal holds a config/servers.dat yet.")
            return 0
        chosen = pick_catalog_source(candidates, master_digest, min_size=master_size)
        if chosen is None:
            print(f"\n  Every terminal catalog either already matches the bundled master")
            print(f"  ({master_size:,} bytes) or is smaller/default.")
            print("  => No NEW broker found yet. In MT5 log into a broker NOT in the bundle")
            print("     (File -> Open an Account, or sync the account from the web platform) so")
            print("     MT5 merges its access points into the terminal catalog, then re-run this")
            print("     command. Or pass --source <mt5-data-dir> to pick deliberately.")
            return 0
        chosen_dir, _sd, chosen_size, _dig = chosen
        ok, msg = rebuild_catalog_pack(chosen_dir, pack_dir)
        if not ok:
            print(f"  ✗ {msg}")
            return 1
        if msg:
            print(f"  ⚠ {msg}")

    new_digest = sha256_file(os.path.join(pack_dir, "servers.dat"))
    print("\n[2] Result")
    print(dash)
    print(f"  New bundled catalog : {os.path.getsize(os.path.join(pack_dir, 'servers.dat')):,} bytes")
    print(f"  sha256              : {new_digest}")
    print(f"  location            : {os.path.join(pack_dir, 'servers.dat')}")
    print(f"  source terminal     : {chosen_dir}")
    if os.path.exists(os.path.join(pack_dir, 'servers.dat') + ".prev"):
        print("  previous catalog    : backed up to servers.dat.prev")
    print("\n  NOTES:")
    print("   • servers_manifest.json 'servers' list is NOT auto-extended (servers.dat is")
    print("     binary — names can't be read from it). New brokers resolve pass-through and")
    print("     their access points already live in the rebuilt catalog, so")
    print("     ensure_broker_server_available() injects them exactly like the bundled ones.")
    print("   • Broker base dirs (bases/<server>) are optional for login; if a worker later")
    print("     reports a missing base, copy that folder from the source terminal by hand.")
    print("\n  Next: re-run --diagnose to confirm, then rebuild the .exe (build_exe.bat) so")
    print("        deployed workers ship the new catalog.")
    print(line)
    return 0


def main():
    if "--build-catalog" in sys.argv:
        sys.exit(run_build_catalog(sys.argv))
    if "--diagnose" in sys.argv:
        run_diagnose()
    elif "--headless" in sys.argv or "--cli" in sys.argv:
        run_headless()
    else:
        try:
            launch_gui()
        except Exception as e:
            print(f"Failed to launch GUI ({e}). Falling back to CLI mode...")
            run_headless()


if __name__ == "__main__":
    main()
