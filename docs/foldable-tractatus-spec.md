# The Foldable Tractatus — Specification (v0.4)

*High-level functional and conceptual spec. Deliberately excludes technology choices and UI/UX design; those are decided later. This document describes **what** the app does and **why**, not **how** it is built or how it looks.*

*Date: 2026-07-02 · Changes since v0.3: annotations simplified to plain text — no Markdown, no parsing, no rendering step, no edit/save flow. This removes the annotation injection surface entirely. Notes autosave on a debounce.*

---

## 1. Concept

The Foldable Tractatus is a single web page that presents the whole of Wittgenstein's *Tractatus Logico-Philosophicus* as a foldable tree of statements.

The book is uniquely suited to this. Wittgenstein deliberately numbered his 525 remarks in a decimal hierarchy (1, 1.1, 1.11, …) where each statement `n.m` is a comment on statement `n`, and the number encodes the statement's logical weight. There are seven root propositions; proposition 7 has no descendants. The numbering **is** a tree — the app simply lets the reader navigate that tree instead of reading it as flat prose.

The reading experience is one of **controlled disclosure**: the reader opens only the branches they care about, keeps the rest quiet, marks what matters, annotates it, and can share or resume any of this later.

## 2. Source text

- The public-domain **C. K. Ogden (1922) English translation** is the sole text, in English only.
- Preparing the text is a build-time task: obtaining a cleanly-formatted copy and encoding it as the fixed statement tree (each statement carries its decimal id, its text, and its parent).
- A **curated term index** (Section 9) is also a build-time deliverable derived from a careful reading of the text — it is authored, not generated at runtime.

## 3. Core reading model — the foldable tree

- Every statement is a node in a fixed tree. Each node can be **collapsed** (its children hidden) or **expanded** (its children revealed).
- **Default state:** fully folded. Only the seven root propositions are visible.
- **Unfold one level:** a control next to a statement reveals only that statement's direct children (one level), so the reader descends gradually.
- **Re-fold:** the same control collapses a statement's children again.
- **Global controls:** *Fold all* and *Unfold all* act on the whole tree (Fold all interacts with pins — see Section 5).
- **No level-skipping:** a descendant is never shown without its full chain of ancestors also being present. The hierarchy is always legible.

## 4. Pinning and isolating

- Each statement has a **pin** control. Pinning marks a statement as personally significant.
- Each statement also has an **isolate** ("focus on this only") control: it makes that statement the sole pinned statement, replacing any existing pins. This is the same mechanism used for deep-linking (Section 12). Because it is a pin-replacing action, it is a single, clearly-undoable step (Section 12).
- Pins are the backbone of focused reading, sharing, export, and reading paths.
- The reading column's information line reports the **number of pinned statements** (alongside the statement and branch counts) whenever anything is pinned, in the same accent treatment as the annotation count — the reader's own marks stand apart from the fixed text's numbers.
- A prominent **"unpin all"** action clears the entire pin set. Because it destroys a possibly carefully-built pin set, it asks for confirmation first, with the same brief warning-and-confirm treatment as the other pin-replacing actions — and, like them, it is a single, clearly-undoable step (Section 12). Manual expansion survives it; only the pins go.

## 5. Focused reading (the folded-with-pins view)

*Approved (tentative). This is the app's signature reading mode and resolves how non-pinned siblings behave.*

When the reader folds everything while pins exist, the tree does not collapse to bare roots. Instead it presents a **focused view** in which every statement is in one of four display states:

- **Full** — text shown in full.
- **Peek** — presence indicated by a minimal, low-emphasis marker (its number plus a short hint) that says "a statement exists here, expandable," without the full text.
- **Collapsed** — text shown, children hidden.
- **Hidden** — not rendered (only beneath a collapsed or peek ancestor).

The focused view is **derived** from the pin set and the tree, by these rules:

1. The seven roots are always shown.
2. A node is **expanded** only if it is a pinned statement's ancestor; otherwise it is collapsed.
3. Under an expanded node, each child is shown **Full** if it is pinned or is itself an ancestor of a pin, and **Peek** otherwise.
4. Everything below a collapsed or peek node is Hidden.

The effect: pinned statements and their exact lineage read clearly, while their siblings remain present-but-quiet as peeks, so the reader always knows there is more material at that level without being distracted by it. The reader can promote any peek to full by expanding it.

