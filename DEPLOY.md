# Deploying the Foldable Tractatus

Two independent pieces: a static frontend (Vercel) and an optional tiny backend
(Val Town free plan) for the encrypted "Save notes to link" feature. The app is
fully functional without the backend — the sync row simply doesn't appear.

## 1. Frontend → Vercel

1. In Vercel: **Add New → Project → Import** this GitLab repository
   (`gitlab.com/REDACTED/foldable-tractatus`). Grant Vercel access to
   GitLab if asked.
2. Vercel auto-detects Vite. Defaults are correct:
   - Build command: `npm run build`
   - Output directory: `dist`
3. (After step 2 below) add the environment variable
   `VITE_SYNC_ENDPOINT = https://<your-val>.web.val.run` and redeploy.
   Skip this to ship without cloud sync.

No `vercel.json` is needed — the app is a single page with query-string state,
so there are no client-side routes to rewrite.

## 2. Backend → Val Town (free plan)

The backend stores only opaque, client-encrypted ciphertext. It needs no
secrets, so a public val is fine (free plan vals are public).

1. Sign in at [val.town](https://www.val.town) and create a new val, e.g.
   `tractatus-notes`.
2. Add the three files from this repo's `backend/` directory, verbatim:
   - `core.ts` — plain module (no trigger)
   - `notes-store.ts` — set trigger type to **HTTP**
   - `cleanup-cron.ts` — set trigger type to **Cron**, schedule daily
     (e.g. `0 4 * * *`; free-plan minimum interval is 15 min, daily is plenty)
3. Copy the HTTP file's endpoint URL (like `https://xxx-tractatus-notes.web.val.run`)
   and set it as `VITE_SYNC_ENDPOINT` in Vercel (and in a local `.env` for dev).
4. Verify: `curl -X POST <endpoint>/bundles -d '{"iv":"AAAAAAAAAAAAAAAA","data":"AAAA"}'`
   should return `201 {"id":"..."}`, and a GET of `<endpoint>/bundles/<id>`
   should return the same `{iv, data}`.

Free-plan fit: val-scoped SQLite (10 MB) holds thousands of 64 KiB-capped
bundles; the 90-day TTL plus the daily cron keeps it self-cleaning; per-IP
write rate-limiting (5/hour) guards the write path; 100k runs/day is far above
expected traffic. Val Town's default permissive CORS is used as-is.

## Local development

```sh
npm install
npm run dev        # app at localhost:5173
npm test           # 77 tests: derivation, matching, URL codec, crypto, backend
npm run build      # typecheck + production bundle in dist/
```

Optional `.env` (gitignored): `VITE_SYNC_ENDPOINT=https://xxx.web.val.run`

The backend tests run the real SQL against an in-memory libsql database — no
Val Town account needed for development.
