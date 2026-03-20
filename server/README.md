# DRI Board Backend (Bridge Mode)
## Claude Opus recommendations (deferred)

LLM-backed recommendations are intentionally disabled for now.

Next step (later): you’ll provide a small library of example outputs/actions, and we’ll re-enable a recommendations endpoint that produces *your* style of specific, playbook-anchored actions.

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
