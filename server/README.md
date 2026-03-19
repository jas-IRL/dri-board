# DRI Board Backend (Bridge Mode)
## Claude Opus recommendations (optional)

If your environment approves Claude (Anthropic), you can enable playbook-anchored recommendations locally.

### Set env vars
```bash
export ANTHROPIC_API_KEY='YOUR_KEY_HERE'
export ANTHROPIC_MODEL='claude-3-opus-20240229'  # or your approved Opus model
```

### Call endpoint
```bash
curl -s http://localhost:5055/api/recommendations \
  -H 'Content-Type: application/json' \
  -d '{"text":"Describe the change...","p_level":"P1","mode":"Launch Readiness"}' | jq
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
