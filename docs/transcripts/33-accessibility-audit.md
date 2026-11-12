# Session 33: Accessibility audit

Claude Code · Polish · 5 prompts · 237 words

[← Session 32](32-favicon-and-fold-all-icon.md) · [All sessions](README.md)

## Prompt 187

**Summary:** Asks whether the completed implementation is accessible, requesting an accessibility compliance check and proposed improvements for broader usability.

- **Phase:** Polish
- **Human:** 24 words · ~36 s to write
- **LLM:** Opus 5 · Claude Code · 3 min 35 s
- **Outcome:** accessibility, research, decision, docs written

### Prompt

> The implementation is complete, but is is accessible? Do a check for accessibility compliance, and propose improvements to allow anyone to benefit from it.

### Reply of Claude Code

I read the full UI layer (components, `useKeyboardNav`, all eight stylesheets, `index.html`) and computed contrast ratios for every token pair. No automated tooling is installed, so this is a code-level audit against WCAG 2.2 AA.

**Verdict:** the foundation is genuinely good — `lang`, real `<main>`, `aria-label`/`aria-pressed`/`aria-expanded` on nearly every control, `aria-hidden` on every decorative glyph, a global `prefers-reduced-motion` block, `role="dialog"` + Escape + initial focus on both modals, and a voice-control-aware caption/label pairing in `MobileControls.tsx:20`. Somebody was thinking about this.

But there are five Level A blockers, and the reading tree itself — the thing the app *is* — is currently near-unusable with a screen reader.

---

##### Level A blockers

**1. Statement rows have no accessible role or structure.** `StatementRow.tsx:60-69` renders `<div aria-label="Statement 2.11" tabIndex={-1}>`. ARIA forbids `aria-label` on `role="generic"`, so most screen readers **drop it entirely**. There is no `role`, no `aria-level`, no `aria-expanded` on the row. Depth is conveyed purely by CSS indent + `.depth-rails` (which are `aria-hidden`). A screen reader user gets 526 unlabelled, unstructured text blobs with no way to know 2.11 is a child of 2.1 — the decimal tree, the entire premise, is invisible.

*Fix:* make the reading section a real ARIA tree.
```tsx
<section role="tree" aria-label="Statements">
  <div role="treeitem"
       aria-level={depth + 1}
       aria-expanded={hasChildren ? expanded : undefined}
       aria-selected={pinned}
       aria-label={`${n}. ${plainText(s.text)}`}
       tabIndex={-1} data-nav="" …>
```
The row already behaves like a treeitem (roving focus, ←/→ fold, `data-nav`) — it just never says so. `PeekRange` becomes `role="treeitem"` too.

**2. Single-character shortcuts cannot be disabled (2.1.4).** `useKeyboardNav.ts:87-136` binds `j`, `k`, `p`, `/`, `?` on `document`, exempting only `INPUT`/`TEXTAREA`. Speech-input software emits bare characters constantly; a dictation user pinning statements by accident has no escape hatch. Level A requires these be remappable, switchable off, *or* active only when a component has focus.

*Fix (cheapest conforming route):* gate the letter keys on focus being inside the tree — `if (!document.activeElement?.closest('[data-nav]')) return;` before the `j`/`k`/`p` cases. Keep `/` and `?` global only if you add a toggle in the Reader guide. Also exempt `[contenteditable]` and `isContentEditable` alongside INPUT/TEXTAREA.

**3. Arrow keys are hijacked globally, so the page cannot be scrolled with the keyboard.** `move()` calls `e.preventDefault()` unconditionally (`useKeyboardNav.ts:78`), even when focus is on `<body>` or in the control panel. Your intro header is four paragraphs long and a keyboard-only user cannot arrow-scroll past it. Same focus gate as above fixes it: only capture arrows when focus is already within `[data-nav]`.

**4. Focusable controls that are invisible when focused (2.4.7 / 2.4.11).** `.row-pin`, `.row-note-btn`, `.row-share-btn` are `opacity: 0; pointer-events: none` until `.row:hover` (`reading.css:242,635,662`). They remain in the tab order. A sighted keyboard user tabs into three invisible buttons per row — and with the tree unfolded that's ~1,580 invisible tab stops.

