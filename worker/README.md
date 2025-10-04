# Python Worker (Flask)

This worker receives HTTP calls from Vercel Cron (via `/api/cron/*`) and updates files in this GitHub repo using the GitHub Contents API.

## Endpoints
- `POST /update-data`
- `POST /update-market-caps`
- `POST /update-news`

Protect endpoints with `WORKER_TOKEN` (Bearer token). If unset, no auth is enforced.

## Environment Variables
- `GITHUB_OWNER` (e.g. `avalidurl`)
- `GITHUB_REPO_NAME` (e.g. `sp500-capex`)
- `GITHUB_TOKEN` (fine-grained PAT with `contents:write`)
- `WORKER_TOKEN` (shared secret for Vercel forwarders)
- Any API keys your logic needs: `FMP_API_KEY`, `RSS2JSON_API_KEY`, etc.

## Run locally
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export GITHUB_OWNER=avalidurl
export GITHUB_REPO_NAME=sp500-capex
export GITHUB_TOKEN=ghp_xxx
export WORKER_TOKEN=some-shared-secret
python app.py
```

## Deploy options
- PythonAnywhere, Render, Railway, Fly.io, or a small VPS with systemd/nginx.

## Wiring with Vercel
1. In Vercel Project Settings → Environment Variables:
   - `WORKER_BASE_URL` → public URL of this worker
   - `WORKER_TOKEN` → same as above
2. Vercel Cron triggers `/api/cron/*` at schedules in `vercel.json`.
3. Those routes forward to this worker.

## Implement your data logic
Replace the placeholder writes in `app.py` with your real logic (fetch, transform, and write JSON under `public/data/` or `data/`). The helper `_write_json_if_changed` commits only when content changes.
