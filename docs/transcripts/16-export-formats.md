# Session 16: Export formats

Claude Design · Design · 2 prompts · 45 words

[← Session 15](15-keyboard-shortcuts-modal.md) · [All sessions](README.md) · [Session 17 →](17-search-box.md)

## Prompt 72

**Summary:** Open a discussion on export formats and ask the agent's opinion on what's missing.

- **Phase:** Design
- **Human:** 14 words · ~21 s to write
- **LLM:** Fable 5 · Claude Design · 33 s
- **Outcome:** question asked

### Prompt

> Let's discuss the last remaining task, Export formats. What do you think is missing?

### Reply of Claude Design

Here's my read on the gap. The spec (§8) names three export formats, each with a distinct purpose:

- **Markdown** — readable study export: pinned statements with lineage + all annotations, in reading order.
- **HTML (styled)** — self-contained pretty rendering of that same export, for reading/printing outside the app.
- **JSON (round-trip)** — the full pin+annotation set, re-importable to restore working state.

What the current menu has: **Markdown + PDF**. So concretely:

1. **PDF doesn't belong** — it's not in the spec. The spec's "for printing" intent is carried by the *styled HTML* export, not a separate PDF. I'd drop PDF.
2. **HTML (styled) is missing.**
3. **JSON (round-trip) is missing.**

Two design questions beyond just adding two rows:

**A. The three formats aren't peers, and bare labels hide that.** Markdown and HTML are both "study document" outputs (same content, different dressing); JSON is a fundamentally different thing — a state file you'd never *read*, only re-import. Stacking three identical-looking rows misrepresents that. I'd give each item a one-line descriptor, and possibly a subtle divider setting JSON apart as the "backup / move to another browser" option.

**B. Round-trip implies import.** JSON export only pays off paired with an import path (§6 "export annotations and pins as a file and re-import them in another browser"). The TODO scopes this task to export *formats* only, but the menu is the natural home for an "Import…" affordance too. Worth deciding now whether to include it or explicitly defer.

My recommendation: replace the two rows with the three spec formats, add short descriptors, visually separate JSON, and add an "Import annotations…" row beneath it (or defer it with a note).

Want me to build that? And on import — include it now, or leave it out of scope?

## Prompt 73

**Summary:** Change the spec: drop JSON export since import was scrapped, and prefer PDF over HTML export.

- **Phase:** Design
- **Human:** 31 words · ~47 s to write
- **LLM:** Fable 5 · Claude Design · 29 s · +12 −9 lines
- **Outcome:** feature rejected, docs written, decision

### Prompt

> I'm changing the spec:
> - We scrapped the import functionality, so no need for JSON export any more.
> - I'm not sure HTML is convenient for most people. PDF is better.

### Reply of Claude Design

Done. The change actually closes the task with no design work needed — the export menu already shows **Markdown + PDF**, which is now exactly what the spec calls for.

Updated the spec (§8 → two formats, plus a note in §6 that import was scrapped) and marked the TODO item resolved. That was the last open item on the list.

One optional polish if you want it: the two menu rows are bare labels. I could add a one-line descriptor under each ("study notes in reading order" / "for printing"), but it's not required by the spec — happy to leave as-is.

---

[← Session 15](15-keyboard-shortcuts-modal.md) · [All sessions](README.md) · [Session 17 →](17-search-box.md)
