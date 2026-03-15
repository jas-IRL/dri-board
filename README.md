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

## Next step
If you share a GitHub repo URL (or confirm you want me to create one with `gh`), I will push this project to GitHub.
