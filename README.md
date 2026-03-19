# DRI Board (Prototype)

Operational readiness command center UI prototype based on your prompt.

## What this is
- A single-page HTML/CSS/JS dashboard with **11 panels** (Mission Control, Workstreams, Comms Queue, etc.)
- Uses **synthetic mock data** (`js/data.js`) to demonstrate interactions
- Includes **snooze (Not Relevant)** behavior stored in `localStorage`

## What this is not (yet)
- Not wired to Jira/Glean/Snowflake
- No real AI generation. Buttons simulate artifact generation and Jira write-back

## Run locally
Option A: open directly
- Double-click `index.html`

Option B: run a local server (recommended)
```bash
cd dri-board
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project structure
- `index.html` - shell + panel containers
- `css/styles.css` - core theme and components
- `css/panels.css` - panel-specific layout
- `js/data.js` - mock data + helpers
- `js/app.js` - navigation, snoozing, global search
- `js/panels.js` - renderers for each panel

## Bridge mode (no Jira yet)
If Jira is not ready, you can still make parts of the board "real" now using the optional backend.

What becomes real immediately:
- **Worldview** panel pulls live external items via RSS aggregation
- Optional stub endpoints for **Intake**, **Decision Log**, and **Brag Board** so you can persist entries outside the browser

### Run backend
```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/app.py
# backend at http://localhost:5055
```

### Run frontend (locally, so http->http works)
Because GitHub Pages is https, it cannot call an http backend (mixed-content blocked).
Run the UI locally:
```bash
cd dri-board
python3 -m http.server 8000
# open http://localhost:8000
```

### Point the UI at the backend
In your browser console:
```js
localStorage.setItem('DRI_API_BASE', 'http://localhost:5055')
location.reload()
```

## Jira integration (later)
When your Jira project is ready, replace stub state with Jira-backed endpoints:
- initiatives, lifecycle, checklists, artifacts, RAPID, write-back
