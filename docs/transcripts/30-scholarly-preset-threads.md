# Session 30: Scholarly preset threads

Claude Code · Polish · 13 prompts · 418 words

[← Session 29](29-curated-term-index.md) · [All sessions](README.md) · [Session 31 →](31-mobile-control-labels.md)

## Prompt 169

**Summary:** Assigns the agent to research scholarly/teaching sources and propose 3-5 non-overlapping cross-cutting thread topics for the book, to be approved before adding to the code, while the human writes the introduction separately

- **Phase:** Polish
- **Human:** 106 words · ~3 min to write
- **LLM:** Opus 5 · Claude Code · 4 min 2 s · +63 −0 lines
- **Outcome:** process, research, content, docs written

### Prompt

> Two things are left to do before the core implementation is done:
>
> 1. Writing the introduction
> 2. Create a few preset threads to include out-of-the-box, replacing the current testing placeholders;
>
> The first one is my job, and I'll do it next.
>
> The seconf one is your job: don't wing it, actually read scholarly works and teaching materials from universities, and identify a few (3 to 5) topics or cross-sections of this book consisting in different sets of statements (they shouldn't overlap too much) that cut through the book differently. Before actually adding them to the source code, summarize your proposed sets and let me approve/reject them.

### Reply of Claude Code

Here are five candidate sets, each grounded in how the secondary literature and course syllabi actually carve the book. Every number verified to exist in `src/data/tractatus.ts`. I'd ship **1, 3, 4, 5** (four paths, minimal overlap) — but tell me which you want.

---

**1. `picture-theory` — "Picture theory"** (14 pins)
`2.1, 2.11, 2.12, 2.15, 2.161, 2.17, 2.18, 2.201, 2.21, 2.223, 3, 4.01, 4.021, 4.06`

The core answer to *how can a sentence be true or false at all*: a picture is a model of reality, shares logical form with it, and stands or falls by comparison. SEP and every syllabus treat 2.1–2.225 + 4.01–4.06 as one unit. Keeps the existing id so old share links and the smoke test survive.

**2. `saying-showing` — "Saying and showing"** (11 pins)
`4.022, 4.0312, 4.121, 4.1212, 4.122, 4.126, 3.332, 5.62, 6.113, 6.124, 6.522`

The distinction Wittgenstein told Russell was the main point of the book. Scattered deliberately from 3.3 to 6.5 — the set that most rewards a tree view, because it's the one theme you cannot read sequentially. *Overlap: 6.522 also in set 5.*

**3. `limits-of-my-world` — "The limits of my world"** (14 pins)
`5.6, 5.61, 5.62, 5.621, 5.63, 5.631, 5.632, 5.633, 5.634, 5.64, 5.641, 6.431, 6.4311, 6.4312`

Solipsism, the metaphysical subject as limit-not-part of the world, the eye that isn't in the visual field (5.6331 renders as your figure), extended to death and eternity. A famously self-contained argument; standard exam topic.

**4. `science-and-causality` — "Science, law, and causality"** (14 pins)
`6.3, 6.31, 6.32, 6.33, 6.341, 6.36, 6.362, 6.363, 6.36311, 6.37, 6.371, 6.372, 6.373, 6.375`

The Hume/induction cut: causality is not a law but the form of a law, the "law of least action" as a net over description, *the sun will rise tomorrow is a hypothesis*, and the "whole modern conception of the world" resting on an illusion. Cuts a region the other four barely touch.

**5. `ethics-and-the-mystical` — "Ethics and the mystical"** (12 pins)
`6.4, 6.41, 6.42, 6.421, 6.422, 6.423, 6.43, 6.432, 6.44, 6.45, 6.52, 6.522`

Value lies outside the world; ethics cannot be put into words; *not how the world is, but that it is, is the mystical*. Deliberately excludes 6.53/6.54 so it doesn't collide with the frame material.

**Also considered, cut:** a `frame` path (`4.003, 4.11–4.116, 6.53, 6.54`) for the Diamond/Conant resolute-reading frame, and a `logic-says-nothing` path (`4.46–4.464, 5, 5.43, 6, 6.1–6.13`) on tautology and the a priori. Both are good; I dropped them because #5 and #2 already reach into 6.5 and I wanted the sets kept disjoint. Say the word if you'd rather swap one in.

---

Two notes: retiring `world-and-facts` and `the-ladder` means any old share link with those `?path=` ids loses its path label (pins in `?p=` still work) — fine pre-release. And presets have no description field in the current UI, so these ship as name + pin count only; adding one-line descriptions would touch three type definitions and the 256px menu CSS. Plan is at `~/.claude/plans/two-things-are-left-deep-spring.md`.

