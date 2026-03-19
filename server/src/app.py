import os
import time
from datetime import datetime

import feedparser
import requests
from cachetools import TTLCache
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# -----------------------------
# In-memory stub state
# -----------------------------
# This is NOT the long-term SOT. It's a bridge until Jira is ready.
# Use this to operationalize the UI flows (Intake, Decision Log, Wins, Snooze rules)
# without requiring Jira write-back.

STATE = {
    "intake_items": [],
    "decisions": [],
    "wins": [],
    "snoozed": {
        "recs": set(),
        "comms": set(),
        "worldview": set(),
    },
}

# -----------------------------
# Worldview: RSS aggregation
# -----------------------------
RSS_SOURCES = [
    {
        "name": "CFPB Press Releases",
        "type": "Regulatory",
        "url": "https://www.consumerfinance.gov/about-us/newsroom/feed/",
    },
    {
        "name": "Federal Register - Consumer Protection",
        "type": "Regulatory",
        "url": "https://www.federalregister.gov/agencies/consumer-financial-protection-bureau.rss",
    },
    {
        "name": "The Verge - Fintech",
        "type": "Trends",
        "url": "https://www.theverge.com/rss/index.xml",
    },
]

worldview_cache = TTLCache(maxsize=10, ttl=60 * 15)  # 15 min


def _iso_now():
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _normalize_worldview_entry(entry, source):
    title = entry.get("title", "")
    link = entry.get("link", "")
    published = entry.get("published", entry.get("updated", ""))
    summary = entry.get("summary", "")

    # Keep summaries short and safe
    if summary:
        summary = summary.replace("\n", " ").strip()
        if len(summary) > 360:
            summary = summary[:357] + "..."

    return {
        "id": f"{source['name']}::{link or title}",
        "type": source["type"],
        "source": source["name"],
        "title": title,
        "url": link,
        "published": published,
        "summary": summary,
        "relevance": None,
        "soWhat": None,
    }


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "ts": _iso_now()})


@app.get("/api/worldview")
def worldview():
    # cache key can include types later
    key = "default"
    if key in worldview_cache:
        return jsonify({"items": worldview_cache[key], "cached": True, "ts": _iso_now()})

    items = []
    for src in RSS_SOURCES:
        try:
            parsed = feedparser.parse(src["url"])
            for e in parsed.entries[:10]:
                items.append(_normalize_worldview_entry(e, src))
        except Exception:
            continue

    # sort by published where possible
    worldview_cache[key] = items
    return jsonify({"items": items, "cached": False, "ts": _iso_now()})


# -----------------------------
# Stub endpoints for non-Jira ops
# -----------------------------

@app.get("/api/stub/state")
def stub_state():
    # do not leak snooze sets directly as sets
    return jsonify(
        {
            "intake_items": STATE["intake_items"],
            "decisions": STATE["decisions"],
            "wins": STATE["wins"],
            "snoozed": {k: sorted(list(v)) for k, v in STATE["snoozed"].items()},
            "ts": _iso_now(),
        }
    )


@app.post("/api/stub/intake")
def stub_intake():
    payload = request.get_json(force=True, silent=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400

    item = {
        "id": f"INTAKE-{int(time.time())}",
        "created_at": _iso_now(),
        "text": text,
        "status": "New",
        "triage": payload.get("triage"),
    }
    STATE["intake_items"].insert(0, item)
    return jsonify({"ok": True, "item": item})


@app.post("/api/stub/decision")
def stub_decision():
    payload = request.get_json(force=True, silent=True) or {}
    title = (payload.get("title") or "").strip()
    details = (payload.get("details") or "").strip()
    dtype = (payload.get("type") or "all").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400

    item = {
        "id": f"DEC-{int(time.time())}",
        "created_at": _iso_now(),
        "type": dtype,
        "title": title,
        "details": details,
        "initiative_id": payload.get("initiative_id"),
    }
    STATE["decisions"].insert(0, item)
    return jsonify({"ok": True, "item": item})


@app.post("/api/stub/win")
def stub_win():
    payload = request.get_json(force=True, silent=True) or {}
    title = (payload.get("title") or "").strip()
    desc = (payload.get("desc") or "").strip()
    comp = (payload.get("comp") or "").strip()

    if not title or not desc:
        return jsonify({"error": "title and desc are required"}), 400

    item = {
        "id": f"WIN-{int(time.time())}",
        "created_at": _iso_now(),
        "title": title,
        "desc": desc,
        "comp": comp,
        "evidence": payload.get("evidence"),
        "initiative_id": payload.get("initiative_id"),
    }
    STATE["wins"].insert(0, item)
    return jsonify({"ok": True, "item": item})


@app.post("/api/stub/snooze")
def stub_snooze():
    payload = request.get_json(force=True, silent=True) or {}
    kind = payload.get("kind")
    item_id = payload.get("id")
    if kind not in STATE["snoozed"]:
        return jsonify({"error": "invalid kind"}), 400
    if not item_id:
        return jsonify({"error": "id required"}), 400

    STATE["snoozed"][kind].add(item_id)
    return jsonify({"ok": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5055"))
    app.run(host="0.0.0.0", port=port, debug=True)
