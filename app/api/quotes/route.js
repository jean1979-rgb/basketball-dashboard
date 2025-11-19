// app/api/quotes/route.js
import { getProvider, listProviders } from "../../../lib/exchanges";

export async function GET() {
  // Lista de providers disponibles (para UI)
  return new Response(
    JSON.stringify({ ok: true, providers: listProviders() }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * POST /api/quotes
 * Body:
 * {
 *   "providers": ["betA","betB"],   // requerido
 *   "market": "OU"|"Spread"|"ML",   // requerido
 *   "side": "OVER"|"UNDER"|...      // requerido
 *   "price": -110                    // requerido (precio solicitado/objetivo)
 * }
 * Respuesta: { ok:true, quotes:[{provider, quote:{...}}] }
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const providers = Array.isArray(body.providers) ? body.providers : [];
    const market = String(body.market || "");
    const side = String(body.side || "");
    const price = Number(body.price);

    if (!providers.length) {
      return new Response(JSON.stringify({ ok: false, error: "providers requerido" }), { status: 400 });
    }
    if (!["OU","Spread","ML"].includes(market)) {
      return new Response(JSON.stringify({ ok: false, error: "market inválido (OU|Spread|ML)" }), { status: 400 });
    }
    if (!side) {
      return new Response(JSON.stringify({ ok: false, error: "side requerido" }), { status: 400 });
    }
    if (!isFinite(price)) {
      return new Response(JSON.stringify({ ok: false, error: "price inválido" }), { status: 400 });
    }

    const quotes = [];
    for (const pid of providers) {
      try {
        const p = getProvider(pid);
        const q = await p.quote({ market, side, price });
        quotes.push({ provider: pid, quote: q });
      } catch (e) {
        quotes.push({ provider: pid, error: e?.message || "error cotizando" });
      }
    }

    return new Response(JSON.stringify({ ok: true, quotes }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "POST error" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}

