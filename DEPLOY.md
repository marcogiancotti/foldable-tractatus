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
