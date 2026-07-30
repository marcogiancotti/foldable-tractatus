# The Foldable Tractatus — Specification (v0.6)

*High-level functional and conceptual spec. Deliberately excludes technology choices and UI/UX design; those are decided later. This document describes **what** the app does and **why**, not **how** it is built or how it looks.*

*Date: 2026-07-30 · Changes since v0.5: consecutive peeks merge into a range (§5), settling open question 1; two new sections — measurement (§7a) and accessibility (§12a); §13's export list corrected against §8; the statement count corrected to 526. Section numbers are stable — additions take a letter suffix, as §9a did, because the implementation cites §N.*

---

## 1. Concept

The Foldable Tractatus is a single web page that presents the whole of Wittgenstein's *Tractatus Logico-Philosophicus* as a foldable tree of statements.

The book is uniquely suited to this. Wittgenstein deliberately numbered his 526 remarks in a decimal hierarchy (1, 1.1, 1.11, …) where each statement `n.m` is a comment on statement `n`, and the number encodes the statement's logical weight. There are seven root propositions; proposition 7 has no descendants. The numbering **is** a tree — the app simply lets the reader navigate that tree instead of reading it as flat prose.

The reading experience is one of **controlled disclosure**: the reader opens only the branches they care about, keeps the rest quiet, marks what matters, annotates it, and can share or resume any of this later.

## 2. Source text

- The public-domain **C. K. Ogden (1922) English translation** is the sole text, in English only.
- **526 numbered remarks**, which is what the transmitted text actually contains: 526 distinct decimal numbers, each carrying text, every one of them the child of a number that also exists. The figure "525" is quoted often enough to be worth naming here as a counting convention rather than a discrepancy in the data — the app derives its counts from the text, so the text decides.
- Preparing the text is a build-time task: obtaining a cleanly-formatted copy and encoding it as the fixed statement tree (each statement carries its decimal id, its text, and its parent).
- **Mathematical notation** in statement text is authored as inline `$…$` LaTeX and rendered typeset (KaTeX) wherever the text appears — reading column, cross-reference previews, print view. Math never participates in term marking or search counts, and exports keep the raw LaTeX (the standard math-in-Markdown convention). Annotations are unaffected: they stay plain text (Section 6).
- A **curated term index** (Section 9) is also a build-time deliverable derived from a careful reading of the text — it is authored, not generated at runtime.

## 3. Core reading model — the foldable tree

- Every statement is a node in a fixed tree. Each node can be **collapsed** (its children hidden) or **expanded** (its children revealed).
- **Default state:** fully folded. Only the seven root propositions are visible.
- **Unfold one level:** a control next to a statement reveals only that statement's direct children (one level), so the reader descends gradually.
- **Re-fold:** the same control collapses a statement's children again.
- **Global controls:** *Fold all* and *Unfold all* act on the whole tree (Fold all interacts with pins — see Section 5).
- **No level-skipping:** a descendant is never shown without its full chain of ancestors also being present. The hierarchy is always legible.

## 4. Pinning and sharing a statement

- Each statement has a **pin** control. Pinning marks a statement as personally significant.
- Each statement also has a **share** control: it copies that statement's deep link (Section 12) to the clipboard, confirmed by a toast. It is for handing a single statement to someone else and **never alters the sharer's own view** — no pins change, nothing folds, nothing enters the undo history. Only the *recipient* opening the link gets the isolated view.
- Pins are the backbone of focused reading, sharing, export, and reading paths.
- The reading column's information line reports the **number of pinned statements** (alongside the statement and branch counts) whenever anything is pinned, in the same accent treatment as the annotation count — the reader's own marks stand apart from the fixed text's numbers.
- A prominent **"unpin all"** action clears the entire pin set. Because it destroys a possibly carefully-built pin set, it asks for confirmation first, with the same brief warning-and-confirm treatment as the other pin-replacing actions — and, like them, it is a single, clearly-undoable step (Section 12). Manual expansion survives it; only the pins go.

