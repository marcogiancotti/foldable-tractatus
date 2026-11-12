# Session 7: Annotation style

Claude Design · Design · 3 prompts · 85 words

[← Session 6](06-side-panel-iteration.md) · [All sessions](README.md) · [Session 8 →](08-header-alternatives.md)

## Prompt 37

**Summary:** Design the annotation style in the main design file, using the design system file's existing first version as the basis.

- **Phase:** Design
- **Human:** 32 words · ~48 s to write
- **LLM:** Fable 5 · Claude Design · 4 min 7 s · +230 −64 lines
- **Outcome:** feature designed, constraint, feature built

### Prompt

> Next I want to design the annotation style. The design system file already has a good first version, so use that as basis to add the element to the main design file

### Reply of Claude Design

Added the annotation element to the main design file, built from the design system's NOTE component:

- **Rest** — plain note text at 60% ink, aligned under its statement.
- **Hover** — ochre left-rule appears, ink goes to 100%, a pencil affordance fades in.
- **Editing** — click to edit inline (ochre caret, live autosave counter "autosaved · N left").

Rows without a note reveal an "add note" pencil on hover. Both light and dark themes are covered, plus a new `showNotes` tweak. Seeded notes on 1.11 and 2.12 so it reads richly on first paint.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": small grey notes now appear in the text, under proposition 1.11 and under 2.12. Proposition 1.11 is highlighted and pinned. The controls panel is at the left.*

## Prompt 38

**Summary:** Correct the annotation approach: they must be true margin notes like the referenced Readwise screenshot, only collapsing under the item on mobile.

- **Phase:** Design
- **Human:** 32 words · ~48 s to write
- **LLM:** Fable 5 · Claude Design · 4 min 37 s · +65 −36 lines
- **Outcome:** correction, feature designed, decision, constraint

### Prompt

> Nope, look at the sample screenshot I gave you of Readwise: these are meant to be MARGIN notes! Only on mobile it's okay to collapse them under the item they refer to.

### Reply of Claude Design

Fixed — notes are now **margin notes**, matching the Readwise reference:

- On wide screens (≥1180px) each note sits in a right-hand rail, top-aligned to the statement it annotates, as quiet bare text.
- Hover brings the ochre rule + full ink; click edits inline with the autosave counter — the design system's three states, just relocated to the margin.
- Below 1180px (tablet/mobile) they collapse inline under their statement, as you noted is acceptable there.

The layout reserves the rail so the 720px reading column stays intact at full width.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": the notes now sit as margin notes in a right-hand column, beside propositions 1.11 and 2.12. The text column is unchanged, and 1.11 is highlighted.*

## Prompt 39

**Summary:** Make hovering an annotation also trigger the hover effect on the statement it refers to.

- **Phase:** Design
- **Human:** 21 words · ~32 s to write
- **LLM:** Fable 5 · Claude Design · 22 s · +2 −2 lines
- **Outcome:** UX improved

### Prompt

> Good, but when I hover over an annotation it should also trigger the hover effect of the item it refers to

### Reply of Claude Design

Hovering a note now also highlights its referenced statement row (background, pin, controls). Done.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": the pointer is on the margin note beside 2.12. The note gets an ochre bar and a pencil icon, and its proposition row is highlighted too, with a faint pin.*

---

[← Session 6](06-side-panel-iteration.md) · [All sessions](README.md) · [Session 8 →](08-header-alternatives.md)
