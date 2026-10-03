#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Seeding Sentinel Fusion with Operation Northstar (SF-2026-001) ==="
cd "$ROOT_DIR/backend"
PYTHONPATH=. "$ROOT_DIR/backend/venv/bin/python" app/seed.py
echo "=== Seed completed successfully! ==="