## 5. Focused reading (the folded-with-pins view)

*Approved (tentative). This is the app's signature reading mode and resolves how non-pinned siblings behave.*

When the reader folds everything while pins exist, the tree does not collapse to bare roots. Instead it presents a **focused view** in which every statement is in one of four display states:

- **Full** — text shown in full.
- **Peek** — presence indicated by a minimal, low-emphasis marker that says "statements exist here, expandable," without the full text. **Consecutive peeks at the same depth merge into a single range row** rather than each taking a row of its own: a run of quiet siblings reads as one compact "these are also here" line naming the range it covers. This is what keeps a peek genuinely quiet — under a wide parent, one row per peeked sibling is no quieter than showing them.
- **Collapsed** — text shown, children hidden.
- **Hidden** — not rendered (only beneath a collapsed or peek ancestor).

The focused view is **derived** from the pin set and the tree, by these rules:

1. The seven roots are always shown.
2. A node is **expanded** only if it is a pinned statement's ancestor; otherwise it is collapsed.
3. Under an expanded node, each child is shown **Full** if it is pinned or is itself an ancestor of a pin, and **Peek** otherwise.
4. Everything below a collapsed or peek node is Hidden.
5. Adjacent peeks at one depth are then collapsed into one range row.

The effect: pinned statements and their exact lineage read clearly, while their siblings remain present-but-quiet as peek ranges, so the reader always knows there is more material at that level without being distracted by it. The reader can promote a range's members to full rows by expanding it.

Crucially, peeks are **computed, not managed** — the reader never sets them. The only per-statement state beyond the pin set is any **manual expansion/collapse override** the reader applies on top of the derived view; these are sparse and are what gets persisted (Section 13).

## 6. Annotations

- The reader can attach a personal **annotation** to any statement, and edit or delete it.
- **Plain text only.** Annotations are never parsed, interpreted, or rendered as markup (no Markdown, no HTML, no rich text). They are stored as text and displayed as text — inserted as text content, never as markup — so there is **no rendering step and no injection surface**, even for annotations that arrive in an imported or synced bundle. Line breaks are preserved, so multi-paragraph notes still read cleanly.
- **No edit/save flow.** There is a single text field; changes **autosave automatically after a short debounce** as the reader types. There is no separate display mode and no explicit Save action. **Enter closes the editor** (the note is already saved); **Shift+Enter inserts a line break**.
- **Deletion** is an explicit control at the bottom of the open note editor (a trash icon). It asks for confirmation, and — like any annotation change — is a single undoable step.
- **Length cap:** annotations are bounded, not unbounded. Cap: **1,000 characters** per annotation (about 150–175 words). Remaining budget is shown as the reader approaches it.
- **Margin notes never overlap.** When notes crowd each other (folding often brings annotated statements close together), a long note rests folded to its first few lines, and notes slide down just enough that none covers another. Opening a note (click, or editing it) expands it in place while its neighbours make room — nothing is ever occluded. Every margin note is labelled with its statement's number, so the pairing stays legible even when a note has slid away from its row.
- Annotations are private study notes. They persist locally between sessions automatically, and are **never** carried in the shareable link (Section 7).

## 7. Sharing and persistence

Two kinds of state are handled separately, because they differ greatly in size and purpose.

**View state** — which statements are expanded (overrides), which are pinned, the active term, the active reading path. Small and bounded. It is **encoded in the shareable link**, so a reader can hand someone the exact view they are looking at, and the view survives a page reload.

