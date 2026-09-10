#!/usr/bin/env python3
"""
Unit tests for TNT-Cloud-Sync-Worker (worker.py).

Run from tools/tnt-worker:
    .venv/Scripts/python.exe -m unittest discover -s tests -t .

Covers the pure helpers that previously carried partial-close / logging bugs:
  * build_closed_positions  (closed-position reconstruction from history deals)
  * resolve_server_name     (broker alias resolution against servers_manifest)
  * parse_iso_datetime      (range-from / range-to parsing)
"""
import hashlib
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import worker  # noqa: E402  (path fix above must run first)


def make_deal(**over):
    """Build a lightweight mock of an MT5 history deal tuple."""
    base = dict(
        symbol="EURUSD",
        position_id=10,
        entry=0,      # DEAL_ENTRY_IN
        type=0,       # DEAL_TYPE_BUY
        volume=0.1,
        time=1_000_000,
        price=1.10000,
        profit=0.0,
        swap=0.0,
        commission=0.0,
        comment="",
    )
    base.update(over)
    return SimpleNamespace(**base)


class TestBuildClosedPositions(unittest.TestCase):
    def test_full_close_single_position(self):
        """One opening deal + one closing deal -> one closed row, lots = in volume."""
        deals = [
            make_deal(position_id=10, entry=0, type=0, volume=0.5,
                      time=1000, price=1.10000, profit=0.0, comment=""),
            make_deal(position_id=10, entry=1, type=1, volume=0.5,
                      time=2000, price=1.11000, profit=12.5, swap=-0.5,
                      commission=-1.0, comment="tp"),
        ]
        result = worker.build_closed_positions(deals, open_tickets=set())
        self.assertEqual(len(result), 1)
        row = result[0]
        self.assertEqual(row["ticket"], 10)
        self.assertEqual(row["symbol"], "EURUSD")
        self.assertEqual(row["type"], "BUY")
        self.assertAlmostEqual(row["lots"], 0.5)
        self.assertEqual(row["openTime"], 1000)
        self.assertAlmostEqual(row["openPrice"], 1.10)
        self.assertEqual(row["closeTime"], 2000)
        self.assertAlmostEqual(row["closePrice"], 1.11)
        self.assertIsNone(row["sl"])
        self.assertIsNone(row["tp"])
        self.assertAlmostEqual(row["profit"], 12.5)
        self.assertAlmostEqual(row["swap"], -0.5)
        self.assertAlmostEqual(row["commission"], -1.0)
        self.assertEqual(row["comment"], "tp")

    def test_partial_then_fully_closed_uses_total_opened_volume(self):
        """Position opened in 2 lots and closed in 2 lots -> ONE row, lots = total in_vol."""
        deals = [
            make_deal(position_id=10, entry=0, type=0, volume=0.2,
                      time=1000, price=1.10000),
            make_deal(position_id=10, entry=0, type=0, volume=0.3,
                      time=1100, price=1.11000),
            make_deal(position_id=10, entry=1, type=1, volume=0.2,
                      time=2000, price=1.12000, profit=4.0, comment="partial"),
            make_deal(position_id=10, entry=1, type=1, volume=0.3,
                      time=3000, price=1.13000, profit=9.0, comment="out"),
        ]
        result = worker.build_closed_positions(deals, open_tickets=set())
        self.assertEqual(len(result), 1, "must not emit one row per closing deal")
        row = result[0]
        self.assertAlmostEqual(row["lots"], 0.5, msg="lots must sum ALL opened volume")
        self.assertAlmostEqual(row["profit"], 13.0, msg="profit sums all deals of the position")
        # close time/price/comment come from the LATEST closing deal
        self.assertEqual(row["closeTime"], 3000)
        self.assertAlmostEqual(row["closePrice"], 1.13)
        self.assertEqual(row["comment"], "out")

    def test_still_open_partial_position_is_not_emitted(self):
        """Open position with only a partial close -> must NOT appear as CLOSED (dup ticket)."""
        deals = [
            make_deal(position_id=10, entry=0, type=0, volume=0.5, time=1000, price=1.10000),
            make_deal(position_id=10, entry=1, type=1, volume=0.2, time=2000, price=1.12000,
                      profit=4.0, comment="partial"),
        ]
        # Open positions set -> pid 10 is still open.
        self.assertEqual(worker.build_closed_positions(deals, open_tickets={10}), [])
        # Sanity: without the open set the function would emit (caller bug guard).
        self.assertEqual(len(worker.build_closed_positions(deals, open_tickets=set())), 1)

    def test_only_outside_in_range_falls_back_to_out_volume(self):
        """Opening deal lies outside range -> emit with lots = closed volume, type inferred."""
        deals = [
            make_deal(position_id=10, entry=1, type=1, volume=0.4,
                      time=3000, price=1.12000, profit=5.0, comment="out"),
        ]
        result = worker.build_closed_positions(deals, open_tickets=set())
        self.assertEqual(len(result), 1)
        row = result[0]
        self.assertEqual(row["type"], "BUY", "no in deal -> derive direction from closing deal")
        self.assertAlmostEqual(row["lots"], 0.4, msg="lots fallback to total closed volume")
        self.assertEqual(row["openTime"], 3000, msg="open time falls back to close time")
        self.assertAlmostEqual(row["openPrice"], 1.12)

    def test_trash_and_open_only_rows_are_skipped(self):
        """Balance/without-position rows and in-only (never-closed-in-range) rows are dropped."""
        deals = [
            # balance deal (no symbol / position id) — deposit/withdraw
            make_deal(symbol=None, position_id=None, entry=0, type=0, volume=0.0),
            # position opened but closed OUTSIDE the queried range -> no out deal
            make_deal(position_id=30, entry=0, type=0, volume=0.5, time=1000, price=1.10000),
            # valid fully closed position
            make_deal(position_id=40, entry=0, type=1, volume=0.2, time=1000, price=1.10000),
            make_deal(position_id=40, entry=1, type=0, volume=0.2, time=2000, price=1.09000,
                      profit=-4.0, comment="sl"),
        ]
        result = worker.build_closed_positions(deals, open_tickets=set())
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["ticket"], 40)
        self.assertEqual(result[0]["type"], "SELL")  # opened with type SELL(1)

    def test_empty_deals_return_empty(self):
        self.assertEqual(worker.build_closed_positions(None, open_tickets=set()), [])
        self.assertEqual(worker.build_closed_positions([], open_tickets=set()), [])

    def test_open_tickets_accepts_raw_ticket_values(self):
        """open_tickets may carry ints or numeric strings; both must suppress emit."""
        deals = [make_deal(position_id=10, entry=0, type=0, volume=0.5, time=1000),
                 make_deal(position_id=10, entry=1, type=1, volume=0.5, time=2000, profit=3.0)]
        self.assertEqual(worker.build_closed_positions(deals, open_tickets={10}), [])
        self.assertEqual(worker.build_closed_positions(deals, open_tickets={"10"}), [])


