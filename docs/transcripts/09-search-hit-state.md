# Session 9: Search-hit state

Claude Design · Design · 4 prompts · 140 words

[← Session 8](08-header-alternatives.md) · [All sessions](README.md) · [Session 10 →](10-header-retitle.md)

## Prompt 44

**Summary:** Design the UI shown when a keyword/term is selected, following the existing design system.

- **Phase:** Design
- **Human:** 30 words · ~45 s to write
- **LLM:** Fable 5 · Claude Design · 7 min 19 s · +183 −56 lines
- **Outcome:** feature built, decision, feature designed

### Prompt

> Next, design the UI for when a keyword is selected (either by searching in the search box, or by clicking on an indexed term) Follow the design system here, too.

### Reply of Claude Design

Done. The keyword-selected state is now a real, working feature in the reading app.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": the search box holds "picture" with a count of 9. Matches are highlighted in the text. A card under the panel offers "Pin only these" and "Add to pins".*

## Prompt 45

**Summary:** Prototype five alternative highlight color options, consistent with the theme, in a separate small file.

- **Phase:** Design
- **Human:** 26 words · ~39 s to write
- **LLM:** Fable 5 · Claude Design · no timing
- **Outcome:** feature designed, process

### Prompt

> I want to test other colors for the highlights. In a small file, experiment with 5 different highlight color variants, still in line with the theme.

*The prototype after this reply (screenshot, not included): The prototype "Highlight Color Studies": five cards, each with the same three lines from the text and the word "picture" highlighted. The colors are A ochre, B sage, C clay, D slate and E plum.*

## Prompt 46

**Summary:** Pick highlight color variant D (blue) and apply it in the main file, updating the design system's accent color accordingly.

- **Phase:** Design
- **Human:** 23 words · ~35 s to write
- **LLM:** Fable 5 · Claude Design · 1 min 24 s
- **Outcome:** decision, refactor, tooling

### Prompt

> I like D, the blue one. Use that in the main file. Also update the design system to use that color as accent.

### Reply of Claude Design

Done. D (slate blue) is now the accent in the main app, and the design system has been updated to match — token swatches relabeled slate / slate-wash / slate-dark and every component treatment (pins, highlights, note rules, toggles, focused inputs) flipped to the new blue in both light and dark. The study file is still there if you want to revisit the other options.

## Prompt 47

**Summary:** Refine the selected-term info box: match its width to the control panel, replace explanatory text with a confirmation modal, and prefix the selected term with "Selected: ".

- **Phase:** Design
- **Human:** 61 words · ~2 min to write
- **LLM:** Fable 5 · Claude Design · 3 min 50 s · +84 −36 lines
- **Outcome:** constraint, decision, UX improved, verification

### Prompt

> Now let's work on the box with the information about the selected terms.
>
> 1. Its width should match the width of the control panel exactly
> 2. Remove the explanation text at the bottom (`"Pin only these" replaces...`) and instead have a modal show up to ask for confirmation.
> 3. Add the word "Selected: " before the tag containing the selected term.

### Reply of Claude Design

Done.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": a small box in the left sidebar shows "Selected: picture" with the buttons "Pin only these" and "Add to pins". The old explanation text is gone. Matching statements are highlighted.*

---

[← Session 8](08-header-alternatives.md) · [All sessions](README.md) · [Session 10 →](10-header-retitle.md)
