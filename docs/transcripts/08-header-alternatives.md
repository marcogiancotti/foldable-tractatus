# Session 8: Header alternatives

Claude Design · Design · 4 prompts · 141 words

[← Session 7](07-annotation-style.md) · [All sessions](README.md) · [Session 9 →](09-search-hit-state.md)

## Prompt 40

**Summary:** Design the app header (title, introduction, distinctive visual accent matching the design system) and propose three alternative approaches in a new file.

- **Phase:** Design
- **Human:** 38 words · ~57 s to write
- **LLM:** Fable 5 · Claude Design · 2 min 50 s · +218 −0 lines
- **Outcome:** feature designed, process, tooling

### Prompt

> Next we need to iterate on the header of the web app's page. It should have the title, an introduction, and some distinctive visual accent in line with the design system. Propose 3 approaches in a new file

### Reply of Claude Design

Three header approaches, all on the "Pencil" tokens, in `Tractatus Header.dc.html`:

- **1a — Masthead + index rail:** big light Hanken title, mono attribution eyebrow, intro, and the seven root numbers as a spine with root 1 in ochre.
- **1b — Epigraph:** asymmetric layout with proposition 7 pulled out in an ochre-wash card.
- **1c — Colophon ledger:** centered and quiet, accent carried by a single ochre-ticked mono ledger line.

Each sits above faded tree rows for context. Tell me which direction to take into the app — or mix elements across them.

*The prototype after this reply (screenshot, not included): The prototype "Tractatus Header": three stacked header options, each with a title, intro and faded tree rows. 1a is a left-aligned masthead with a Roots row, 1b has a quote box, and 1c is centered with a summary line.*

## Prompt 41

**Summary:** Build a specific header variant ("1d") based on option 1a with detailed edits: drop the roots element, reuse the 1c summary line plus an annotation count, and add spacing after the separator.

- **Phase:** Design
- **Human:** 50 words · ~1 min to write
- **LLM:** Fable 5 · Claude Design · 33 s · +40 −3 lines
- **Outcome:** decision, feature rejected, feature designed, UX improved

### Prompt

> Make 1d as follows:
> - Use 1a as basis, with the changes below.
> - Remove the "Roots 1, 2, 3..." element
> - Use the summary line from 1c, and include a "7 annotations" (to be shown when the user has added annotations.
> - Add more space after the separator line

### Reply of Claude Design

Added **1d** — 1a's masthead, the ROOTS rail swapped for 1c's ledger line (now with an ochre `7 annotations` at the end, shown once notes exist), and more breathing room after the separator.

*The prototype after this reply (screenshot, not included): The prototype "Tractatus Header": the new option 1d is at the top of the stack. It is the 1a masthead, but it has a summary line ending in "7 annotations" in place of the Roots row. 1a, 1b and 1c follow below.*

## Prompt 42

**Summary:** Apply the now-approved, slightly edited version of the header design into the main design file.

- **Phase:** Design
- **Human:** 18 words · ~27 s to write
- **LLM:** Fable 5 · Claude Design · 1 min 7 s · +25 −3 lines
- **Outcome:** decision, feature built

### Prompt

> I've made a little edit to 1d and now it's approved. apply it to the main design file

### Reply of Claude Design

The 1d header now sits at the top of the reading column in the main app — eyebrow, title, intro, and the ledger line, with `N annotations` in ochre driven by the live note count (hidden when there are none, and it respects the light/dark theme and the Show notes toggle).

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": the approved header now tops the reading column, with the title, intro and a summary line ending "2 annotations". The controls panel is at the left, and the text tree and margin notes follow.*

## Prompt 43

**Summary:** Change the main design so the control panel starts aligned with the first text item and becomes fixed via absolute positioning on scroll.

- **Phase:** Design
- **Human:** 35 words · ~53 s to write
- **LLM:** Fable 5 · Claude Design · 2 min 52 s · +64 −34 lines
- **Outcome:** decision, bug fixed, verification

### Prompt

> Good, but I need 1 change to the main design:
> 1. The control panel should start in line with the first item of the text (1), and be fixed there absolute positioned when scrolling down.

### Reply of Claude Design

Fixed — the panel now measures the actual first-row position instead of summing header height. The panel top aligns with proposition **1** (12px residual, which is just the row's internal padding/baseline offset) and stays pinned on scroll.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": the controls panel now starts level with proposition 1, below the header block. The header title and intro are to the right of the empty space above it.*

---

[← Session 7](07-annotation-style.md) · [All sessions](README.md) · [Session 9 →](09-search-hit-state.md)