class TestResolveServerName(unittest.TestCase):
    MANIFEST = {
        "servers": [
            "STARTRADERFinancial-Demo",
            "STARTRADERFinancial-Live 6",
            "Exness-MT5Real20",
            "VantageMarkets-Live",
            "VTMarkets-Demo",
        ],
        "brokers": {},
    }

    def test_exact_case_insensitive_match(self):
        self.assertEqual(worker.resolve_server_name("exness-mt5real20", self.MANIFEST),
                         "Exness-MT5Real20")

    def test_whitespace_stripped(self):
        self.assertEqual(worker.resolve_server_name("  Exness-MT5Real20  ", self.MANIFEST),
                         "Exness-MT5Real20")

    def test_prefix_alias_match(self):
        self.assertEqual(worker.resolve_server_name("STARTRADER-Demo", self.MANIFEST),
                         "STARTRADERFinancial-Demo")

    def test_unknown_server_passthrough(self):
        self.assertEqual(worker.resolve_server_name("NoSuchBroker-Live", self.MANIFEST),
                         "NoSuchBroker-Live")

    def test_empty_input_passthrough(self):
        self.assertIsNone(worker.resolve_server_name(None, self.MANIFEST))
        self.assertEqual(worker.resolve_server_name("", self.MANIFEST), "")

    @unittest.skipUnless(os.path.isdir(worker.get_servers_pack_dir() or ""),
                         "servers_pack not bundled in this checkout")
    def test_against_bundled_manifest(self):
        """Integration: bundled manifest resolves real brokers to canonical names."""
        for probe, canonical in [("exness-mt5real20", "Exness-MT5Real20"),
                                 ("STARTRADER-Demo", "STARTRADERFinancial-Demo"),
                                 ("Vantage-Live", "VantageMarkets-Live"),
                                 ("vtmarkets-demo", "VTMarkets-Demo")]:
            got = worker.resolve_server_name(probe)
            self.assertEqual(got, canonical, f"probe '{probe}' should resolve to '{canonical}'")


class TestParseIsoDatetime(unittest.TestCase):
    def test_zulu_string(self):
        dt = worker.parse_iso_datetime("2026-09-08T04:16:00Z")
        self.assertEqual(dt.year, 2026)
        self.assertEqual(dt.month, 9)
        self.assertIsNotNone(dt.tzinfo)

    def test_naive_string(self):
        dt = worker.parse_iso_datetime("2026-09-08T04:16:00")
        self.assertEqual(dt.year, 2026)
        self.assertEqual(dt.month, 9)

    def test_empty_returns_now_utc(self):
        for bad in ("", None, "not-a-date"):
            dt = worker.parse_iso_datetime(bad)
            self.assertLess(abs((datetime.now(timezone.utc) - dt).total_seconds()), 10,
                            f"'{bad}' should fall back to now UTC")


