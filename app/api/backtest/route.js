// app/api/backtest/route.js
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "backtest.json");

// Helpers
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    const empty = {
      // Estructura base: agrupado por fecha ISO (YYYY-MM-DD)
      byDate: {}
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(empty, null, 2), "utf-8");
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(n) {
  return typeof n === "number" && isFinite(n) ? n : 0;
}

async function readDB() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw || '{"byDate":{}}');
}

async function writeDB(db) {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

function initDay(db, dateIso) {
  if (!db.byDate[dateIso]) {
    db.byDate[dateIso] = {
      counters: {
        ou:     { market: "Over/Under", picks: 0, wins: 0, losses: 0, pushes: 0, winrate: 0,  avgEdgePts: 0,   avgEdgeProb: 0, units: 0 },
        spread: { market: "Spread",     picks: 0, wins: 0, losses: 0, pushes: 0, winrate: 0,  avgEdgePts: 0,   avgEdgeProb: 0, units: 0 },
        ml:     { market: "Moneyline",  picks: 0, wins: 0, losses: 0, pushes: 0, winrate: 0,  avgEdgePts: 0,   avgEdgeProb: 0, units: 0 },
      },
      lastEvents: []
    };
  }
}

// Recalcular derivadas (winrate, promedios, units)
function recomputeCounters(day) {
  ["ou", "spread", "ml"].forEach((k) => {
    const c = day.counters[k];
    const totalDecisions = c.picks - c.pushes;
    c.winrate = totalDecisions > 0 ? Number(((c.wins / totalDecisions) * 100).toFixed(1)) : 0;

    // Recalcular promedios a partir de eventos del día
    const events = day.lastEvents.filter(e => e.marketKey === k);
    if (events.length) {
      const avgPts = events
        .map(e => typeof e.edgePts === "number" ? e.edgePts : null)
        .filter(v => v !== null);
      if (avgPts.length) {
        c.avgEdgePts = Number((avgPts.reduce((a,b) => a+b, 0) / avgPts.length).toFixed(2));
      }

      const avgProb = events
        .map(e => typeof e.edgeProb === "number" ? e.edgeProb : null)
        .filter(v => v !== null);
      if (avgProb.length) {
        c.avgEdgeProb = Number((avgProb.reduce((a,b) => a+b, 0) / avgProb.length).toFixed(3));
      }
    }
  });
}

// GET → devuelve el día solicitado (?date=YYYY-MM-DD) o hoy
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || todayISO();

    const db = await readDB();
    initDay(db, date);
    const day = db.byDate[date];

    return new Response(
      JSON.stringify({ ok: true, date, counters: day.counters, lastEvents: day.lastEvents }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "GET error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * POST body JSON (ejemplos abajo):
 * {
 *   "ts": "2025-11-12T02:34:00Z",
 *   "league": "NBA",
 *   "game": "LAL @ DEN",
 *   "market": "OU" | "Spread" | "ML",
 *   "pick": "UNDER 221.5",
 *   "model": "ProjTotal 218.3",
 *   "edgePts": 3.2,          // OU/Spread (opcional)
 *   "edgeProb": 0.05,        // ML (opcional, 0-1)
 *   "price": "-110",
 *   "result": "W"|"L"|"P",   // opcional al inicio; si llega, actualiza counters
 *   "units": 0.95            // opcional al inicio; si llega, suma units
 * }
 */
export async function POST(req) {
  try {
    const payload = await req.json().catch(() => ({}));
    const nowIsoDate = todayISO();
    const db = await readDB();
    initDay(db, nowIsoDate);
    const day = db.byDate[nowIsoDate];

    // Validación mínima
    const allowed = ["OU", "Spread", "ML"];
    const market = String(payload.market || "").trim();
    if (!allowed.includes(market)) {
      return new Response(JSON.stringify({ ok: false, error: "market inválido (OU|Spread|ML)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Normalizar clave
    const marketKey = market.toLowerCase() === "ou" ? "ou" :
                      market.toLowerCase() === "spread" ? "spread" : "ml";

    const event = {
      ts: payload.ts || new Date().toISOString(),
      league: payload.league || "NBA",
      game: payload.game || "Unknown",
      market,               // etiqueta
      marketKey,            // clave interna
      pick: payload.pick || "",
      model: payload.model || "",
      edgePts: typeof payload.edgePts === "number" ? payload.edgePts : undefined,
      edgeProb: typeof payload.edgeProb === "number" ? payload.edgeProb : undefined,
      price: payload.price || "",
      result: payload.result || "",       // W/L/P opcional
      units: typeof payload.units === "number" ? payload.units : 0
    };

    // Guardar evento
    day.lastEvents.unshift(event);
    // Mantener lista compacta (ej: últimos 300)
    day.lastEvents = day.lastEvents.slice(0, 300);

    // Actualizar counters
    const c = day.counters[marketKey];
    c.picks += 1;

    // Si ya viene resultado y units, actualiza
    if (event.result === "W") c.wins += 1;
    else if (event.result === "L") c.losses += 1;
    else if (event.result === "P") c.pushes += 1;

    c.units = Number((safeNumber(c.units) + safeNumber(event.units)).toFixed(2));

    // Recalcular derivados
    recomputeCounters(day);

    await writeDB(db);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "POST error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

