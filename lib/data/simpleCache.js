// lib/data/simpleCache.js
// Cache ultra simple en memoria con expiración en ms.

const store = new Map();

/**
 * Obtiene una clave del cache.
 * Si ya expiró, la borra y devuelve null.
 */
export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;

  const { expireAt, value } = entry;
  if (Date.now() > expireAt) {
    store.delete(key);
    return null;
  }
  return value;
}

/**
 * Guarda una clave en cache con TTL (ms).
 */
export function setCached(key, value, ttlMs) {
  const ttl = typeof ttlMs === "number" ? ttlMs : 0;
  store.set(key, {
    value,
    expireAt: Date.now() + ttl,
  });
}

