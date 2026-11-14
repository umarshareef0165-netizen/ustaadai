#!/usr/bin/env bash
# UstaadAI v2 — deploy script, run as user `ustaad` on the Vultr instance.
# Run on every deploy:
#   ssh ustaad@<IP>
#   cd /opt/ustaadai && bash infra/deploy.sh
#
# NOTE: .env lives on the server only (api/.env), NEVER committed:
#   PORT=3001
#   MODE=deterministic   # or: gemini
#   GEMINI_API_KEY=...   # only if MODE=gemini
set -euo pipefail

cd /opt/ustaadai

if [ ! -d .git ]; then
  echo "ERROR: /opt/ustaadai is not a git repo." >&2
  echo "Clone the public repo into /opt/ustaadai first, e.g.:" >&2
  echo "  git clone <public repo URL> /opt/ustaadai" >&2
  exit 1
fi

echo "==> Pulling latest code..."
git pull --ff-only

cd api

echo "==> Installing dependencies..."
npm ci --omit=dev

echo "==> Building..."
npm run build

echo "==> Restarting API service..."
sudo systemctl restart ustaad-api

echo "==> Waiting for the API to come up..."
sleep 3

echo "==> Health check..."
curl -fsS http://127.0.0.1:3001/health
echo ""

echo "DEPLOY DONE."
