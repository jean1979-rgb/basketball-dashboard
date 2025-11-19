// lib/data/cache.js
// Cache en memoria por clave con expiración (ms)
const store = new Map();

export function getCache(key) {
  const hit = store.get(key);
  if (!hit) return null;
  const { exp, value } = hit;
  if (Date.now() > exp) {
    store.delete(key);
    return null;
  }
  return value;
}

export function setCache(key, value, ttlMs) {
  store.set(key, { value, exp: Date.now() + (ttlMs || 0) });
}

export function nowISO() {
  return new Date().toISOString();
}

