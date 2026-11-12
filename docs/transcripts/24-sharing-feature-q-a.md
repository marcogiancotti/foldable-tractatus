# Session 24: Sharing-feature Q&A

Claude Code · Implementation · 1 prompt · 32 words

[← Session 23](23-manual-test-bug-rounds.md) · [All sessions](README.md) · [Session 25 →](25-mobile-usability-round-one.md)

## Prompt 111

**Summary:** Asks for an explanation of how the Val Town-based sharing feature (for annotations and pins via a link) is meant to be activated and used.

- **Phase:** Implementation
- **Human:** 32 words · ~48 s to write
- **LLM:** Opus 4.8 · Claude Code · 1 min 4 s
- **Outcome:** question asked

### Prompt

> Explain to me how the sharing feature that uses Val Town (giving access to annotations as well as pins via a link) is supposed to be activated and used by the user.

### Reply of Claude Code

Here's how the Val Town "save notes to a link" feature is meant to be turned on and used.

##### Two-layer activation

The feature is **off unless the deployment is configured for it** — a user can't toggle it in the app.

**1. Build-time config (deployer, not end user).** The whole feature is gated on one build-time env var, `VITE_SYNC_ENDPOINT`, pointing at the Val Town backend (e.g. `https://tractatus-notes.val.run`). It's read once in [client.ts:11](src/lib/sync/client.ts#L11), and `syncAvailable()` is just "is that string non-empty?" ([client.ts:16](src/lib/sync/client.ts#L16)).

- If it's **unset** (the default for a plain build), the UI element never renders — [App.tsx:447](src/App.tsx#L447) passes `onSaveToLink={syncAvailable() ? saveToLink : undefined}`, and the button only appears when the handler is defined ([ControlPanel.tsx:285](src/components/ControlPanel.tsx#L285)). The app stays 100% client-side.
- To enable it, the deployer sets `VITE_SYNC_ENDPOINT` in Vercel (and a local `.env` for dev) and redeploys, per [DEPLOY.md:21](DEPLOY.md#L21). It's live today at `https://tractatus-notes.val.run`.

**2. In-app activation (end user).** Once the endpoint is configured, a **"Save notes to link"** button appears in the **More** menu of the control panel (cloud-upload icon, [ControlPanel.tsx:295](src/components/ControlPanel.tsx#L295)). It's opt-in per action — nothing syncs automatically.

##### How a user uses it — sending

Clicking **Save notes to link** runs `saveToLink` ([App.tsx:131](src/App.tsx#L131)):

1. Generate a fresh random 256-bit AES-GCM key in the browser.
2. Encrypt a bundle of `{ notes, pins }` locally via WebCrypto ([crypto.ts:46](src/lib/sync/crypto.ts#L46)).
3. Upload only the opaque ciphertext (`{iv, data}`) to Val Town, which returns a short id.
4. Build a link of the form `…?bundle=<id>#k=<key>` and copy it to the clipboard.

The user gets a toast: *"Private link copied — notes encrypted in your browser."* The critical detail: the decryption **key lives only in the URL fragment (`#k=`)**, which browsers never send to the server — so the host stores ciphertext it can't read. The bundle carries **annotations *and* pins**, but not other view state (overrides, active term, reading path); those ride the normal query-string share link instead.

If the per-IP write limit is hit (5/hr) the user sees *"Save limit reached — try again in an hour."*

##### How a user uses it — receiving

When someone opens a `?bundle=<id>#k=<key>` link, `App` captures both parts on first render ([App.tsx:99](src/App.tsx#L99)) and then ([App.tsx:104](src/App.tsx#L104)):

1. Fetches the ciphertext by id, decrypts it with the key from the fragment.
2. Sanitizes the payload — drops unknown statement ids, caps note length ([client.ts:55](src/lib/sync/client.ts#L55)).
3. Shows a **confirmation dialog** before touching anything: *"Load notes from this link? This link holds N annotations and M pins. Loading them replaces your current annotations and pins. This is undoable."* ([App.tsx:285](src/App.tsx#L285)).
4. Only on confirming **"Load notes"** does `importBundle` replace the local notes and pins ([store.tsx:191](src/state/store.tsx#L191)) — and since it goes through `withHistory`, it's undoable.

Either way the `#k=` fragment is immediately stripped from the address bar so the key doesn't linger ([App.tsx:122](src/App.tsx#L122)). Failures degrade gracefully to toasts (*"Couldn't open the saved notes in this link"* / *"This link holds no readable notes"*).

##### Worth flagging

- **It replaces, not merges.** Loading a link overwrites the recipient's current notes and pins wholesale. It's undoable, but a first-time user might not expect their annotations to be swapped out — the confirm dialog is the only guard.
- **Bundles expire.** Server-side TTL is 90 days (lazy-expire on read plus a daily cleanup cron), so shared links are not permanent.
- **Distinct from the other two share paths.** "Share" (query-string view link) and "Save thread" (local named pin-sets) never involve the backend or annotations; only this one path uploads anything, and only annotations+pins.

---

[← Session 23](23-manual-test-bug-rounds.md) · [All sessions](README.md) · [Session 25 →](25-mobile-usability-round-one.md)
