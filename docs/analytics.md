# Analytics

Optional, self-hosted [Plausible](https://plausible.io). Off by default: the
script is injected only when **both** `VITE_PLAUSIBLE_DOMAIN` and
`VITE_PLAUSIBLE_SRC` are set at build time, so forks, `npm run dev`, and the
test suite measure nothing. Implementation: `src/lib/analytics.ts` (transport +
label derivation) and `src/lib/useAnalytics.ts` (the state-derived milestones).

## What is measured, and what is refused

Plausible is cookieless and keeps no per-visitor identifier, so there is nothing
here to build a profile out of and no consent banner to add. On top of that, two
rules are enforced in code:

1. **Nothing a reader wrote leaves the browser.** Annotations are out of scope
   entirely — they are not read by this module. Free-text search is reported as
   the constant `(free search)`, never as what was typed. Saved-thread names are
   never sent. Only the curated term index and the curated reading-path ids —
   both fixed, published vocabularies — are ever named.
2. **Every property is a bounded label.** Counts and depths are reported as
   milestones (`1`, `3`, `10`), not as raw numbers, so no property can grow a
   long tail that starts to identify individual sessions.

`RESPECT_DNT` in `analytics.ts` also drops the script entirely for readers
sending Do-Not-Track or Global Privacy Control. Plausible's own script ignores
those headers; this app does not.

## The question behind the numbers

Visits tell you that people arrived. They do not tell you the thing this app
actually needs to know, which is:

> Does treating the *Tractatus* as a foldable tree change how people read it —
> or do they look at the novelty and leave?

Every event below exists to answer some part of that. Read them as a ladder,
because the ladder *is* the metric: **arrived → opened the tree → pinned →
annotated → came back.** Each rung is a smaller number than the one before it,
and the shape of the drop-off is the finding.

## Events

Custom events need to be registered as goals in your Plausible site settings
before they show up in the dashboard.

| Event | Properties | What it answers |
| --- | --- | --- |
| *(pageview)* | — | Reach: visits, sources, devices, entry pages. One per load — the app uses `replaceState` only, so view changes never inflate it. |
| `Arrived` | `via`: `direct` \| `shared-view` \| `statement-link` \| `notes-link` | **Does sharing work?** Share links are the app's only real distribution mechanism; this splits organic landings from links a reader sent someone. |
| `Read deep` | `depth`: `3` \| `4` \| `5` | **Does the folding get used for reading?** Reaching the fourth or fifth decimal level means someone followed an argument down a branch rather than skimming the seven roots. |
| `Pinned` | `count`: `1` \| `3` \| `10` | **Activation.** The first pin is the moment the app stops being a web page and starts being an instrument. `3` and `10` mark someone assembling a real cross-section. |
| `Annotated` | `count`: `1` \| `3` | **The deepest engagement there is.** Writing a note means intending to come back. Expect this to be small; its ratio to `Pinned` is the interesting number. |
| `Traced term` | `term`: a curated term, or `(free search)` | **Which threads people pull.** Which concepts readers chase through the text, and how often they reach past the curated index for something of their own. |
| `Applied pin set` | `set`: a reading-path id, or `saved-thread` | **Do the curated entry points earn their place?** A path nobody applies is either badly named or badly chosen. `saved-thread` means a returning reader resuming their own work. |
| `Saved thread` | — | Intent to return, recorded locally. Pairs with `Applied pin set: saved-thread` to show whether they actually did. |
| `Shared` | `kind`: `view` \| `statement` \| `notes-link` | The outbound half of the loop. Compare against inbound `Arrived` to see whether shared links get opened. |
| `Exported` | `kind`: `markdown` \| `pdf` | **Does the reading leave the app?** Export means the session produced something worth keeping. |
| `Opened guide` | — | A *negative* signal worth watching: readers open the guide when the affordances failed to explain themselves. Rising with new visitors is normal; rising as a share of them is a design bug. |
| `Used keyboard` | — | Whether the keyboard-first design is discovered at all, once per session. |

## Reading them

A few ratios carry more than any single count:

- **Pinned : visits** — the activation rate, and the single number to watch.
  Everything else in the app is downstream of a reader pinning something.
- **Annotated : Pinned** — how many people go from arranging the text to
  working on it.
- **Read deep(5) : Read deep(3)** — whether the deep structure holds attention
  or the novelty wears off at the first fold.
- **Arrived(shared-view + statement-link) : Shared** — does anything sent
  actually get opened?
- **Opened guide : visits** — trending *up* means the interface got less
  legible, not that more people are curious.
- **Returning visitors** (Plausible's own metric) — for a reading tool this
  outranks total visits: the *Tractatus* is not a one-sitting book, and a
  reader who never returns did not really use it.

Two things worth knowing about the data itself:

- **Bounce rate and time-on-page are close to meaningless here.** A single
  pageview per session is by design, and someone reading 6.54 slowly looks
  identical to someone who left the tab open. Use the milestone ladder instead.
- **Ad blockers hide a slice of everyone.** A self-hosted Plausible script on its
  own subdomain is blocked less than the hosted one, but not never; see the
  first-party proxy note in [`DEPLOY.md`](../DEPLOY.md). Treat all absolute
  numbers as a floor and trust the ratios.

## Adding an event

Keep the two rules above. Concretely: derive it from state in
`useAnalytics.ts` if it is a milestone, call `track` at the handler if it is a
discrete action, and make sure any property you attach comes from a fixed
vocabulary — if a reader can type it, it does not travel. `analytics.test.ts`
asserts that the label functions stay bounded; extend it alongside.
