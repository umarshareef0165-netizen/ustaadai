# UstaadAI v2 — Deploy Checklist (Vultr Compute + Vercel)

Target: live backend on Vultr + live frontend on Vercel before **Sat Nov 14, 2026, 9:30 PM PT**
(submissions close 10:30 PM PT on Vultr Community).

## (a) Claim the $200 Vultr credit

1. Open the claim form: https://binary.so/JEFuZzv (the user is filling this in).
2. When the gift code arrives, go to the Vultr dashboard → **Billing → Gift Code** and redeem it.
3. Confirm the $200 credit shows on the account before creating the instance.

## (b) Create the instance

1. Vultr dashboard → **Products → Cloud Compute**.
2. Location: **Los Angeles**.
3. OS: **Ubuntu 24.04**.
4. Plan: **vc2-1c-1gb — $5/mo** (1 vCPU / 1 GB RAM / 25 GB SSD / 1 TB transfer, IPv4).
   This is the cheapest real plan — about **$0.25 for the weekend**.
5. Hostname: `ustaadai`.
6. Deploy, then note the instance's **IPv4 address** — you will need it in every step below.

> ⚠️ **Billing warning:** Vultr keeps charging for STOPPED instances.
> Destroy the instance after the event unless the user approves $5/mo to keep it running.

## (c) First-time server setup

```bash
ssh root@<IP>
bash infra/vultr-setup.sh
```

This installs Node.js 24.x, nginx, git, sqlite3, ufw, creates user `ustaad`,
prepares `/opt/ustaadai`, and enables nginx.
(If the file is not on the server yet, copy it up first with `scp`.)

## (d) Deploy the app

As user `ustaad`:

```bash
ssh ustaad@<IP>
git clone <public repo URL> /opt/ustaadai
cd /opt/ustaadai
```

Create the server-only env file `api/.env` (NEVER committed to git):

```
PORT=3001
MODE=deterministic
# GEMINI_API_KEY=...   # only if MODE=gemini
```

Install the systemd unit and nginx config (as root / with sudo):

```bash
sudo cp infra/ustaad-api.service /etc/systemd/system/ustaad-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now ustaad-api

sudo cp infra/nginx-ustaadai.conf /etc/nginx/sites-available/ustaadai
sudo ln -s /etc/nginx/sites-available/ustaadai /etc/nginx/sites-enabled/ustaadai
sudo nginx -t
sudo systemctl reload nginx
```

For later deploys, just run (as `ustaad`):

```bash
cd /opt/ustaadai && bash infra/deploy.sh
```

## (e) Verify the backend

```bash
curl http://<IP>/health
```

Expect something like:

```json
{"ok":true,"mode":"deterministic","chapters":4}
```

Smoke-test the tutor endpoint — physics numerical, expect non-empty citations
plus a follow-up question:

```bash
curl -s -X POST http://<IP>/api/tutor/chat \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"smoke","message":"A car starts from rest, accelerates at 2 m/s^2 for 5 s. Find final velocity and distance."}'
```

Pass = HTTP 200, an answer with `vf = 10 m/s` and `S = 25 m`,
citations non-empty, and a follow-up question present.

## (f) Deploy the frontend (Vercel)

1. Vercel → import the repo.
2. **Root Directory: `web`** (see `vercel.json`).
3. Environment variable: `NEXT_PUBLIC_API_URL=http://<IP>` (the Vultr IPv4 from step b).
4. Deploy and note the Vercel URL.

## (g) Health-check pass criteria (before recording the demo video)

- [ ] `GET http://<IP>/health` returns `{"ok":true,...}` with `chapters: 4`.
- [ ] Tutor physics numerical returns vf = 10 m/s, S = 25 m, citations non-empty, follow-up present.
- [ ] Off-syllabus question (e.g. chemistry) is politely refused/redirected, not answered.
- [ ] Quiz start returns 5 questions; submit returns a score + revision plan.
- [ ] Progress endpoint returns mastery data for a session.
- [ ] Frontend loads on its Vercel URL and talks to the Vultr backend (no localhost calls).
- [ ] No Vercel Deployment Protection login wall on the public demo URL.

Only record the demo video once every box above is ticked, against the LIVE
Vultr/Vercel URLs (see `docs/DEMO-SCRIPT.md`).

## (h) After the event

- Keep the instance running through Demo Day.
- Then, **with the user's approval**, destroy the instance — but first download
  `api/data.db` from the server: it holds the progress/Reach evidence.
- If the user approves $5/mo, the instance can stay up instead.
