#!/usr/bin/env python3
"""Gmail Draft → DRI Board Sentiment importer (Bridge Mode)

Goal
----
Pull the daily sentiment JSON payload from Gmail *Drafts* labeled `DRI_SENTIMENTS`,
POST it to the local Bridge backend (/api/sentiment/import), then mark the draft
as imported.

This script is intentionally local-first and conservative:
- No secrets are committed to git
- OAuth tokens are stored locally (server/.secrets/)
- If Google libs aren't installed yet, we print install instructions

Setup (one-time)
---------------
1) Create a Google Cloud project
2) Enable Gmail API
3) Create OAuth Client ID (Desktop)
4) Download the JSON and save it as:
     server/.secrets/gmail_credentials.json

Install deps (in server venv)
-----------------------------
  cd server
  source .venv/bin/activate
  pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

Run
---
Single pass:
  python3 server/tools/gmail_draft_sentiment_importer.py --once

Continuous polling:
  python3 server/tools/gmail_draft_sentiment_importer.py --poll-seconds 300

Defaults
--------
- Backend: http://localhost:5055
- Read label: DRI_SENTIMENTS
- Imported label: DRI_IMPORTED (created if missing)

"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional, Tuple


READ_LABEL = "DRI_SENTIMENTS"
IMPORTED_LABEL = "DRI_IMPORTED"
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def _iso_now() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _extract_first_json_object(text: str) -> Optional[str]:
    """Extract first {...} JSON object from an email/draft body.

    Handles leading/trailing text and nested braces.
    Tracks string literals + escapes to avoid premature brace matching.
    """
    if not text:
        return None

    start = text.find("{")
    if start < 0:
        return None

    depth = 0
    in_str = False
    esc = False

    for i in range(start, len(text)):
        ch = text[i]

        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue

        if ch == '"':
            in_str = True
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    return None


def _http_post_json(url: str, payload: Dict[str, Any], timeout: int = 20) -> Tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.getcode(), resp.read().decode("utf-8", errors="replace")


def _b64url_decode(data: str) -> bytes:
    # Gmail uses base64url without padding
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _safe_int(x: Any, default: int = 0) -> int:
    try:
        return int(x)
    except Exception:
        return default


@dataclass
class Config:
    backend_base: str
    read_label: str
    imported_label: str
    creds_path: str
    token_path: str
    poll_seconds: int
    once: bool
    dry_run: bool
    verbose: bool


def _load_google() -> Tuple[Any, Any, Any]:
    """Import Google libs lazily so core repo doesn't require them."""
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build

        return Request, Credentials, InstalledAppFlow, build
    except Exception as e:
        print("\n[error] Missing Google libraries for Gmail API.")
        print("Install them in your server venv:")
        print(
            "  pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib\n"
        )
        print("Original import error:")
        print(f"  {e}\n")
        raise