*Fix:* reveal on focus as well as hover, and take them out of the tab sequence in favour of the row-level keyboard model:
```css
.row:hover .row-pin,
.row:focus-within .row-pin,
.row-pin:focus-visible { opacity: 1; pointer-events: auto; }
```
plus `tabIndex={-1}` on all three (they're already reachable via `P` / `Enter` on the row; add a `S` binding or leave share to the toggle). This single change is the biggest usability win in the audit.

**5. Toasts announce unreliably and time out (4.1.3 / 2.2.1).** `UndoToast.tsx:59` mounts `role="status"` *and* its text in the same commit — live regions must exist in the DOM **before** content is inserted or the announcement is silently lost. Worse, the toast auto-dismisses in 6s (4.2s for plain) and the **Undo button lives inside it**, with no pause on hover or focus. A screen-reader or motor-impaired user cannot reach Undo in time. `ReturnPill.tsx:32` has the identical shape with an 8s dwell.

*Fix:* render the `role="status"` wrapper permanently (empty when idle) and swap only the inner content; clear the dismiss timer on `mouseenter`/`focusin` and restart on leave. Ctrl+Z already covers undo, so mention that in the toast text as the durable path.

---

##### Level AA — contrast

I computed every token against its paper. Failures:

| Token | Light | Dark | Used for | Needs |
|---|---|---|---|---|
| `--ink24` | **1.65** | **1.85** | pin/note/share icons, `.note-pencil`, `.idx-term` underline, **`::placeholder`** | 4.5 (text) / 3.0 (UI) |
| `--ink40` | **2.22** | **3.31** | `.cp-search-kbd`, `.xref-quiet` ("(cf. ") | 4.5 |
| `--control-border` | **1.98** | **2.41** | control boundaries | 3.0 |
| `--ink60` | **4.31** | 5.88 | `.row-num` at 13px | 4.5 |
| accent on `--accent-wash` | **4.16** | — | `.row-badge`, `.peek-badge` at 11px | 4.5 |

`--ink100` (15.8 / 14.5) and `--accent` (5.2 / 8.4) are fine — the body text is not the problem, the chrome is.

The design system's stated rule is "chrome sits at 24% ink until hover," and that rule is what fails. It doesn't need abandoning — it needs a floor. Suggest raising `--ink24` → `rgba(33,31,27,0.45)` (≈3.1:1, clears the non-text threshold for icon affordances), `--ink40` → `0.62`, `--control-border` → `0.5`, `--ink60` → `0.68`, and darkening `--accent` to `#3f5a7a` (6.9:1) so badge-on-wash clears 4.5. Then add an escape hatch that preserves the "Pencil" look for people who don't need it:

```css
@media (prefers-contrast: more) {
  :root { --ink24: rgba(33,31,27,0.7); --hairline: rgba(60,50,30,0.35); }
}
```

Two more colour issues: pinned state is a background wash only, which **vanishes entirely in Windows High Contrast** (no `forced-colors` handling anywhere) — add a `@media (forced-colors: active)` block giving `.row.is-pinned` a `border-inline-start: 3px solid Highlight`. And `.row.is-pinned:focus` resolves to the *same* `--accent-wash` as `.row.is-pinned` (`reading.css:148`), so **pinned rows have no focus indicator at all**; give the focused row `box-shadow: inset 0 0 0 2px var(--accent)`.

---

##### Level AA — other findings

**Dialogs don't trap or restore focus.** `ConfirmModal`, `ReaderGuide`, and `MobileSheet` all focus an element on open but nothing stops Tab from walking out into the page behind, and on close focus is dropped to `<body>` — the reader loses their place in a 526-statement document. `MobileSheet` (`MobileControls.tsx:70`) has no focus management and no `aria-modal` at all. Fix with a shared `useDialog(ref, onClose)` hook: store `document.activeElement` on open, cycle Tab within the card, restore on unmount, and set `inert` on `.app-root` while open.

**Invalid menu semantics.** `ThreadsMenu.tsx:116-134` uses `role="menuitem"` on `<div>`s that *contain focusable buttons* — prohibited, since a menuitem's children are not independently reachable. There's also no arrow-key navigation or roving tabindex on either menu. The simplest correct fix is to drop `role="menu"`/`role="menuitem"` entirely: use real `<button>`s inside a labelled `<div>`, which loses nothing and is immediately valid. Same for `.cp-export-menu`.

**Div-as-button.** `.cp-head` (`ControlPanel.tsx:149`) and `.note-box` (`AnnotationNote.tsx:115`) are `role="button"` divs. `.note-box` handles Enter but **not Space**, which native buttons activate. Both should just be `<button type="button">`.

**Hover-only tooltips.** `.badge-tip` (`reading.css:444`) appears only on `:hover` of a non-focusable `<span>`, and the `role="tooltip"` is never referenced by `aria-describedby`, so it's dead markup for everyone. It also violates 1.4.13 (no dismiss/hover/persist). Replace with `aria-label` on the badge wrapper: `aria-label={`${hiddenCount} more matches for "${activeTerm}" inside`}`.

**Search results are never announced.** Typing in the search box changes the entire view — highlights, badges, the term card — and says nothing. Add a polite live region: `<p role="status" className="sr-only">{termCount} occurrences in {matchCount} statements</p>`. Likewise fold-all/unfold-all/pin produce no announcement; route them through the same region.

**Touch targets under 24×24 (2.5.8).** `.row-pin`/`.row-note-btn`/`.row-share-btn` are bare ~17px glyphs with `padding: 0`. The `::after { inset: -8px }` hit-area extension exists but is scoped to `@media (hover: none)` (`reading.css:748`) — 2.5.8 applies regardless of input modality. Move that `::after` rule out of the media query.

**Cross-ref popover.** `XRefPreview.tsx:110` is `role="dialog"` but focus never moves into it, and `onScroll` closes it on *any* scroll — a keyboard user who tabs toward "Go to statement N" and triggers a scroll loses it. Either move focus into the popover on open and restore on close, or drop `role="dialog"` and treat it as a disclosure with `aria-controls`.

**No skip link, and the panel is not a landmark.** Add `<a href="#statements" className="skip-link">Skip to the statements</a>` as the first focusable element, and wrap the desktop `.panel-col` in `<aside aria-label="Controls">` — it currently has no landmark, so landmark navigation goes straight past the whole toolset.

**Every curated term is a `<button>` mid-sentence** (`StatementText.tsx:175`). Screen readers interrupt the prose with "button" hundreds of times and each is a tab stop. Give them `tabIndex={-1}` and a clearer `aria-label={`trace the term ${canonical}`}`, keeping them mouse- and tree-reachable without shredding the reading flow.

**Icon-font ligature fallback.** All glyphs are Material Symbols ligature text (`chevron_right`, `push_pin`). If Google Fonts is blocked — corporate proxies, offline, privacy extensions — the literal words render in the layout. Wrapping the ligature text in `aria-hidden` already protects screen readers; adding `font-display: block` plus a self-hosted subset would protect everyone else.

---

##### Suggested sequencing

1. **Tree semantics + focus gating + visible-on-focus row controls** — items 1–4. This is where the app goes from unusable to usable non-visually, and it's maybe 80 lines across four files.
2. **Token contrast pass + focus-visible on pinned rows + `forced-colors` block** — pure CSS, no logic risk.
3. **Live regions + toast timing** — item 5 plus search announcements.
4. **Dialog focus management hook + menu role cleanup + skip link.**

Nothing here requires touching `focusedView.ts` or the URL codec — the derivation model is orthogonal to all of it, which is why the fixes are cheap.

Want me to implement these? I'd suggest taking them in the order above, one commit per stage, with `npm test` and a typecheck between each — and I can add an `axe-core` assertion to `App.smoke.test.tsx` so the structural regressions can't come back.

## Prompt 188

**Summary:** Responds item-by-item to Level A and AA accessibility proposals: approves building a real ARIA tree, a keyboard focus route into it, a contrast floor, focus restoration, menu semantics fixes, a button type fix on .note-box, hover-tooltip fixes, touch-target fixes, dropping role=dialog for the cross-ref popover in favor of a disclosure pattern, adding a skip link, and preventing curated term buttons from interrupting screen reading; rejects two cosmetic color issues and the google-fonts risk; also asks for automated a11y tooling to be installed if possible.

- **Phase:** Polish
- **Human:** 177 words · ~4 min to write
- **LLM:** Opus 5 · Claude Code · 49 min 0 s
- **Outcome:** decision, constraint, process, feature rejected

### Prompt

> Level A feedback
> 1. Okay, create a real ARIA tree
> 2. Okay, but there should be a keyboard-only to focus the tree.
> 3. Agreed
> 4. Okay
> 5. Okay
>
> Level AA feedback
> contrast: good catch (should have caught it at the design phase), do give it a floor.
> Ignore the other two color issues, they were just cosmetic, not functional.
>
> Other level AA:
> - Yes, restoring the correct focus should be implemented
> - Yes, fix the menu semantics
> - Add type="button" to .note-box
> - fix the hover-only tooltips as you proposed
> - Search results are already announced: in the "Selected: ..." panel (the same created by clicking on an indexed term). No need to add another.
> - touch targets: yes, move that ::after rule out
> - cross-ref popover: drop role="dialog" and treat it as a disclosure with aria-controls
> - No skip link: okay, add that link
> - Prevent the many curated term buttons from interrupting the screen reading experience
> - Ignore the risk of google fonts being blocked.
>
> Also, install automated tooling to check more systematically, if possible.

### Reply of Claude Code

Registry is reachable, Playwright browsers are cached, and `stripMath`/`proseForMatching` (`src/lib/math.ts:85`) already exist for building accessible names. Three decisions materially change the design — let me settle those before writing the plan.

**Questions of the AI:**

1. You approved gating the tree shortcuts (j/k/p/arrows) to tree focus. But `/` and `?` are also single-character shortcuts, and WCAG 2.1.4 (Level A) requires *any* single-char shortcut be remappable, disableable, or focus-scoped. How far should I go?
   - Options: Focus-gate + off toggle (Recommended) · Focus-gate everything · Focus-gate only, accept the gap
   - **Answer:** Focus-gate + off toggle (Recommended)
2. Playwright is deliberately not a project dependency (the `verify` skill installs it in the scratchpad). jsdom-based axe catches structure but not colour or focus visibility. What should I commit?
   - Options: axe (jsdom) + contrast unit test (Recommended) · Both jsdom and browser · jsdom axe only
   - **Answer:** (notes only)
3. With a roving tabindex the tree becomes ONE tab stop instead of ~1,580. That means the per-row pin/note/share buttons must leave the tab order. How should keyboard users reach them?
   - Options: Shortcuts only, add `S` (Recommended) · Shift+Tab into the row's buttons · Keep all buttons tabbable
   - **Answer:** Shortcuts only, add `S` (Recommended)

Done. All four stages are on `a11y-remediation` in three commits, working tree clean, `package.json` untouched.

##### Results

**axe-core, 15 states, desktop + iPhone 13, light + dark: 22 violations → 0.**

| | Before | After |
|---|---|---|
| Tab stops to cross the unfolded book | ~1,580 (invisible) | **1** |
| Tree structure exposed to a screen reader | none | 526 treeitems with level / position / expanded / selected |
| Arrow-key page scrolling | broken everywhere | works outside the tree |
| Tests | 133 | 157 |

##### What changed against the plan

Four things the plan didn't anticipate, all found by running the code rather than reading it:

**`role="tree"` on a `<section>` is invalid** — ARIA-in-HTML doesn't allow it there. Moved to a `div`.

**The treeitem had to be `.row-group`, not `.row`.** With the role a level down, the annotation editor's textarea and buttons became direct children of the tree — a critical `aria-required-children` failure. I first tried `role="group"` on the note wrapper; axe still descended, correctly, because a `group` inside a `tree` is meant to hold child treeitems. Putting the role on the wrapper is the honest structure: a statement and its margin note are one node.

**My `useDialog` broke note-saving.** I focused the dialog inside a `requestAnimationFrame`; the existing design relies on the modal stealing focus to blur and commit the annotation editor. Caught by an existing test. Focus is now synchronous, as both dialogs did before.

**The `prefers-contrast` block was dead in dark mode** — I'd inserted it between the light and dark `:root` blocks, so at equal specificity the dark theme overrode the override. Writing the contrast test surfaced it immediately.

I also mutation-tested the new keyboard guards (defeating the kill switch and the focus gate) to confirm the tests actually fail when the feature does.

##### Two things to flag

**The pinned-row focus indicator.** You judged this cosmetic, and it was — while rows were unreachable by Tab. It isn't now: the row focus treatment is the primary navigation indicator, and `.row-group:focus > .row.is-pinned` still resolves to the same `--accent-wash` as an unfocused pinned row, so arrowing through pinned statements gives no feedback. I left it as instructed. It's a two-line fix (`box-shadow: inset 0 0 0 2px var(--accent)`).

**The light accent moved** `#4e6c90` → `#3f5a7a` to get the 11px occurrence badges over 4.5:1 against their own wash. It's the most visible change in the whole diff — worth your eye before merging.

Scope I didn't touch, per your call: forced-colors, `.cp-head`, a search live region, Google Fonts. One small thing I did fix beyond the list — two `<th />` in the 4.442 truth table claimed to head columns they don't; they're `<td>` now.

The branch isn't pushed and nothing is merged.

## Prompt 189

**Summary:** Asks for a URL that pins all statements containing images, so the human can manually test them.

- **Phase:** Polish
- **Human:** 17 words · ~26 s to write
- **LLM:** Opus 5 · Claude Code · 2 min 23 s
- **Outcome:** question answered, verification, bug reported

### Prompt

> I'm testing it. Give me a URL that pins all the statements with images, to check them

### Reply of Claude Code

All five ab-notation figures render correctly inside the pinned statement. Server is running.

**Figures (SVG diagrams) — 4 statements:**

```
http://localhost:5173/?p=5.5423,5.6331,6.1203,6.36111
```

- `5.5423` — the ambiguous cube
- `5.6331` — the eye and the visual field boundary
- `6.1203` — all five ab-notation diagrams (the densest one; truth-combination braces, ⊃ correlation, ∼ξ, ξ.η, and the fully-constructed ∼(p.∼q))
- `6.36111` — the two congruent segments

**Including the three truth tables as well:**

```
http://localhost:5173/?p=4.31,4.442,5.101,5.5423,5.6331,6.1203,6.36111
```

Adds `4.31` (the truth-possibility table), `4.442` (the quoted truth table — the one whose two empty `<th>` I changed to `<td>`, worth a look since I touched its header rule), and `5.101` (the 16 truth-functions list).

Two things you may want to check while you're in there, since both were touched:

- **The `4.442` table header rule** — the underline should still run the full width including the last two unlabelled columns. That's the `thead td` rule I added; if it stops short, that's my regression.
- **Figure contrast in dark mode** — the SVGs use `color: var(--ink100)` via `currentColor`, so they weren't affected by the token changes, but `.fig-label`/`.fig-tf` inherit too and are worth an eye at the new values.

The figures carry `role="img"` with descriptive labels already (they were correct before I started) — e.g. 6.1203's five read as "The four truth-combinations of p and q, tied by braces", "Correlation of truth-values for p implies q", and so on.

## Prompt 190

**Summary:** Reports that manual verification found no regressions and asks to commit the work.

- **Phase:** Polish
- **Human:** 15 words · ~23 s to write
- **LLM:** Opus 5 · Claude Code · 39 s
- **Outcome:** verification, bug reported

### Prompt

> My visual and interactive verification surfaced no regressions. It all seems to work fine. Commit

### Reply of Claude Code

Nothing left to commit — the work was already committed as I went, in three stages. Working tree is clean.

On `a11y-remediation`, ahead of `main` by:

```
5c65cf8  test(a11y): enforce the contrast floor from tokens.css
9708768  feat(a11y): trap and restore dialog focus, fix menu semantics, hold toasts
d61454d  feat(a11y): expose the statement tree, scope shortcuts, set a contrast floor
```

28 files, +1225/−204. Last verified state: 157 tests passing, `tsc --noEmit` clean, production build fine, axe clean across 15 states (desktop + iPhone 13, light + dark). `package.json` untouched — the Playwright/axe install was scratchpad-only and has been discarded.

The branch isn't merged or pushed. Want me to merge it into `main`, push the branch, or leave it as is?

One loose end worth deciding before this lands: the **pinned-row focus indicator**. You called it cosmetic during the audit, and it was — but that was when rows couldn't be reached by Tab. Now that arrowing through the tree is the primary way to navigate, a focused pinned row looks identical to an unfocused one. It's two lines in `reading.css`:

```css
.row-group:focus > .row.is-pinned {
  box-shadow: inset 0 0 0 2px var(--accent);
}
```

Say the word and I'll add it before merging; otherwise it stays as you decided.

## Prompt 191

**Summary:** Asks to merge the current work into main.

- **Phase:** Polish
- **Human:** 4 words · ~6 s to write
- **LLM:** Opus 5 · Claude Code · 47 s
- **Outcome:** tooling, verification

### Prompt

> then merge into main

### Reply of Claude Code

Merged into `main` as a fast-forward (main hadn't moved), history stays linear:

```
5c65cf8  test(a11y): enforce the contrast floor from tokens.css
9708768  feat(a11y): trap and restore dialog focus, fix menu semantics, hold toasts
d61454d  feat(a11y): expose the statement tree, scope shortcuts, set a contrast floor
37bbbaa  feat: label the mobile controls        ← previous main
```

Re-verified on `main` after the merge: 157 tests passing, typecheck clean.

`main` is **ahead of `origin/main` by 3** — not pushed, since you asked only for the merge. Say the word if you want it pushed.

The pinned-row focus indicator stayed out, as you originally decided. The `a11y-remediation` branch still exists if you want it for reference, or I can delete it.

---

[← Session 32](32-favicon-and-fold-all-icon.md) · [All sessions](README.md)
