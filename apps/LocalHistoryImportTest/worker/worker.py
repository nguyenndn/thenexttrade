from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import psutil
import requests

from token_store import load_token, save_token


VERSION = "0.1.1"
UTC = timezone.utc
LOG = logging.getLogger("gsn-worker")


class WorkerError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def configure_logging(log_dir: Path) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    handlers.append(logging.FileHandler(log_dir / "worker.log", encoding="utf-8"))
    for handler in handlers:
        handler.setFormatter(formatter)
    logging.basicConfig(level=logging.INFO, handlers=handlers)


def canonical_records(records: list[dict[str, Any]]) -> bytes:
    return json.dumps(records, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def parse_utc(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise WorkerError("INVALID_JOB_RANGE", "Job datetime has no timezone")
    return parsed.astimezone(UTC)


def normalize_value(value: Any) -> Any:
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return format(value, ".15g")
    if isinstance(value, datetime):
        return value.astimezone(UTC).isoformat().replace("+00:00", "Z")
    return str(value)


def normalize_records(values: Iterable[Any]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for value in values:
        source = value._asdict() if hasattr(value, "_asdict") else dict(value)
        record = {str(key): normalize_value(item) for key, item in source.items()}
        if "ticket" not in record:
            raise WorkerError("MT5_RECORD_INVALID", "MT5 record has no ticket")
        record["ticket"] = str(record["ticket"])
        normalized.append(record)
    return normalized


def chunks(records: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    if not records:
        return [[]]
    return [records[index : index + size] for index in range(0, len(records), size)]


def matching_terminal_pids(terminal_path: Path) -> set[int]:
    expected = str(terminal_path.resolve()).casefold()
    found: set[int] = set()
    for process in psutil.process_iter(["pid", "exe"]):
        try:
            executable = process.info.get("exe")
            if executable and str(Path(executable).resolve()).casefold() == expected:
                found.add(int(process.info["pid"]))
        except (psutil.AccessDenied, psutil.NoSuchProcess, OSError):
            continue
    return found


def terminate_new_terminals(before: set[int], terminal_path: Path) -> None:
    for pid in matching_terminal_pids(terminal_path) - before:
        try:
            process = psutil.Process(pid)
            process.terminate()
            process.wait(timeout=10)
        except psutil.TimeoutExpired:
            process.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass


def ensure_terminal_is_available(terminal_path: Path) -> None:
    """Prevent the worker from attaching to an unrelated/shared MT5 instance."""
    existing = matching_terminal_pids(terminal_path)
    if existing:
        pids = ", ".join(str(pid) for pid in sorted(existing))
        raise WorkerError(
            "MT5_TERMINAL_ALREADY_RUNNING",
            f"Controlled MT5 terminal is already running (PID {pids}). Close it before retrying the import.",
        )


def ensure_terminal_is_portable(terminal_path: Path, allow_nonportable: bool) -> None:
    """Require a writable, worker-owned terminal copy for real imports."""
    if allow_nonportable:
        return
    normalized = str(terminal_path.resolve()).casefold()
    program_files = [
        str(Path(os.environ.get("ProgramFiles", "C:\\Program Files")).resolve()).casefold(),
        str(Path(os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")).resolve()).casefold(),
    ]
    if any(normalized == root or normalized.startswith(root + "\\") for root in program_files):
        raise WorkerError(
            "MT5_TERMINAL_NOT_PORTABLE",
            "Worker terminal must be a dedicated portable copy outside Program Files. "
            "Copy MT5 to C:\\GSN\\mt5\\terminal and update paths.terminal.",
        )


class ApiClient:
    def __init__(self, base_url: str, worker_id: str, token_path: Path) -> None:
        self.base_url = base_url.rstrip("/")
        self.worker_id = worker_id.strip()
        self.token_path = token_path
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": f"GSN-Windows-Worker/{VERSION}"})

    def enroll(self, enrollment_token: str) -> None:
        enrollment_token = enrollment_token.strip().strip('"').strip("'")
        response = self.session.post(
            self.base_url + "/internal/v1/mt5-workers/enroll",
            json={"worker_id": self.worker_id, "enrollment_token": enrollment_token},
            timeout=20,
        )
        if response.status_code >= 400:
            detail = "Worker enrollment failed"
            try:
                body = response.json()
                detail = body.get("detail") or body.get("error") or detail
            except ValueError:
                pass
            raise WorkerError("WORKER_ENROLLMENT_FAILED", f"HTTP {response.status_code}: {detail}")
        worker_token = response.json()["worker_token"]
        save_token(self.token_path, worker_token)

    def _headers(self) -> dict[str, str]:
        if not self.token_path.exists():
            raise WorkerError("WORKER_NOT_ENROLLED", "Worker token is missing; enroll first")
        return {"Authorization": "Worker " + load_token(self.token_path)}

    def post(self, path: str, payload: dict[str, Any], timeout: int = 30) -> dict[str, Any]:
        response = self.session.post(self.base_url + path, json=payload, headers=self._headers(), timeout=timeout)
        if response.status_code >= 400:
            detail = "API request failed"
            if response.content:
                try:
                    body = response.json()
                    detail = body.get("detail") or body.get("error") or detail
                except ValueError:
                    pass
            raise WorkerError("API_REQUEST_FAILED", f"HTTP {response.status_code}: {detail}")
        return response.json()

    def upload_batch(self, job_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        encoded = json.dumps(payload, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        headers = self._headers() | {"Content-Type": "application/json", "Content-Encoding": "gzip"}
        response = self.session.post(
            self.base_url + f"/internal/v1/mt5-jobs/{job_id}/batches",
            data=gzip.compress(encoded),
            headers=headers,
            timeout=60,
        )
        if response.status_code >= 400:
            detail = "Batch upload failed"
            if response.content:
                try:
                    body = response.json()
                    detail = body.get("detail") or body.get("error") or detail
                except ValueError:
                    pass
            raise WorkerError("BATCH_UPLOAD_FAILED", f"HTTP {response.status_code}: {detail}")
        return response.json()


class Worker:
    def __init__(self, config_path: Path) -> None:
        self.config_path = config_path
        self.config = json.loads(config_path.read_text(encoding="utf-8-sig"))
        paths = self.config["paths"]
        self.terminal = Path(paths["terminal"])
        self.log_dir = Path(paths["logs"])
        self.token_path = config_path.parent / "worker-token.dpapi"
        self.poll_seconds = int(self.config.get("pollSeconds", 5))
        self.batch_size = int(self.config.get("batchSize", 500))
        self.initialize_timeout_ms = int(self.config.get("initializeTimeoutMs", 180000))
        self.login_timeout_ms = int(self.config.get("loginTimeoutMs", 60000))
        self.allow_nonportable_terminal = bool(self.config.get("allowNonPortableTerminal", False))
        self.api = ApiClient(self.config["backendBaseUrl"], self.config["workerId"], self.token_path)

    def enroll(self, enrollment_token: str) -> None:
        self.api.enroll(enrollment_token)
        LOG.info("Worker enrollment completed for %s", self.config["workerId"])

    def heartbeat(self, state: str = "IDLE", current_job_id: str | None = None) -> None:
        self.api.post(
            "/internal/v1/mt5-workers/heartbeat",
            {"version": VERSION, "status": state, "current_job_id": current_job_id},
        )

    def progress(self, job_id: str, lease_id: str, state: str, percent: int, message: str) -> None:
        self.api.post(
            f"/internal/v1/mt5-jobs/{job_id}/progress",
            {"lease_id": lease_id, "status": state, "progress_percent": percent, "message": message},
        )

    def upload_records(self, job_id: str, lease_id: str, entity_type: str, records: list[dict[str, Any]]) -> None:
        batches = chunks(records, self.batch_size)
        for index, batch in enumerate(batches):
            checksum = hashlib.sha256(canonical_records(batch)).hexdigest()
            self.api.upload_batch(
                job_id,
                {
                    "lease_id": lease_id,
                    "entity_type": entity_type,
                    "batch_index": index,
                    "total_batches": len(batches),
                    "checksum": checksum,
                    "records": batch,
                },
            )

    def initialize_mt5(self, mt5_module: Any, job_id: str) -> None:
        deadline = time.monotonic() + (self.initialize_timeout_ms / 1000)
        last_error: Any = None
        attempt = 0
        while time.monotonic() < deadline:
            attempt += 1
            remaining_ms = max(1000, int((deadline - time.monotonic()) * 1000))
            LOG.info("Job %s waiting for MT5 terminal IPC (attempt=%d timeout_ms=%d)", job_id, attempt, remaining_ms)
            try:
                initialized = mt5_module.initialize(
                    path=str(self.terminal),
                    timeout=remaining_ms,
                    portable=True,
                )
            except TypeError:
                LOG.warning("Job %s MT5 package does not support timeout/portable kwargs; using legacy initialize", job_id)
                initialized = mt5_module.initialize(path=str(self.terminal))
            if initialized:
                return
            last_error = mt5_module.last_error()
            LOG.warning("Job %s MT5 initialize attempt %d failed: %s", job_id, attempt, last_error)
            mt5_module.shutdown()
            if time.monotonic() >= deadline:
                break
            time.sleep(2)
        raise WorkerError("MT5_CONNECT_FAILED", f"MT5 initialize failed after {self.initialize_timeout_ms}ms: {last_error}")

    def process_job(self, job: dict[str, Any]) -> None:
        job_id = job["job_id"]
        lease_id = job["lease_id"]
        before_pids = matching_terminal_pids(self.terminal)
        mt5 = None
        try:
            LOG.info("Job %s claimed; controlled terminal=%s", job_id, self.terminal)
            if not self.terminal.exists():
                raise WorkerError("MT5_TERMINAL_MISSING", f"Controlled terminal not found: {self.terminal}")
            ensure_terminal_is_portable(self.terminal, self.allow_nonportable_terminal)
            ensure_terminal_is_available(self.terminal)
            self.heartbeat("BUSY", job_id)
            secret = self.api.post(
                f"/internal/v1/mt5-jobs/{job_id}/secret",
                {"lease_id": lease_id, "secret_exchange_token": job["secret_exchange_token"]},
            )
            self.progress(job_id, lease_id, "AUTHENTICATING", 8, "Connecting to MT5")
            try:
                import MetaTrader5 as mt5_module
            except ImportError as exc:
                raise WorkerError(
                    "MT5_PYTHON_PACKAGE_MISSING",
                    f"MetaTrader5 Python package is missing for {sys.executable}",
                ) from exc
            mt5 = mt5_module
            LOG.info("Job %s initializing MT5 in portable mode", job_id)
            password = secret["investor_password"]
            self.initialize_mt5(mt5, job_id)
            LOG.info("Job %s terminal IPC ready; logging in to server=%s", job_id, secret["server"])
            try:
                authorized = mt5.login(
                    int(secret["login"]),
                    password=password,
                    server=secret["server"],
                    timeout=self.login_timeout_ms,
                )
            except TypeError:
                LOG.warning("Job %s MT5 package does not support login timeout; using legacy login", job_id)
                authorized = mt5.login(
                    int(secret["login"]),
                    password=password,
                    server=secret["server"],
                )
            secret["investor_password"] = ""
            if not authorized:
                raise WorkerError("MT5_LOGIN_FAILED", f"MT5 login failed: {mt5.last_error()}")
            account = mt5.account_info()
            if account is None:
                raise WorkerError("MT5_ACCOUNT_INFO_FAILED", f"MT5 account_info failed: {mt5.last_error()}")
            if str(account.login) != str(job["account"]["login"]):
                raise WorkerError("MT5_ACCOUNT_MISMATCH", "Connected MT5 login does not match job account")
            account_server = str(getattr(account, "server", ""))
            if account_server.casefold() != str(job["account"]["server"]).casefold():
                raise WorkerError("MT5_SERVER_MISMATCH", "Connected MT5 server does not match job server")
            LOG.info("Job %s connected to MT5 login=%s server=%s", job_id, account.login, account_server)

            start = parse_utc(job["range"]["from"])
            end = parse_utc(job["range"]["to"])
            self.progress(job_id, lease_id, "FETCHING_ORDERS", 20, "Fetching MT5 orders")
            orders = mt5.history_orders_get(start, end)
            if orders is None:
                raise WorkerError("MT5_HISTORY_ORDERS_FAILED", f"history_orders_get failed: {mt5.last_error()}")
            normalized_orders = normalize_records(orders)
            LOG.info("Job %s fetched %d orders", job_id, len(normalized_orders))

            self.progress(job_id, lease_id, "FETCHING_DEALS", 40, "Fetching MT5 deals")
            deals = mt5.history_deals_get(start, end)
            if deals is None:
                raise WorkerError("MT5_HISTORY_DEALS_FAILED", f"history_deals_get failed: {mt5.last_error()}")
            normalized_deals = normalize_records(deals)
            LOG.info("Job %s fetched %d deals", job_id, len(normalized_deals))

            self.progress(job_id, lease_id, "UPLOADING", 60, "Uploading MT5 orders")
            self.upload_records(job_id, lease_id, "ORDERS", normalized_orders)
            self.progress(job_id, lease_id, "UPLOADING", 80, "Uploading MT5 deals")
            self.upload_records(job_id, lease_id, "DEALS", normalized_deals)
            self.progress(job_id, lease_id, "CLEANING_UP", 95, "Cleaning up MT5 terminal")
            mt5.shutdown()
            mt5 = None
            time.sleep(1)
            terminate_new_terminals(before_pids, self.terminal)
            self.api.post(f"/internal/v1/mt5-jobs/{job_id}/complete", {"lease_id": lease_id})
            LOG.info("Job %s completed: %d orders, %d deals", job_id, len(normalized_orders), len(normalized_deals))
        except WorkerError as exc:
            LOG.error("Job %s failed [%s]: %s", job_id, exc.code, exc)
            try:
                self.api.post(
                    f"/internal/v1/mt5-jobs/{job_id}/fail",
                    {"lease_id": lease_id, "error_code": exc.code, "error_message": str(exc)[:500]},
                )
            except Exception as report_error:
                LOG.error("Could not report job failure: %s", report_error)
        except Exception as exc:
            LOG.exception("Job %s failed unexpectedly", job_id)
            try:
                self.api.post(
                    f"/internal/v1/mt5-jobs/{job_id}/fail",
                    {"lease_id": lease_id, "error_code": "INTERNAL_ERROR", "error_message": str(exc)[:500]},
                )
            except Exception as report_error:
                LOG.error("Could not report job failure: %s", report_error)
        finally:
            if mt5 is not None:
                try:
                    mt5.shutdown()
                except Exception:
                    LOG.exception("MT5 shutdown failed")
            time.sleep(1)
            terminate_new_terminals(before_pids, self.terminal)
            try:
                self.heartbeat("IDLE", None)
            except Exception as heartbeat_error:
                LOG.error("Post-job heartbeat failed: %s", heartbeat_error)

    def run_once(self) -> bool:
        self.heartbeat("IDLE", None)
        response = self.api.post("/internal/v1/mt5-jobs/claim", {"capacity": 1})
        job = response.get("job")
        if job is None:
            return False
        self.process_job(job)
        return True

    def run_forever(self) -> None:
        LOG.info("Worker %s started", self.config["workerId"])
        while True:
            try:
                worked = self.run_once()
                time.sleep(1 if worked else self.poll_seconds)
            except KeyboardInterrupt:
                return
            except Exception as exc:
                LOG.error("Worker loop error: %s", exc)
                time.sleep(min(30, self.poll_seconds * 2))


def main() -> int:
    parser = argparse.ArgumentParser(description="GSN Windows MT5 history worker")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).with_name("config.json"),
        help="Worker config path (defaults to config.json beside worker.py)",
    )
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--enroll", action="store_true")
    parser.add_argument("--enroll-token", type=str, help="Enrollment token string")
    args = parser.parse_args()

    worker = Worker(args.config)
    configure_logging(worker.log_dir)
    if args.enroll or args.enroll_token:
        enrollment_token = args.enroll_token or os.environ.pop("GSN_ENROLLMENT_TOKEN", "")
        if not enrollment_token:
            print("Paste enrollment token (input is visible for verification): ", end="", flush=True)
            enrollment_token = input().strip().strip('"').strip("'")
        if not enrollment_token:
            raise WorkerError("ENROLLMENT_TOKEN_MISSING", "Enrollment token cannot be empty")
        print(f"Token received (verify before sending, {len(enrollment_token)} characters): {enrollment_token}")
        confirmation = input("Use this token? [Y/n]: ").strip().lower()
        if confirmation not in ("", "y", "yes"):
            raise WorkerError("ENROLLMENT_CANCELLED", "Enrollment cancelled")
        worker.enroll(enrollment_token)
        return 0
    if args.once:
        worker.run_once()
        return 0
    worker.run_forever()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except WorkerError as error:
        print(f"ERROR [{error.code}]: {error}", file=sys.stderr)
        raise SystemExit(1)
