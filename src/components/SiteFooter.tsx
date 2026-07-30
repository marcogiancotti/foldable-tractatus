/*
  Colophon at the foot of the reading column: who made this, where the text came
  from, and where the code lives.

  Collapsible, following the control panel's "More" disclosure (.cp-more-* in
  src/styles/panel.css): a quiet trigger with a caret that rotates 90° when open,
  and a body that is not rendered at all while closed. Open by default — the
  credit and the text's provenance should be visible without being hunted for —
  but shut, the whole block is one line of small type.

  Collapsing costs nothing for search: crawlers read the build-time prerendered
  copy of this same text (vite/prerender.ts), which is always present and
  unconditional in the HTML source. This component is only what a reader with
  JavaScript sees.

  Mounted inside ReadingColumn's <main> rather than as a sibling in App, so that
  print.css — which blanks .app-root under @media print — keeps it out of the PDF
  study export, where a site footer would be noise.

  Two link decisions are deliberate:

  • No rel="nofollow" anywhere. Pointing readers and crawlers at the author's own
    sites is the point of this block. rel="author me" is the machine-readable half
    of the same claim, matching the <link rel="me"> pair and the JSON-LD Person
    node in index.html.

  • rel="noopener", not "noreferrer". noopener is the security part and costs
    nothing; noreferrer would additionally strip the Referer header, which would
    hide this site from the referral reports of the very sites being linked. The
    elsewhere-in-app convention is noreferrer, but that is for third-party links
    (Project Gutenberg), where attribution back to us is nobody's goal.
*/

import { useState } from 'react';
import {
  AUTHOR_BLOG_NAME,
  AUTHOR_BLOG_URL,
  AUTHOR_NAME,
  AUTHOR_URL,
  REPO_URL,
} from '../lib/site';

export default function SiteFooter() {
  const [open, setOpen] = useState(true);

  return (
    <footer className="site-footer">
      <button
        type="button"
        className="sf-trigger"
        aria-expanded={open}
        aria-controls="colophon"
        title={open ? 'hide colophon' : 'show colophon'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`sf-caret msym${open ? ' is-open' : ''}`} aria-hidden="true">
          chevron_right
        </span>
        <span className="sf-label">Colophon</span>
      </button>

      {open && (
        <div className="sf-body" id="colophon">
          <p className="sf-line">
            Built by{' '}
            <a href={AUTHOR_URL} target="_blank" rel="author me noopener">
              {AUTHOR_NAME}
            </a>
            . More writing at{' '}
            <a href={AUTHOR_BLOG_URL} target="_blank" rel="me noopener">
              {AUTHOR_BLOG_NAME}
            </a>
            .
          </p>
          <p className="sf-line">
            The text is the C. K. Ogden translation of 1922, in the public domain. The code is{' '}
            <a href={REPO_URL} target="_blank" rel="noopener">
              MIT-licensed and on GitHub
            </a>
            .
          </p>
          <p className="sf-line sf-quiet">
            Your annotations stay in this browser. Nothing you write is sent anywhere unless you
            explicitly save it to a link, and then only encrypted.
          </p>
        </div>
      )}
    </footer>
  );
}
