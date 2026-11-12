# Session 13: Per-statement share link

Claude Design · Design · 2 prompts · 97 words

[← Session 12](12-undo-toast.md) · [All sessions](README.md) · [Session 14 →](14-cross-reference-preview.md)

## Prompt 62

**Summary:** Implement a per-statement "share link" button that pins only that statement, copies a shareable link, and shows a toast confirmation — clarifying it is not a special focus UI.

- **Phase:** Design
- **Human:** 91 words · ~2 min to write
- **LLM:** Fable 5 · Claude Design · 1 min 52 s · +70 −21 lines
- **Outcome:** decision, feature designed, UX improved, content

### Prompt

> Let's take up this task:
> "Per-statement isolate control (§4) — a per-row "focus on this only" toggle that makes that statement the sole pin, also the deep-link mechanism."
>
> To be clear, this is simply a way to share a single statement by pinning it and embedding it in a sharable URL. It's not a special UI for "focus" or whatever. The button should be called "share link" in the tooltip, have a share icon, and simply show a toast saying "the link to statement X has been copied to your clipboard"

### Reply of Claude Design

Ready for review.

*The prototype after this reply (screenshot, not included): The prototype "Foldable Tractatus", close up: the mouse is on statement 1.1, which shows three small icons after its text: add note, share and pin. A dark toast below reads "The link to statement 1.1 has been copied to your clipboard".*

## Prompt 63

**Summary:** Approve the prior work and ask the assistant to mark the task as done.

- **Phase:** Design
- **Human:** 6 words · ~9 s to write
- **LLM:** Fable 5 · Claude Design · 16 s
- **Outcome:** verification

### Prompt

> good, mark the task as done.

### Reply of Claude Design

Already marked done in the TODO tracker — the item now reads as completed (`[x]`) with the implementation note. Nothing else to do.

---

[← Session 12](12-undo-toast.md) · [All sessions](README.md) · [Session 14 →](14-cross-reference-preview.md)
