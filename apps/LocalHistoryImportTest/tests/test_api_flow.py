from __future__ import annotations

import hashlib
import gzip
import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path

from cryptography.fernet import Fernet


TEST_ROOT = Path(tempfile.mkdtemp(prefix="gsn-local-api-test-"))
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "api"))
os.environ["GSN_LOCAL_DATA_DIR"] = str(TEST_ROOT)
os.environ["GSN_LOCAL_USER_TOKEN"] = "test-user-token"
os.environ["GSN_LOCAL_ADMIN_TOKEN"] = "test-admin-token"
os.environ["GSN_LOCAL_FERNET_KEY"] = Fernet.generate_key().decode("ascii")
os.environ["GSN_LOCAL_LEASE_SECONDS"] = "600"

from fastapi.testclient import TestClient  # noqa: E402
import app as api_app  # noqa: E402


client = TestClient(api_app.app)
ADMIN = {"Authorization": "Bearer test-admin-token"}
USER = {"Authorization": "Bearer test-user-token"}


def checksum(records: list[dict]) -> str:
    encoded = json.dumps(records, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def test_complete_local_import_flow() -> None:
    assert client.get("/health").status_code == 200

    enrollment = client.post(
        "/admin/v1/workers/enrollment-tokens",
        headers=ADMIN,
        json={"worker_id": "worker-test-01", "ttl_minutes": 15},
    )
    assert enrollment.status_code == 200
    enrollment_token = enrollment.json()["enrollment_token"]

    enroll = client.post(
        "/internal/v1/mt5-workers/enroll",
        json={"worker_id": "worker-test-01", "enrollment_token": enrollment_token},
    )
    assert enroll.status_code == 200
    worker_token = enroll.json()["worker_token"]
    worker_headers = {"Authorization": "Worker " + worker_token}

    replay = client.post(
        "/internal/v1/mt5-workers/enroll",
        json={"worker_id": "worker-test-01", "enrollment_token": enrollment_token},
    )
    assert replay.status_code == 401

    heartbeat = client.post(
        "/internal/v1/mt5-workers/heartbeat",
        headers=worker_headers,
        json={"version": "test", "status": "IDLE", "current_job_id": None},
    )
    assert heartbeat.status_code == 200

    password = "investor-secret-not-plaintext"
    account = client.post(
        "/v1/mt5-accounts",
        headers=USER,
        json={
            "label": "Test account",
            "login": "12345678",
            "broker_name": "Test Broker",
            "server": "TestBroker-Demo",
            "investor_password": password,
        },
    )
    assert account.status_code == 201
    account_id = account.json()["id"]

    original_password = password
    password = password + "-rotated"
    account_update = client.post(
        "/v1/mt5-accounts",
        headers=USER,
        json={
            "label": "Test account updated",
            "login": "12345678",
            "broker_name": "Test Broker",
            "server": "TestBroker-Demo",
            "investor_password": password,
        },
    )
    assert account_update.status_code == 201
    assert account_update.json()["id"] == account_id
    assert account_update.json()["created"] is False

    database_bytes = Path(api_app.settings.db_path).read_bytes()
    assert password.encode("utf-8") not in database_bytes
    assert original_password.encode("utf-8") not in database_bytes

    created = client.post(
        f"/v1/mt5-accounts/{account_id}/imports",
        headers=USER,
        json={"from": "2026-07-01T00:00:00Z", "to": "2026-07-02T00:00:00Z", "mode": "FULL"},
    )
    assert created.status_code == 202
    job_id = created.json()["job_id"]

    claim = client.post("/internal/v1/mt5-jobs/claim", headers=worker_headers, json={"capacity": 1})
    assert claim.status_code == 200
    job = claim.json()["job"]
    assert job["job_id"] == job_id

    secret = client.post(
        f"/internal/v1/mt5-jobs/{job_id}/secret",
        headers=worker_headers,
        json={"lease_id": job["lease_id"], "secret_exchange_token": job["secret_exchange_token"]},
    )
    assert secret.status_code == 200
    assert secret.json()["investor_password"] == password
    assert client.post(
        f"/internal/v1/mt5-jobs/{job_id}/secret",
        headers=worker_headers,
        json={"lease_id": job["lease_id"], "secret_exchange_token": job["secret_exchange_token"]},
    ).status_code == 401

    orders = [{"ticket": "1001", "symbol": "XAUUSD", "volume_initial": "0.01"}]
    deals = [{"ticket": "2001", "order": "1001", "profit": "12.50"}]
    for entity_type, records in (("ORDERS", orders), ("DEALS", deals)):
        payload = {
            "lease_id": job["lease_id"],
            "entity_type": entity_type,
            "batch_index": 0,
            "total_batches": 1,
            "checksum": checksum(records),
            "records": records,
        }
        if entity_type == "ORDERS":
            encoded = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            uploaded = client.post(
                f"/internal/v1/mt5-jobs/{job_id}/batches",
                headers=worker_headers | {"Content-Type": "application/json", "Content-Encoding": "gzip"},
                content=gzip.compress(encoded),
            )
        else:
            uploaded = client.post(f"/internal/v1/mt5-jobs/{job_id}/batches", headers=worker_headers, json=payload)
        assert uploaded.status_code == 200
        assert uploaded.json()["duplicate"] is False
        duplicate = client.post(f"/internal/v1/mt5-jobs/{job_id}/batches", headers=worker_headers, json=payload)
        assert duplicate.status_code == 200
        assert duplicate.json()["duplicate"] is True

    conflict_records = [{"ticket": "9999"}]
    conflict = client.post(
        f"/internal/v1/mt5-jobs/{job_id}/batches",
        headers=worker_headers,
        json={
            "lease_id": job["lease_id"],
            "entity_type": "DEALS",
            "batch_index": 0,
            "total_batches": 1,
            "checksum": checksum(conflict_records),
            "records": conflict_records,
        },
    )
    assert conflict.status_code == 409

    completed = client.post(
        f"/internal/v1/mt5-jobs/{job_id}/complete",
        headers=worker_headers,
        json={"lease_id": job["lease_id"]},
    )
    assert completed.status_code == 200

    status_response = client.get(f"/v1/imports/{job_id}", headers=USER)
    assert status_response.status_code == 200
    status_body = status_response.json()
    assert status_body["status"] == "COMPLETED"
    assert status_body["orders_received"] == 1
    assert status_body["deals_received"] == 1

    records_response = client.get(f"/v1/imports/{job_id}/records?entity_type=DEALS", headers=USER)
    assert records_response.status_code == 200
    assert records_response.json()["records"] == deals

    connection = sqlite3.connect(api_app.settings.db_path)
    try:
        assert connection.execute("SELECT COUNT(*) FROM batches").fetchone()[0] == 2
        assert connection.execute("SELECT COUNT(*) FROM raw_deals").fetchone()[0] == 1
    finally:
        connection.close()

    workers = client.get("/admin/v1/workers", headers=ADMIN)
    assert workers.status_code == 200
    assert workers.json()["workers"][0]["id"] == "worker-test-01"
    revoked = client.post("/admin/v1/workers/worker-test-01/revoke", headers=ADMIN)
    assert revoked.status_code == 200
    assert client.post(
        "/internal/v1/mt5-workers/heartbeat",
        headers=worker_headers,
        json={"version": "test", "status": "IDLE", "current_job_id": None},
    ).status_code == 401


def test_authentication_is_required() -> None:
    assert client.get("/admin/v1/jobs").status_code == 401
    assert client.get("/v1/imports/not-found").status_code == 401
