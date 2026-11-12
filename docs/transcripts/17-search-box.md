# Session 17: Search box

Claude Design · Design · 1 prompt · 63 words

[← Session 16](16-export-formats.md) · [All sessions](README.md) · [Session 18 →](18-annotated-sketch-edit.md)

## Prompt 74

**Summary:** Check whether the search box (added during design but not in the original spec) should be kept, and if so make typing in it behave like clicking an indexed word but accept any characters, with the same hit visualization.

- **Phase:** Design
- **Human:** 63 words · ~2 min to write
- **LLM:** Fable 5 · Claude Design · 2 min 0 s · +18 −4 lines
- **Outcome:** decision, docs written, constraint, verification

### Prompt

> In this design phase we added a search box, which I believe isn't in the original spec. I want it, so check the spec and add it if necessary. The idea is that typing there triggers the same behavior as clicking an indexed word, except this box accepts any characters you type, regardless of indexing. But the visualization of hits is the same.

### Reply of Claude Design

The search box is already built and behaves exactly as you described — I verified it live (typing the non-indexed word "silent" highlights the hit, shows "1 occurrence · 1 statement," and offers Pin only these / Add to pins, identical to clicking a curated term). Prefix matching, folded-branch count badges, and clear-to-reset all work.

The gap was in the spec, not the design: §9 explicitly ruled out a "click-any-word concordance." I added **§9a** documenting the search field as a *complement* to the curated inline index (inline marking stays curated-only; the search field accepts any text but reuses the same active-term visualization), and logged it in the audit TODO. No code change was needed.

---

[← Session 16](16-export-formats.md) · [All sessions](README.md) · [Session 18 →](18-annotated-sketch-edit.md)
