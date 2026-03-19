import os
import time
import uuid
from datetime import datetime

import feedparser
from cachetools import TTLCache
from flask import Flask, jsonify, request
from flask_cors import CORS

from db import db_conn, migrate

app = Flask(__name__)
CORS(app)

# Initialize SQLite
migrate()

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
# Bridge Mode API (local only)
# -----------------------------

READINESS_ELEMENTS = [
    "Knowledge (Content)",
    "Training (L&D)",
    "Tooling",
    "Quality",
    "Workforce",
    "Vendor Management / BPO",
    "Operations",
    "Communications (Content)",
    "Operational Readiness",
    "Compliance / Regulatory",
    "Data / Measurement",
]


def _now():
    return _iso_now()


def _init_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


@app.get("/api/initiatives")
def list_initiatives():
    lifecycle = request.args.get("lifecycle")
    with db_conn() as conn:
        if lifecycle:
            rows = conn.execute(
                "SELECT * FROM initiatives WHERE lifecycle = ? ORDER BY deadline IS NULL, deadline ASC, updated_at DESC",
                (lifecycle,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM initiatives ORDER BY CASE lifecycle WHEN 'Active' THEN 0 WHEN 'In Measurement' THEN 1 WHEN 'Paused' THEN 2 ELSE 3 END, deadline IS NULL, deadline ASC, updated_at DESC"
            ).fetchall()

        initiatives = [dict(r) for r in rows]
        for i in initiatives:
            elements = conn.execute(
                "SELECT * FROM readiness_elements WHERE initiative_id = ? ORDER BY due_date IS NULL, due_date ASC, id ASC",
                (i["id"],),
            ).fetchall()
            el = [dict(e) for e in elements]
            i["readiness_elements"] = el
            # progress
            if el:
                done = len([x for x in el if x.get("status") == "Complete"])
                i["progress"] = round((done / len(el)) * 100)
            else:
                i["progress"] = 0

        return jsonify({"items": initiatives, "ts": _iso_now()})


@app.post("/api/initiatives")
def create_initiative():
    payload = request.get_json(force=True, silent=True) or {}
    title = (payload.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    p_level = payload.get("p_level") or "P2"
    if p_level not in ("P0", "P1", "P2", "P3"):
        return jsonify({"error": "p_level must be P0/P1/P2/P3"}), 400

    lifecycle = payload.get("lifecycle") or "Active"
    if lifecycle not in ("Active", "In Measurement", "Closed", "Paused"):
        return jsonify({"error": "invalid lifecycle"}), 400

    now = _now()
    iid = _init_id("INIT")

    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO initiatives (
              id, jira_key, title, description, p_level, readiness_mode,
              overall_readiness_status, readiness_decision, risk_summary, success_criteria,
              owner, executive_sponsor, deadline, lifecycle,
              channel, lob, impacted,
              rapid_recommend, rapid_agree, rapid_perform, rapid_input, rapid_decide,
              created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                iid,
                payload.get("jira_key"),
                title,
                payload.get("description"),
                p_level,
                payload.get("readiness_mode"),
                payload.get("overall_readiness_status") or "Not Started",
                payload.get("readiness_decision"),
                payload.get("risk_summary"),
                payload.get("success_criteria"),
                payload.get("owner"),
                payload.get("executive_sponsor"),
                payload.get("deadline"),
                lifecycle,
                payload.get("channel"),
                payload.get("lob"),
                payload.get("impacted"),
                payload.get("rapid_recommend"),
                payload.get("rapid_agree"),
                payload.get("rapid_perform"),
                payload.get("rapid_input"),
                payload.get("rapid_decide"),
                now,
                now,
            ),
        )

        # Optionally seed readiness elements
        if payload.get("seed_elements"):
            for el in READINESS_ELEMENTS:
                conn.execute(
                    """
                    INSERT INTO readiness_elements (
                      initiative_id, readiness_element, functional_dri,
                      what_needs_to_happen, dependencies, risk_if_not_completed,
                      linked_partner_ticket, due_date, status,
                      created_at, updated_at
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
                    """,
                    (
                        iid,
                        el,
                        None,
                        None,
                        None,
                        None,
                        None,
                        payload.get("deadline"),
                        "Not Started",
                        now,
                        now,
                    ),
                )

    return jsonify({"ok": True, "id": iid})


@app.patch("/api/initiatives/<initiative_id>")
def update_initiative(initiative_id: str):
    payload = request.get_json(force=True, silent=True) or {}

    # Allow a controlled set of updatable fields
    allowed = {
        "jira_key",
        "title",
        "description",
        "p_level",
        "readiness_mode",
        "overall_readiness_status",
        "readiness_decision",
        "risk_summary",
        "success_criteria",
        "owner",
        "executive_sponsor",
        "deadline",
        "lifecycle",
        "channel",
        "lob",
        "impacted",
        "rapid_recommend",
        "rapid_agree",
        "rapid_perform",
        "rapid_input",
        "rapid_decide",
    }

    fields = {k: v for k, v in payload.items() if k in allowed}
    if not fields:
        return jsonify({"error": "no supported fields"}), 400

    if "p_level" in fields and fields["p_level"] not in ("P0", "P1", "P2", "P3"):
        return jsonify({"error": "p_level must be P0/P1/P2/P3"}), 400

    if "lifecycle" in fields and fields["lifecycle"] not in ("Active", "In Measurement", "Closed", "Paused"):
        return jsonify({"error": "invalid lifecycle"}), 400

    fields["updated_at"] = _now()

    sets = ", ".join([f"{k} = ?" for k in fields.keys()])
    vals = list(fields.values()) + [initiative_id]

    with db_conn() as conn:
        cur = conn.execute(f"UPDATE initiatives SET {sets} WHERE id = ?", vals)
        if cur.rowcount == 0:
            return jsonify({"error": "not found"}), 404

    return jsonify({"ok": True})


@app.patch("/api/readiness-elements/<int:element_id>")
def update_readiness_element(element_id: int):
    payload = request.get_json(force=True, silent=True) or {}

    allowed = {
        "functional_dri",
        "what_needs_to_happen",
        "dependencies",
        "risk_if_not_completed",
        "linked_partner_ticket",
        "due_date",
        "status",
    }

    fields = {k: v for k, v in payload.items() if k in allowed}
    if not fields:
        return jsonify({"error": "no supported fields"}), 400

    if "status" in fields and fields["status"] not in ("Not Started", "In Progress", "Complete", "Blocked", "N/A"):
        return jsonify({"error": "invalid status"}), 400

    fields["updated_at"] = _now()

    sets = ", ".join([f"{k} = ?" for k in fields.keys()])
    vals = list(fields.values()) + [element_id]

    with db_conn() as conn:
        cur = conn.execute(f"UPDATE readiness_elements SET {sets} WHERE id = ?", vals)
        if cur.rowcount == 0:
            return jsonify({"error": "not found"}), 404

    return jsonify({"ok": True})


@app.get("/api/decisions")
def list_decisions():
    with db_conn() as conn:
        rows = conn.execute("SELECT * FROM decisions ORDER BY decided_at IS NULL, decided_at DESC, created_at DESC").fetchall()
        return jsonify({"items": [dict(r) for r in rows]})


@app.post("/api/decisions")
def create_decision():
    payload = request.get_json(force=True, silent=True) or {}
    title = (payload.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    did = _init_id("DEC")
    now = _now()
    decided_at = payload.get("decided_at") or now

    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO decisions (
              id, initiative_id, decision_type, title, details,
              tenet_alignment, expected_outcome, actual_outcome,
              decided_at, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?)
            """,
            (
                did,
                payload.get("initiative_id"),
                payload.get("decision_type"),
                title,
                payload.get("details"),
                payload.get("tenet_alignment"),
                payload.get("expected_outcome"),
                payload.get("actual_outcome"),
                decided_at,
                now,
            ),
        )

    return jsonify({"ok": True, "id": did})


@app.get("/api/wins")
def list_wins():
    with db_conn() as conn:
        rows = conn.execute("SELECT * FROM wins ORDER BY occurred_at IS NULL, occurred_at DESC, created_at DESC").fetchall()
        return jsonify({"items": [dict(r) for r in rows]})


@app.post("/api/wins")
def create_win():
    payload = request.get_json(force=True, silent=True) or {}
    title = (payload.get("title") or "").strip()
    desc = (payload.get("desc") or "").strip()
    if not title or not desc:
        return jsonify({"error": "title and desc are required"}), 400

    wid = _init_id("WIN")
    now = _now()

    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO wins (
              id, initiative_id, title, desc, competency, evidence, occurred_at, created_at
            ) VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                wid,
                payload.get("initiative_id"),
                title,
                desc,
                payload.get("competency"),
                payload.get("evidence"),
                payload.get("occurred_at") or now,
                now,
            ),
        )

    return jsonify({"ok": True, "id": wid})


@app.post("/api/snoozes")
def create_snooze():
    payload = request.get_json(force=True, silent=True) or {}
    kind = payload.get("kind")
    item_id = payload.get("item_id")
    if not kind or not item_id:
        return jsonify({"error": "kind and item_id required"}), 400

    now = _now()
    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO snoozes (kind, item_id, snoozed_at, until, reason)
            VALUES (?,?,?,?,?)
            ON CONFLICT(kind, item_id) DO UPDATE SET snoozed_at=excluded.snoozed_at, until=excluded.until, reason=excluded.reason
            """,
            (
                kind,
                item_id,
                now,
                payload.get("until"),
                payload.get("reason"),
            ),
        )

    return jsonify({"ok": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5055"))
    app.run(host="0.0.0.0", port=port, debug=True)