## Prompt 171

**Summary:** Repeats the request to pick the three most important threads from the proposed set

- **Phase:** Polish
- **Human:** 14 words · ~21 s to write
- **LLM:** Opus 5 · Claude Code · 22 s
- **Outcome:** question asked, decision

The author sent this prompt 2 times. The earlier attempts:

- Prompt 170: I stopped the AI in the middle of its answer and asked again.

### Prompt

> if you had to choose the three most important threads, which would they be?

### Reply of Claude Code

If it's three, I'd take **picture theory**, **saying and showing**, and **the limits of my world**.

**1. `picture-theory`** — mandatory. It's the machinery everything else runs on; drop it and the other paths pin conclusions whose derivation isn't represented. It's also the gentlest entry point, which matters for the first row in the menu.

**2. `saying-showing`** — Wittgenstein told Russell this was the main point of the book, and it's the set that best justifies the app existing. Its members sit at 3.332, 4.02, 4.12, 5.6, 6.1, 6.5 — six different decades. Sequential reading cannot assemble it; a pin-driven view assembles it in one screen. If a first-time visitor clicks exactly one preset, this is the one that shows them what the tool does that a book doesn't.

**3. `limits-of-my-world`** — the hinge. It's where the logical apparatus turns into the ethical conclusion: the subject as limit rather than part of the world, then straight through to death not being an event in life. It's a genuine argument rather than a set of pronouncements, it's the standard exam topic, and it contains 5.6331 — the eye-and-visual-field figure you just redrew, which is a nice thing to have a preset land on.

**The close call:** `ethics-and-the-mystical` is the rival for slot 3, and there's a real case for it — Wittgenstein told von Ficker the unwritten second half was the important one. I put it behind `limits-of-my-world` on tool-fit grounds, not philosophical ones: 6.4–6.522 is almost contiguous, so a reader scrolling normally already gets it, whereas the payoff of pinning is highest where the material is scattered. Swap it in if you'd rather the presets track the book's own centre of gravity than the app's strengths.

`science-and-causality` I'd leave out of a three — most distinctive region, least load-bearing.

Want me to write those three into `src/data/paths.ts`?

## Prompt 172

**Summary:** Approves the three chosen threads and asks to replace the current presets with those three full threads

- **Phase:** Polish
- **Human:** 14 words · ~21 s to write
- **LLM:** Opus 5 · Claude Code · 3 min 33 s · +166 −16 lines
- **Outcome:** content, feature rejected, bug fixed, test added, verification

### Prompt

> Okay, let's use those three. Replace the current presets with those 3 full threads.

### Reply of Claude Code

Done. The three presets are in `src/data/paths.ts`, replacing all three placeholders.

**What shipped**

| id | name | pins |
|---|---|---|
| `picture-theory` | Picture theory | 14 (2.1–2.223, 3, 4.01–4.06) |
| `saying-showing` | Saying and showing | 11 (3.332 → 6.522, across six branches) |
| `limits-of-my-world` | The limits of my world | 14 (5.6–5.641, 6.431–6.4312) |

Each carries a short comment saying what the cut is; the file header names the sources (SEP Wittgenstein + logical atomism, IEP, UMass Phil 791T, Edinburgh PHIL10014).

**Two things beyond the plan, both forced by the code**

`src/App.smoke.test.tsx` mounts the app over the frozen 25-node fixture but was importing the *real* `READING_PATHS`. The moment the presets pinned real-text statements, two tests died with `Unknown statement: 2.15`. I added a `vi.mock('./data/paths')` alongside the existing tree mock, with fixture-scale presets — same pattern, same stated reason ("stay valid independent of the full text").

That mock removes the only thing that was accidentally validating the real pins, so I added `src/data/paths.test.ts`: every pin exists in `byId`, ids unique, no empty paths, no repeated pins. It's the test that would have caught the typo class that just bit us.

Also updated the `&path=the-ladder` example in the `urlState.ts` doc comment to a path that still exists.

**Verified**

- `npm test` — 124 passed, 11 files.
- `npm run build` — typecheck clean.
- Drove all three in Chromium at 1280×900. Menu reads "Picture theory 14 pins / Saying and showing 11 pins / The limits of my world 14 pins"; each applies with the right `?p=` and `?path=`, all pins land as real rows, no console or page errors. The screenshots read well: picture-theory is a tight 24-row view with fold markers for the skipped ranges; limits-of-my-world renders as one near-continuous argument with the 6.43x death/eternity tail hanging off it; saying-showing produces 30 peek groups spanning 3.332 to 6.522 — the one that most obviously could not be read in book order.

