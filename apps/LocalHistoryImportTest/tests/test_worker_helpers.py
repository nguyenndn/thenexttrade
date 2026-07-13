from __future__ import annotations

import sys
from collections import namedtuple
from pathlib import Path

import pytest


WORKER_DIR = Path(__file__).resolve().parents[1] / "worker"
sys.path.insert(0, str(WORKER_DIR))

import worker  # noqa: E402


def test_normalize_and_chunk_records() -> None:
    Deal = namedtuple("Deal", "ticket price volume symbol")
    records = worker.normalize_records([Deal(123, 4100.125, 0.01, "XAUUSD")])
    assert records == [{"ticket": "123", "price": "4100.125", "volume": "0.01", "symbol": "XAUUSD"}]
    assert worker.chunks([], 500) == [[]]
    assert worker.chunks(records * 3, 2) == [records * 2, records]


def test_existing_terminal_is_rejected(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(worker, "matching_terminal_pids", lambda _path: {4242})

    with pytest.raises(worker.WorkerError, match="already running"):
        worker.ensure_terminal_is_available(tmp_path / "terminal64.exe")
