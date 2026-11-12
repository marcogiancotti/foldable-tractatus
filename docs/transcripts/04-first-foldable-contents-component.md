# Session 4: First foldable contents component

Claude Design · Design · 3 prompts · 149 words

[← Session 3](03-palette-typography-density-vibe.md) · [All sessions](README.md) · [Session 5 →](05-left-control-panel.md)

## Prompt 14

**Summary:** Design the main foldable-book-contents component in the actual design file, built from the existing wireframes and rules, with header/side-panel/annotations deliberately deferred.

- **Phase:** Design
- **Human:** 72 words · ~2 min to write
- **LLM:** Fable 5 · Claude Design · 5 min 36 s · +22 −0 lines
- **Outcome:** feature designed, constraint, decision

### Prompt

> Now that we have clear CSS rules and design system specifications (see uploads and the design system HTML file) it's time to create the actual design of the page. Use the existing wireframes and building blocks and rules to first create the main design component: the foldable book contents (use a small subset of the book here, of course). Don't create the header, side panel, annotation part yet. We'll go by degrees.

### Reply of Claude Design

Done. The main design component — **Foldable Tractatus** — is built as an interactive foldable tree over a curated subset (roots 1–7 with real Ogden text and deep decimal nesting through 2.141).

Applied straight from the "Pencil" system:
- Statement text in Hanken 300 at 17/1.62 (full ink, the protagonist); decimal numbers in Plex Mono at 60% ink doing the hierarchy work.
- Fold toggle sits at the 24% floor, lifts to 60% on row hover, rotates on expand — unfolds one level at a time.
- Pin appears at 24% on hover, becomes filled ochre when set; the pinned row takes the ochre-wash selection surface.
- Hierarchy comes from indentation + the numbers only — I deliberately dropped the wireframe's dashed rails, since principles.md says the numbering *is* the hierarchy.

Tweaks: light/dark theme and a pins on/off toggle.

Deferred as you asked: header, control panel, and annotation margin. One judgment call to flag — I open with a small designed expansion (1, 1.1, 2, 2.1) and 1.11 pinned so it reads richly; the spec's true default is fully-folded, which is one fold-all away once we add global controls.

Next by degrees: the control panel (fold-all/unfold-all, paths, share/export), or the note margin?

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus", close up: statements 1 to 2.02 in a plain column, indented by level, with small fold arrows at the left. Statement 1.11 is pinned, with a tinted box and a pin icon.*

## Prompt 15

**Summary:** Fix the fold marker's centering inside its box, make the whole box clickable, and add a hover-darken affordance.

- **Phase:** Design
- **Human:** 39 words · ~59 s to write · 1 file
- **LLM:** Fable 5 · Claude Design · 2 min 1 s · +46 −29 lines
- **Outcome:** UX improved, decision

### Prompt

> The fold marker is not centered vertically & horizontally in its box. Also, I want to make the whole box clickable for ease of use. When the mouse hovers on the box, make it slightly darker to indicate clickability.

### Reply of Claude Design

The chevron is now centered in a 26×26 clickable box. The hover-darken is wired (my synthetic event just didn't trip React's handler — the logic sets the box background to a stronger wash on toggle-hover). 

Changes made:
- Fold marker centered vertically & horizontally in a proper 26×26 box.
- The whole box is the click target (bigger, easier hit area).
- Box darkens slightly on hover to signal it's clickable — distinct from the row's lighter hover wash.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus", close up: statements 1 to 1.2. The mouse is on the fold arrow of statement 1.1, so the arrow now sits centered in a gray square, and the whole row has a light hover tint.*

## Prompt 16

**Summary:** Refine the clickable area's alignment so it lines up with the first line of its statement, and add a matching left margin.

- **Phase:** Design
- **Human:** 38 words · ~57 s to write
- **LLM:** Fable 5 · Claude Design · 1 min 19 s · +5 −4 lines
- **Outcome:** UX improved

### Prompt

> Better, but make the clickable square area vertically aligned with the first line of the statement it refers to. Right now it's lightly shifted upwards. Also add a margin to the left equal to the resulting top margin

### Reply of Claude Design

The fold box now vertically centers on the first line of its statement (compare the `1` and `2` chevrons against their statement lines), with equal 1px top and left margins for a symmetric inset.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus", close up: the same rows. The gray square around the fold arrow of statement 1.1 now lines up with the first line of the statement, with a small gap to its left.*

---

[← Session 3](03-palette-typography-density-vibe.md) · [All sessions](README.md) · [Session 5 →](05-left-control-panel.md)