def get_gmail_service(cfg: Config):
    Request, Credentials, InstalledAppFlow, build = _load_google()

    os.makedirs(os.path.dirname(cfg.token_path), exist_ok=True)

    creds = None
    if os.path.exists(cfg.token_path):
        creds = Credentials.from_authorized_user_file(cfg.token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(cfg.creds_path):
                raise FileNotFoundError(
                    f"Gmail OAuth credentials not found at {cfg.creds_path}. "
                    "Download OAuth client JSON and place it there."
                )
            flow = InstalledAppFlow.from_client_secrets_file(cfg.creds_path, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(cfg.token_path, "w") as f:
            f.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def _get_or_create_label_id(service, label_name: str) -> str:
    labels = service.users().labels().list(userId="me").execute().get("labels", [])
    for lab in labels:
        if lab.get("name") == label_name:
            return lab.get("id")

    created = (
        service.users()
        .labels()
        .create(
            userId="me",
            body={
                "name": label_name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show",
                "type": "user",
            },
        )
        .execute()
    )
    return created["id"]


def _list_draft_ids(service, label_name: str, max_results: int = 50):
    # Drafts.list supports q but not labelIds; we use q=label:NAME
    # This is simplest + stable.
    q = f"label:{label_name}"
    resp = service.users().drafts().list(userId="me", q=q, maxResults=max_results).execute()
    return [d["id"] for d in resp.get("drafts", [])]


def _get_draft_text(service, draft_id: str) -> str:
    draft = service.users().drafts().get(userId="me", id=draft_id, format="full").execute()
    msg = draft.get("message", {})
    payload = msg.get("payload", {})

    def walk(part) -> Optional[str]:
        body = (part.get("body") or {})
        data = body.get("data")
        if data:
            try:
                return _b64url_decode(data).decode("utf-8", errors="replace")
            except Exception:
                return None
        for p in part.get("parts", []) or []:
            got = walk(p)
            if got:
                return got
        return None

    txt = walk(payload) or ""
    return txt


def _mark_imported(service, draft_id: str, imported_label_id: str):
    # Drafts don't support modify; we modify the underlying message.
    draft = service.users().drafts().get(userId="me", id=draft_id, format="minimal").execute()
    msg_id = (draft.get("message") or {}).get("id")
    if not msg_id:
        raise RuntimeError("Could not resolve message id for draft")

    service.users().messages().modify(
        userId="me",
        id=msg_id,
        body={
            "addLabelIds": [imported_label_id],
            # We intentionally do NOT remove DRI_SENTIMENTS by default.
            # You can use Gmail rules later if desired.
        },
    ).execute()


def process_once(cfg: Config) -> int:
    service = get_gmail_service(cfg)

    # Ensure imported label exists
    imported_label_id = _get_or_create_label_id(service, cfg.imported_label)

    draft_ids = _list_draft_ids(service, cfg.read_label)
    if cfg.verbose:
        print(f"[{_iso_now()}] Found {len(draft_ids)} drafts with label:{cfg.read_label}")

    imported = 0

    for did in draft_ids:
        text = _get_draft_text(service, did)
        json_str = _extract_first_json_object(text)
        if not json_str:
            if cfg.verbose:
                print(f"[{_iso_now()}] draft={did}: no JSON found, skipping")
            continue

        try:
            payload = json.loads(json_str)
        except Exception as e:
            print(f"[{_iso_now()}] draft={did}: JSON parse failed: {e}")
            continue

        if cfg.dry_run:
            print(f"[{_iso_now()}] DRY RUN: would POST report_date={payload.get('report_date')} (draft={did})")
            imported += 1
            continue

        # Retry POST a few times (backend might be booting)
        url = cfg.backend_base.rstrip("/") + "/api/sentiment/import"
        ok = False
        last_err = None
        for attempt in range(1, 4):
            try:
                code, body = _http_post_json(url, payload)
                if 200 <= code < 300:
                    ok = True
                    if cfg.verbose:
                        print(f"[{_iso_now()}] Imported draft={did} -> backend ({code}) {body[:160]}")
                    break
                else:
                    last_err = RuntimeError(f"HTTP {code}: {body[:200]}")
            except Exception as e:
                last_err = e
            time.sleep(10)

        if not ok:
            print(f"[{_iso_now()}] draft={did}: import failed after retries: {last_err}")
            continue

        try:
            _mark_imported(service, did, imported_label_id)
        except Exception as e:
            print(f"[{_iso_now()}] draft={did}: imported but failed to label as imported: {e}")

        imported += 1

    return imported


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", default=os.environ.get("DRI_BACKEND", "http://localhost:5055"))
    ap.add_argument("--read-label", default=os.environ.get("DRI_SENTIMENT_LABEL", READ_LABEL))
    ap.add_argument("--imported-label", default=os.environ.get("DRI_IMPORTED_LABEL", IMPORTED_LABEL))
    ap.add_argument("--poll-seconds", type=int, default=_safe_int(os.environ.get("DRI_POLL_SECONDS"), 300))
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verbose", action="store_true")

    args = ap.parse_args()

    secrets_dir = os.path.join(os.path.dirname(__file__), "..", ".secrets")
    secrets_dir = os.path.abspath(secrets_dir)

    cfg = Config(
        backend_base=args.backend,
        read_label=args.read_label,
        imported_label=args.imported_label,
        creds_path=os.path.join(secrets_dir, "gmail_credentials.json"),
        token_path=os.path.join(secrets_dir, "gmail_token.json"),
        poll_seconds=args.poll_seconds,
        once=args.once,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )

    if cfg.once:
        n = process_once(cfg)
        print(f"[{_iso_now()}] Imported {n} drafts")
        return

    while True:
        try:
            n = process_once(cfg)
            if cfg.verbose:
                print(f"[{_iso_now()}] cycle imported={n}; sleeping {cfg.poll_seconds}s")
        except KeyboardInterrupt:
            print("\nbye")
            return
        except Exception as e:
            print(f"[{_iso_now()}] cycle error: {e}")

        time.sleep(cfg.poll_seconds)


if __name__ == "__main__":
    main()