One judgement call worth your eye: saying-showing is the densest of the three, because 4.122 and 4.126 are long statements that render in full when pinned. I left it — the density is the theme — but if you want it lighter, dropping 4.122 and 4.126 would cut roughly a third of its vertical extent without losing the argument.

*The app after this change (screenshot, not included): The app with the "Saved threads" menu open. Under "Presets" it lists "Picture theory" (14 pins), "Saying and showing" (11 pins), and "The limits of my world" (14 pins).*

## Prompt 173

**Summary:** Requests a git commit of the current work

- **Phase:** Polish
- **Human:** 1 word · ~2 s to write
- **LLM:** Opus 5 · Claude Code · 29 s
- **Outcome:** tooling

### Prompt

> commit

### Reply of Claude Code

Committed as `ffa4f47` on a new branch `task/preset-reading-paths`.

Two notes:

- **It's on a branch, not `main`.** Your recent history commits straight to `main`, so if that's what you wanted here: `git checkout main && git merge --ff-only task/preset-reading-paths`.
- **`dashboard.html` was left alone.** Its deletion was already staged in your working tree when this session started and is unrelated to the presets, so I kept it out of the commit. It's still showing as a pending deletion.

## Prompt 174

**Summary:** Supplies a full replacement introduction text and asks the agent to proofread it and add it to the page

- **Phase:** Polish
- **Human:** 180 words · ~5 min to write
- **LLM:** Opus 5 · Claude Code · 2 min 7 s · +72 −4 lines
- **Outcome:** content, correction, UX improved, verification

### Prompt

> This is the intro I wrote to replace the current placeholder. Do a quick proofread and add it to the page.
>
> ```
>
> Ludwig Wittgenstein wrote most of the Tractatus Logico-Philosophicus (TLP) while fighting World War I. When he was done, he believed this book made philosophy obsolete, so he found a job as an elementary school teacher. While he would later change his mind on its finality, TLP remains one of the most important works of philosophy to this day.
>
> The Tractatus has an unusual shape: it's shaped not as a sequence of chapters, but as a **tree** of statements and sub-statements and sub-sub-statements. In other words, it is not a linear read but a branching set of rabbit-holes. This page is an attempt at making that tree maximally traversable and interactive. **Use the many tools available to explore, make cross-sections, annotate, fold and sculpt the book the way you prefer. You can also export your work and/or share it with others.**
>
> This is the open-domain C. K. Ogden translation of TLP. For Bertrand Russel's introduction, see [Project Gutenberg](https://www.gutenberg.org/ebooks/5740).
> ```

### Reply of Claude Code

Added, in `src/components/ReadingColumn.tsx:115` — three paragraphs replacing the one-paragraph placeholder.

**Proofread — two real corrections:**

- **"Bertrand Russel's" → "Russell's."** Two l's.
- **"open-domain" → "public-domain."** "Open domain" isn't the term; the Ogden translation is public domain.

**One wording change I made:**

- "it's shaped not as a sequence of chapters, but as a tree" → "it is not a sequence of chapters but a tree." Your version says "shape… shaped" in consecutive clauses. Trivial to revert if you'd rather keep your phrasing.

**Two I'd flag but left alone, your call:**

- "while fighting World War I" — I read this as a missing preposition and set "while fighting **in** World War I." If you meant the transitive sense deliberately, say so and I'll put it back.
- "export your work and/or share it" — I dropped the "and/or" to plain "and." It's the only change that touches your bolded call-to-action, so it's the one most worth checking.

**Markup notes**

*Tractatus Logico-Philosophicus* is in `<em>` on first mention; **tree** and the call-to-action sentence are `<strong>`; Project Gutenberg is a real link opening in a new tab.

This is the app's first anchor tag — there were no `a` styles anywhere — so I added `.rc-intro a` in `reading.css`: inherits ink color, accent-colored underline at a 3px offset, accent on hover. Also `.rc-intro strong { font-weight: 500 }`, because the intro body is weight 300 and a default 700 bold was disproportionate against it.

**Verified:** 124 tests pass, build clean, and I rendered it at 1280×900 light, 1280×900 dark, and iPhone 13 — no console errors, link href correct, three paragraphs, both themes read well.

One thing worth your judgement: the header block is now 738px tall, so on mobile the intro fills the whole first screen and the book itself starts below the fold. That's inherent to the length you wrote, not a bug — but if you want the text to survive intact while the book stays visible, collapsing paragraphs 2 and 3 behind a "more" toggle would do it.

