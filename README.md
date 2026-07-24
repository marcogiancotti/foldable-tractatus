# The Foldable Tractatus

An interactive reader for Wittgenstein's *Tractatus Logico-Philosophicus*
(Ogden 1922 translation). The book's decimal numbering **is** a tree — this app
lets you read it as one: fold and unfold branches, pin the statements that
matter, trace technical terms through the whole text, keep notes in the margin,
and share any view as a link.

Full functional spec: [`docs/foldable-tractatus-spec.md`](docs/foldable-tractatus-spec.md).

## Features

- **Foldable tree** — seven root propositions, controlled disclosure one level
  at a time; fold all / unfold all.
- **Focused reading** — pins drive a *derived* view: pinned lineages read in
  full while their siblings stay present-but-quiet as merged "peek" ranges.
- **Curated terms + search** — indexed words are clickable in the text; free
  search behaves identically; hidden occurrences show as count badges;
  "Pin only these" / "Add to pins".
- **Margin annotations** — plain text, autosaved, private, persisted locally,
  never in any link.
- **Cross-references** — interactive `(cf. N)` previews with in-place cards.
- **Undo/redo** — full in-app history; pin-replacing actions are single
  undoable steps with an immediate undo toast. Browser Back is never hijacked.
- **Sharing** — the exact view (pins, folds, term, reading path) lives in the
  URL; `?statement=N` deep-links a single statement.
- **Export** — Markdown study export and a print-formatted PDF route, both
  containing pinned statements with lineage plus all annotations.
- **Optional encrypted sync** — save notes under a private link; content is
  AES-GCM-encrypted in the browser and the key travels only in the link
  fragment. The host (a Val Town val) stores unreadable ciphertext.
- **Keyboard-first** — arrows/`j`/`k`, fold keys, `P`, `Enter`, `/`, `?`; see
  the in-app Reader guide.
- Light & dark themes (same design, ink and paper swapped).

## Status

The app ships the complete 526-statement Ogden text, Wittgenstein's in-text
cross-references, and a hand-curated index of the technical vocabulary used to
build the book's framework.

## Development

```sh
npm install
npm run dev      # Vite dev server
npm test         # vitest: derivation, matching, URL codec, crypto, backend
npm run build    # typecheck + production build
```

## Layout

- `src/model/` — pure logic: the focused-view derivation (the heart of the
  app), tree index, prefix matcher, URL codec, history.
- `src/state/` — reducer store (undo/redo, toasts), localStorage persistence.
- `src/components/` — reading column, statement rows, peek ranges, control
  panel, notes, overlays.
- `backend/` — the Val Town val for encrypted bundles + its test suite (runs
  locally against in-memory libsql).
- `docs/` — the functional spec.

Deployment (Vercel + Val Town free plan): see [`DEPLOY.md`](DEPLOY.md).

The Ogden translation is in the public domain.
