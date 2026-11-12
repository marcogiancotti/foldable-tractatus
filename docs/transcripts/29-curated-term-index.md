# Session 29: Curated term index

Codex · Content · 4 prompts · 108 words

[← Session 28](28-screenshot-driven-mobile-fixes.md) · [All sessions](README.md) · [Session 30 →](30-scholarly-preset-threads.md)

## Prompt 151

**Summary:** Build the hand-curated technical-terms index for the book in a worktree, using several parallel subagents that avoid duplicating each other's entries, comprehensively covering the author's framework terms and treating qualified terms (e.g. "atomic facts") as separate entries from their base terms.

- **Phase:** Content
- **Human:** 97 words · ~2 min to write
- **LLM:** GPT-5.6 Sol · Codex · 7 min 31 s
- **Outcome:** process, constraint, decision, research, docs written

### Prompt

> work on the following task in a worktree.
>
> The app is almost complete. One thing that is missing is the hand-curated index of technical terms. You should now create that index using a suitable number of parallel subagents, but avoiding double work (e.g. two subagents listing the same word twice).
>
> The list should be comprehensive. All terms that the author uses to build his framework should be included. Often he uses composite/qualified terms, like "atomic facts". These should be taken as single index entries. So, for example, there should be separate entries for "facts" and "atomic facts".

### Reply of Codex

A qualified term can be made the single inline click target while its base term still counts that occurrence when the base is active—for example, “atomic facts” opens the `atomic fact` entry, while tracing `fact` still includes it. That gives both entries meaningful behavior without nested buttons. One naming detail affects every entry, so I’d like to lock it before finalizing the plan.

*Meanwhile: [prompt 152](27-full-book-import.md#prompt-152) in session 27 (Claude Code).*

## Prompt 153

**Summary:** Proceed to implement the previously discussed plan.

- **Phase:** Content
- **Human:** 3 words · ~5 s to write
- **LLM:** GPT-5.6 Sol · Codex · 27 min 15 s · +764 −151 lines
- **Outcome:** content, tooling, feature built, process, bug fixed, test added, docs written, verification

### Prompt

> Implement the plan.

### Reply of Codex

Implemented in worktree `~/dev/webapps/foldable-tractatus/.nn-tmp/curated-term-index` on branch `task/curated-term-index`.

- Added 339 curated terms and 510 variants in [terms.ts](~/dev/webapps/foldable-tractatus/.nn-tmp/curated-term-index/src/data/terms.ts).
- Added overlap-safe composite matching, Unicode boundaries, emphasis-spanning phrases, and consistent search/cross-reference highlighting.
- Added corpus-wide validation ensuring every entry has an independently clickable occurrence.
- Updated stale documentation.
- Preserved unrelated changes in the original checkout.
- `npm test`: 122 tests passed.
- `npm run build`: passed, with only the existing chunk-size warning.
- `git diff --check`: passed.

The code-review skill prompted fixes for search/highlight consistency and unreachable entries. Its final review:

##### Overall assessment

Approved. The prior correctness findings are resolved, with no new blocking issues found. The suite passes: 122 tests, `tsc --noEmit`, and `git diff --check`.

##### Critical

None.

##### Important

None.

##### Suggestions

- `src/components/StatementText.tsx:75-76`: `overlaps()` remains linear per token. Consider a range cursor only if profiling shows short-query rendering costs are noticeable.

##### Positives

- Cross-reference tokens now retain active-match state and visibly highlight through `RefLink`.
- The new cross-reference regression test covers the previously inconsistent `5.101` case.
- `model of reality` is attested in the corpus and owns an independently clickable occurrence.
- The inventory is restored to exactly 339 terms and 510 variants.
- Corpus-wide ownership, Unicode boundaries, qualified overlap, emphasis-spanning phrases, and visible/model consistency are covered.

##### Key recommendations

No required changes. The diff is ready to proceed.

*Meanwhile: [prompts 154–157](27-full-book-import.md#prompt-154) in session 27 (Claude Code).*

## Prompt 158

**Summary:** Commit the completed work.

- **Phase:** Content
- **Human:** 1 word · ~2 s to write
- **LLM:** GPT-5.6 Sol · Codex · 45 s
- **Outcome:** tooling, bug reported, decision

### Prompt

> commit

### Reply of Codex

Commit is staged but blocked by the nono OS sandbox protecting `~/.gnupg`; no commit was created.

Options:

- One-off: restart with `nono run --allow ~/.gnupg -- codex`, then ask me to commit again.
- Persistent: ask me to draft a derived nono profile, then promote it with `nono profile promote`.

Alternatively, run the staged commit outside Codex:

```sh
cd ~/dev/webapps/foldable-tractatus/.nn-tmp/curated-term-index
git commit -m "feat: add comprehensive technical term index"
```

*Meanwhile: [prompts 159–162](27-full-book-import.md#prompt-159) in session 27 (Claude Code).*

## Prompt 163

**Summary:** Confirm the human has committed the work and instruct the agent to delete the worktree.

- **Phase:** Content
- **Human:** 7 words · ~11 s to write
- **LLM:** GPT-5.6 Luna · Codex · 18 s
- **Outcome:** question answered, tooling

### Prompt

> I've committed, you can delete the worktree

### Reply of Codex

Removed the worktree successfully. The commit remains on branch `task/curated-term-index`; the branch itself was preserved.

---

[← Session 28](28-screenshot-driven-mobile-fixes.md) · [All sessions](README.md) · [Session 30 →](30-scholarly-preset-threads.md)
