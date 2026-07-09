/*
  Encrypted-bundle store — platform-agnostic core (spec §7).

  The host only ever sees opaque ciphertext: clients encrypt in the browser
  and the decryption key travels in the link fragment, never in a request.
  Abuse posture: unguessable high-entropy ids, a hard size cap, per-IP write
  rate-limiting, TTL expiry (lazy on read + a daily cleanup cron), and strict
  validation — only conforming encrypted bundles are accepted, and they are
  served as opaque JSON data (never rendered or executable).

  The SQLite client is injected so the same code runs on Val Town
  (std/sqlite) and under tests (@libsql/client :memory:).
*/

export interface SqliteClient {
  execute(stmt: string | { sql: string; args?: (string | number)[] }): Promise<{
    rows: Record<string, unknown>[];
  }>;
}

export interface StoreConfig {
  /** Max decoded ciphertext size. Default 64 KiB. */
  maxBundleBytes?: number;
  /** Bundle lifetime. Default 90 days. */
  ttlMs?: number;
  /** Per-IP write budget per hour. Default 5. */
  writesPerHour?: number;
  now?: () => number;
}

const DEFAULTS = {
  maxBundleBytes: 64 * 1024,
  ttlMs: 90 * 24 * 60 * 60 * 1000,
  writesPerHour: 5,
  now: () => Date.now(),
};

const HOUR_MS = 60 * 60 * 1000;
// 16 random bytes, base64url → 22 chars
const ID_RE = /^[A-Za-z0-9_-]{22}$/;
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const AES_GCM_IV_BYTES = 12;
// Generous raw-body ceiling: base64 overhead + JSON envelope.
const MAX_BODY_CHARS = 96 * 1024;

function base64DecodedBytes(s: string): number | null {
  if (s.length % 4 !== 0 || !BASE64_RE.test(s)) return null;
  const padding = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  return (s.length / 4) * 3 - padding;
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function json(status: number, body: unknown, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      ...extra,
    },
  });
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || 'unknown';
}

export async function ensureSchema(sqlite: SqliteClient): Promise<void> {
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY,
    iv TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);
  await sqlite.execute(`CREATE TABLE IF NOT EXISTS writes (
    ip TEXT NOT NULL,
    at INTEGER NOT NULL
  )`);
  await sqlite.execute('CREATE INDEX IF NOT EXISTS writes_ip_at ON writes (ip, at)');
}

export function createNotesStore(sqlite: SqliteClient, config: StoreConfig = {}) {
  const cfg = { ...DEFAULTS, ...config };
  let schemaReady: Promise<void> | null = null;
  const schema = () => (schemaReady ??= ensureSchema(sqlite));

  async function handlePost(req: Request): Promise<Response> {
    const now = cfg.now();

    // Rate limit before doing any work on the body.
    const ip = clientIp(req);
    const recent = await sqlite.execute({
      sql: 'SELECT COUNT(*) AS c FROM writes WHERE ip = ? AND at > ?',
      args: [ip, now - HOUR_MS],
    });
    if (Number(recent.rows[0]?.c ?? 0) >= cfg.writesPerHour) {
      return json(429, { error: 'rate limit exceeded' }, { 'Retry-After': '3600' });
    }

    let raw: string;
    try {
      raw = await req.text();
    } catch {
      return json(400, { error: 'unreadable body' });
    }
    if (raw.length > MAX_BODY_CHARS) return json(413, { error: 'bundle too large' });

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { error: 'invalid JSON' });
    }

    // Only a conforming encrypted bundle is accepted: exactly {iv, data}.
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 2 ||
      typeof (body as Record<string, unknown>).iv !== 'string' ||
      typeof (body as Record<string, unknown>).data !== 'string'
    ) {
      return json(400, { error: 'expected {iv, data}' });
    }
    const { iv, data } = body as { iv: string; data: string };

    if (base64DecodedBytes(iv) !== AES_GCM_IV_BYTES) {
      return json(400, { error: 'invalid iv' });
    }
    const dataBytes = base64DecodedBytes(data);
    if (dataBytes === null || dataBytes === 0) return json(400, { error: 'invalid data' });
    if (dataBytes > cfg.maxBundleBytes) return json(413, { error: 'bundle too large' });

    const id = randomId();
    await sqlite.execute({
      sql: 'INSERT INTO bundles (id, iv, data, created_at) VALUES (?, ?, ?, ?)',
      args: [id, iv, data, now],
    });
    await sqlite.execute({
      sql: 'INSERT INTO writes (ip, at) VALUES (?, ?)',
      args: [ip, now],
    });
    return json(201, { id });
  }

  async function handleGet(id: string): Promise<Response> {
    if (!ID_RE.test(id)) return json(404, { error: 'not found' });
    const result = await sqlite.execute({
      sql: 'SELECT iv, data, created_at FROM bundles WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0];
    if (!row) return json(404, { error: 'not found' });
    if (Number(row.created_at) + cfg.ttlMs <= cfg.now()) {
      await sqlite.execute({ sql: 'DELETE FROM bundles WHERE id = ?', args: [id] });
      return json(404, { error: 'not found' });
    }
    return json(200, { iv: row.iv, data: row.data });
  }

  return async function handler(req: Request): Promise<Response> {
    await schema();
    const path = new URL(req.url).pathname.replace(/\/+$/, '');

    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

    if (path === '/bundles') {
      if (req.method === 'POST') return handlePost(req);
      return json(405, { error: 'method not allowed' }, { Allow: 'POST' });
    }

    const match = path.match(/^\/bundles\/([^/]+)$/);
    if (match) {
      if (req.method === 'GET') return handleGet(match[1]);
      return json(405, { error: 'method not allowed' }, { Allow: 'GET' });
    }

    return json(404, { error: 'not found' });
  };
}

/** Delete expired bundles and stale rate-limit rows (cron). */
export async function cleanupExpired(
  sqlite: SqliteClient,
  config: StoreConfig = {},
): Promise<void> {
  const cfg = { ...DEFAULTS, ...config };
  const now = cfg.now();
  await ensureSchema(sqlite);
  await sqlite.execute({
    sql: 'DELETE FROM bundles WHERE created_at <= ?',
    args: [now - cfg.ttlMs],
  });
  await sqlite.execute({
    sql: 'DELETE FROM writes WHERE at <= ?',
    args: [now - HOUR_MS],
  });
}
