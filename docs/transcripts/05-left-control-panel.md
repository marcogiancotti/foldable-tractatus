# Session 5: Left control panel

Claude Design · Design · 3 prompts · 121 words

[← Session 4](04-first-foldable-contents-component.md) · [All sessions](README.md) · [Session 6 →](06-side-panel-iteration.md)

## Prompt 17

**Summary:** Design the next design component, the left control panel, using the existing wireframes/building blocks/rules, while explicitly holding off on the header and annotation part.

- **Phase:** Design
- **Human:** 66 words · ~2 min to write
- **LLM:** Fable 5 · Claude Design · 3 min 38 s · +190 −19 lines
- **Outcome:** feature designed, decision, feature built, constraint, bug fixed

### Prompt

> Now that we have clear CSS rules and design system specifications (see uploads and the design system HTML file) we're creating the actual design of the page. Keep adding to the currently open page. Use the existing wireframes and building blocks and rules to first create the next design component: the left control panel. Don't create the header and annotation part yet. We'll go by degrees.

### Reply of Claude Design

Added the left control panel. It reads as bare chrome — controls at the 24% ink floor lifting to 60/100% on hover, grouped by hairline dividers with no container box, per the Pencil system. **Fold all** and **Unfold all** actually drive the tree; Paths, Share link, Export, and undo/redo are in place (functional wiring for those comes later). The reading column is offset right to clear the gutter, matching wireframe 1a.

Header and annotations still to come, as you said — ready for the next degree.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": a new Controls panel at the far left lists Fold all, Unfold all, Paths, Share link, Export, and undo and redo icons. The statements are to its right.*

## Prompt 18

**Summary:** Revise the just-designed control panel: reposition it next to the text, make it more visible by default, and give it a collapse/expand affordance that goes nearly invisible when collapsed.

- **Phase:** Design
- **Human:** 54 words · ~1 min to write
- **LLM:** Fable 5 · Claude Design · 4 min 20 s · +291 −181 lines
- **Outcome:** decision, feature designed, correction

### Prompt

> 1. The panel should be next to the text, not all the way to the left edge of the page.
> 2. The panel should not be so faint: it should be clearly visible when expanded (default state)
> 3. The panel should have an affordance to collapse/expand it. When collapsed, it should become almost invisible.

### Reply of Claude Design

All three changes are in. The panel now sits beside the text, is clearly legible at rest, and collapses to a faint sliver via the header chevron.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": the Controls panel now sits right beside the statements. Its text is darker and a small arrow at its top right collapses it.*

## Prompt 19

**Summary:** Ask whether the requested panel revisions are complete.

- **Phase:** Design
- **Human:** 1 word · ~2 s to write
- **LLM:** Fable 5 · Claude Design · 19 s
- **Outcome:** verification, decision

### Prompt

> done?

### Reply of Claude Design

Yes — done. The left control panel is complete: it sits beside the reading column, reads clearly at 60% ink when open, lifts to full ink on hover, and collapses to a near-invisible chevron sliver via the header toggle. No console errors. Fold all / Unfold all drive the tree; the rest of the controls are placed and ready for wiring in later degrees.

Header and annotations still to come whenever you want the next one.

---

[← Session 4](04-first-foldable-contents-component.md) · [All sessions](README.md) · [Session 6 →](06-side-panel-iteration.md)
