#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Starting Sentinel Fusion Frontend on http://localhost:3000 ==="
cd "$ROOT_DIR/frontend"
npm run dev