**Annotations** — potentially large, personal, authored content. Handled three ways:
- **Local persistence** — retained on the reader's device automatically.
- **Export** — the reader can export annotations and pins as a file (formats in Section 8). _(Import was scrapped.)_
- **Optional cloud save/sync (opt-in)** — a lightweight, opt-in way to save an annotation set under a private, unguessable link, so the same reader can resume on another device, or hand a full annotated copy to someone else, without shuffling files. Design posture:
  - Content is **encrypted in the browser before upload**; the decryption key travels **only in the link fragment** and is never sent to the host. The host stores only unreadable ciphertext ("your notes stay yours").
  - Because access is anonymous and free (no login), the store is a **convenience layer over durable local+export copies**, and is hardened against abuse rather than treated as a vault: unguessable high-entropy ids; a hard per-bundle size cap; write rate-limiting; time-to-live expiry so storage self-cleans; and the store only ever accepts conforming encrypted bundles and serves them as opaque data (never rendered or served as executable/active content). If abuse appears, a lightweight write barrier (e.g. proof-of-work or a page-minted token) can be added without changing the client model.
  - No oversized "everything-in-the-link" export.

### 7a. Measurement (added v0.6, 2026-07-30)

A deployment may optionally measure whether the app is doing its job. This section exists because §7 otherwise implies that nothing but notes and view state ever leaves the browser, and that is only true of a deployment with measurement switched off.

- **Off unless deliberately configured.** With it unconfigured — the default, and what a fork or a development build gets — nothing is loaded and no request is made. There is no partial state: it is configured, or it is inert.
- **Aggregate and cookieless.** No visitor identifier, no cross-site tracking, no profile of a reader across sessions.
- **Nothing the reader authored is ever measured.** Annotations are not read at all. A free-text search is counted as the fact that a search happened, never as the text typed. A saved thread's name never travels. Only fixed, already-published vocabularies — the curated term index (§9), the curated reading paths (§11) — are ever named, because naming them reveals nothing about the reader that the app did not ship to everyone.
- **Every measured value is a bounded label.** Counts and depths are reported as milestones from a fixed set, not as numbers. An unbounded value is a long tail, and a long tail is how aggregate measurement quietly becomes identifying.
- **What is worth measuring is the reading, not the visiting.** The app is one page per session, so visit counts and time-on-page say very little. What matters is whether readers descend the tree, pin, annotate, trace a term, and return — the ladder from arrival to real use.
- Readers who signal that they do not wish to be measured are not measured.

These are requirements, not implementation notes: the first four are enforced in code and tested. The event catalogue itself is deliberately kept out of this document — it changes at a different pace than the spec does.

## 8. Export

Two formats:
- **Readable study export (Markdown):** the pinned statements, shown with their lineage (ancestors), together with all annotations (including annotations on non-pinned statements), in reading order. The statements provide the Markdown structure; annotations appear as their plain text.
- **Printable export (PDF):** a self-contained rendering of that same export, for pleasant reading or printing outside the app.

_(Removed: styled-HTML export — PDF covers the print/read-outside case more conveniently. Removed: JSON round-trip export — import functionality was scrapped, so there is no working state to restore.)_

## 9. Technical terms (curated, surfaced inline)

- The app carries a **hand-curated index** of the Tractatus's technical vocabulary. There is **no** automatic click-any-word concordance, and **no separate glossary section, list, or panel**.
- The curated data records, for each term, its **canonical form and variant forms** (inflection stems, abbreviations, alternative renderings). The app derives the set of matching statements from the fixed text, so occurrence data cannot drift from the corpus. Building the index is a careful analysis of the whole text (method and scope — Section 14).
- Terms are marked **unobtrusively inline within the statement text itself**. The reader activates the feature by clicking a marked term where it appears in the text.
- Activating a term:
  - **Highlights every visible occurrence** across the tree.
  - **Surfaces hidden occurrences** that sit inside folded branches as a small **count** shown beside the collapsed branch, in the same colour as the inline term highlight, indicating how many occurrences lie within. The reader can expand to reach them, or use auto-pin.
  - Offers to **pin its occurrences**, with an explicit choice between two clearly-labelled actions: **"Pin only these"** (replaces the current pins) and **"Add these to pins"** (extends them). The replacing action carries a brief explanatory warning that it will clear existing pins, and — like all pin-replacing actions — is a single, clearly-undoable step with an immediately-visible way to undo it (Section 12), so a mis-click never silently destroys a carefully-built pin set.

