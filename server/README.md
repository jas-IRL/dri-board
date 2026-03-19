# DRI Board Backend (Bridge Mode)
## Claude Opus recommendations (optional)

Claude is only called from the backend (your API key never goes to the browser).

### Easiest way (recommended): run script that prompts for the key
```bash
cd server
chmod +x run_local.sh
./run_local.sh
```

It will:
- create/activate `server/.venv`
- install requirements
- **prompt you for `ANTHROPIC_API_KEY` at runtime** (not saved on disk)

### Manual way: set env vars
```bash
export ANTHROPIC_API_KEY='YOUR_KEY_HERE'
export ANTHROPIC_MODEL='claude-3-opus-20240229'
python src/app.py
```

### Call endpoint
```bash
curl -s http://localhost:5055/api/recommendations \
  -H 'Content-Type: application/json' \
  -d '{"text":"Describe the change...","p_level":"P1","mode":"Launch Readiness"}'
```

This returns JSON recommendations per your playbook readiness elements.

---



This backend exists to make the dashboard "real" before Jira integration is ready.

It provides:
- `/api/worldview` RSS aggregation (real external data)
- `/api/stub/*` endpoints for Intake/Decision/Wins while Jira is not the SOT yet

## Setup
```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python src/app.py
# backend at http://localhost:5055
```

## Endpoints
- `GET /api/health`
- `GET /api/worldview`
- `GET /api/stub/state`
- `POST /api/stub/intake`
- `POST /api/stub/decision`
- `POST /api/stub/win`
- `POST /api/stub/snooze`

## Notes
This is intentionally a bridge. When Jira is ready, replace the stub endpoints with Jira-backed equivalents.
