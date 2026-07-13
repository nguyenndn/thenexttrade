from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
WORKER = ROOT / "worker.py"
CONFIG = ROOT / "config.json"
TOKEN_FILE = ROOT / "worker-token.dpapi"


def run_enrollment() -> None:
    print("TheNextTrade local worker setup")
    print("The enrollment token is requested only once and is stored with Windows DPAPI.")
    token = input("Paste enrollment token: ").strip()
    if not token:
        raise RuntimeError("Enrollment token cannot be empty.")
    print(f"Token received: {token}")
    confirmation = input("Use this token? [Y/n]: ").strip().lower()
    if confirmation not in ("", "y", "yes"):
        raise RuntimeError("Enrollment cancelled.")

    environment = os.environ.copy()
    environment["GSN_ENROLLMENT_TOKEN"] = token
    result = subprocess.run(
        [sys.executable, str(WORKER), "--config", str(CONFIG), "--enroll"],
        cwd=ROOT,
        env=environment,
        check=False,
    )
    environment.pop("GSN_ENROLLMENT_TOKEN", None)
    token = ""
    if result.returncode != 0:
        raise RuntimeError(f"Worker enrollment failed with exit code {result.returncode}.")
    print("Enrollment completed. The token will not be requested again on this Windows user.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Enroll and start the local GSN worker")
    parser.add_argument("--re-enroll", action="store_true", help="Replace the saved worker token")
    args = parser.parse_args()

    if not WORKER.exists():
        raise RuntimeError(f"Worker file not found: {WORKER}")
    if not CONFIG.exists():
        raise RuntimeError(f"Worker config not found: {CONFIG}")
    if args.re_enroll and TOKEN_FILE.exists():
        TOKEN_FILE.unlink()
    if not TOKEN_FILE.exists():
        run_enrollment()

    print("Starting worker. Press Ctrl+C to stop it.")
    return subprocess.call([sys.executable, str(WORKER), "--config", str(CONFIG)], cwd=ROOT)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nWorker stopped.")
        raise SystemExit(0)
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
