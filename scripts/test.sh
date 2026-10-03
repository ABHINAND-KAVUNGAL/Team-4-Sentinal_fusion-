#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Running Sentinel Fusion Backend Test Suite ==="
cd "$ROOT_DIR/backend"
PYTHONPATH=. "$ROOT_DIR/backend/venv/bin/pytest" -v
echo "=== Tests completed successfully! ==="
