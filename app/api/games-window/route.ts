// app/api/games-window/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type {
  OddsWindowStore,
  OddsWindowGame,
  OddsSnapshot,
} from "../../../lib/types";

const ODDS_API_URL =
  "https://api.the-odds-api.com/v4/sports/basketball_nba/odds";

const STORAGE_FILE = path.join(process.cwd(), "data", "odds_window.json");

// Leer archivo odds_window.json
async function readStorage(): Promise<OddsWindowStore> {
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf8");
    const json = JSON.parse(raw);
    if (typeof json === "object" && json !== null) {
      return json as OddsWindowStore;
    }
    return {};
  } catch {
    return {};
  }
}

// Escribir archivo odds_window.json
async function writeStorage(data: OddsWindowStore) {
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error al escribir odds_window.json:", err);
  }
}

// Helpers para pendiente / tendencia
function getDeltaFromWindow(
  history: OddsSnapshot[],
  now: Date,
  windowMs: number,
  filter: (snapTime: Date) => boolean
): number | null {
  const windowSnaps = history.filter((snap) => {
    const t = new Date(snap.timestamp);
    const diff = now.getTime() - t.getTime();
    return diff >= 0 && diff <= windowMs && filter(t);
  });

  if (windowSnaps.length < 2) return null;

  const first = windowSnaps[0];
  const last = windowSnaps[windowSnaps.length - 1];

  if (first.total == null || last.total == null) return null;

  return last.total - first.total;
}

// Clasificación pre-game (ventana 5 min)
function classifyPreGameDelta(delta: number | null) {
  if (delta == null) return { label: "neutral", emoji: "🟡" };

  if (delta >= 1.5) return { label: "rally_naciente", emoji: "🟢" };
  if (delta <= -1.5) return { label: "colapso_naciente", emoji: "🔴" };

  return { label: "neutral", emoji: "🟡" };
}

// Clasificación live (ventana 2.5 min aprox)
function classifyLiveDelta(delta: number | null) {
  if (delta == null) return { label: "neutral", emoji: "🟡" };

  if (delta >= 2.0) return { label: "rally_live", emoji: "🟢" };
  if (delta <= -2.0) return { label: "colapso_live", emoji: "🔴" };

  return { label: "neutral", emoji: "🟡" };
}

