from __future__ import annotations

import json
import os
import secrets
import getpass
import subprocess
from pathlib import Path

from cryptography.fernet import Fernet


ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get("GSN_LOCAL_DATA_DIR", ROOT / "data"))
SECRETS_FILE = DATA / "local-secrets.json"


def load_or_create_secrets() -> dict[str, str]:
    DATA.mkdir(parents=True, exist_ok=True)
    if SECRETS_FILE.exists():
        return json.loads(SECRETS_FILE.read_text(encoding="utf-8"))
    values = {
        "user_token": secrets.token_urlsafe(32),
        "admin_token": secrets.token_urlsafe(32),
        "fernet_key": Fernet.generate_key().decode("ascii"),
    }
    SECRETS_FILE.write_text(json.dumps(values, indent=2), encoding="utf-8")
    return values


def restrict_data_acl() -> None:
    if os.name != "nt":
        return
    user = getpass.getuser()
    command = [
        "icacls",
        str(DATA),
        "/inheritance:r",
        "/grant:r",
        f"{user}:(OI)(CI)F",
        "*S-1-5-18:(OI)(CI)F",
        "*S-1-5-32-544:(OI)(CI)F",
        "/T",
        "/C",
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        print("WARNING: Could not restrict local API data ACL; review permissions manually.")


if __name__ == "__main__":
    values = load_or_create_secrets()
    restrict_data_acl()
    os.environ["GSN_LOCAL_DATA_DIR"] = str(DATA)
    os.environ["GSN_LOCAL_USER_TOKEN"] = values["user_token"]
    os.environ["GSN_LOCAL_ADMIN_TOKEN"] = values["admin_token"]
    os.environ["GSN_LOCAL_FERNET_KEY"] = values["fernet_key"]
    print(f"Local secrets: {SECRETS_FILE}")
    print("API docs: http://127.0.0.1:8765/docs")
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8765, reload=False, app_dir=str(ROOT))