### 9a. Free-text search (added v0.5, 2026-07-06)

- A **search field** in the control panel complements the curated inline index. It is a plain free-text entry, not the click-any-word concordance §9 rules out: the inline marking remains restricted to the hand-curated vocabulary, and there is still no separate glossary section.
- Typing a query establishes exactly the **same active-term state** a curated-term click produces — it simply accepts **any characters, regardless of whether the query is an indexed term.** Everything downstream is identical: visible occurrences highlight, hidden occurrences inside folded branches show the same count badge, and the term card offers the same **"Pin only these" / "Add to pins"** actions (with the same undoable warning).
- Matching is prefix-based per word (a query matches a word and its inflections), mirroring the curated-term match behaviour so the two entry points feel like one feature.
- Clearing the field (or its close affordance) drops the active-term state entirely.

## 10. Cross-references

- Where a statement refers to another statement, that reference is interactive.
- Activating a reference opens a small **in-place preview** of the referenced statement's content, rather than jumping the reader away.
- The preview contains a link the reader can follow to navigate to the referenced statement if they choose.

## 11. Reading paths (curated preset pin-sets)

- The app ships a small set of **curated reading paths** — named, pre-built pin-sets that trace a theme through the book (for example, the picture theory, the saying/showing distinction, or the closing ladder).
- Selecting a reading path establishes its pins and drops the reader into the focused view for that thread.
- Applying a reading path — or one of the reader's saved personal threads — **replaces the current pin set**. When pins already exist, the app therefore asks for confirmation first, with the same brief warning-and-confirm treatment as "Pin only these" (Section 9); when no pins are set it applies immediately. Like every pin-replacing action, it remains a single, clearly-undoable step (Section 12).
- A reading path is just a pin-set, and pin-sets are part of view state, so a reader can also **share their own arrangement as a link** — curated paths and personal sharing use the same mechanism.
- The reader's saved personal threads live outside the in-app history, so **deleting a thread is not undoable** — deletion therefore asks for confirmation first.

## 12. Navigation and history

- **Deep-linkable statements:** every statement is individually addressable by a link that, when opened, pins that statement alone and scrolls it into view. The link is obtained from the statement's share control (Section 4) without disturbing the sharer's own state.
- **Keyboard navigation:** move between statements with the arrow keys (and also j/k for readers who prefer them), with keys for expand/fold, pin, share, and opening the annotation editor. Every action a statement row offers to the mouse is reachable from the keyboard, and a row reveals its controls when focused rather than only on hover. `/` focuses the search box, reopening the control panel first if it is collapsed. Enter or Esc in the box leaves it — the box visibly drops to its resting look (the query and any active term stay) and focus moves to the first statement, so the keyboard immediately drives text navigation again. `?` opens the reader guide, which is where the shortcuts are documented for the reader.
- **Single-key shortcuts are scoped and defeatable.** They apply only while focus is inside the reading tree, so the page stays scrollable from the keyboard and typing into a field never triggers an action; modifier combinations and Esc are exempt from the scoping. The reader can also turn single-key shortcuts off entirely — a hard requirement for anyone using speech input, for whom stray keystrokes are not hypothetical.
- **Undo / redo:** the app keeps its own in-app history of actions (fold, pin, "Pin only these", annotate, apply reading path), traversable with undo/redo. It is **not** wired to the browser Back button, so navigation is never hijacked and history is never flooded. Native text-editing undo inside an annotation field works as usual. **Pin-replacing actions ("Pin only these", applying a reading path or saved thread, unpin all) are single undoable steps** and surface an immediate undo affordance so an accidental replacement is trivially reversible. At minimum, the reader can always recover prior states within a session.

### 12a. Accessibility (added v0.6, 2026-07-30)

Written as behaviour rather than markup, per this document's stated exclusion of implementation — but these are requirements, not aspirations, and they are verified automatically.

