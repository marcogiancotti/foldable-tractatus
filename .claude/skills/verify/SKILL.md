---
name: verify
description: Build, launch, and drive the Foldable Tractatus frontend to verify changes at the surface (browser screenshots via Playwright).
---

# Verifying the Foldable Tractatus

## Launch

```sh
nohup npm run dev -- --port 5173 --strictPort > /tmp/dev.log 2>&1 & disown
until curl -s -o /dev/null http://localhost:5173; do sleep 1; done
```

`--strictPort` matters: without it Vite silently hops to 5174 when 5173 is
held by a stale process and the driver script hits the wrong port. Kill stale
servers with `pkill -f vite` first.

## Drive

Playwright is NOT a project dependency. Install it in the session scratchpad
(`npm init -y && npm install playwright@<version matching npx playwright
--version> --no-save` — takes ~2 min; browsers are already in
`~/.cache/ms-playwright`) and run a script from there.

- Mobile: `devices['iPhone 13']` context gives 390×844 + touch + hover:none —
  exercises the mobile layout (bottom bar `.mobile-bar`, sheet `.mobile-sheet`,
  depth rails `.depth-rails`) and the `@media (hover: none)` always-visible row
  actions. Use `.tap()`, not `.click()`.
- Desktop: plain `{ viewport: { width: 1280, height: 900 } }` context — panel
  column `.cp-panel` visible, rails `display: none`, hover reveals intact.
- Collect `pageerror` + console errors; screenshot each state and READ the
  screenshots — layout squeezes (flex items stealing text width) don't throw.

## Flows worth driving

- fold/unfold via `.row-toggle`; peek promote via `.peek-row`
- pin (`.row-pin`) → header meta shows "N pins", row gets accent wash
- term: tap `.idx-term` or search input → TermCard (mobile: `.mobile-term-dock`)
- note: `.row-note-btn` → type → Enter → note persists under row
- cross-ref: `.xref-num` tap → `.xref-pop` → "Go to statement"
- mobile bar buttons by aria-label: "search the text", "controls", "undo"
