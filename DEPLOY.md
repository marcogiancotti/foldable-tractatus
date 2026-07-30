# Deploying the Foldable Tractatus

Two independent pieces: a static frontend and an optional tiny backend for the
encrypted "Share pins & notes" feature. **The app is fully functional without
the backend** — leave `VITE_SYNC_ENDPOINT` unset and the sync row simply
doesn't appear. Deploy section 1 alone unless you want cloud sync.

## 1. Frontend → any static host

The build output is a plain static bundle in `dist/`, so any static host works
(Vercel, Netlify, Cloudflare Pages, GitHub Pages, an S3 bucket, …). On Vercel
the Vite preset is auto-detected and its defaults are correct:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: see `.nvmrc`

No rewrite/redirect rules are needed — the app is a single page whose entire
view state lives in the query string, so there are no client-side routes.

### Deploying without a Git integration

Connecting a host to a Git provider is a convenience, not a requirement.
`.github/workflows/` deploys this project on a Vercel **token** instead:
`deploy.yml` on every push to `main`, `preview.yml` per pull request. Both
address the Vercel project by id, so its domain and dashboard environment
variables need no change.

Three repository secrets are needed. `VERCEL_TOKEN` comes from Vercel's Account
Settings → Tokens; the other two are printed into `.vercel/project.json`
(gitignored) by running `vercel link` once against the existing project:

```
VERCEL_TOKEN  VERCEL_ORG_ID  VERCEL_PROJECT_ID
```

`vercel pull` fetches the project's environment before building, so build-time
variables keep working. If the project also has a Git integration connected,
disconnect it, or every commit deploys twice.

To enable cloud sync, set the environment variable `VITE_SYNC_ENDPOINT` to your
own backend's URL (section 2) and redeploy. It is a **build-time** variable:
changing it requires a rebuild, not just a restart.

## 2. Backend → Val Town (free plan)

The store holds only opaque, client-encrypted ciphertext and needs no secrets
of its own, so a public val is fine — which is what the free plan gives you.

1. Sign in at [val.town](https://www.val.town) and create a val, e.g.
   `tractatus-notes`.
2. Add the three files from this repo's `backend/` directory, verbatim:
   - `core.ts` — plain module (no trigger)
   - `notes-store.ts` — trigger type **HTTP**
   - `cleanup-cron.ts` — trigger type **Cron**, daily (e.g. `0 4 * * *`;
     the free-plan minimum interval is 15 min, so daily is plenty)
3. Copy the HTTP file's endpoint URL (like
   `https://<user>-tractatus-notes.web.val.run`) and set it as
   `VITE_SYNC_ENDPOINT` on your static host — and in a local `.env` for dev.
4. Verify:

   ```sh
   curl -X POST <endpoint>/bundles -d '{"iv":"AAAAAAAAAAAAAAAA","data":"AAAA"}'
   # → 201 {"id":"..."}
   curl <endpoint>/bundles/<id>
   # → 200 {"iv":"...","data":"..."}
   ```

Free-plan fit: val-scoped SQLite (10 MB) holds thousands of 64 KiB-capped
bundles; the 90-day TTL plus the daily cron keeps it self-cleaning; per-IP
write rate-limiting (5/hour) guards the write path; 100k runs/day is far above
expected traffic. Val Town's default permissive CORS is used as-is.

Nothing in `backend/` is Val Town-specific except the two trigger files —
`core.ts` takes its SQLite client by injection, so porting it to another
runtime means writing a small adapter, not touching the logic.

> The author's own deployment lives at `https://tractatus-notes.val.run`. It is
> not a shared service: run your own val rather than pointing a fork at it.

## 3. Analytics → self-hosted Plausible (optional)

Also **build-time** and also entirely optional: set both variables or neither.
With either one missing, no script is loaded and no request is made.

```
VITE_PLAUSIBLE_DOMAIN=<the site name as registered in your Plausible instance>
VITE_PLAUSIBLE_SRC=https://<your-plausible-host>/js/script.js
```

Add the site in your Plausible instance first, then register the custom events
from [`docs/analytics.md`](docs/analytics.md) as goals — unregistered events are
accepted but not shown. That document is also where the event catalogue and the
privacy rules live; read it before adding an event.

Only the standard `script.js` is required. Any CE variant works if you want
extras (`script.outbound-links.js`, etc.) — the custom events in this app are
sent through `window.plausible()` and need no particular variant.

> **First-party proxy (recommended).** Content blockers block requests to hosts
> whose path looks like `/js/script.js` from a known analytics domain, so a
> meaningful slice of readers is invisible. Serving the script and the event
> endpoint from your own origin avoids most of that. On Vercel, add a
> `vercel.json` rewriting a neutral path to your Plausible host and point
> `VITE_PLAUSIBLE_SRC` at the rewritten path:
>
> ```json
> {
>   "rewrites": [
>     { "source": "/stats/js/script.js", "destination": "https://<your-plausible-host>/js/script.js" },
>     { "source": "/stats/api/event", "destination": "https://<your-plausible-host>/api/event" }
>   ]
> }
> ```
>
> Both paths must be proxied: the script is useless without an endpoint to post
> to. Because the endpoint here is not at the location the script would assume,
> name it explicitly with the third, optional variable:
>
> ```
> VITE_PLAUSIBLE_SRC=/stats/js/script.js
> VITE_PLAUSIBLE_API=/stats/api/event
> ```
>
> `VITE_PLAUSIBLE_API` sets the script's `data-api` attribute and is needed only
> in this proxied case. Verify with the browser's network tab: loading the page
> should POST to your own origin and get a `202`.

## Local development

```sh
npm install
npm run dev        # app at localhost:5173
npm test           # derivation, matching, URL codec, crypto, backend, smoke
npm run build      # typecheck + production bundle in dist/
```

Optional `.env` (gitignored — copy `.env.example`):
`VITE_SYNC_ENDPOINT=<your endpoint>`

The backend tests run the real SQL against an in-memory libsql database, so no
Val Town account is needed for development.
