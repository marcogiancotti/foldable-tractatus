# Transcripts of the build

These files hold the prompts that the author sent to AI tools to make the
Foldable Tractatus, from the first specification to the accessibility audit.
There are 191 prompts in 33 sessions, in 4 tools.
Each file is one session.

## What a file holds

For each prompt, a file gives:

- The number of the prompt. The numbers follow the order in which the author sent the prompts, over all the sessions.
- A one-line summary of the prompt.
- The phase of the work: Specification, Design, Implementation, Content or Polish.
- **Human:** the length of the prompt, an estimate of the time to write it at 40 words per minute, and the attached images and files.
- **LLM:** the model, the tool, the time from the prompt to the end of the reply, and the lines of code that the reply added and removed.
- **Outcome:** what the prompt and its reply did, as one or more types.
- The text of the prompt, as the author wrote it, with the attached images.
- The reply: the last message of the AI in its turn, and each round of questions that the AI asked, with the message before it and the answers of the author.
  The transcripts do not include the other messages and the tool calls of the AI.

When the author sent a prompt again with the same text, the transcript keeps only the last attempt.
A note gives the earlier attempts and why the author sent the prompt again.
Some sessions ran at the same time as others.
A "Meanwhile" line shows the prompts of other sessions between two prompts of a session.

## Private data

The transcripts do not include private data.
A text in square brackets shows where private data was removed, for example `[account]`, `[private link]`, `[email address]` or `[bundle id]`.
Paths in the home folder start with `~`.

## Sessions

| # | Session | Tool | Phase | Prompts | Words |
|--:|---|---|---|--:|--:|
| 1 | [Specification from scratch](01-specification-from-scratch.md) | Claude Web | Specification | 6 | 1801 |
| 2 | [Quick-and-ugly wireframes](02-quick-and-ugly-wireframes.md) | Claude Design | Design | 2 | 209 |
| 3 | [Palette, typography, density, vibe](03-palette-typography-density-vibe.md) | Claude Design | Design | 5 | 354 |
| 4 | [First foldable contents component](04-first-foldable-contents-component.md) | Claude Design | Design | 3 | 149 |
| 5 | [Left control panel](05-left-control-panel.md) | Claude Design | Design | 3 | 121 |
| 6 | [Side-panel iteration](06-side-panel-iteration.md) | Claude Design | Design | 19 | 570 |
| 7 | [Annotation style](07-annotation-style.md) | Claude Design | Design | 3 | 85 |
| 8 | [Header alternatives](08-header-alternatives.md) | Claude Design | Design | 4 | 141 |
| 9 | [Search-hit state](09-search-hit-state.md) | Claude Design | Design | 4 | 140 |
| 10 | [Header retitle](10-header-retitle.md) | Claude Design | Design | 2 | 72 |
| 11 | [Gap audit and task list](11-gap-audit-and-task-list.md) | Claude Design | Design | 8 | 188 |
| 12 | [Undo toast](12-undo-toast.md) | Claude Design | Design | 2 | 30 |
| 13 | [Per-statement share link](13-per-statement-share-link.md) | Claude Design | Design | 2 | 97 |
| 14 | [Cross-reference preview](14-cross-reference-preview.md) | Claude Design | Design | 3 | 70 |
| 15 | [Keyboard-shortcuts modal](15-keyboard-shortcuts-modal.md) | Claude Design | Design | 5 | 202 |
| 16 | [Export formats](16-export-formats.md) | Claude Design | Design | 2 | 45 |
| 17 | [Search box](17-search-box.md) | Claude Design | Design | 1 | 63 |
| 18 | [Annotated-sketch edit](18-annotated-sketch-edit.md) | Claude Design | Design | 1 | 27 |
| 19 | [Save-icon swap](19-save-icon-swap.md) | Claude Design | Design | 1 | 15 |
| 20 | [Design-to-code handoff](20-design-to-code-handoff.md) | Claude Design | Design | 2 | 89 |
| 21 | [Private-skills tooling detour](21-private-skills-tooling-detour.md) | Claude Code | Implementation | 1 | 33 |
| 22 | [The greenfield build](22-the-greenfield-build.md) | Claude Code | Implementation | 13 | 345 |
| 23 | [Manual-test bug rounds](23-manual-test-bug-rounds.md) | Claude Code | Implementation | 25 | 1505 |
| 24 | [Sharing-feature Q&A](24-sharing-feature-q-a.md) | Claude Code | Implementation | 1 | 32 |
| 25 | [Mobile usability, round one](25-mobile-usability-round-one.md) | Claude Code | Implementation | 5 | 172 |
| 26 | [Mobile annotation saving](26-mobile-annotation-saving.md) | Claude Code | Content | 8 | 279 |
| 27 | [Full-book import](27-full-book-import.md) | Claude Code | Content | 26 | 758 |
| 28 | [Screenshot-driven mobile fixes](28-screenshot-driven-mobile-fixes.md) | Claude Code | Content | 7 | 219 |
| 29 | [Curated term index](29-curated-term-index.md) | Codex | Content | 4 | 108 |
| 30 | [Scholarly preset threads](30-scholarly-preset-threads.md) | Claude Code | Polish | 13 | 418 |
| 31 | [Mobile control labels](31-mobile-control-labels.md) | Claude Code | Polish | 3 | 57 |
| 32 | [Favicon and fold-all icon](32-favicon-and-fold-all-icon.md) | Claude Code | Polish | 2 | 53 |
| 33 | [Accessibility audit](33-accessibility-audit.md) | Claude Code | Polish | 5 | 237 |