Crucially, peeks are **computed, not managed** — the reader never sets them. The only per-statement state beyond the pin set is any **manual expansion/collapse override** the reader applies on top of the derived view; these are sparse and are what gets persisted (Section 13).

## 6. Annotations

- The reader can attach a personal **annotation** to any statement, and edit or delete it.
- **Plain text only.** Annotations are never parsed, interpreted, or rendered as markup (no Markdown, no HTML, no rich text). They are stored as text and displayed as text — inserted as text content, never as markup — so there is **no rendering step and no injection surface**, even for annotations that arrive in an imported or synced bundle. Line breaks are preserved, so multi-paragraph notes still read cleanly.
- **No edit/save flow.** There is a single text field; changes **autosave automatically after a short debounce** as the reader types. There is no separate display mode and no explicit Save action. **Enter closes the editor** (the note is already saved); **Shift+Enter inserts a line break**.
- **Length cap:** annotations are bounded, not unbounded. Cap: **1,000 characters** per annotation (about 150–175 words). Remaining budget is shown as the reader approaches it.
- **Margin notes never overlap.** When notes crowd each other (folding often brings annotated statements close together), a long note rests folded to its first few lines, and notes slide down just enough that none covers another. Opening a note (click, or editing it) expands it in place while its neighbours make room — nothing is ever occluded. A note resting away from its statement is labelled with the statement's number so the pairing stays legible.
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

## 8. Export

Two formats:
- **Readable study export (Markdown):** the pinned statements, shown with their lineage (ancestors), together with all annotations (including annotations on non-pinned statements), in reading order. The statements provide the Markdown structure; annotations appear as their plain text.
- **Printable export (PDF):** a self-contained rendering of that same export, for pleasant reading or printing outside the app.

_(Removed: styled-HTML export — PDF covers the print/read-outside case more conveniently. Removed: JSON round-trip export — import functionality was scrapped, so there is no working state to restore.)_

## 9. Technical terms (curated, surfaced inline)

- The app carries a **hand-curated index** of the Tractatus's technical vocabulary. There is **no** automatic click-any-word concordance, and **no separate glossary section, list, or panel**.
- The curated data records, for each term, its **canonical form, its variant forms** (singular/plural, abbreviations, alternative renderings), and the **set of statements** in which it or a variant occurs. Building this index is a careful build-time analysis of the whole text (method and scope deferred — Section 14).
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

- **Deep-linkable statements:** every statement is individually addressable by a link that isolates it (Section 4) and scrolls it into view.
- **Keyboard navigation:** move between statements with the arrow keys (and also j/k for readers who prefer them), with keys for expand/fold and pin.
- **Undo / redo:** the app keeps its own in-app history of actions (fold, pin, isolate, "Pin only these", annotate, apply reading path), traversable with undo/redo. It is **not** wired to the browser Back button, so navigation is never hijacked and history is never flooded. Native text-editing undo inside an annotation field works as usual. **Pin-replacing actions (isolate, "Pin only these", applying a reading path or saved thread, unpin all) are single undoable steps** and surface an immediate undo affordance so an accidental replacement is trivially reversible. At minimum, the reader can always recover prior states within a session.

## 13. State summary

- **View state** (expansion overrides, pins, active term, active reading path): encoded in the shareable link; restores on reload.
- **Annotations:** plain text; persisted locally; exportable (Markdown, HTML, JSON); optionally syncable via the opt-in encrypted store.
- **Term index, reading paths, and the text itself:** fixed application data, prepared at build time.

## 14. Open questions to resolve

1. **Peek treatment** — four-state model tentatively approved; settle exactly how quiet a peek is (full sibling row vs. a compact "N more" indicator) during design.
2. ~~**Annotation length cap**~~ — resolved 2026-07-10: confirmed at **1,000 characters** (Section 6).
3. **Glossary/term construction** — method and scope of the build-time term analysis; deferred.
4. **Cloud sync** — abuse posture defined; remaining work is to confirm concrete caps/TTL and monitor for abuse, escalating to a write barrier only if needed.

## 15. Non-goals (for now)

- Markdown, HTML, or rich text in annotations — plain text only, never parsed.
- Bilingual (German/English) presentation — English only.
- Focus/zoom into an isolated subtree as a distinct mode.
- Automatic click-any-word concordance, and any separate glossary section/panel — inline term marks only.
- Oversized "annotations-in-the-link" sharing.
- Typography, visual design, and UI/UX detail — deferred.
- Technology and architecture choices — deferred.
