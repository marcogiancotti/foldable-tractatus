/*
  View state ⇄ shareable link (spec §7/§13). Small, bounded, compact:
    ?p=1.11,2.12    pinned ids
    &e=2:1,1.2:0    expand overrides (id:1 expand, id:0 collapse)
    &t=picture      active term
    &path=saying-showing  active reading path
  Deep link: ?statement=N isolates N (spec §12). Annotations are NEVER here.
*/

import { pathById } from '../data/paths';
import { byId } from './tree';
import type { Overrides, Pins } from './focusedView';

export interface ViewState {
  pins: Pins;
  overrides: Overrides;
  activeTerm: string | null;
  activePath: string | null;
}

const MAX_TERM_LENGTH = 100;

export function encodeViewState(v: ViewState): string {
  const params = new URLSearchParams();
  if (v.pins.size) params.set('p', [...v.pins].join(','));
  if (v.overrides.size) {
    params.set(
      'e',
      [...v.overrides].map(([n, expand]) => `${n}:${expand ? 1 : 0}`).join(','),
    );
  }
  if (v.activeTerm) params.set('t', v.activeTerm.slice(0, MAX_TERM_LENGTH));
  if (v.activePath) params.set('path', v.activePath);
  return params.toString();
}

/** Decode a query string; unknown ids/paths and malformed parts are dropped. */
export function decodeViewState(search: string): Partial<ViewState> | null {
  const params = new URLSearchParams(search);
  if (!['p', 'e', 't', 'path'].some((k) => params.has(k))) return null;

  const view: Partial<ViewState> = {};

  const p = params.get('p');
  if (p !== null) {
    view.pins = new Set(p.split(',').filter((n) => byId.has(n)));
  }

  const e = params.get('e');
  if (e !== null) {
    const overrides = new Map<string, boolean>();
    for (const part of e.split(',')) {
      const [n, flag] = part.split(':');
      if (byId.has(n) && (flag === '0' || flag === '1')) overrides.set(n, flag === '1');
    }
    view.overrides = overrides;
  }

  const t = params.get('t');
  view.activeTerm = t?.trim() ? t.slice(0, MAX_TERM_LENGTH) : null;

  const path = params.get('path');
  view.activePath = path && pathById.has(path) ? path : null;

  return view;
}

/** The ?statement=N deep-link parameter, if present and valid. */
export function statementParam(search: string): string | null {
  const n = new URLSearchParams(search).get('statement');
  return n && byId.has(n) ? n : null;
}
