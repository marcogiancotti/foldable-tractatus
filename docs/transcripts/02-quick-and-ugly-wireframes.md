# Session 2: Quick-and-ugly wireframes

Claude Design · Design · 2 prompts · 209 words

[← Session 1](01-specification-from-scratch.md) · [All sessions](README.md) · [Session 3 →](03-palette-typography-density-vibe.md)

## Prompt 7

**Summary:** Start a quick, low-fidelity wireframing pass on the single-page webapp to work out structure and UX, deferring visual polish to later.

- **Phase:** Design
- **Human:** 43 words · ~1 min to write · 3 files
- **LLM:** Fable 5 · Claude Design · 35 s
- **Outcome:** process, decision

### Prompt

> [private link]
> I want to briefly iterate on the design of this single page webap as quick and ugly wireframes: I just want to figure out the structure and get an idea of the UX. A pretty design will come in a later step.

### Reply of Claude Design

The spec is thorough — a few UX-structure questions before I sketch, since that's exactly what the wireframes should explore:

**Questions of the AI:**

1. Which parts should the wireframes cover?
   - Options: Main tree reading view · Focused view with pins + peeks · Annotation UX · Term-highlight flow (activate, counts, pin-these dialog) · Reading paths picker · Cross-reference preview · Export/share/sync UI · Undo affordance for pin-replacing actions · Explore a few options · Decide for me
   - **Answer:** Explore a few options
2. Peek treatment — worth exploring variants? (open question #1 in the spec)
   - Options: Yes — show both variants side by side · Just pick one per wireframe · Decide for me · Other
   - **Answer:** Yes — show both variants side by side
3. Where should global controls live (fold/unfold all, paths, export, share)?
   - Options: Explore a few options · Slim top toolbar · Left sidebar · Minimal — controls hidden in a menu · Decide for me
   - **Answer:** On the left in a little absolute-positioned panel, not a full-height sidebar
4. Where do annotations appear?
   - Options: Explore a few options · Inline below the statement · Right margin column · Slide-in panel · Decide for me
   - **Answer:** Right margin column
5. Target width for the wireframes?
   - Options: Desktop only · Desktop + a mobile sketch · Mobile-first · Decide for me
   - **Answer:** Desktop + a mobile sketch
6. How many overall layout variations in round 1?
   - **Answer:** 3
7. Wireframe depth
   - Options: Static sketches only · Lightly interactive (fold/unfold actually works) · Decide for me
   - **Answer:** Static sketches only
8. What matters most to explore first?
   - Options: Overall page structure · The tree row itself (controls, pin, density) · Focused/pinned reading experience · Term interaction flow · Decide for me · Other
   - **Answer:** Overall page structure
9. How adventurous should the UX ideas be?
   - Options: Stick close to the spec's implied UX · Mix of safe + novel · Push for novel interaction ideas · Decide for me
   - **Answer:** Mix of safe + novel
10. Anything you already know you want (or hate)?
   - **Answer:** nesting levels should be shown with slight indentation, like a nested bullet list

Round 1 is up — six sketches:

- **1a** Classic scroll: floating control panel left, notes in a right margin
- **1b** Focused view: reading path + term highlight, compact peeks, "Pin only these" dialog, undo toast
- **1c** Novel: the 7 propositions as a fixed spine rail with pin dots; cross-ref preview in place
- **1d / 1e** The two peek treatments side by side (quiet sibling row vs merged "N more")
- **1f** Mobile: notes go inline, controls behind ☰

Tell me which ids to riff on, or what to explore next (annotation UX, term-pin flow…).

*The prototype after this reply (screenshot, not included): The prototype "Tractatus Wireframes": a sheet of six rough sketches. The main one shows a control panel on the left, the foldable statements in the middle and notes in a right margin.*

## Prompt 8

**Summary:** Gives detailed feedback on the six wireframe variants (accepting some, rejecting the spine rail, tweaking the count tags and peek option) and adds new requirements: a collapsible left panel with boxless floating annotation text, renaming 'Paths' to 'Saved pin-sets', and a new save/name/delete pin-set feature capped at 5 custom slots plus 3 built-in.

- **Phase:** Design
- **Human:** 166 words · ~4 min to write
- **LLM:** Fable 5 · Claude Design · 1 min 28 s · +124 −1 lines
- **Outcome:** decision, feature rejected, UX improved, feature designed

### Prompt

> 1a: good basis for the overall structure.
> 1b: okay, but i wouldn't repeat the word in the count tags. "9" instead of "picture x9". There can be a tooltip on hover: "9 occurrences of "picture"
> 1c: nope, I don't like the spine rail. Keep the 1a structure.
> 1d vs 1e: I choose 1e, but remove the "n more before/after"
> 1f: Looks good on mobile.
>
> Other thoughts I had seeing these first wireframes:
>
> a. It should be possible to unclutter the UI when the user wants to focus on reading. The left panel should be collapsible, becoming almost invisible. The notes should be not have any boxes or anything, just the text floating over the background in smaller font than the main text.
> b. Rename "Paths" to "Saved pin-sets"
> c. New key feature: it should be possible to save the current pin set under "Saved pin-sets". Maximum 5 pin-sets can be saved (plus 3 that are built into the app from the beginning. User can name/rename/delete/overwrite them.

### Reply of Claude Design

Round 2 at the top:

- **2a** — 1a structure with your fixes: bare count badges (tooltip carries the wording), peeks reduced to dim numbers/ranges only, "Saved pin-sets" in the panel
- **2b** — reading mode: panel collapsed to a sliver at the edge, carets/numbers faded, notes as bare smaller text with no boxes
- **2c** — Saved pin-sets popover: 3 built-in + up to 5 user slots, save-current flow, rename/overwrite/delete

Happy to sketch annotation editing states or export/share dialogs next.

*The prototype after this reply (screenshot, not included): The prototype "Tractatus Wireframes": the new round of sketches sits above the first six. It shows the main view, a reading mode with a collapsed panel and bare notes, and a Saved pin-sets popover.*

---

[← Session 1](01-specification-from-scratch.md) · [All sessions](README.md) · [Session 3 →](03-palette-typography-density-vibe.md)
