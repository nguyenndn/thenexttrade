"""
TheNextTrade Connect — API Client
Handles all communication with TheNextTrade web API.
"""

import logging
import requests
from typing import Optional

logger = logging.getLogger("tnt-connect.api")


class APIClient:
    def __init__(self, api_key: str, base_url: str = "https://thenexttrade.com"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "X-Sync-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "TNTConnect/1.0",
        })
        self.session.timeout = 30

    def connect(self) -> Optional[dict]:
        """
        Authenticate and fetch user info + trading accounts.
        Returns response data or None on failure.
        """
        try:
            resp = self.session.post(f"{self.base_url}/api/sync/connect")
            resp.raise_for_status()
            data = resp.json()
            if data.get("success"):
                logger.info(f"Connected as {data['user']['name']} — {len(data['accounts'])} accounts")
                return data
            else:
                logger.error(f"Connect failed: {data.get('error')}")
                return None
        except requests.RequestException as e:
            logger.error(f"Connect error: {e}")
            return None

    def sync_trades(self, accounts: list[dict]) -> Optional[dict]:
        """
        Send batch trade sync for multiple accounts.
        accounts: [{ accountNumber, balance, equity, trades: [...] }, ...]
        """
        try:
            resp = self.session.post(
                f"{self.base_url}/api/sync/trades",
                json={"accounts": accounts},
            )
            resp.raise_for_status()
            data = resp.json()
            logger.debug(f"Sync response: {data}")
            if data.get("success"):
                return data.get("results", {})
            else:
                logger.error(f"Sync failed: {data.get('error')}")
                return None
        except requests.RequestException as e:
            logger.error(f"Sync error: {e}")
            return None

    def heartbeat(self, accounts: list[dict]) -> bool:
        """
        Send heartbeat for all connected accounts.
        accounts: [{ accountNumber, connected, balance, equity, ... }, ...]
        """
        try:
            resp = self.session.post(
                f"{self.base_url}/api/sync/heartbeat",
                json={"accounts": accounts},
            )
            resp.raise_for_status()
            return resp.json().get("success", False)
        except requests.RequestException as e:
            logger.error(f"Heartbeat error: {e}")
            return False

    def get_config(self) -> Optional[dict]:
        """Fetch sync config and resync requests from server."""
        try:
            resp = self.session.get(f"{self.base_url}/api/sync/config")
            resp.raise_for_status()
            data = resp.json()
            if data.get("success"):
                return data
            return None
        except requests.RequestException as e:
            logger.error(f"Config fetch error: {e}")
            return None
