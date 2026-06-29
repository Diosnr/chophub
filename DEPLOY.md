# Deploying ChopHub to Render

ChopHub is a Blueprint-ready monorepo. Render reads `render.yaml` from this repo and provisions both services automatically.

The full deploy is 5 manual clicks + filling in 5 secret values. Everything else is automated.

---

## Prerequisites — accounts you'll need

| Service | Why | Cost |
|---|---|---|
| GitHub | Code is already there | Free |
| Render | Hosts backend + frontend | Free tier OK (services sleep after 15 min idle on free tier) |
| MongoDB Atlas | Database | Free tier (512 MB, plenty for MVP) |
| Monnify | Payment gateway | Free sandbox account, then live account |

---

## Step 1 — MongoDB Atlas (5 min)

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free M0 cluster (any region; `aws / Frankfurt / eu-central-1` is fine)
3. **Database Access** → Add user with read/write on `chophub` db
4. **Network Access** → Add IP `0.0.0.0/0` (Render's IP range is dynamic)
5. **Database** → Get connection string, looks like:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/chophub?retryWrites=true&w=majority
   ```
   Save this — it's `MONGO_URI` for Render.

---

## Step 2 — Monnify (10 min for sandbox)

1. Sign up at https://app.monnify.com (use sandbox first)
2. **Settings → API Keys** → copy your API key + secret
3. **Settings → Contracts** → get your contract code
4. **Settings → Webhooks** → set a webhook secret (any random string), save it for later wiring
5. You'll fill in 4 values on Render:
   - `MONNIFY_API_KEY`
   - `MONNIFY_SECRET_KEY`
   - `MONNIFY_CONTRACT_CODE`
   - `MONNIFY_WEBHOOK_SECRET`

> Don't have Monnify yet? You can still deploy — set the env vars to dummy strings and the app will boot; payments will return `503 monnify_not_configured` until you wire real keys.

---

## Step 3 — Render Blueprint (2 min)

1. Sign up at https://render.com (free)
2. Dashboard → **New +** → **Blueprint**
3. Connect your GitHub account, select the `Diosnr/chophub` repo
4. Render reads `render.yaml` and shows two services:
   - `chophub-api` — Node web service (Express)
   - `chophub-web` — Static site (built with Vite)
5. Click **Apply**

---

## Step 4 — Set environment variables (3 min)

Render opens each service's env vars page. For **both** services, set:

| Var | Value |
|---|---|
| `MONGO_URI` | from Step 1 |
| `MONNIFY_API_KEY` | from Step 2 |
| `MONNIFY_SECRET_KEY` | from Step 2 |
| `MONNIFY_CONTRACT_CODE` | from Step 2 |
| `MONNIFY_WEBHOOK_SECRET` | from Step 2 |
| `WEB_URL` | `https://chophub-web.onrender.com` (or your custom domain) |

> Render auto-generates `JWT_SECRET` if you leave it blank — but for production set it to a random 32+ char string.

For the API service, also set:
| Var | Value |
|---|---|
| `WEB_URL` | the public URL of your frontend service |

Save → Render triggers a deploy.

---

## Step 5 — Wire the Monnify webhook (2 min)

Once deployed:
1. Render gives you a public URL like `https://chophub-api.onrender.com`
2. In Monnify dashboard → **Settings → Webhooks** → add endpoint:
   ```
   https://chophub-api.onrender.com/api/payments/monnify/webhook
   ```
3. Toggle on: `Successful transactions`, `Failed transactions`
4. Use your `MONNIFY_WEBHOOK_SECRET` from Step 2 as the shared secret Monnify signs with.

Add a second webhook for wallet topups:
   ```
   https://chophub-api.onrender.com/api/wallet/topup/webhook
   ```

---

## Step 6 — Verify

```
curl https://chophub-api.onrender.com/api/health
```
Expect `{ "status": "ok", "db": "connected" }`.

Open `https://chophub-web.onrender.com` — landing page loads, `API status: ok` in the footer.

---

## Optional — custom domain

In Render → your static site → **Custom Domains** → add `chophub.com` (or whatever you own) → update DNS as instructed.

---

## Phase 2 — Android .aab (Capacitor wrap)

When the web MVP is live and you want to ship to Google Play:

1. Install Android Studio locally (Android SDK + JDK 17 + Gradle)
2. From `apps/web/`, run:
   ```
   bunx cap add android
   bunx cap sync
   cd android && ./gradlew bundleRelease
   ```
3. Output: `apps/web/android/app/build/outputs/bundle/release/app-release.aab`
4. Upload to Google Play Console

Capacitor config lives at `apps/web/capacitor.config.ts` and is wired into the build. Full instructions in `CAPACITOR.md` (Phase 2 doc, written when you start Android work).

---

## Troubleshooting

**API healthcheck shows `db: disconnected`** — `MONGO_URI` is wrong or Atlas network access is not set to `0.0.0.0/0`.

**Frontend shows "API status: offline"** — `VITE_API_URL` is not set on the static site. Update `render.yaml` or set it in the Render dashboard.

**Monnify webhook returns 401** — `MONNIFY_WEBHOOK_SECRET` doesn't match what Monnify signs with. Re-check both.

**Free tier sleeps** — Render's free web service sleeps after 15 min idle. First request takes ~30 s. Upgrade to `Starter` ($7/mo) for always-on.