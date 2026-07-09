/*
  Full security test suite for the encrypted-bundle store, run against a real
  in-memory libsql database (the same client API Val Town's std/sqlite exposes).
*/

import { createClient, type Client } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanupExpired, createNotesStore, type SqliteClient } from './core';

const DAY = 24 * 60 * 60 * 1000;

let db: Client;
let now: number;
let handler: (req: Request) => Promise<Response>;

const sqlite = (): SqliteClient => ({
  execute: (stmt) => db.execute(stmt as never) as never,
});

beforeEach(() => {
  db = createClient({ url: ':memory:' });
  now = 1_700_000_000_000;
  handler = createNotesStore(sqlite(), { now: () => now });
});

afterEach(() => db.close());

const BASE = 'https://store.example';
const validIv = btoa(String.fromCharCode(...new Uint8Array(12))); // 12 bytes
const validData = btoa('some opaque ciphertext bytes');

function post(body: unknown, ip = '1.2.3.4'): Promise<Response> {
  return handler(
    new Request(`${BASE}/bundles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

function get(id: string): Promise<Response> {
  return handler(new Request(`${BASE}/bundles/${id}`));
}

async function createBundle(ip = '1.2.3.4'): Promise<string> {
  const res = await post({ iv: validIv, data: validData }, ip);
  expect(res.status).toBe(201);
  return (await res.json()).id;
}

describe('store and retrieve', () => {
  it('round-trips an encrypted bundle', async () => {
    const id = await createBundle();
    const res = await get(id);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ iv: validIv, data: validData });
  });

  it('issues 22-char base64url ids (128-bit, unguessable)', async () => {
    const id = await createBundle();
    expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const id2 = await createBundle('5.6.7.8');
    expect(id2).not.toBe(id);
  });

  it('serves bundles as opaque JSON with hardened headers', async () => {
    const id = await createBundle();
    for (const res of [await get(id), await post({ iv: validIv, data: validData })]) {
      expect(res.headers.get('content-type')).toBe('application/json');
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('cache-control')).toBe('no-store');
    }
  });
});

describe('input validation — only conforming encrypted bundles are accepted', () => {
  it.each([
    ['malformed JSON', '{not json'],
    ['non-object', '"hello"'],
    ['array', '[1,2]'],
    ['missing data', { iv: validIv }],
    ['missing iv', { data: validData }],
    ['extra keys', { iv: validIv, data: validData, evil: 'x' }],
    ['non-string iv', { iv: 12, data: validData }],
    ['non-string data', { iv: validIv, data: null }],
    ['invalid base64 data', { iv: validIv, data: '<script>!!' }],
    ['iv wrong length', { iv: btoa('too many bytes here!'), data: validData }],
    ['empty data', { iv: validIv, data: '' }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
  });

  it('rejects a bundle over the size cap with 413', async () => {
    const big = btoa('x'.repeat(65 * 1024));
    const res = await post({ iv: validIv, data: big });
    expect(res.status).toBe(413);
  });

  it('rejects an oversized raw body with 413 before parsing', async () => {
    const res = await post('x'.repeat(100 * 1024));
    expect(res.status).toBe(413);
  });
});

describe('rate limiting (per IP, sliding hour)', () => {
  it('allows 5 writes then returns 429 with Retry-After', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await post({ iv: validIv, data: validData })).status).toBe(201);
    }
    const res = await post({ iv: validIv, data: validData });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('3600');
  });

  it('does not throttle other IPs', async () => {
    for (let i = 0; i < 5; i++) await post({ iv: validIv, data: validData }, '9.9.9.9');
    expect((await post({ iv: validIv, data: validData }, '8.8.8.8')).status).toBe(201);
  });

  it('window slides: writes are allowed again after an hour', async () => {
    for (let i = 0; i < 5; i++) await post({ iv: validIv, data: validData });
    expect((await post({ iv: validIv, data: validData })).status).toBe(429);
    now += 61 * 60 * 1000;
    expect((await post({ iv: validIv, data: validData })).status).toBe(201);
  });

  it('is enforced before the body is read', async () => {
    for (let i = 0; i < 5; i++) await post({ iv: validIv, data: validData });
    const res = await post('x'.repeat(100 * 1024)); // oversized AND over quota
    expect(res.status).toBe(429);
  });
});

describe('lookup hardening', () => {
  it('404s an unknown id', async () => {
    expect((await get('AAAAAAAAAAAAAAAAAAAAAA')).status).toBe(404);
  });

  it.each(['short', 'x'.repeat(64), '../../etc', "1'; DROP TABLE bundles;--"])(
    '404s a malformed id (%s) without touching the database',
    async (id) => {
      expect((await get(encodeURIComponent(id))).status).toBe(404);
    },
  );

  it('expires bundles after the TTL and deletes them on read', async () => {
    const id = await createBundle();
    now += 91 * DAY;
    expect((await get(id)).status).toBe(404);
    const left = await db.execute('SELECT COUNT(*) AS c FROM bundles');
    expect(Number(left.rows[0].c)).toBe(0);
  });

  it('still serves bundles just inside the TTL', async () => {
    const id = await createBundle();
    now += 89 * DAY;
    expect((await get(id)).status).toBe(200);
  });
});

describe('routing', () => {
  it('405s wrong methods on known routes', async () => {
    const r1 = await handler(new Request(`${BASE}/bundles`, { method: 'GET' }));
    expect(r1.status).toBe(405);
    const r2 = await handler(
      new Request(`${BASE}/bundles/AAAAAAAAAAAAAAAAAAAAAA`, { method: 'DELETE' }),
    );
    expect(r2.status).toBe(405);
  });

  it('404s unknown paths', async () => {
    expect((await handler(new Request(`${BASE}/`))).status).toBe(404);
    expect((await handler(new Request(`${BASE}/admin`))).status).toBe(404);
  });

  it('answers OPTIONS preflight with 204', async () => {
    const res = await handler(new Request(`${BASE}/bundles`, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });
});

describe('cleanup cron', () => {
  it('removes expired bundles and stale write records, keeps live ones', async () => {
    const oldId = await createBundle();
    now += 89 * DAY;
    const freshId = await createBundle('5.5.5.5');
    now += 2 * DAY; // old bundle is now 91 days old, fresh one 2 days
    await cleanupExpired(sqlite(), { now: () => now });
    expect((await get(oldId)).status).toBe(404);
    expect((await get(freshId)).status).toBe(200);
    const writes = await db.execute('SELECT COUNT(*) AS c FROM writes');
    expect(Number(writes.rows[0].c)).toBe(0);
  });

  it('is safe to run before any request created the schema', async () => {
    const fresh = createClient({ url: ':memory:' });
    await expect(
      cleanupExpired({ execute: (s) => fresh.execute(s as never) as never }),
    ).resolves.toBeUndefined();
    fresh.close();
  });
});