**The tree is the app, so the tree must be perceivable non-visually.** Depth conveyed only by visual indentation is depth that does not exist for a reader who is not looking at it. Each statement is therefore announced with its level, its position among its siblings, how many siblings there are, and whether it is expanded, collapsed, or a peek range — the same four states §5 derives. A statement and its margin note are **one** node, not two, because they are one thing the reader is reading.

**The whole book is one stop in the tab order.** A 526-statement document whose every row holds several controls would otherwise put on the order of a thousand stops between the reader and anything past the top of the page. Movement *within* the tree is by arrow keys (§12); Tab moves between the page's regions. The page offers a way to skip past the chrome directly to the reading column.

**A dialog holds focus and gives it back.** While a modal is open, keyboard focus cannot leave it — otherwise the reader operates controls they cannot see. On close, focus returns to whatever opened it, because in a document this size, dropping focus to the top of the page means losing your place entirely.

**Anything announced must be announced in time, and anything offered must be reachable.** A transient message that carries the *only* way to perform an action — an undo affordance, a way back — must not expire while the reader is still travelling toward it: pointing at it or focusing it holds it open. A control that exists only on hover does not exist for a keyboard.

**Contrast has a floor, and the floor is enforced.** The design's quiet, low-emphasis palette is a genuine tension with legibility, and the tension is resolved in legibility's favour: every text and interface colour, in both themes, must clear its contrast minimum, and this is asserted from the design tokens themselves so that a later tweak cannot quietly drop one below the line. Readers who ask their system for more contrast get more.

**Reduced-motion and system preferences are honoured** rather than overridden.

## 13. State summary

- **View state** (expansion overrides, pins, active term, active reading path): encoded in the shareable link; restores on reload.
- **Annotations:** plain text; persisted locally; exportable (Markdown and its printable PDF rendering — see §8, which retired the HTML and JSON exports); optionally syncable via the opt-in encrypted store.
- **Saved threads** (the reader's own named pin-sets): persisted locally, deliberately outside both the shareable link and the undo history (§11).
- **Term index, reading paths, and the text itself:** fixed application data, prepared at build time.

## 14. Open questions to resolve

*All four are now closed. They are kept, struck through, because the reasoning behind a settled decision is the part that is expensive to reconstruct later.*

1. ~~**Peek treatment**~~ — resolved 2026-07-30: the compact indicator won. Consecutive same-depth peeks merge into one range row rather than each occupying a sibling row (§5).
2. ~~**Annotation length cap**~~ — resolved 2026-07-10: confirmed at **1,000 characters** (Section 6).
3. ~~**Glossary/term construction**~~ — resolved 2026-07-24: curate the English Ogden text by hand, include vocabulary that defines or structures the framework, and give independently meaningful qualified terms their own lemma-form entries. Proper names, incidental examples, and ordinary prose are excluded.
4. ~~**Cloud sync caps**~~ — resolved 2026-07-30: the concrete figures are settled and in place (a 64 KiB cap per bundle, a 90-day time-to-live that expires lazily on read and by a daily sweep, and a per-address write rate limit). What remains is not a design question but an operational one: watch for abuse, and escalate to a write barrier only if it appears.

## 15. Non-goals (for now)

- Markdown, HTML, or rich text in annotations — plain text only, never parsed.
- Bilingual (German/English) presentation — English only.
- Focus/zoom into an isolated subtree as a distinct *mode*. (A deep link isolating a single statement, §12, is not this: it is an arrival state the reader can fold and unfold out of like any other, not a mode with its own rules.)
- Automatic click-any-word concordance, and any separate glossary section/panel — inline term marks only.
- Oversized "annotations-in-the-link" sharing.
- Typography, visual design, and UI/UX detail — out of scope *for this document*, which is why §12a states accessibility as behaviour and not as markup.
- Technology and architecture choices — likewise out of scope here; they are recorded alongside the implementation.
