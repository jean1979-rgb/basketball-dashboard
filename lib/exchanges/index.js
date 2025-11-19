// lib/exchanges/index.js
import * as betA from "./betA";
import * as betB from "./betB";

// Registra aquí TODOS los sportsbooks soportados.
// Para agregar uno nuevo: crea lib/exchanges/<id>.js y agrégalo abajo.
const REGISTRY = {
  betA,
  betB,
};

export function listProviders() {
  return Object.keys(REGISTRY).map((id) => ({
    id,
    name: REGISTRY[id].name,
    markets: REGISTRY[id].markets,
  }));
}

// Obtiene un provider por id (e.g., "betA")
export function getProvider(id) {
  const mod = REGISTRY[id];
  if (!mod) throw new Error(`Provider '${id}' no registrado`);
  if (typeof mod.quote !== "function" || typeof mod.place !== "function") {
    throw new Error(`Provider '${id}' no implementa interfaz quote/place`);
  }
  return mod;
}

