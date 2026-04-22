"""
TheNextTrade Connect — Auto Updater
Checks for updates, downloads new version, and restarts.
"""

import logging
import os
import sys
import subprocess
import tempfile
import threading
import requests
from typing import Optional, Callable

logger = logging.getLogger("tnt-connect.updater")


def compare_versions(current: str, latest: str) -> int:
    """Compare semver strings. Returns 1 if latest > current, 0 if equal, -1 if older."""
    def parse(v: str) -> tuple:
        return tuple(int(x) for x in v.strip().split("."))
    try:
        c, l = parse(current), parse(latest)
        if l > c:
            return 1
        elif l == c:
            return 0
        return -1
    except Exception:
        return 0


class AutoUpdater:
    def __init__(self, current_version: str, api_base_url: str = "https://thenexttrade.com"):
        self.current_version = current_version
        self.api_base_url = api_base_url.rstrip("/")
        self.latest_version: Optional[str] = None
        self.download_url: Optional[str] = None
        self.changelog: Optional[str] = None
        self.mandatory: bool = False
        self._downloading = False
        self._download_progress = 0

    def check_for_updates(self) -> dict:
        """Check server for new version. Returns update info."""
        try:
            resp = requests.get(
                f"{self.api_base_url}/api/app/version",
                timeout=10,
                headers={"User-Agent": f"TNTConnect/{self.current_version}"},
            )
            resp.raise_for_status()
            data = resp.json()

            self.latest_version = data.get("version", self.current_version)
            self.download_url = data.get("downloadUrl", "")
            self.changelog = data.get("changelog", "")
            self.mandatory = data.get("mandatory", False)

            has_update = compare_versions(self.current_version, self.latest_version) > 0

            if has_update:
                logger.info(f"Update available: {self.current_version} → {self.latest_version}")
            else:
                logger.info(f"App is up to date (v{self.current_version})")

            return {
                "hasUpdate": has_update,
                "currentVersion": self.current_version,
                "latestVersion": self.latest_version,
                "changelog": self.changelog,
                "mandatory": self.mandatory,
            }
        except Exception as e:
            logger.warning(f"Update check failed: {e}")
            return {
                "hasUpdate": False,
                "currentVersion": self.current_version,
                "error": str(e),
            }

    def download_and_install(self, on_progress: Optional[Callable] = None, on_complete: Optional[Callable] = None):
        """Download update in background thread, then launch installer."""
        if self._downloading or not self.download_url:
            return

        def _worker():
            self._downloading = True
            self._download_progress = 0
            temp_path = None

            try:
                # Download to temp file
                resp = requests.get(self.download_url, stream=True, timeout=120)
                resp.raise_for_status()
                total = int(resp.headers.get("content-length", 0))

                temp_dir = tempfile.gettempdir()
                temp_path = os.path.join(temp_dir, "TheNextTradeConnect_update.exe")

                downloaded = 0
                with open(temp_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=65536):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total > 0:
                            self._download_progress = int(downloaded / total * 100)
                            if on_progress:
                                on_progress(self._download_progress)

                logger.info(f"Update downloaded to: {temp_path}")

                # Get current exe path
                if getattr(sys, 'frozen', False):
                    current_exe = sys.executable
                else:
                    # Dev mode: can't self-update
                    logger.warning("Cannot self-update in dev mode")
                    if on_complete:
                        on_complete(False, "Cannot update in development mode")
                    return

                # Create updater batch script
                updater_script = os.path.join(temp_dir, "tnt_updater.bat")
                with open(updater_script, "w") as f:
                    f.write(f'''@echo off
title TheNextTrade Connect Updater
echo Updating TheNextTrade Connect...
echo Waiting for app to close...
timeout /t 3 /nointerrupt >nul
echo Applying update...
copy /y "{temp_path}" "{current_exe}"
if errorlevel 1 (
    echo Update failed! Please download manually.
    pause
    exit /b 1
)
del "{temp_path}"
echo Update complete! Restarting...
start "" "{current_exe}"
del "%~f0"
''')

                logger.info("Launching updater and closing app...")
                # Launch batch script (detached from current process)
                subprocess.Popen(
                    ["cmd", "/c", updater_script],
                    creationflags=subprocess.CREATE_NEW_CONSOLE | subprocess.DETACHED_PROCESS,
                    close_fds=True,
                )

                if on_complete:
                    on_complete(True, "Update ready — restarting...")

            except Exception as e:
                logger.error(f"Update download failed: {e}")
                # Clean up partial download
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass
                if on_complete:
                    on_complete(False, str(e))
            finally:
                self._downloading = False

        threading.Thread(target=_worker, daemon=True).start()

    @property
    def is_downloading(self) -> bool:
        return self._downloading

    @property
    def download_progress(self) -> int:
        return self._download_progress
