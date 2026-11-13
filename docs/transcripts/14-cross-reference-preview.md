# Session 14: Cross-reference preview

Claude Design · Design · 3 prompts · 70 words

[← Session 13](13-per-statement-share-link.md) · [All sessions](README.md) · [Session 15 →](15-keyboard-shortcuts-modal.md)

## Prompt 64

**Summary:** Implement the next item on an (externally tracked) design task list: an in-place cross-reference preview.

- **Phase:** Design
- **Human:** 10 words · ~15 s to write
- **LLM:** Fable 5 · Claude Design · 4 min 31 s · +181 −55 lines
- **Outcome:** feature designed, decision, content, constraint

### Prompt

> implement the next design task item: "Cross-reference in-place preview (§10)."

### Reply of Claude Design

Cross-reference in-place preview (§10) is built and the TODO is updated. Remaining unbuilt spec items are keyboard navigation (§12) and the Markdown/HTML/JSON export formats (§8), if you'd like those next.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus": a small popup beside statement 2.11 previews the cross-referenced statement 2.14 in full, with a "Go to statement 2.14" link. The "(cf. 2.14)" reference is highlighted.*

## Prompt 65

**Summary:** Point out that cross-references should only apply to Wittgenstein's own citations, not fabricated "(cf. n.nn)" references, and ask only the spec document's text be clarified, not the UI.

- **Phase:** Design
- **Human:** 48 words · ~1 min to write
- **LLM:** Fable 5 · Claude Design · 25 s · +10 −6 lines
- **Outcome:** correction, decision, docs written

### Prompt

> The UI is fine. Nitpick: it's not meant to add references like "(cf. n.nn)" like that. This functionality is only meant for the actual cross-references that Wittgenstein wrote in his text. But don't bother fixing the design, it's okay as a UI reference. Just clarify the doc's text.

### Reply of Claude Design

Clarified in the doc: the `(cf. N)` references in the demo data are noted as fabricated placeholders for UI-reference purposes, and the feature is meant to fire on Wittgenstein's own cross-references, not injected ones.

## Prompt 66

**Summary:** Ask the assistant to mark the current task done and report the remaining open tasks.

- **Phase:** Design
- **Human:** 12 words · ~18 s to write
- **LLM:** Fable 5 · Claude Design · 25 s
- **Outcome:** question asked, process

### Prompt

> mark the task as done and tell me the remaining open tasks

### Reply of Claude Design

The cross-reference task is already marked `[x]` in the TODO doc.

Remaining open tasks (from `TODO - Missing from spec.md`):

- **Keyboard navigation (§12)** — arrow keys + j/k to move between statements; keys for expand/fold and pin. Only the `/` search hint exists today.
- **Export formats (§8)** — the export menu should offer Markdown, HTML (styled), and JSON (round-trip). Currently it shows Markdown + PDF; HTML and JSON are missing, and PDF isn't in the spec.

Everything else is either done or intentionally deferred (cloud save/sync UI §7, empty-state pattern).

---

[← Session 13](13-per-statement-share-link.md) · [All sessions](README.md) · [Session 15 →](15-keyboard-shortcuts-modal.md)
