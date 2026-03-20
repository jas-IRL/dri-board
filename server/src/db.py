import os
import sqlite3
from contextlib import contextmanager

DEFAULT_DB_PATH = os.environ.get("DRI_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "dri.db"))


def _ensure_dir(path: str):
    d = os.path.dirname(os.path.abspath(path))
    os.makedirs(d, exist_ok=True)


def get_db_path() -> str:
    return DEFAULT_DB_PATH


@contextmanager
def db_conn():
    path = get_db_path()
    _ensure_dir(path)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    # Better defaults
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def migrate():
    with db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS initiatives (
              id TEXT PRIMARY KEY,
              jira_key TEXT,
              title TEXT NOT NULL,
              description TEXT,
              p_level TEXT NOT NULL CHECK (p_level IN ('P0','P1','P2','P3')),
              readiness_mode TEXT,
              overall_readiness_status TEXT,
              readiness_decision TEXT,
              risk_summary TEXT,
              success_criteria TEXT,
              owner TEXT,
              executive_sponsor TEXT,
              deadline TEXT,
              lifecycle TEXT NOT NULL CHECK (lifecycle IN ('Active','In Measurement','Closed','Paused')),

              -- bridge fields that will map to Jira custom fields later
              channel TEXT,
              lob TEXT,
              impacted TEXT,
              rapid_recommend TEXT,
              rapid_agree TEXT,
              rapid_perform TEXT,
              rapid_input TEXT,
              rapid_decide TEXT,

              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            """
        )

        # Collaborator sentiment (manual/imported). This is local-first and does not
        # depend on Slack integration.
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sentiment_reports (
              report_date TEXT PRIMARY KEY,
              current_week_window TEXT,
              rolling_90d_window TEXT,
              payload_json TEXT NOT NULL,
              created_at TEXT NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS collaborators (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              team TEXT,
              created_at TEXT NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sentiment_checkins (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              collaborator_id TEXT NOT NULL,
              report_date TEXT NOT NULL,
              window_start TEXT,
              window_end TEXT,
              responsiveness REAL,
              engagement_depth REAL,
              proactivity REAL,
              reliability REAL,
              tone_alignment REAL,
              composite REAL,
              state TEXT,
              notes TEXT,
              context TEXT,
              rolling_90d_json TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) ON DELETE CASCADE,
              FOREIGN KEY (report_date) REFERENCES sentiment_reports(report_date) ON DELETE CASCADE
            )
            """
        )

        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_checkins_report_date ON sentiment_checkins(report_date)
            """
        )

        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_checkins_collaborator ON sentiment_checkins(collaborator_id)
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS readiness_elements (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              initiative_id TEXT NOT NULL,
              readiness_element TEXT NOT NULL,
              functional_dri TEXT,
              what_needs_to_happen TEXT,
              dependencies TEXT,
              risk_if_not_completed TEXT,
              linked_partner_ticket TEXT,
              due_date TEXT,
              status TEXT NOT NULL CHECK (status IN ('Not Started','In Progress','Complete','Blocked','N/A')),
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS artifacts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              initiative_id TEXT,
              type TEXT,
              title TEXT,
              url TEXT,
              content TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS decisions (
              id TEXT PRIMARY KEY,
              initiative_id TEXT,
              decision_type TEXT,
              title TEXT NOT NULL,
              details TEXT,
              tenet_alignment TEXT,
              expected_outcome TEXT,
              actual_outcome TEXT,
              decided_at TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE SET NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS wins (
              id TEXT PRIMARY KEY,
              initiative_id TEXT,
              title TEXT NOT NULL,
              desc TEXT NOT NULL,
              competency TEXT,
              evidence TEXT,
              occurred_at TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE SET NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS snoozes (
              kind TEXT NOT NULL,
              item_id TEXT NOT NULL,
              snoozed_at TEXT NOT NULL,
              until TEXT,
              reason TEXT,
              PRIMARY KEY (kind, item_id)
            )
            """
        )

        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_initiatives_lifecycle ON initiatives(lifecycle)
            """
        )

        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_elements_initiative ON readiness_elements(initiative_id)
            """
        )
