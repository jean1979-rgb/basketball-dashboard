// lib/exchanges/betB.js
export const id = "betB";
export const name = "Bet B (mock)";
export const markets = ["OU", "Spread", "ML"];

export async function quote({ market, side, price }) {
  const px = Number(price);
  // betB simula spreads más “estrechos” (menos slippage)
  const adj = Math.random() < 0.5 ? -3 : +3;
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

export async function place({ market, side, stake, priceLimit }) {
  // betB requiere limite presente y >= -120
  if (typeof priceLimit !== "number")
    return { ok: false, provider: id, message: "priceLimit requerido por betB" };

  const accepted = priceLimit >= -120;
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

