from __future__ import annotations

import gzip
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field, field_validator


UTC = timezone.utc
ACTIVE_JOB_STATES = {
    "CLAIMED",
    "AUTHENTICATING",
    "FETCHING_ORDERS",
    "FETCHING_DEALS",
    "UPLOADING",
}
PROGRESS_STATES = ACTIVE_JOB_STATES | {"CLEANING_UP"}
MAX_BATCH_BODY_BYTES = 10 * 1024 * 1024
MAX_BATCH_RECORDS = 2000


def utc_now() -> datetime:
    return datetime.now(UTC)


def iso_utc(value: datetime | None = None) -> str:
    return (value or utc_now()).astimezone(UTC).isoformat().replace("+00:00", "Z")


def parse_utc(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Expected ISO-8601 datetime") from exc
    if parsed.tzinfo is None:
        raise ValueError("Datetime must include timezone")
    return parsed.astimezone(UTC)


def token_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_records(records: list[dict[str, Any]]) -> bytes:
    return json.dumps(records, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


class Settings:
    def __init__(self) -> None:
        data_dir = Path(os.environ.get("GSN_LOCAL_DATA_DIR", Path(__file__).parent / "data"))
        data_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir = data_dir
        self.db_path = Path(os.environ.get("GSN_LOCAL_DB", data_dir / "gsn-local.db"))
        self.user_token = os.environ.get("GSN_LOCAL_USER_TOKEN", "")
        self.admin_token = os.environ.get("GSN_LOCAL_ADMIN_TOKEN", "")
        fernet_key = os.environ.get("GSN_LOCAL_FERNET_KEY", "")
        if not self.user_token or not self.admin_token or not fernet_key:
            raise RuntimeError("GSN_LOCAL_USER_TOKEN, GSN_LOCAL_ADMIN_TOKEN and GSN_LOCAL_FERNET_KEY are required")
        self.fernet = Fernet(fernet_key.encode("ascii"))
        self.lease_seconds = int(os.environ.get("GSN_LOCAL_LEASE_SECONDS", "600"))


settings = Settings()
db_lock = threading.RLock()


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(settings.db_path, timeout=30, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    connection.execute("PRAGMA journal_mode=WAL")
    return connection


@contextmanager
def db_transaction(immediate: bool = False):
    with db_lock:
        connection = connect_db()
        try:
            connection.execute("BEGIN IMMEDIATE" if immediate else "BEGIN")
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()


def init_db() -> None:
    schema = """
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ENROLLED',
      last_heartbeat TEXT,
      current_job_id TEXT,
      version TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS enrollment_tokens (
      token_hash TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      label TEXT NOT NULL,
      login TEXT NOT NULL,
      broker_name TEXT NOT NULL,
      server TEXT NOT NULL,
      encrypted_password BLOB NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(owner_id, login, server)
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      mode TEXT NOT NULL,
      range_from TEXT NOT NULL,
      range_to TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      message TEXT NOT NULL DEFAULT '',
      worker_id TEXT,
      lease_id TEXT,
      lease_expires_at TEXT,
      secret_token_hash TEXT,
      secret_used_at TEXT,
      orders_received INTEGER NOT NULL DEFAULT 0,
      deals_received INTEGER NOT NULL DEFAULT 0,
      error_code TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS batches (
      job_id TEXT NOT NULL REFERENCES jobs(id),
      entity_type TEXT NOT NULL,
      batch_index INTEGER NOT NULL,
      total_batches INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY(job_id, entity_type, batch_index)
    );
    CREATE TABLE IF NOT EXISTS raw_orders (
      account_id TEXT NOT NULL REFERENCES accounts(id),
      ticket TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      last_job_id TEXT NOT NULL REFERENCES jobs(id),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(account_id, ticket)
    );
    CREATE TABLE IF NOT EXISTS raw_deals (
      account_id TEXT NOT NULL REFERENCES accounts(id),
      ticket TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      last_job_id TEXT NOT NULL REFERENCES jobs(id),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(account_id, ticket)
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
    """
    with db_lock:
        connection = connect_db()
        try:
            connection.executescript(schema)
        finally:
            connection.close()


init_db()
app = FastAPI(title="GSN Local MT5 Import API", version="0.1.0")


class EnrollmentCreate(BaseModel):
    worker_id: str = Field(min_length=3, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    ttl_minutes: int = Field(default=15, ge=1, le=60)


class WorkerEnroll(BaseModel):
    worker_id: str
    enrollment_token: str


class Heartbeat(BaseModel):
    version: str = "0.1.0"
    status: str = "IDLE"
    current_job_id: str | None = None


class AccountCreate(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    login: str = Field(min_length=3, max_length=30, pattern=r"^[0-9]+$")
    broker_name: str = Field(min_length=1, max_length=150)
    server: str = Field(min_length=1, max_length=150)
    investor_password: str = Field(min_length=1, max_length=256)


class ImportCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_time: str = Field(alias="from")
    to_time: str = Field(alias="to")
    mode: Literal["FULL", "INCREMENTAL", "REPAIR"] = "FULL"

    @field_validator("from_time", "to_time")
    @classmethod
    def validate_datetime(cls, value: str) -> str:
        parse_utc(value)
        return value


class ClaimRequest(BaseModel):
    capacity: int = Field(default=1, ge=1, le=1)


class SecretRequest(BaseModel):
    lease_id: str
    secret_exchange_token: str


class ProgressRequest(BaseModel):
    lease_id: str
    status: str
    progress_percent: int = Field(ge=0, le=99)
    message: str = Field(default="", max_length=300)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in PROGRESS_STATES:
            raise ValueError(f"Unsupported progress status: {value}")
        return value


class FinishRequest(BaseModel):
    lease_id: str


class FailRequest(BaseModel):
    lease_id: str
    error_code: str = Field(min_length=1, max_length=80)
    error_message: str = Field(min_length=1, max_length=500)


def bearer_value(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return authorization[7:]


def require_user(authorization: str | None = Header(default=None)) -> str:
    if not hmac.compare_digest(bearer_value(authorization), settings.user_token):
        raise HTTPException(status_code=401, detail="Invalid user token")
    return "local-user"


def require_admin(authorization: str | None = Header(default=None)) -> str:
    if not hmac.compare_digest(bearer_value(authorization), settings.admin_token):
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return "local-admin"


def require_worker(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Worker "):
        raise HTTPException(status_code=401, detail="Missing worker token")
    supplied_hash = token_hash(authorization[7:])
    connection = connect_db()
    try:
        row = connection.execute("SELECT id, token_hash, status FROM workers WHERE token_hash=?", (supplied_hash,)).fetchone()
    finally:
        connection.close()
    if row is None or row["status"] == "REVOKED":
        raise HTTPException(status_code=401, detail="Invalid worker token")
    return str(row["id"])


def get_job_for_worker(connection: sqlite3.Connection, job_id: str, worker_id: str, lease_id: str) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if row["worker_id"] != worker_id or row["lease_id"] != lease_id:
        raise HTTPException(status_code=409, detail="Worker lease mismatch")
    if row["lease_expires_at"] and parse_utc(row["lease_expires_at"]) < utc_now():
        raise HTTPException(status_code=409, detail="Worker lease expired")
    return row


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "gsn-local-mt5-import", "timeUtc": iso_utc()}


@app.post("/admin/v1/workers/enrollment-tokens")
def create_enrollment(body: EnrollmentCreate, _: str = Depends(require_admin)) -> dict[str, Any]:
    raw_token = secrets.token_urlsafe(32)
    expires = utc_now() + timedelta(minutes=body.ttl_minutes)
    with db_transaction(immediate=True) as connection:
        connection.execute(
            "INSERT INTO enrollment_tokens(token_hash,worker_id,expires_at,created_at) VALUES(?,?,?,?)",
            (token_hash(raw_token), body.worker_id, iso_utc(expires), iso_utc()),
        )
    return {"worker_id": body.worker_id, "enrollment_token": raw_token, "expires_at": iso_utc(expires)}


@app.post("/internal/v1/mt5-workers/enroll")
def enroll_worker(body: WorkerEnroll) -> dict[str, Any]:
    now = utc_now()
    with db_transaction(immediate=True) as connection:
        row = connection.execute(
            "SELECT * FROM enrollment_tokens WHERE token_hash=?", (token_hash(body.enrollment_token),)
        ).fetchone()
        if row is None or row["worker_id"] != body.worker_id or row["used_at"] is not None:
            raise HTTPException(status_code=401, detail="Invalid enrollment token")
        if parse_utc(row["expires_at"]) < now:
            raise HTTPException(status_code=401, detail="Enrollment token expired")
        worker_token = secrets.token_urlsafe(48)
        connection.execute("UPDATE enrollment_tokens SET used_at=? WHERE token_hash=?", (iso_utc(now), row["token_hash"]))
        connection.execute(
            "INSERT INTO workers(id,token_hash,status,created_at) VALUES(?,?,?,?) "
            "ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash,status='ENROLLED'",
            (body.worker_id, token_hash(worker_token), "ENROLLED", iso_utc(now)),
        )
    return {"worker_id": body.worker_id, "worker_token": worker_token}


@app.post("/internal/v1/mt5-workers/heartbeat")
def worker_heartbeat(body: Heartbeat, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    with db_transaction() as connection:
        connection.execute(
            "UPDATE workers SET status='ONLINE',last_heartbeat=?,current_job_id=?,version=? WHERE id=?",
            (iso_utc(), body.current_job_id, body.version, worker_id),
        )
    return {"accepted": True, "worker_id": worker_id, "server_time_utc": iso_utc()}


@app.get("/admin/v1/workers")
def list_workers(_: str = Depends(require_admin)) -> dict[str, Any]:
    connection = connect_db()
    try:
        rows = connection.execute(
            "SELECT id,status,last_heartbeat,current_job_id,version,created_at FROM workers ORDER BY created_at DESC"
        ).fetchall()
    finally:
        connection.close()
    return {"workers": [dict(row) for row in rows]}


@app.post("/admin/v1/workers/{worker_id}/revoke")
def revoke_worker(worker_id: str, _: str = Depends(require_admin)) -> dict[str, Any]:
    with db_transaction(immediate=True) as connection:
        updated = connection.execute(
            "UPDATE workers SET status='REVOKED',current_job_id=NULL WHERE id=?", (worker_id,)
        ).rowcount
        if updated == 0:
            raise HTTPException(status_code=404, detail="Worker not found")
    return {"worker_id": worker_id, "status": "REVOKED"}


@app.post("/v1/mt5-accounts", status_code=status.HTTP_201_CREATED)
def create_account(body: AccountCreate, owner_id: str = Depends(require_user)) -> dict[str, Any]:
    encrypted = settings.fernet.encrypt(body.investor_password.encode("utf-8"))
    with db_transaction(immediate=True) as connection:
        existing = connection.execute(
            "SELECT id FROM accounts WHERE owner_id=? AND login=? AND server=?",
            (owner_id, body.login, body.server),
        ).fetchone()
        if existing is not None:
            account_id = str(existing["id"])
            connection.execute(
                "UPDATE accounts SET label=?,broker_name=?,encrypted_password=? WHERE id=?",
                (body.label, body.broker_name, encrypted, account_id),
            )
            created = False
        else:
            account_id = "mta_" + uuid.uuid4().hex[:16]
            connection.execute(
                "INSERT INTO accounts(id,owner_id,label,login,broker_name,server,encrypted_password,created_at) "
                "VALUES(?,?,?,?,?,?,?,?)",
                (account_id, owner_id, body.label, body.login, body.broker_name, body.server, encrypted, iso_utc()),
            )
            created = True
    return {
        "id": account_id,
        "created": created,
        "label": body.label,
        "login_masked": "****" + body.login[-4:],
        "server": body.server,
    }


@app.post("/v1/mt5-accounts/{account_id}/imports", status_code=status.HTTP_202_ACCEPTED)
def create_import(account_id: str, body: ImportCreate, owner_id: str = Depends(require_user)) -> dict[str, Any]:
    from_dt = parse_utc(body.from_time)
    to_dt = parse_utc(body.to_time)
    if from_dt >= to_dt:
        raise HTTPException(status_code=422, detail="from must be earlier than to")
    if to_dt - from_dt > timedelta(days=3660):
        raise HTTPException(status_code=422, detail="Local test range cannot exceed 10 years")
    job_id = "imp_" + uuid.uuid4().hex[:16]
    now = iso_utc()
    with db_transaction(immediate=True) as connection:
        account = connection.execute("SELECT id FROM accounts WHERE id=? AND owner_id=?", (account_id, owner_id)).fetchone()
        if account is None:
            raise HTTPException(status_code=404, detail="Account not found")
        connection.execute(
            "INSERT INTO jobs(id,owner_id,account_id,mode,range_from,range_to,status,created_at,updated_at) "
            "VALUES(?,?,?,?,?,?,'QUEUED',?,?)",
            (job_id, owner_id, account_id, body.mode, iso_utc(from_dt), iso_utc(to_dt), now, now),
        )
    return {"job_id": job_id, "status": "QUEUED", "created_at": now}


def serialize_job(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "job_id": row["id"],
        "status": row["status"],
        "progress_percent": row["progress_percent"],
        "message": row["message"],
        "worker_id": row["worker_id"],
        "orders_received": row["orders_received"],
        "deals_received": row["deals_received"],
        "error_code": row["error_code"],
        "error_message": row["error_message"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "completed_at": row["completed_at"],
    }


@app.get("/v1/imports/{job_id}")
def get_import(job_id: str, owner_id: str = Depends(require_user)) -> dict[str, Any]:
    connection = connect_db()
    try:
        row = connection.execute("SELECT * FROM jobs WHERE id=? AND owner_id=?", (job_id, owner_id)).fetchone()
    finally:
        connection.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return serialize_job(row)


@app.get("/v1/imports/{job_id}/records")
def get_import_records(
    job_id: str,
    entity_type: Literal["ORDERS", "DEALS"],
    owner_id: str = Depends(require_user),
) -> dict[str, Any]:
    table = "raw_orders" if entity_type == "ORDERS" else "raw_deals"
    connection = connect_db()
    try:
        job = connection.execute("SELECT account_id FROM jobs WHERE id=? AND owner_id=?", (job_id, owner_id)).fetchone()
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")
        rows = connection.execute(
            f"SELECT ticket,payload_json FROM {table} WHERE account_id=? AND last_job_id=? ORDER BY ticket",
            (job["account_id"], job_id),
        ).fetchall()
    finally:
        connection.close()
    return {"entity_type": entity_type, "count": len(rows), "records": [json.loads(row["payload_json"]) for row in rows]}


@app.post("/internal/v1/mt5-jobs/claim")
def claim_job(body: ClaimRequest, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    del body
    now = utc_now()
    lease_expires = now + timedelta(seconds=settings.lease_seconds)
    with db_transaction(immediate=True) as connection:
        connection.execute(
            "UPDATE jobs SET status='QUEUED',worker_id=NULL,lease_id=NULL,lease_expires_at=NULL,secret_token_hash=NULL,secret_used_at=NULL,"
            "updated_at=?,message='Lease expired; queued again' "
            "WHERE status IN ('CLAIMED','AUTHENTICATING','FETCHING_ORDERS','FETCHING_DEALS','UPLOADING') "
            "AND lease_expires_at IS NOT NULL AND lease_expires_at < ?",
            (iso_utc(now), iso_utc(now)),
        )
        job = connection.execute("SELECT * FROM jobs WHERE status='QUEUED' ORDER BY created_at LIMIT 1").fetchone()
        if job is None:
            return {"job": None}
        account = connection.execute("SELECT * FROM accounts WHERE id=?", (job["account_id"],)).fetchone()
        lease_id = "lease_" + uuid.uuid4().hex
        secret_token = secrets.token_urlsafe(32)
        connection.execute(
            "UPDATE jobs SET status='CLAIMED',worker_id=?,lease_id=?,lease_expires_at=?,secret_token_hash=?,"
            "progress_percent=2,message='Claimed by worker',updated_at=? WHERE id=?",
            (worker_id, lease_id, iso_utc(lease_expires), token_hash(secret_token), iso_utc(now), job["id"]),
        )
    return {
        "job": {
            "job_id": job["id"],
            "lease_id": lease_id,
            "lease_expires_at": iso_utc(lease_expires),
            "account": {"id": account["id"], "login": account["login"], "server": account["server"]},
            "range": {"from": job["range_from"], "to": job["range_to"]},
            "secret_exchange_token": secret_token,
        }
    }


@app.post("/internal/v1/mt5-jobs/{job_id}/secret")
def exchange_secret(job_id: str, body: SecretRequest, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    with db_transaction(immediate=True) as connection:
        job = get_job_for_worker(connection, job_id, worker_id, body.lease_id)
        if job["secret_used_at"] is not None or not hmac.compare_digest(
            str(job["secret_token_hash"]), token_hash(body.secret_exchange_token)
        ):
            raise HTTPException(status_code=401, detail="Invalid or already-used secret exchange token")
        account = connection.execute("SELECT * FROM accounts WHERE id=?", (job["account_id"],)).fetchone()
        try:
            password = settings.fernet.decrypt(account["encrypted_password"]).decode("utf-8")
        except InvalidToken as exc:
            raise HTTPException(status_code=500, detail="Credential decrypt failed") from exc
        connection.execute(
            "UPDATE jobs SET secret_used_at=?,status='AUTHENTICATING',progress_percent=5,message='Credential exchanged',updated_at=? WHERE id=?",
            (iso_utc(), iso_utc(), job_id),
        )
    return {"login": account["login"], "server": account["server"], "investor_password": password}


@app.post("/internal/v1/mt5-jobs/{job_id}/progress")
def update_progress(job_id: str, body: ProgressRequest, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    with db_transaction(immediate=True) as connection:
        get_job_for_worker(connection, job_id, worker_id, body.lease_id)
        lease_expires = utc_now() + timedelta(seconds=settings.lease_seconds)
        connection.execute(
            "UPDATE jobs SET status=?,progress_percent=?,message=?,lease_expires_at=?,updated_at=? WHERE id=?",
            (body.status, body.progress_percent, body.message, iso_utc(lease_expires), iso_utc(), job_id),
        )
    return {"accepted": True, "lease_expires_at": iso_utc(lease_expires)}


@app.post("/internal/v1/mt5-jobs/{job_id}/batches")
async def upload_batch(job_id: str, request: Request, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    raw_body = await request.body()
    if len(raw_body) > MAX_BATCH_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Compressed batch body is too large")
    if request.headers.get("content-encoding", "").lower() == "gzip":
        try:
            raw_body = gzip.decompress(raw_body)
        except OSError as exc:
            raise HTTPException(status_code=400, detail="Invalid gzip body") from exc
    if len(raw_body) > MAX_BATCH_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Uncompressed batch body is too large")
    try:
        payload = json.loads(raw_body)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON body") from exc
    required = {"lease_id", "entity_type", "batch_index", "total_batches", "checksum", "records"}
    if not required.issubset(payload):
        raise HTTPException(status_code=422, detail="Missing batch fields")
    entity_type = payload["entity_type"]
    records = payload["records"]
    batch_index = payload["batch_index"]
    total_batches = payload["total_batches"]
    if entity_type not in {"ORDERS", "DEALS"} or not isinstance(records, list):
        raise HTTPException(status_code=422, detail="Invalid entity_type or records")
    if len(records) > MAX_BATCH_RECORDS:
        raise HTTPException(status_code=413, detail="Too many records in one batch")
    if not isinstance(batch_index, int) or not isinstance(total_batches, int) or not (0 <= batch_index < total_batches):
        raise HTTPException(status_code=422, detail="Invalid batch index/total")
    actual_checksum = hashlib.sha256(canonical_records(records)).hexdigest()
    if not hmac.compare_digest(str(payload["checksum"]), actual_checksum):
        raise HTTPException(status_code=409, detail="Batch checksum mismatch")

    with db_transaction(immediate=True) as connection:
        job = get_job_for_worker(connection, job_id, worker_id, str(payload["lease_id"]))
        existing = connection.execute(
            "SELECT checksum,record_count,total_batches FROM batches WHERE job_id=? AND entity_type=? AND batch_index=?",
            (job_id, entity_type, batch_index),
        ).fetchone()
        if existing is not None:
            if existing["checksum"] != actual_checksum or existing["total_batches"] != total_batches:
                raise HTTPException(status_code=409, detail="Idempotency conflict for batch index")
            return {"accepted": True, "duplicate": True, "received": existing["record_count"]}

        table = "raw_orders" if entity_type == "ORDERS" else "raw_deals"
        now = iso_utc()
        for record in records:
            if not isinstance(record, dict) or "ticket" not in record:
                raise HTTPException(status_code=422, detail="Every record requires ticket")
            ticket = str(record["ticket"])
            connection.execute(
                f"INSERT INTO {table}(account_id,ticket,payload_json,last_job_id,updated_at) VALUES(?,?,?,?,?) "
                "ON CONFLICT(account_id,ticket) DO UPDATE SET payload_json=excluded.payload_json,last_job_id=excluded.last_job_id,updated_at=excluded.updated_at",
                (job["account_id"], ticket, json.dumps(record, sort_keys=True, separators=(",", ":")), job_id, now),
            )
        connection.execute(
            "INSERT INTO batches(job_id,entity_type,batch_index,total_batches,checksum,record_count,created_at) VALUES(?,?,?,?,?,?,?)",
            (job_id, entity_type, batch_index, total_batches, actual_checksum, len(records), now),
        )
        count_column = "orders_received" if entity_type == "ORDERS" else "deals_received"
        lease_expires = utc_now() + timedelta(seconds=settings.lease_seconds)
        connection.execute(
            f"UPDATE jobs SET {count_column}={count_column}+?,status='UPLOADING',message=?,lease_expires_at=?,updated_at=? WHERE id=?",
            (len(records), f"Uploaded {entity_type} batch {batch_index + 1}/{total_batches}", iso_utc(lease_expires), now, job_id),
        )
    return {"accepted": True, "duplicate": False, "received": len(records)}


@app.post("/internal/v1/mt5-jobs/{job_id}/complete")
def complete_job(job_id: str, body: FinishRequest, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    with db_transaction(immediate=True) as connection:
        get_job_for_worker(connection, job_id, worker_id, body.lease_id)
        for entity_type in ("ORDERS", "DEALS"):
            rows = connection.execute(
                "SELECT batch_index,total_batches FROM batches WHERE job_id=? AND entity_type=? ORDER BY batch_index",
                (job_id, entity_type),
            ).fetchall()
            if not rows:
                raise HTTPException(status_code=409, detail=f"No {entity_type} batch uploaded")
            expected = rows[0]["total_batches"]
            if len(rows) != expected or [row["batch_index"] for row in rows] != list(range(expected)):
                raise HTTPException(status_code=409, detail=f"Incomplete {entity_type} batch manifest")
        now = iso_utc()
        connection.execute(
            "UPDATE jobs SET status='COMPLETED',progress_percent=100,message='Import completed',completed_at=?,updated_at=? WHERE id=?",
            (now, now, job_id),
        )
        connection.execute("UPDATE workers SET current_job_id=NULL,status='ONLINE' WHERE id=?", (worker_id,))
    return {"accepted": True, "status": "COMPLETED"}


@app.post("/internal/v1/mt5-jobs/{job_id}/fail")
def fail_job(job_id: str, body: FailRequest, worker_id: str = Depends(require_worker)) -> dict[str, Any]:
    with db_transaction(immediate=True) as connection:
        get_job_for_worker(connection, job_id, worker_id, body.lease_id)
        now = iso_utc()
        connection.execute(
            "UPDATE jobs SET status='FAILED',message='Import failed',error_code=?,error_message=?,updated_at=? WHERE id=?",
            (body.error_code, body.error_message, now, job_id),
        )
        connection.execute("UPDATE workers SET current_job_id=NULL,status='ONLINE' WHERE id=?", (worker_id,))
    return {"accepted": True, "status": "FAILED"}


@app.get("/admin/v1/jobs")
def list_jobs(_: str = Depends(require_admin)) -> dict[str, Any]:
    connection = connect_db()
    try:
        rows = connection.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 100").fetchall()
    finally:
        connection.close()
    return {"jobs": [serialize_job(row) for row in rows]}