## Prompt 175

**Summary:** Clarifies that exporting and sharing are distinct features and asks the wording to make that distinction clear

- **Phase:** Polish
- **Human:** 41 words · ~1 min to write
- **LLM:** Opus 5 · Claude Code · 2 min 0 s · +12 −8 lines
- **Outcome:** constraint, content, UX improved

### Prompt

> "exporting your work" and "sharing your work" are two very different features, and I don't want people to conflate them. The former is about exporting a file, the latter about sharing a rich link. The wording should make the distinction clear

### Reply of Claude Code

All three changes are in. The intro is now four paragraphs:

1. Wittgenstein / the war / the schoolteacher years — "TLP" gone, second mention is "the Tractatus."
2. The tree shape, ending at "…a branching set of rabbit-holes."
3. **New break here.** "This page is an attempt…" plus the bolded call to action.
4. The Ogden translation note and the Gutenberg link — now "translation of the Tractatus."

On export vs. share, the sentence now names the artifact each one produces:

> Export the result as a **Markdown or PDF file** to keep, or share a **link** that reopens your version of the book in someone else's browser.

That matches what the two controls actually do — the Export submenu offers "Export as Markdown" / "Export as PDF", while Share offers "Share pins only" / "Share pins & notes", both of which hand over a URL rather than a file. "File … to keep" against "link … in someone else's browser" is the contrast doing the work; the two are in separate clauses of a single sentence rather than joined by "and", so they don't read as one feature.

Verified: 124 tests pass, build clean, rendered at desktop light/dark and iPhone 13 with no console errors. Four `.rc-intro` paragraphs, link href correct.

Not committed — the intro changes are sitting uncommitted on `task/preset-reading-paths` alongside the preset commit from earlier. Say the word and I'll commit them.

## Prompt 176

**Summary:** Asks that the intro also mention that pin states can be bookmarked for easy access

- **Phase:** Polish
- **Human:** 16 words · ~24 s to write
- **LLM:** Opus 5 · Claude Code · 52 s · +3 −3 lines
- **Outcome:** content, decision

### Prompt

> also, it should mention that you can bookmark any pin state to make them easily accessible

### Reply of Claude Code

Added to the bolded call to action, between sculpting and exporting:

> …sculpt the book the way you prefer. **Bookmark any set of pins as a named thread to pick it up again later.** Export the result as a Markdown or PDF file to keep, or share a link…

I used "thread" as the noun because that's the word the UI uses — the control is labelled "Saved threads" and the menu heading is "My threads" — so a reader who wants to do this has a term to look for.

That placement also puts the three persistence options in ascending order of reach: bookmark (stays in this browser), export (a file you keep), share (a link someone else opens). The menu's own footer already says "Threads stay in this browser," so the intro doesn't need to repeat the locality caveat.

Verified: 124 tests pass, build clean, rendered desktop light/dark and iPhone 13, no console errors. Still four paragraphs; the header block is now 842px on desktop.

Still uncommitted, on `task/preset-reading-paths`.

## Prompt 177

**Summary:** Points out that browser bookmarking and saving a thread in the control panel are different things that got conflated in the previous edit

- **Phase:** Polish
- **Human:** 19 words · ~29 s to write
- **LLM:** Opus 5 · Claude Code · 1 min 2 s · +3 −2 lines
- **Outcome:** correction, content, question asked

### Prompt

> Hmm bookmarking with the browser and saving a thread in the control panel are different things, you conflated them

### Reply of Claude Code

Fixed — they're now two clauses naming two different mechanisms:

> **Save any set of pins as a named thread in the control panel, or bookmark the page in your browser — the address bar always carries your current view.**

"Save … in the control panel" for the in-app thread library; "bookmark the page in your browser" for the browser's own bookmarks, with the reason it works spelled out — `src/model/urlState.ts` writes pins, overrides, active term and path into the query string live, so any URL you capture restores that view.

Worth knowing about the asymmetry, since it's the kind of thing that bites later: a browser bookmark carries **view state only**. Annotations never enter the URL — they're localStorage — so a bookmark reopened in the same browser will still show your notes, but the same bookmark opened elsewhere won't. Saved threads are narrower still: just the pin set, capped at 5. The intro doesn't say any of that, which I think is right for an intro, but tell me if you want a caveat in there.

Verified: 124 tests pass, build clean, rendered at desktop light/dark and iPhone 13, no console errors. Header block is 870px on desktop now — that bolded paragraph has grown to six lines, which is the one thing I'd keep an eye on.

