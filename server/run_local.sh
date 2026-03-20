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
echo "Claude Opus recommendations are optional."
echo "If you want them enabled, paste your Anthropic API key when prompted."
echo "(The key is NOT saved to disk; it's only used for this process.)"
echo ""

read -r -p "Enable Claude recommendations? (y/N): " ENABLE
ENABLE=${ENABLE:-N}

if [[ "$ENABLE" =~ ^[Yy]$ ]]; then
  read -r -s -p "Anthropic API key: " ANTHROPIC_API_KEY
  echo ""
  export ANTHROPIC_API_KEY
  export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-3-opus-20240229}"
  echo "[ok] Claude enabled with model: $ANTHROPIC_MODEL"
else
  echo "[ok] Claude disabled (no ANTHROPIC_API_KEY set)"
fi

echo ""
echo "[run] starting backend on http://localhost:5055"
exec "$PYTHON_BIN" src/app.py