class TestCatalogTools(unittest.TestCase):
    """--build-catalog helpers: source picking + manifest refresh + pack rebuild."""

    def test_pick_largest_differing_at_least_master_size(self):
        cands = [("d0", "p0", 500, "aaa"),   # smaller than master -> skipped
                 ("d1", "p1", 900, "bbb"),   # largest eligible -> chosen
                 ("d2", "p2", 600, "master")]  # same digest -> skipped
        best = worker.pick_catalog_source(cands, "master", min_size=700)
        self.assertEqual(best[0], "d1")

    def test_pick_none_when_all_match_master(self):
        cands = [("d0", "p0", 900, "m"), ("d1", "p1", 950, "m")]
        self.assertIsNone(worker.pick_catalog_source(cands, "m", min_size=0))

    def test_pick_none_when_all_differing_are_smaller_than_master(self):
        # A fresh default install (small catalog) must never replace a richer master.
        cands = [("d0", "p0", 300, "different")]
        self.assertIsNone(worker.pick_catalog_source(cands, "m", min_size=554244))

    def test_update_manifest_serversdat_refreshes_metadata_only(self):
        with tempfile.TemporaryDirectory() as d:
            with open(os.path.join(d, "servers_manifest.json"), "w", encoding="utf-8") as f:
                json.dump({"serversDat": {"sha256": "old", "bytes": 1},
                           "servers": ["Exness-MT5Real20"],
                           "brokers": {"Exness": ["Exness-MT5Real20"]}}, f)
            ok, err = worker.update_manifest_serversdat(d, 123456, "deadbeef")
            self.assertTrue(ok, err)
            with open(os.path.join(d, "servers_manifest.json"), "r", encoding="utf-8") as f:
                m = json.load(f)
            self.assertEqual(m["serversDat"]["sha256"], "deadbeef")
            self.assertEqual(m["serversDat"]["bytes"], 123456)
            self.assertEqual(m["serversDat"]["file"], "servers.dat")
            self.assertEqual(m["servers"], ["Exness-MT5Real20"], "server list must be untouched")
            self.assertIn("updatedAt", m)

    def test_rebuild_identical_source_is_noop(self):
        with tempfile.TemporaryDirectory() as d:
            pack = os.path.join(d, "pack")
            src = os.path.join(d, "src")
            os.makedirs(os.path.join(pack, "bases"))
            os.makedirs(os.path.join(src, "config"))
            with open(os.path.join(pack, "servers.dat"), "wb") as f:
                f.write(b"MASTER-CONTENT")
            with open(os.path.join(pack, "servers_manifest.json"), "w", encoding="utf-8") as f:
                json.dump({"serversDat": {}, "servers": []}, f)
            with open(os.path.join(src, "config", "servers.dat"), "wb") as f:
                f.write(b"MASTER-CONTENT")
            ok, msg = worker.rebuild_catalog_pack(src, pack)
            self.assertFalse(ok)
            self.assertIn("identical", msg)
            self.assertFalse(os.path.exists(os.path.join(pack, "servers.dat") + ".prev"))

    def test_rebuild_replaces_master_backups_and_refreshes_manifest(self):
        with tempfile.TemporaryDirectory() as d:
            pack = os.path.join(d, "pack")
            src = os.path.join(d, "src")
            os.makedirs(os.path.join(pack, "bases"))
            os.makedirs(os.path.join(src, "config"))
            with open(os.path.join(pack, "servers.dat"), "wb") as f:
                f.write(b"OLD-MASTER")
            with open(os.path.join(pack, "servers_manifest.json"), "w", encoding="utf-8") as f:
                json.dump({"serversDat": {"sha256": "stale"}, "servers": []}, f)
            new_content = b"RICH-NEW-CATALOG-WITH-MORE-BROKERS"
            with open(os.path.join(src, "config", "servers.dat"), "wb") as f:
                f.write(new_content)
            ok, msg = worker.rebuild_catalog_pack(src, pack)
            self.assertTrue(ok, msg)
            with open(os.path.join(pack, "servers.dat"), "rb") as f:
                self.assertEqual(f.read(), new_content)
            bak = os.path.join(pack, "servers.dat") + ".prev"
            self.assertTrue(os.path.exists(bak), "previous master must be backed up")
            with open(bak, "rb") as f:
                self.assertEqual(f.read(), b"OLD-MASTER")
            with open(os.path.join(pack, "servers_manifest.json"), "r", encoding="utf-8") as f:
                m = json.load(f)
            self.assertEqual(m["serversDat"]["sha256"],
                             hashlib.sha256(new_content).hexdigest())
            self.assertEqual(m["serversDat"]["bytes"], len(new_content))

    def test_rebuild_missing_source_servers_dat_errors(self):
        with tempfile.TemporaryDirectory() as d:
            pack = os.path.join(d, "pack")
            src = os.path.join(d, "src")  # no config/servers.dat
            os.makedirs(os.path.join(pack, "bases"))
            os.makedirs(src)
            with open(os.path.join(pack, "servers.dat"), "wb") as f:
                f.write(b"MASTER")
            ok, msg = worker.rebuild_catalog_pack(src, pack)
            self.assertFalse(ok)
            self.assertIn("no config/servers.dat", msg)


if __name__ == "__main__":
    unittest.main()