export async function GET() {
  const apiKey = process.env.THEODDSAPI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falta THEODDSAPI_KEY en .env.local",
      },
      { status: 200 }
    );
  }

  try {
    const stored = await readStorage();

    const url = new URL(ODDS_API_URL);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", "us");
    url.searchParams.set("markets", "totals,spreads");
    url.searchParams.set("oddsFormat", "american");

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    const text = await res.text();
    let apiJson: any = null;
    try {
      apiJson = JSON.parse(text);
    } catch {
      // dejamos text como está
    }

    if (!res.ok) {
      console.error("Error en TheOddsAPI:", res.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: `TheOddsAPI HTTP ${res.status}`,
          raw: apiJson || text,
        },
        { status: 200 }
      );
    }

    const json = apiJson || [];
    const now = new Date();

    const games = (json || []).map((g: any) => {
      const bookmakers = g.bookmakers || [];

      const totalsBook = bookmakers.find((b: any) =>
        b.markets?.some((m: any) => m.key === "totals")
      );
      const spreadsBook = bookmakers.find((b: any) =>
        b.markets?.some((m: any) => m.key === "spreads")
      );

      // ---- Total ACTUAL (snapshot) ----
      let totalCurrent: number | null = null;
      if (totalsBook) {
        const totalsMarket = totalsBook.markets.find(
          (m: any) => m.key === "totals"
        );
        const overOutcome = totalsMarket?.outcomes?.find(
          (o: any) => (o.name || "").toLowerCase() === "over"
        );
        if (overOutcome?.point != null) {
          totalCurrent = overOutcome.point;
        }
      }

      // ---- Spread ACTUAL (home) ----
      let spreadCurrent: number | null = null;
      if (spreadsBook) {
        const spreadsMarket = spreadsBook.markets.find(
          (m: any) => m.key === "spreads"
        );
        const homeOutcome = spreadsMarket?.outcomes?.find(
          (o: any) => o.name === g.home_team
        );
        if (homeOutcome?.point != null) {
          spreadCurrent = homeOutcome.point;
        }
      }

      const id: string = g.id;
      const commenceTime = new Date(g.commence_time);
      const hasStarted = now >= commenceTime;

      // ---- Recuperar datos previos del storage ---
      const prev: OddsWindowGame | undefined = (stored as OddsWindowStore)[id];

      let totalOpen =
        prev && prev.totalOpen != null ? prev.totalOpen : null;
      let spreadOpen =
        prev && prev.spreadOpen != null ? prev.spreadOpen : null;

      let totalPregameClose =
        prev && prev.totalPregameClose != null
          ? prev.totalPregameClose
          : null;
      let spreadPregameClose =
        prev && prev.spreadPregameClose != null
          ? prev.spreadPregameClose
          : null;

      let totalLiveLast =
        prev && prev.totalLiveLast != null ? prev.totalLiveLast : null;
      let spreadLiveLast =
        prev && prev.spreadLiveLast != null ? prev.spreadLiveLast : null;

      const prevTimestamps = prev?.timestamps || {};
      const prevHistory: OddsSnapshot[] = prev?.snapshotHistory || [];
      let snapshotHistory: OddsSnapshot[] = prevHistory;

      const timestamps = {
        createdAt: prevTimestamps.createdAt || now.toISOString(),
        openCapturedAt: prevTimestamps.openCapturedAt || null,
        pregameCapturedAt: prevTimestamps.pregameCapturedAt || null,
        liveUpdatedAt: prevTimestamps.liveUpdatedAt || null,
      };

      // 1) Apertura
      if (totalOpen == null && totalCurrent != null) {
        totalOpen = totalCurrent;
        timestamps.openCapturedAt = now.toISOString();
      }
      if (spreadOpen == null && spreadCurrent != null) {
        spreadOpen = spreadCurrent;
        if (!timestamps.openCapturedAt) {
          timestamps.openCapturedAt = now.toISOString();
        }
      }

      // 2) Cierre pregame
      if (hasStarted && totalPregameClose == null && totalCurrent != null) {
        totalPregameClose = totalCurrent;
        timestamps.pregameCapturedAt = now.toISOString();
      }
      if (hasStarted && spreadPregameClose == null && spreadCurrent != null) {
        spreadPregameClose = spreadCurrent;
        if (!timestamps.pregameCapturedAt) {
          timestamps.pregameCapturedAt = now.toISOString();
        }
      }

      // 3) Live last
      if (hasStarted && totalCurrent != null) {
        totalLiveLast = totalCurrent;
        timestamps.liveUpdatedAt = now.toISOString();
      }
      if (hasStarted && spreadCurrent != null) {
        spreadLiveLast = spreadCurrent;
        timestamps.liveUpdatedAt = now.toISOString();
      }

      // 4) Historial de snapshots
      if (totalCurrent != null || spreadCurrent != null) {
        const snap: OddsSnapshot = {
          timestamp: now.toISOString(),
          total: totalCurrent,
          spread: spreadCurrent,
        };
        snapshotHistory = [...prevHistory, snap];

        const MAX_SNAPSHOTS = 120; // más largo para tener margen
        if (snapshotHistory.length > MAX_SNAPSHOTS) {
          snapshotHistory = snapshotHistory.slice(
            snapshotHistory.length - MAX_SNAPSHOTS
          );
        }
      }

      // 5) Calcular pendientes / deltas

      // Ventana pre-game: 5 minutos (en ms)
      const FIVE_MIN_MS = 5 * 60 * 1000;
      // Ventana live: 2.5 minutos (en ms)
      const TWO_DOT_FIVE_MIN_MS = 2.5 * 60 * 1000;

      // Delta pre-game: solo snapshots antes del commenceTime y dentro de últimos 5 min
      const preGameDelta = getDeltaFromWindow(
        snapshotHistory,
        now,
        FIVE_MIN_MS,
        (t) => t < commenceTime
      );
      const preGameTrend = classifyPreGameDelta(preGameDelta);

      // Delta live: snapshots después del commenceTime y dentro de últimos 2.5 min
      const liveDelta = getDeltaFromWindow(
        snapshotHistory,
        now,
        TWO_DOT_FIVE_MIN_MS,
        (t) => t >= commenceTime
      );
      const liveTrend = classifyLiveDelta(liveDelta);

      // Guardar de vuelta en storage
      (stored as OddsWindowStore)[id] = {
        id,
        home: g.home_team,
        away: g.away_team,
        totalOpen,
        spreadOpen,
        totalPregameClose,
        spreadPregameClose,
        totalLiveLast,
        spreadLiveLast,
        snapshotHistory,
        timestamps,
      };

      // Lo que mandamos al frontend
      return {
        id,
        sport: "NBA",
        homeTeam: g.home_team,
        awayTeam: g.away_team,
        commenceTime: g.commence_time,
        totalOpen,
        totalCurrent,
        spreadOpen,
        spreadCurrent,
        totalPregameClose,
        spreadPregameClose,
        totalLiveLast,
        spreadLiveLast,
        snapshotCount: snapshotHistory.length,
        preGameDelta,
        preGameTrend,
        liveDelta,
        liveTrend,
      };
    });

    await writeStorage(stored as OddsWindowStore);

    return NextResponse.json(
      {
        ok: true,
        games,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error en /api/games-window:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Error desconocido en games-window",
      },
      { status: 200 }
    );
  }
}

