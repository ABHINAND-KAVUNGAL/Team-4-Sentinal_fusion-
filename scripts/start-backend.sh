#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Starting Sentinel Fusion Backend on http://localhost:8000 ==="
cd "$ROOT_DIR/backend"
PYTHONPATH=. "$ROOT_DIR/backend/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload
