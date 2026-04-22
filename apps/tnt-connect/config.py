"""
TheNextTrade Connect — Configuration Manager
Stores and loads app settings from config.json
"""

import json
import os
import sys

CONFIG_FILENAME = "config.json"
LOCK_FILENAME = "app.lock"

DEFAULT_CONFIG = {
    "api_key": "",
    "api_base_url": "https://thenexttrade.com",
    "mt5_path": "",            # Auto-detected or user-specified
    "sync_interval": 10,       # seconds
    "heartbeat_interval": 60,  # seconds
    "auto_start": False,
    "minimize_to_tray": True,
    "log_level": "INFO",
    "window_width": 800,
    "window_height": 720,
}


def get_config_dir() -> str:
    """Get config directory: %APPDATA%/TNTConnect"""
    if sys.platform == "win32":
        base = os.environ.get("APPDATA", os.path.expanduser("~"))
    else:
        base = os.path.expanduser("~")
    config_dir = os.path.join(base, "TNTConnect")
    os.makedirs(config_dir, exist_ok=True)
    return config_dir


def get_config_path() -> str:
    return os.path.join(get_config_dir(), CONFIG_FILENAME)


def get_lock_path() -> str:
    return os.path.join(get_config_dir(), LOCK_FILENAME)


def load_config() -> dict:
    """Load config from file, merging with defaults."""
    config = DEFAULT_CONFIG.copy()
    path = get_config_path()
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                config.update(saved)
        except (json.JSONDecodeError, IOError):
            pass
    return config


def save_config(config: dict):
    """Save config to file."""
    path = get_config_path()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def get_log_path() -> str:
    return os.path.join(get_config_dir(), "tnt-connect.log")


def acquire_lock() -> bool:
    """Try to acquire app lock. Returns True if successful."""
    lock_path = get_lock_path()
    try:
        if os.path.exists(lock_path):
            # Check if PID is still running
            with open(lock_path, "r") as f:
                pid = int(f.read().strip())
            try:
                os.kill(pid, 0)  # Check if process exists
                return False  # Another instance is running
            except OSError:
                pass  # Process dead, stale lock

        with open(lock_path, "w") as f:
            f.write(str(os.getpid()))
        return True
    except Exception:
        return True  # On error, allow running


def release_lock():
    """Release app lock."""
    try:
        lock_path = get_lock_path()
        if os.path.exists(lock_path):
            os.remove(lock_path)
    except Exception:
        pass
