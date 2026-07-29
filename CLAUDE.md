# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive reader for Wittgenstein's *Tractatus Logico-Philosophicus* (Ogden
1922 translation). The book's decimal numbering **is** a tree, and the app reads
it as one: fold/unfold branches, pin statements to drive a focused view, trace
terms, keep local margin notes, and share any view as a link. The authoritative
functional spec is [`docs/foldable-tractatus-spec.md`](docs/foldable-tractatus-spec.md);
section references (§N) throughout the code point at it — consult it before
changing view/derivation behavior.

## Commands

```sh
npm run dev            # Vite dev server at localhost:5173
npm test               # vitest run — all suites once
npm run test:watch     # vitest in watch mode
npm run build          # tsc --noEmit typecheck THEN vite build → dist/
npx vitest run src/model/focusedView.test.ts   # single suite
npx vitest run -t "peek"                        # tests matching a name
```

There is no separate lint step; type-checking is `tsc --noEmit` (run via `npm
run build`, strict mode with `noUnusedLocals`/`noUnusedParameters`). Backend
tests run in the same `npm test` invocation against an in-memory libsql.

## Architecture

Two independent pieces: a static React frontend and an optional tiny backend.
The app is fully functional without the backend.

### Frontend — derived-view SPA (no router)

All application state lives in three places, and this separation matters:

- **The tree** (`src/model/tree.ts`) is fixed, built once at module load by
  walking `src/data/tractatus.ts`. `STATEMENTS`, `byId`, `ROOT_IDS`,
  `statement`, `ancestorsOf`.
- **View state** is a *pin set* plus a *sparse* `expandOverrides` map. Nothing
  else describes what's on screen.
- **The focused-view derivation** (`src/model/focusedView.ts`) — the heart of
  the app. Every statement's display state (Full / Collapsed / Peek / Hidden) is
  **derived** from `(tree, pins, overrides)`. Peeks are computed, never stored.
  Override semantics are subtle (presence of an override promotes a peek to a
  real row; `true` = expanded, `false` = shown-but-folded); read the header
  comment before touching it. `normalizeOverrides` drops any override that
  doesn't change what renders — always route override edits through the exported
  helpers (`setRowExpansion`, `promotePeeks`, `revealStatement`, etc.) so this
  invariant holds.

`src/state/store.tsx` is a `useReducer` store exposed via `useStore()`.
Undo/redo is **snapshot-based**: each undoable action pushes an immutable
`{pins, overrides, activePath, notes}` snapshot. Note that the **active term is
view state but NOT in history** (selecting a term isn't an "action"), and
consecutive edits to the same note coalesce into one undo step via `noteEditing`.
Pin-replacing actions carry an undo toast. Add new mutations as reducer actions
wrapped in `withHistory`, not by mutating state elsewhere.

Persistence boundaries are deliberate:
- **Annotations** persist to `localStorage` (`src/state/persistence.ts`) and are
  **never** placed in any URL or share link.
- **View state** round-trips through the URL query string
  (`src/model/urlState.ts`): `?p=` pins, `?e=` overrides, `?t=` term, `?path=`
  reading path; `?statement=N` deep-links/isolates one statement. Unknown ids
  and malformed parts are silently dropped on decode. This codec is the share
  format — keep it compact, bounded, and backward-tolerant.
- **Saved threads** (`src/state/threads.ts`) are a local library of named
  pin-sets (max 5), separate from both history and the share link.

`src/App.tsx` composes it all (keyboard nav, cross-ref navigation with
reveal→scroll→flash, sync UI, export, print route). Components under
`src/components/` are presentational over the derived `DisplayItem[]`.

### Backend — encrypted bundle store (Val Town)

Lives in `backend/`, deployed as a Val Town val (live at
`https://tractatus-notes.val.run`). Powers only the opt-in "save notes to a
link" feature.

- `core.ts` is **platform-agnostic**: the SQLite client is **injected**
  (`SqliteClient` interface) so the exact same code runs on Val Town's
  `std/sqlite` in production and `@libsql/client` `:memory:` in tests. Keep
  platform specifics out of `core.ts`.
- The host only ever sees **opaque ciphertext**. Clients encrypt in the browser
  (`src/lib/sync/crypto.ts`, AES-GCM-256 via WebCrypto) and the decryption key
  travels **only in the URL fragment**, never in a request. Abuse posture:
  22-char random ids, 64 KiB bundle cap, per-IP write rate limit (5/hr), 90-day
  TTL (lazy-expire on read + `cleanup-cron.ts` daily), strict `{iv, data}`-only
  validation.
- `notes-store.ts` / `cleanup-cron.ts` are the thin Val Town HTTP and Cron
  triggers wiring `core.ts` to `std/sqlite`.

Sync is gated on `VITE_SYNC_ENDPOINT`; unset, the sync UI simply doesn't appear.

### Analytics — optional, off by default

`src/lib/analytics.ts` (transport + label derivation) and
`src/lib/useAnalytics.ts` (state-derived milestones) inject a self-hosted
Plausible script **only** when both `VITE_PLAUSIBLE_DOMAIN` and
`VITE_PLAUSIBLE_SRC` are set at build time. Two invariants are load-bearing and
tested: nothing reader-authored is ever sent (annotations aren't read; free
search collapses to `(free search)`; thread names never travel), and every
property is a bounded label (counts/depths become milestones). Milestones fire
at most once per page load. Event catalogue and rationale:
[`docs/analytics.md`](docs/analytics.md).

## Data status

The statement tree ships the complete **526-statement Ogden text**,
Wittgenstein's in-text cross-references, and a hand-curated technical-term
index. The frozen 25-statement tree under `src/model/__fixtures__/` remains only
as stable test data.

## Deployment

Frontend → Vercel (auto-detected Vite, output `dist/`); backend → Val Town free
plan. Full runbook in [`DEPLOY.md`](DEPLOY.md).
