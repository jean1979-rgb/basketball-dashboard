// lib/exchanges/betA.js
export const id = "betA";
export const name = "Bet A (mock)";
export const markets = ["OU", "Spread", "ML"];

// Retorna una cotización mock (simula best price)
export async function quote({ market, side, price }) {
  // price esperado en formato americano (e.g., -110, +120)
  const px = Number(price);
  // Simula un pequeño slippage favorable/desfavorable
  const adj = Math.random() < 0.5 ? -5 : +5;
  const quoted = isFinite(px) ? px + adj : px;
  return {
    ok: true,
    provider: id,
    market,
    side,
    requestedPrice: px,
    quotedPrice: quoted,
    ts: new Date().toISOString(),
  };
}

// Simula una "colocación" (dry-run)
export async function place({ market, side, stake, priceLimit }) {
  // En modo mock, aceptamos si el priceLimit es no peor que -125 (por ejemplo)
  const accepted =
    typeof priceLimit === "number" ? priceLimit >= -125 : true;
  return {
    ok: accepted,
    provider: id,
    market,
    side,
    stake,
    priceLimit,
    ts: new Date().toISOString(),
    message: accepted ? "Simulada OK" : "Rechazada por límite de precio",
  };
}

