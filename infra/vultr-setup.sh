#!/usr/bin/env bash
# UstaadAI v2 — Vultr Compute first-time setup
# Run ONCE as root on a fresh Ubuntu 24.04 instance:
#   ssh root@<IP>
#   bash infra/vultr-setup.sh
# (Or copy the file to the server first and run it there.)
# After this script: clone the repo as user `ustaad`, then follow
# infra/DEPLOY-CHECKLIST.md.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating packages..."
apt-get update
apt-get upgrade -y

echo "==> Installing base packages..."
apt-get install -y ca-certificates curl gnupg git nginx sqlite3 ufw

echo "==> Installing Node.js 24.x (NodeSource)..."
# Node 20 is NOT enough: node:sqlite needs Node 22+.
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

echo "==> Verifying Node..."
node --version
npm --version

echo "==> Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Creating user 'ustaad' (if missing)..."
if ! id -u ustaad >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" ustaad
  usermod -aG sudo ustaad
fi

echo "==> Preparing /opt/ustaadai..."
mkdir -p /opt/ustaadai
chown ustaad:ustaad /opt/ustaadai

echo "==> Enabling nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "SETUP DONE."
echo "Next steps:"
echo "  1. Log in as ustaad:  ssh ustaad@<IP>"
echo "  2. Clone the public repo into /opt/ustaadai"
echo "  3. Follow infra/DEPLOY-CHECKLIST.md (steps d-g)."
