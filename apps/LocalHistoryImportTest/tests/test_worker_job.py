from __future__ import annotations

import json
import sys
from collections import namedtuple
from pathlib import Path


WORKER_DIR = Path(__file__).resolve().parents[1] / "worker"
sys.path.insert(0, str(WORKER_DIR))

import worker as worker_module  # noqa: E402


class FakeMt5:
    def __init__(self) -> None:
        self.shutdown_called = False
        self.initialize_kwargs = None
        self.Account = namedtuple("Account", "login server")
        self.Order = namedtuple("Order", "ticket symbol volume_initial")
        self.Deal = namedtuple("Deal", "ticket order profit")

    def initialize(self, **kwargs):
        self.initialize_kwargs = kwargs
        return True

    def shutdown(self):
        self.shutdown_called = True

    def login(self, login, password, server, timeout):
        return True

    def account_info(self):
        return self.Account(12345678, "TestBroker-Demo")

    def history_orders_get(self, start, end):
        return [self.Order(1001, "XAUUSD", 0.01)]

    def history_deals_get(self, start, end):
        return [self.Deal(2001, 1001, 12.5)]

    def last_error(self):
        return (0, "OK")

class FakeApi:
    def __init__(self, mt5: FakeMt5) -> None:
        self.mt5 = mt5
        self.uploads = []
        self.completed = False
        self.failed = False

    def post(self, path, payload, timeout=30):
        if path.endswith("/secret"):
            return {"login": "12345678", "server": "TestBroker-Demo", "investor_password": "secret"}
        if path.endswith("/complete"):
            assert self.mt5.shutdown_called is True
            self.completed = True
        if path.endswith("/fail"):
            self.failed = True
        return {"accepted": True}

    def upload_batch(self, job_id, payload):
        self.uploads.append((job_id, payload))
        return {"accepted": True}


def test_worker_job_shutdown_precedes_complete(tmp_path, monkeypatch) -> None:
    terminal = tmp_path / "terminal64.exe"
    terminal.write_bytes(b"test")
    logs = tmp_path / "logs"
    config = {
        "backendBaseUrl": "http://127.0.0.1:8765",
        "workerId": "worker-test",
        "paths": {"terminal": str(terminal), "logs": str(logs)},
        "batchSize": 500,
    }
    config_path = tmp_path / "worker.json"
    config_path.write_text(json.dumps(config), encoding="utf-8")
    instance = worker_module.Worker(config_path)
    fake_mt5 = FakeMt5()
    fake_api = FakeApi(fake_mt5)
    instance.api = fake_api

    monkeypatch.setitem(sys.modules, "MetaTrader5", fake_mt5)
    monkeypatch.setattr(worker_module, "matching_terminal_pids", lambda path: set())
    monkeypatch.setattr(worker_module, "terminate_new_terminals", lambda before, path: None)
    monkeypatch.setattr(worker_module.time, "sleep", lambda seconds: None)

    instance.process_job(
        {
            "job_id": "imp_test",
            "lease_id": "lease_test",
            "secret_exchange_token": "exchange",
            "account": {"login": "12345678", "server": "TestBroker-Demo"},
            "range": {"from": "2026-07-01T00:00:00Z", "to": "2026-07-02T00:00:00Z"},
        }
    )

    assert fake_api.completed is True
    assert fake_api.failed is False
    assert fake_mt5.initialize_kwargs["portable"] is True
    assert [payload["entity_type"] for _, payload in fake_api.uploads] == ["ORDERS", "DEALS"]
