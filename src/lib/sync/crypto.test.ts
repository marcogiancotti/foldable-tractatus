import { describe, expect, it } from 'vitest';
import { decryptBundle, encryptBundle, generateKey } from './crypto';

const payload = {
  notes: { '1.11': 'the key move — the world is closed\nand complete.' },
  pins: ['1.11', '2.12'],
};

describe('client-side AES-GCM encryption (spec §7)', () => {
  it('round-trips a bundle', async () => {
    const key = generateKey();
    const bundle = await encryptBundle(payload, key);
    await expect(decryptBundle(bundle, key)).resolves.toEqual(payload);
  });

  it('generates 256-bit base64url keys (fragment-safe)', () => {
    const key = generateKey();
    expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateKey()).not.toBe(key);
  });

  it('produces base64 ciphertext with a fresh 12-byte IV per encryption', async () => {
    const key = generateKey();
    const a = await encryptBundle(payload, key);
    const b = await encryptBundle(payload, key);
    expect(atob(a.iv)).toHaveLength(12);
    expect(a.iv).not.toBe(b.iv);
    expect(a.data).not.toBe(b.data); // same plaintext, different ciphertext
    expect(a.data).not.toContain(JSON.stringify(payload).slice(0, 10)); // opaque
  });

  it('fails loudly on a wrong key', async () => {
    const bundle = await encryptBundle(payload, generateKey());
    await expect(decryptBundle(bundle, generateKey())).rejects.toThrow();
  });

  it('fails loudly on tampered ciphertext (GCM auth)', async () => {
    const key = generateKey();
    const bundle = await encryptBundle(payload, key);
    const bytes = Uint8Array.from(atob(bundle.data), (c) => c.charCodeAt(0));
    bytes[0] ^= 0xff;
    const tampered = { ...bundle, data: btoa(String.fromCharCode(...bytes)) };
    await expect(decryptBundle(tampered, key)).rejects.toThrow();
  });

  it('rejects malformed keys', async () => {
    await expect(() => encryptBundle(payload, 'short')).rejects.toThrow();
  });
});
