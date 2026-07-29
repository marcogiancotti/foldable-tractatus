# Contributing

Thanks for taking an interest. This is a small, opinionated project with one
maintainer — the notes below exist so your time isn't wasted on a PR that was
never going to land.

## Before you start

For anything beyond a small fix, **open an issue first** and let's agree on the
shape of it. The app has a written functional spec —
[`docs/foldable-tractatus-spec.md`](docs/foldable-tractatus-spec.md) — and it is
authoritative for behavior. Code comments refer to it as `§N`. If a change would
alter what the spec describes, the discussion is about the spec first and the
code second.

Especially welcome: bug fixes, accessibility improvements, browser/device
compatibility, test coverage for the pure logic in `src/model/`, and corrections
to the text or the curated term index.

Likely to be declined: new dependencies (the app deliberately ships React,
KaTeX, and nothing else), anything that puts a reader's annotations into a URL,
and features that add server-side state.

Measurement is a special case. The app supports optional, self-hosted,
cookieless Plausible analytics — off unless a deployment configures it — under
two hard rules: nothing a reader wrote ever leaves the browser, and every
property sent is a bounded label from a published vocabulary. Additions that
respect both are welcome; a third-party tracker, a cookie, a visitor id, or
anything that forwards reader text is not. See
[`docs/analytics.md`](docs/analytics.md).

## Setup

```sh
npm install
npm run dev      # Vite dev server at localhost:5173
npm test         # vitest, all suites once
npm run build    # tsc --noEmit typecheck, then production build
```

Use the Node version in [`.nvmrc`](.nvmrc). No configuration is required: the
only environment variable, `VITE_SYNC_ENDPOINT`, is optional and only enables
the encrypted-sync feature (see [`DEPLOY.md`](DEPLOY.md) and `.env.example`).

There is no separate lint step — type-checking *is* the lint, and it runs in
strict mode with `noUnusedLocals` / `noUnusedParameters`. Run `npm test` and
`npm run build` before you push; CI runs exactly those two commands.

## Branching and pull requests

The project is **trunk-based**. `main` is always releasable and is what gets
deployed; there is no long-lived `develop` branch.

1. Cut a short-lived branch from an up-to-date `main`. Name it
   `type/short-description` using the same types as the commit convention below
   — for example `fix/mobile-gutter` or `feat/term-index`.
2. Keep it focused. One concern per PR; unrelated cleanups belong in their own.
3. Keep it current with `main` — rebase rather than merging `main` into your
   branch, so CI tests what will actually land.
4. Open a PR against `main`. Describe *what changes for the reader*, not just
   what you edited, and say how you verified it.

PRs are **squash-merged**, so the PR title becomes the single commit message on
`main`. That means:

- **The PR title must follow [Conventional Commits](https://www.conventionalcommits.org/):**
  `type(optional-scope): imperative summary`, lowercase, no trailing period.
  Types in use here: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`.
  Good: `fix(mobile): keep the pinned highlight full-bleed`.
- Commits *inside* your branch can be as messy as you like — WIP, fixups,
  whatever. They get squashed away. Don't rewrite history to tidy them up.

`main` is protected: it requires a PR with passing CI, an up-to-date branch, and
maintainer approval for outside contributions. Nothing is pushed to it directly.

## Things that will trip you up

A few parts of this codebase have invariants that aren't obvious from reading a
single file. [`CLAUDE.md`](CLAUDE.md) documents the architecture in full; these
are the ones that most often catch people out.

- **`src/data/tractatus.ts` is generated — do not hand-edit it.** It is the
  output of `scripts/import-tractatus.py`. To correct the text, fix the script
  and regenerate. (Its header comment explains the source and the public-domain
  provenance.)
- **The focused view is derived, never stored.** Every statement's display state
  comes from `(tree, pins, overrides)` in `src/model/focusedView.ts`. Peeks are
  computed. Override semantics are subtle, and `normalizeOverrides` maintains
  the invariant that no override is kept unless it changes what renders — so
  route all override edits through the exported helpers (`setRowExpansion`,
  `promotePeeks`, `revealStatement`, …) rather than building the map yourself.
- **`src/model/urlState.ts` is a published format.** Share links people have
  already sent to each other must keep working. The codec must stay compact,
  bounded, and tolerant of unknown input — malformed parts are dropped
  silently, never thrown on.
- **Annotations never leave the device.** They persist to `localStorage` and are
  excluded from every URL and share link by design. The only exception is the
  opt-in sync feature, which encrypts in the browser before upload.
- **State changes go through the reducer.** New mutations are actions in
  `src/state/store.tsx` wrapped in `withHistory`, not state mutated elsewhere.
- **`backend/core.ts` must stay platform-agnostic.** Its SQLite client is
  injected so the same code runs on Val Town and against in-memory libsql in
  tests. Keep platform specifics in the thin trigger files.
- **Accessibility has a test floor.** `src/styles/tokens.contrast.test.ts` reads
  `tokens.css` and re-derives contrast ratios, so a color tweak that drops below
  the floor fails the suite. Fix the color, not the test.

Tests live next to what they test. Pure logic — the derivation, the matcher, the
URL codec, the crypto, the backend — is expected to come with tests; UI changes
are generally verified by hand plus the existing smoke test.

## Reporting bugs

Include the browser and OS, what you expected, and what happened. For anything
involving a specific view, **a share link is the fastest possible bug report** —
it encodes the exact pins, folds, and term. Annotations are not in it, so you
aren't sharing your notes.

## Security

Please **don't** open a public issue for a security problem. Report it privately
through the repository's **Security** tab → **Report a vulnerability**, which
opens a private advisory only the maintainer can see, and give me a reasonable
window to respond before disclosing.

Of particular interest: anything that could expose a reader's annotations, break
the client-side encryption's guarantees, or let the bundle store be read or
abused by a third party.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT license](LICENSE). Please don't include code or text that you
aren't free to license that way — the *Tractatus* text here is deliberately
limited to the public-domain Ogden translation for exactly this reason.
