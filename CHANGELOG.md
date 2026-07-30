# Changelog

This project follows [Semantic Versioning](https://semver.org). The public
surface it versions is the reader itself and, in particular, the **share-link
format**: the query string produced by `src/model/urlState.ts` is a published
format, so a link saved today has to keep opening the same view in every later
1.x release.

## 1.0.0 - 2026-07-30

First tagged release. The reader has been live at
<https://foldabletractatus.aethermug.com> for some time; this marks the point at
which the share-link format and the annotation storage are treated as stable.

### The reader

- The complete 526-statement Ogden (1922) text, held as the tree that
  Wittgenstein's decimal numbering describes, with his own in-text
  cross-references and a hand-curated index of the book's technical vocabulary.
- Folding and unfolding by level, with fold-all and unfold-all.
- Pinning: pinned statements and their ancestors read in full while their
  siblings collapse into merged peek ranges that reopen on click. Every row's
  state is derived from the pin set plus a sparse override map rather than
  stored.
- Term tracing over the curated index and over free search, with occurrence
  counts on folded-away statements and one-click conversion of matches into
  pins.
- Margin annotations, saved as you type, kept in `localStorage`, and excluded
  from every URL.
- Saved threads: a local library of up to five named pin sets.
- In-app undo and redo across the whole history, leaving the browser's Back
  button alone.
- Markdown export and a print-formatted PDF route, both carrying pinned
  statements with their lineage plus all annotations.
- Keyboard navigation throughout, with a single-key shortcut kill switch
  (WCAG 2.1.4), and light and dark themes.

### Sharing and storage

- View state round-trips through the query string: `?p=` pins, `?e=` overrides,
  `?t=` term, `?path=` reading path, `?statement=N` for a single statement.
  Unknown ids and malformed parts are dropped rather than rejected, so links
  stay tolerant of future changes.
- Optional encrypted sync (`VITE_SYNC_ENDPOINT`): notes are encrypted in the
  browser with AES-GCM-256 and the key travels only in the URL fragment, so the
  host stores ciphertext it cannot read. The backend under `backend/` runs on
  Val Town, with a 64 KiB cap, a per-IP write limit and a 90-day TTL.

### Build and deployment

- Static build with Vite; a build-only prerender plugin bakes the full text into
  `dist/index.html` and emits `sitemap.xml` so the book is crawlable without
  JavaScript.
- Self-hosted, subset fonts committed to the repository, so the build needs no
  network.
- Optional self-hosted Plausible analytics, off unless a deployment sets both
  `VITE_PLAUSIBLE_DOMAIN` and `VITE_PLAUSIBLE_SRC`. No reader-authored text is
  ever sent and every property is a bounded label; see
  [`docs/analytics.md`](docs/analytics.md).
