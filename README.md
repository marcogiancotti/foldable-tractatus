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

Requires the Node version in `.nvmrc`. There is no separate lint step —
type-checking is `tsc --noEmit`, run as part of `npm run build`.

Everything above works with no configuration. The only environment variable,
`VITE_SYNC_ENDPOINT`, is optional and enables the encrypted-sync feature
against a backend you deploy yourself; copy `.env.example` to `.env` to set it.
Left unset, the sync UI is absent and nothing else changes.

## Layout

- `src/model/` — pure logic: the focused-view derivation (the heart of the
  app), tree index, prefix matcher, URL codec, history.
- `src/state/` — reducer store (undo/redo, toasts), localStorage persistence.
- `src/components/` — reading column, statement rows, peek ranges, control
  panel, notes, overlays.
- `backend/` — the Val Town val for encrypted bundles + its test suite (runs
  locally against in-memory libsql).
- `docs/` — the functional spec.

Deployment (any static host, plus optionally a Val Town val): see
[`DEPLOY.md`](DEPLOY.md).

## Contributing

Issues and pull requests are welcome — please read
[`CONTRIBUTING.md`](CONTRIBUTING.md) first. It covers the branching and PR
rules, and the handful of non-obvious invariants (the statement data is
generated, the focused view is derived, share links are a published format)
that are easy to break by accident.

## Privacy

The app is client-side. Notes live in your browser's `localStorage` and are
never placed in a share link. The optional sync feature encrypts a bundle in
the browser (AES-GCM-256) before upload and keeps the decryption key in the URL
*fragment*, which browsers never send to a server — so the host stores
ciphertext it cannot read.

A deployment may optionally enable self-hosted, cookieless
[Plausible](https://plausible.io) analytics. There is no visitor identifier, no
cross-site tracking, and nothing you write ever leaves your browser: notes are
not read by it at all, and free-text search is counted as `(free search)` rather
than as what you typed. What it does count is aggregate — did anyone pin
anything, did anyone open the guide — and the full list is
[`docs/analytics.md`](docs/analytics.md). Do-Not-Track and Global Privacy
Control are honoured, so the script is not loaded for readers who send either.
The build here ships with it **off**; it requires explicit configuration.

## License

Code: [MIT](LICENSE) © Marco Giancotti.

The C. K. Ogden (1922) English translation of the *Tractatus* is in the public
domain. The curated term index, the reading paths, and the spec in `docs/` are
original work under the same MIT license.
