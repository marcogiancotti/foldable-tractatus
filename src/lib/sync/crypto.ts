/*
  Client-side encryption for the opt-in sync store (spec §7): AES-GCM 256 via
  WebCrypto. Content is encrypted BEFORE upload; the key travels only in the
  link fragment and is never sent to the host. GCM authentication means any
  tampering with the stored ciphertext fails decryption loudly.
*/

export interface EncryptedBundle {
  iv: string; // base64, 12 bytes
  data: string; // base64 ciphertext
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const toUrlSafe = (b64: string) =>
  b64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const fromUrlSafe = (u: string) => {
  const b64 = u.replaceAll('-', '+').replaceAll('_', '/');
  return b64 + '='.repeat((4 - (b64.length % 4)) % 4);
};

/** A fresh random 256-bit key, base64url — safe to place in a URL fragment. */
export function generateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toUrlSafe(bytesToBase64(bytes));
}

function importKey(keyB64url: string, usage: KeyUsage): Promise<CryptoKey> {
  const bytes = base64ToBytes(fromUrlSafe(keyB64url));
  if (bytes.length !== 32) throw new Error('invalid key');
  return crypto.subtle.importKey('raw', bytes as BufferSource, 'AES-GCM', false, [usage]);
}

export async function encryptBundle(payload: unknown, keyB64url: string): Promise<EncryptedBundle> {
  const key = await importKey(keyB64url, 'encrypt');
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return { iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(ciphertext)) };
}

/** Throws if the key is wrong or the ciphertext was tampered with. */
export async function decryptBundle<T>(bundle: EncryptedBundle, keyB64url: string): Promise<T> {
  const key = await importKey(keyB64url, 'decrypt');
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(bundle.iv) as BufferSource },
    key,
    base64ToBytes(bundle.data) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
