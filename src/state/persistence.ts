/*
  Local persistence of annotations (spec §6/§13): keyed by statement id,
  survives reload automatically, never carried in the shareable link.
*/

import { NOTE_LIMIT } from './store';

const NOTES_KEY = 'ft-notes';

export function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const notes: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.trim()) notes[k] = v.slice(0, NOTE_LIMIT);
    }
    return notes;
  } catch {
    return {};
  }
}

export function saveNotes(notes: Readonly<Record<string, string>>) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // storage unavailable — notes stay in memory for the session
  }
}
