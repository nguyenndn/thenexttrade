from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
WORKER = ROOT / "worker.py"
WORKER_VERSION = "0.1.1"
LOCAL_CONFIG = ROOT / "config.json"
INSTALLED_CONFIG = ROOT.parent / "config" / "worker.json"


def resolve_config_path(value: str | None) -> Path:
    if value:
        return Path(value).expanduser().resolve()
    if INSTALLED_CONFIG.exists():
        return INSTALLED_CONFIG.resolve()
    return LOCAL_CONFIG.resolve()


def token_path_for(config_path: Path) -> Path:
    return config_path.parent / "worker-token.dpapi"


def read_worker_id(config_path: Path) -> str:
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    return str(config.get("workerId") or "(missing workerId)")


def read_backend_url(config_path: Path) -> str:
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    return str(config.get("backendBaseUrl") or "(missing backendBaseUrl)")


def read_clipboard() -> str:
    """Read clipboard text without requiring the user to run a PowerShell command."""
    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command", "Get-Clipboard -Raw"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return ""
    return result.stdout.strip() if result.returncode == 0 else ""


def run_enrollment(config_path: Path, token_file: Path) -> None:
    print("TheNextTrade local worker setup")
    print(f"Worker config: {config_path}")
    print(f"Worker ID: {read_worker_id(config_path)}")
    print(f"Backend URL: {read_backend_url(config_path)}")
    print(f"Worker package: {WORKER} (v{WORKER_VERSION})")
    print("The enrollment token is requested once and is stored with Windows DPAPI.")
    print("Copy the token from Admin > MT5 > Enrollment Tokens, then press Enter.")
    print("You can also paste it manually at the prompt; input is intentionally visible for verification.")
    token = input("Paste enrollment token (Enter = use clipboard): ").strip().strip('"').strip("'")
    if not token:
        token = read_clipboard().strip().strip('"').strip("'")
        if token:
            print("Token loaded from clipboard.")
    if not token:
        raise RuntimeError("Enrollment token cannot be empty.")
    print(f"Token received (verify before sending, {len(token)} characters): {token}")
    confirmation = input("Use this token? [Y/n]: ").strip().lower()
    if confirmation not in ("", "y", "yes"):
        raise RuntimeError("Enrollment cancelled.")

    environment = os.environ.copy()
    environment["GSN_ENROLLMENT_TOKEN"] = token
    result = subprocess.run(
        [sys.executable, str(WORKER), "--config", str(config_path), "--enroll"],
        cwd=ROOT,
        env=environment,
        check=False,
    )
    environment.pop("GSN_ENROLLMENT_TOKEN", None)
    token = ""
    if result.returncode != 0:
        raise RuntimeError(
            f"Worker enrollment failed with exit code {result.returncode}. "
            "Generate a fresh token for this Worker ID and retry with --re-enroll."
        )
    print(f"Enrollment completed. Encrypted worker token saved to: {token_file}")
    print("The enrollment token will not be requested again on this Windows user.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Enroll and start the local GSN worker")
    parser.add_argument("--re-enroll", action="store_true", help="Replace the saved worker token")
    parser.add_argument("--config", type=str, help="Worker config path; defaults to the installed or local config")
    args = parser.parse_args()

    config_path = resolve_config_path(args.config)
    token_file = token_path_for(config_path)
    if not WORKER.exists():
        raise RuntimeError(f"Worker file not found: {WORKER}")
    if not config_path.exists():
        raise RuntimeError(f"Worker config not found: {config_path}")
    if args.re_enroll and token_file.exists():
        token_file.unlink()
    if not token_file.exists():
        run_enrollment(config_path, token_file)

    print("Starting worker. Press Ctrl+C to stop it.")
    return subprocess.call([sys.executable, str(WORKER), "--config", str(config_path)], cwd=ROOT)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nWorker stopped.")
        raise SystemExit(0)
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
