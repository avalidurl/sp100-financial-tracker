import os
import hashlib
import base64
import json
from datetime import datetime, timezone
from typing import Optional

import requests
from flask import Flask, request, jsonify


app = Flask(__name__)


REPO_FULL_NAME = (
    f"{os.environ.get('GITHUB_OWNER', '').strip()}/" \
    f"{os.environ.get('GITHUB_REPO_NAME', '').strip()}"
)
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")


def _get_github_headers() -> dict:
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN not configured")
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    }


def _get_file_sha(path: str, branch: str = "master") -> Optional[str]:
    url = f"https://api.github.com/repos/{REPO_FULL_NAME}/contents/{path}?ref={branch}"
    r = requests.get(url, headers=_get_github_headers(), timeout=30)
    if r.status_code == 200:
        data = r.json()
        return data.get("sha")
    return None


def _put_file(path: str, content_bytes: bytes, message: str, branch: str = "master") -> dict:
    existing_sha = _get_file_sha(path, branch)
    payload = {
        "message": message,
        "content": base64.b64encode(content_bytes).decode("utf-8"),
        "branch": branch,
    }
    if existing_sha:
        payload["sha"] = existing_sha
    url = f"https://api.github.com/repos/{REPO_FULL_NAME}/contents/{path}"
    r = requests.put(url, headers=_get_github_headers(), data=json.dumps(payload), timeout=60)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"GitHub write failed: {r.status_code} {r.text}")
    return r.json()


def _write_json_if_changed(path: str, data: dict | list, branch: str = "master") -> Optional[dict]:
    new_bytes = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    # Compare via SHA of bytes against current file (when present)
    current_sha = _get_file_sha(path, branch)
    if current_sha is None:
        return _put_file(path, new_bytes, message=f"Create {path}", branch=branch)

    # Fetch current file for content comparison
    url = f"https://raw.githubusercontent.com/{REPO_FULL_NAME}/{branch}/{path}"
    r = requests.get(url, timeout=30)
    if r.status_code == 200:
        if r.content == new_bytes:
            return None
    return _put_file(path, new_bytes, message=f"Update {path} {datetime.now(timezone.utc).isoformat()}", branch=branch)


def _require_bearer_auth() -> None:
    token = os.environ.get("WORKER_TOKEN", "")
    if not token:
        return
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer ") or auth_header.split(" ", 1)[1] != token:
        raise RuntimeError("Unauthorized")


@app.post("/update-data")
def update_data():
    _require_bearer_auth()

    # TODO: Replace with real data fetch
    result = {
        "last_run": datetime.now(timezone.utc).isoformat(),
        "status": "ok",
        "type": "quarterly",
    }
    _write_json_if_changed("public/data/last_updated.json", {"quarterly": result["last_run"]})
    return jsonify(result)


@app.post("/update-market-caps")
def update_market_caps():
    _require_bearer_auth()

    # TODO: Replace with real market cap update
    result = {
        "last_run": datetime.now(timezone.utc).isoformat(),
        "status": "ok",
        "type": "market_caps",
    }
    _write_json_if_changed("public/data/last_updated.json", {"market_caps": result["last_run"]})
    return jsonify(result)


@app.post("/update-news")
def update_news():
    _require_bearer_auth()

    # TODO: Replace with real news/filings update
    result = {
        "last_run": datetime.now(timezone.utc).isoformat(),
        "status": "ok",
        "type": "news",
    }
    _write_json_if_changed("data/last_updated.json", {"news": result["last_run"]})
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))


