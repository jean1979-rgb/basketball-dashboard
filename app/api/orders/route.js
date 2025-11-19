// app/api/orders/route.js
import { promises as fs } from "fs";
import path from "path";
import { listProviders, getProvider } from "../../../lib/exchanges";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ orders: [] }, null, 2), "utf-8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw || '{"orders":[]}');
}

async function writeStore(db) {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// GET: lista órdenes del día (?date=YYYY-MM-DD) o todas (?all=1)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const all = searchParams.get("all") === "1";

    const db = await readStore();
    let orders = db.orders || [];

    if (!all) {
      const d = date || todayISO();
      orders = orders.filter((o) => (o.date || "").startsWith(d));
    }

    return new Response(JSON.stringify({ ok: true, orders, providers: listProviders() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "GET error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/orders (DRY-RUN)
 * Body JSON:
 * {
 *   "providers": ["betA","betB"],   // requerido: 1..N
 *   "market": "OU"|"Spread"|"ML",   // requerido
 *   "side": "OVER"|"UNDER"|"FAVORITE"|"DOG"|"HOME"|"AWAY" (según mercado),
 *   "price": -110,                  // requerido (precio solicitado)
 *   "priceLimit": -115,             // opcional pero recomendado
 *   "stake": 1.0,                   // requerido (unidades)
 *   "context": { ... }              // opcional: info del partido/pick
 * }
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const providers = Array.isArray(body.providers) ? body.providers : [];
    const market = String(body.market || "");
    const side = String(body.side || "");
    const price = Number(body.price);
    const stake = Number(body.stake);
    const priceLimit = typeof body.priceLimit === "number" ? body.priceLimit : undefined;
    const context = body.context || {};

    if (providers.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "providers requerido" }), { status: 400 });
    }
    if (!["OU", "Spread", "ML"].includes(market)) {
      return new Response(JSON.stringify({ ok: false, error: "market inválido (OU|Spread|ML)" }), { status: 400 });
    }
    if (!side) {
      return new Response(JSON.stringify({ ok: false, error: "side requerido" }), { status: 400 });
    }
    if (!isFinite(price)) {
      return new Response(JSON.stringify({ ok: false, error: "price inválido" }), { status: 400 });
    }
    if (!(stake > 0)) {
      return new Response(JSON.stringify({ ok: false, error: "stake debe ser > 0" }), { status: 400 });
    }

    const results = [];
    for (const pid of providers) {
      try {
        const p = getProvider(pid);

        // 1) Cotiza
        const q = await p.quote({ market, side, price });

        // 2) Simula place con límite (si hay)
        const pl = await p.place({ market, side, stake, priceLimit });

        results.push({
          provider: pid,
          quote: q,
          place: pl,
        });
      } catch (e) {
        results.push({
          provider: pid,
          error: e?.message || "error proveedor",
        });
      }
    }

    const db = await readStore();
    const record = {
      id: "ord_" + Date.now(),
      date: new Date().toISOString(),
      market,
      side,
      price,
      priceLimit: typeof priceLimit === "number" ? priceLimit : null,
      stake,
      providers,
      results,
      status: "simulated", // dry-run
      context,
    };
    db.orders.unshift(record);
    db.orders = db.orders.slice(0, 500); // mantener compacto
    await writeStore(db);

    return new Response(JSON.stringify({ ok: true, order: record }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "POST error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

