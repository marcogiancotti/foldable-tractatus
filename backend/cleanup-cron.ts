/*
  Val Town cron val — daily TTL cleanup for the encrypted-bundle store.
  Schedule: once a day (free plan minimum interval is 15 minutes; daily is
  plenty since reads also expire bundles lazily).
*/

// @ts-expect-error — resolved by the Val Town runtime, not by the local build
import { sqlite } from 'https://esm.town/v/std/sqlite/main.ts';
import { cleanupExpired } from './core.ts';

export default async function () {
  await cleanupExpired(sqlite);
}
