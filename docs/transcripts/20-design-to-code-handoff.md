# Session 20: Design-to-code handoff

Claude Design · Design · 2 prompts · 89 words

[← Session 19](19-save-icon-swap.md) · [All sessions](README.md) · [Session 21 →](21-private-skills-tooling-detour.md)

## Prompt 77

**Summary:** Ask the agent to prepare modular handoff documents so the coding agent can build the app, reading only the files relevant to each component.

- **Phase:** Design
- **Human:** 43 words · ~1 min to write
- **LLM:** Fable 5 · Claude Design · 8 min 27 s · +1199 −0 lines
- **Outcome:** docs written, constraint, decision, correction

### Prompt

> The design is now sufficiently well-defined. Prepare documents to hand off this design to the coding agent to actually build the app. Keep the files modular, so that the agent can choose to read only the files for the single components it needs.

### Reply of Claude Design

Built a modular `handoff/` package the coding agent can navigate file-by-file:

- **README.md** — index, sources of truth (spec / principles / design system / **prototype**), reading order, and a flagged inconsistency: accent is named `--ochre` but renders slate blue — build to `#4E6C90` / `#93B4D8`.
- **01-architecture** · **02-data-model** · **03-focused-view-algorithm** — shell/layout/theming, all data shapes + persistence/link encoding, and the core Full/Peek/Collapsed/Hidden derivation (the gate).
- **design/** — `tokens.md` and `interaction-rules.md` (the five rules as build constraints).
- **components/** — one self-contained file each for reading column, statement row, peek range, annotation note, inline term marking, cross-reference preview, control panel, search + term card, saved threads, export menu, confirm modal, undo toast, reader guide.
- **04-build-plan.md** — M0–M8 milestones with per-step "read these docs" + acceptance criteria.

Two things I surfaced from the TODO audit so they don't get built as-is: the seeded `(cf. N)` cross-refs and the seeded peek/expand demo state are **placeholders** — the real app derives peeks from pins and fires refs on Wittgenstein's actual citations. Both are called out in the relevant docs.

Want me to also generate a starter data schema file (JSON/TS types for the tree + term index) the agent can drop in, or leave data shapes as the documented examples?

*Meanwhile: [prompt 78](21-private-skills-tooling-detour.md#prompt-78) in session 21 (Claude Code).*

## Prompt 80

**Summary:** Check whether the actual design files were included in the handoff folder, reiterating that this was the whole point of making it modular.

- **Phase:** Design
- **Human:** 46 words · ~1 min to write
- **LLM:** Fable 5 · Claude Design · 3 min 51 s · +874 −73 lines
- **Outcome:** correction, docs written, process

### Prompt

> did you put the actual design files in the handoff folder? that's by far the most important part. THat's the whole reason I asked you to make it modular: so that the agent that implements it has access to the implemented components one at a time.

### Reply of Claude Design

Fixed. `handoff/source/` now holds the actual design files verbatim (the working prototype, design system, tokens, exploration files), and every `handoff/components/*.md` ends with a real, copy-pasteable code excerpt — exact template markup + JS — pulled from `Foldable Tractatus.dc.html` for just that piece. An agent building the statement row now opens one small doc and gets working code, not a description of one.

---

[← Session 19](19-save-icon-swap.md) · [All sessions](README.md) · [Session 21 →](21-private-skills-tooling-detour.md)
