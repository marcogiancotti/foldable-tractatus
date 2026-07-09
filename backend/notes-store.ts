/*
  Val Town HTTP val — encrypted annotation-bundle store (spec §7).
  Paste this val together with core.ts and cleanup-cron.ts into one Val Town
  val (see DEPLOY.md). Free plan: val-scoped SQLite, default permissive CORS.

  POST /bundles      {iv, data} (base64 ciphertext) → 201 {id}
  GET  /bundles/:id  → 200 {iv, data} | 404
*/

// @ts-expect-error — resolved by the Val Town runtime, not by the local build
import { sqlite } from 'https://esm.town/v/std/sqlite/main.ts';
import { createNotesStore } from './core.ts';

export default createNotesStore(sqlite);
