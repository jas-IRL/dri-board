#!/usr/bin/env bash
set -euo pipefail

# DRI Board Bridge Mode launcher (no secrets stored on disk)

# NOTE: This script runs until you stop it (Ctrl+C).
# If you're using an API key you pasted into chat previously, rotate it after testing.

# - Ensures venv exists
# - Installs requirements
# - Prompts for Anthropic key at runtime

cd "$(dirname "$0")"

PYTHON_BIN="python3"

if [[ ! -d .venv ]]; then
  echo "[setup] creating venv in server/.venv"
  "$PYTHON_BIN" -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

echo "[setup] installing requirements"
pip -q install -r requirements.txt

echo ""
echo "[info] LLM/Claude recommendations are currently disabled in this build."
echo "[info] Start the backend anyway to use Bridge Mode (SQLite) endpoints."
echo ""

echo "[run] starting backend on http://localhost:5055"
exec "$PYTHON_BIN" src/app.py
