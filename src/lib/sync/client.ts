/*
  API client for the Val Town bundle store + bundle sanitizing. The endpoint
  is configured at build time (VITE_SYNC_ENDPOINT); without it the sync UI
  simply doesn't appear — the app stays fully client-side.
*/

import { byId } from '../../model/tree';
import { NOTE_LIMIT } from '../../state/store';
import type { EncryptedBundle } from './crypto';

const ENDPOINT = ((import.meta.env.VITE_SYNC_ENDPOINT as string | undefined) ?? '').replace(
  /\/+$/,
  '',
);

export const syncAvailable = () => ENDPOINT !== '';

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export async function uploadBundle(bundle: EncryptedBundle): Promise<string> {
  const res = await fetch(`${ENDPOINT}/bundles`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) throw new SyncError('upload failed', res.status);
  const { id } = (await res.json()) as { id?: unknown };
  if (typeof id !== 'string') throw new SyncError('malformed response');
  return id;
}

export async function fetchBundle(id: string): Promise<EncryptedBundle> {
  const res = await fetch(`${ENDPOINT}/bundles/${encodeURIComponent(id)}`);
  if (!res.ok) throw new SyncError('bundle not found', res.status);
  const body = (await res.json()) as Partial<EncryptedBundle>;
  if (typeof body.iv !== 'string' || typeof body.data !== 'string') {
    throw new SyncError('malformed bundle');
  }
  return { iv: body.iv, data: body.data };
}

export interface BundlePayload {
  notes: Record<string, string>;
  pins: string[];
}

/** Harden a decrypted payload: known statement ids, plain strings, capped. */
export function sanitizeBundlePayload(raw: unknown): BundlePayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const { notes: rawNotes, pins: rawPins } = raw as Record<string, unknown>;
  const notes: Record<string, string> = {};
  if (rawNotes && typeof rawNotes === 'object' && !Array.isArray(rawNotes)) {
    for (const [k, v] of Object.entries(rawNotes)) {
      if (typeof v === 'string' && v.trim() && byId.has(k)) notes[k] = v.slice(0, NOTE_LIMIT);
    }
  }
  const pins = Array.isArray(rawPins)
    ? rawPins.filter((p): p is string => typeof p === 'string' && byId.has(p))
    : [];
  if (!Object.keys(notes).length && !pins.length) return null;
  return { notes, pins };
}
