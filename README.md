# DRI Board (Demo)

Operational Readiness command center UI scaffold inspired by the prompt.

## What this is
- A **static HTML/CSS/JS single-page app** with 11 panels:
  1. Mission Control
  2. Workstreams
  3. Comms Queue
  4. Collaborator Sentiment
  5. Worldview
  6. AI Recommender
  7. Intake / Triage
  8. Gap Analysis
  9. QBR Engine
  10. Brag Board / Impact Journal
  11. Decision Log

## What this is not
- Not connected to Jira, Slack, Glean, Snowflake.
- Uses **mock/demo data only**.

## Run locally
From the repo root:

```bash
python3 -m http.server 8080
```

Open:
- http://localhost:8080

## Replace demo data
Edit:
- `js/data.js`

## Next step: real integrations
Typical approach:
- Replace `js/data.js` with calls to your backend.
- Add Jira/Slack/Glean/Snowflake connectors server-side.
- Keep this UI as the command center.