## Prompt 178

**Summary:** Requests the last paragraph of the intro be made a bit smaller than the rest of the text

- **Phase:** Polish
- **Human:** 10 words · ~15 s to write
- **LLM:** Opus 5 · Claude Code · 1 min 4 s · +8 −1 lines
- **Outcome:** UX improved, bug fixed

### Prompt

> Make the last paragraph a bit smaller than the rest.

### Reply of Claude Code

The source note is now a step down — `rc-intro rc-intro-fine`, 17px → 15px.

I also muted it to `--ink60` alongside the size drop. Size alone at a 2px delta is a weak signal at this line length; the two together make it read clearly as apparatus rather than a fourth beat of the intro. If you only wanted the size change, say so and I'll drop the color line.

One implementation note: the rule is `.rc-intro.rc-intro-fine`, two classes on purpose. `mobile.css:26` sets `.rc-intro { font-size: 16px }` inside a media query, so a single-class rule would lose to it on phones and the paragraph would come out *larger* than the desktop version. The doubled selector outranks it at every width.

Verified: 124 tests pass, build clean, rendered desktop light/dark and iPhone 13, no console errors. The muted grey holds up in dark mode — it's `--ink60` in both themes, so it tracks the palette rather than being a hardcoded grey.

Everything from this turn plus the earlier intro work is still uncommitted on `task/preset-reading-paths`.

*The app after this change (screenshot, not included): The app: the top of the page, with an introduction of three paragraphs. The last one, about the Ogden translation and Project Gutenberg, is smaller and lighter gray.*

## Prompt 179

**Summary:** Requests a git commit of the current work

- **Phase:** Polish
- **Human:** 1 word · ~2 s to write
- **LLM:** Opus 5 · Claude Code · 16 s
- **Outcome:** tooling

### Prompt

> commit

### Reply of Claude Code

Committed as `ceeb548`.

That's both branch commits now:

- `ffa4f47` — the three preset reading paths
- `ceeb548` — the introduction

`dashboard.html` is still left out — that deletion predates this session and is unrelated to either change.

The branch is still unmerged. To land it the way your history normally goes: `git checkout main && git merge --ff-only task/preset-reading-paths`.

## Prompt 180

**Summary:** Asks to fold the dashboard deletion into the last commit rather than making a separate one

- **Phase:** Polish
- **Human:** 8 words · ~12 s to write
- **LLM:** Opus 5 · Claude Code · 25 s
- **Outcome:** tooling, bug reported

### Prompt

> include the dashboard deletion in the last commit

### Reply of Claude Code

Amended — `ceeb548` → `97dde83`, now carrying the `dashboard.html` deletion. Working tree is clean.

Amending rewrote the commit, which is safe here: `task/preset-reading-paths` has no upstream and was never pushed.

One thing I found while writing the message. I looked at what `dashboard.html` actually contained before deleting it, and it isn't a dashboard — it's two lines of GitHub's "429 Too Many Requests" error page, captured by a scrape that got rate-limited. It went in via `6bf7965 chore: commit agent skills, dashboard, and skills lockfile`. So the deletion is clearly correct, but you may want to check whether anything else from that commit is the same kind of truncated-fetch artifact.

Branch state:

- `ffa4f47` — three preset reading paths
- `97dde83` — introduction + dashboard.html removal

Still unmerged: `git checkout main && git merge --ff-only task/preset-reading-paths`.

## Prompt 181

**Summary:** Requests merging the current branch, pushing it, and deleting the old working branch

- **Phase:** Polish
- **Human:** 8 words · ~12 s to write
- **LLM:** Opus 5 · Claude Code · 32 s
- **Outcome:** tooling, verification

### Prompt

> merge, push, and delete the old working branch

### Reply of Claude Code

Done. `main` fast-forwarded, pushed, branch deleted.

- Fast-forward `096a9d5..97dde83` — no merge commit, linear history preserved.
- Pushed to `gitlab.com:[account]/foldable-tractatus.git` (not GitHub, despite the `gh`-flavoured artifact in that dashboard file).
- `task/preset-reading-paths` deleted with `-d`, which only succeeds on a fully merged branch — so that's also a confirmation the merge took.

Working tree is clean and `main` is level with `origin/main`. Both core-implementation items are now landed: your introduction, and the three reading paths replacing the placeholders.

---

[← Session 29](29-curated-term-index.md) · [All sessions](README.md) · [Session 31 →](31-mobile-control-labels.md)
