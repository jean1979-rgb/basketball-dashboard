// app/api/live/route.js

import { computeRallyPredictor } from "../../../lib/rallyPredictor";

export const dynamic = "force-dynamic";

// --- Helpers técnicos para tendencia y valor ---

function ema(values, period) {
  if (!values || values.length === 0) return [];
  const k = 2 / (period + 1);
  const result = [];
  let emaPrev = values[0];

  for (let i = 0; i < values.length; i++) {
    const price = values[i];
    if (i === 0) emaPrev = price;
    else emaPrev = price * k + emaPrev * (1 - k);
    result.push(emaPrev);
  }
  return result;
}

function macd(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = ema(values, fastPeriod);
  const emaSlow = ema(values, slowPeriod);
  const macdLine = values.map((_, i) => emaFast[i] - emaSlow[i]);
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

function rsi(values, period = 14) {
  if (!values || values.length <= period) return null;
  let gains = 0,
    losses = 0;
  const start = Math.max(1, values.length - period);
  for (let i = start; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const eff = values.length - start;
  const avgGain = gains / (eff || 1);
  const avgLoss = losses / (eff || 1) || 1e-6;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeTrendMetrics(history) {
  if (!history || history.length < 3) {
    return {
      slope: 0,
      prevSlope: 0,
      curvature: 0,
      direction: "flat",
      strength: "soft",
      inflexion: false,
      label: "Sin suficiente historial para evaluar la tendencia.",
    };
  }

  const n = history.length;
  const p1 = history[n - 1];
  const p2 = history[n - 2];
  const p3 = history[n - 3];

  const dt1 = Math.abs(p1.secondsAgo - p2.secondsAgo) || 1;
  const dt2 = Math.abs(p2.secondsAgo - p3.secondsAgo) || 1;

  const slope = (p1.total - p2.total) / dt1;
  const prevSlope = (p2.total - p3.total) / dt2;
  const curvature = slope - prevSlope;

  let direction = "flat";
  if (Math.abs(slope) < 0.005) direction = "flat";
  else if (slope > 0) direction = "up";
  else direction = "down";

  let strength = "soft";
  const absSlope = Math.abs(slope);
  if (absSlope >= 0.08) strength = "strong";
  else if (absSlope >= 0.03) strength = "moderate";

  const changedSign = prevSlope * slope < 0;
  const bigCurv = Math.abs(curvature) >= 0.02;
  const inflexion = changedSign && bigCurv;

  let label = "";

  if (direction === "flat") {
    label = "Línea live casi plana: el mercado parece lateralizar.";
  } else if (direction === "up") {
    if (strength === "strong") {
      label = "Tendencia alcista fuerte en la línea live (presión hacia OVER).";
    } else if (strength === "moderate") {
      label = "Tendencia alcista moderada en la línea live.";
    } else {
      label = "Línea live ligeramente alcista.";
    }
  } else if (direction === "down") {
    if (strength === "strong") {
      label = "Tendencia bajista fuerte en la línea live (presión hacia UNDER).";
    } else if (strength === "moderate") {
      label = "Tendencia bajista moderada en la línea live.";
    } else {
      label = "Línea live ligeramente bajista.";
    }
  }

  if (inflexion) {
    label +=
      " Se detecta un posible punto de inflexión: la pendiente cambió de signo recientemente.";
  }

  return {
    slope,
    prevSlope,
    curvature,
    direction,
    strength,
    inflexion,
    label,
  };
}

function americanToProb(odds) {
  if (odds === 0) return 0.5;
  if (odds < 0) {
    const abs = Math.abs(odds);
    return abs / (abs + 100);
  } else {
    return 100 / (odds + 100);
  }
}

function marginToProb(margin) {
  return 1 / (1 + Math.exp(-margin / 6));
}

// --- Motor principal para simular un juego con todos los indicadores ---

function buildSimGame(cfg) {
  const {
    gameId,
    matchup,
    homeTeam,
    awayTeam,
    quarter,
    secondsRemainingQuarter,
    scoreHome,
    scoreAway,
    expectedHome,
    expectedAway,
    lineHistory,
    scoreHistory,
    spreadLine,
    mlHome,
    mlAway,
  } = cfg;

  const closes = lineHistory.map((p) => p.total);
  const emaShortSeries = ema(closes, 5);
  const emaLongSeries = ema(closes, 13);
  const macdData = macd(closes);
  const rsiValue = rsi(closes, 7);

  const lastIndex = closes.length - 1;
  const emaShort = emaShortSeries[lastIndex];
  const emaLong = emaLongSeries[lastIndex];
  const macdValue = macdData.macdLine[lastIndex];
  const macdSignal = macdData.signalLine[lastIndex];

  const trendMetrics = computeTrendMetrics(lineHistory);

  const game = {
    gameId,
    matchup,
    homeTeam,
    awayTeam,
    quarter,
    secondsRemainingQuarter,
    score: {
      home: scoreHome,
      away: scoreAway,
    },
    market: {
      totalLive: closes[lastIndex],
      history: lineHistory,
    },
    scoreHistory,
  };

  // Señal técnica sobre totales
  let liveSignal = "NO_BET";
  let liveComment = "Modelo técnico: sin señal clara en el total live.";

  if (emaShort > emaLong && macdValue > macdSignal && rsiValue !== null && rsiValue < 70) {
    liveSignal = "OVER_BIAS";
    liveComment = "Momentum alcista en la línea live (EMA corta > EMA larga, MACD positivo).";
  } else if (
    emaShort < emaLong &&
    macdValue < macdSignal &&
    rsiValue !== null &&
    rsiValue > 30
  ) {
    liveSignal = "UNDER_BIAS";
    liveComment =
      "Momentum bajista en la línea live (EMA corta < EMA larga, MACD negativo).";
  }

  // Ritmo (pace)
  const totalGameSeconds = 48 * 60;
  const secondsPerQuarter = 12 * 60;
  const timePlayed =
    (quarter - 1) * secondsPerQuarter +
    (secondsPerQuarter - secondsRemainingQuarter);

  let projectedHome = expectedHome;
  let projectedAway = expectedAway;

  if (timePlayed > 0) {
    const factor = totalGameSeconds / timePlayed;
    projectedHome = scoreHome * factor;
    projectedAway = scoreAway * factor;
  }

  const deltaHome = projectedHome - expectedHome;
  const deltaAway = projectedAway - expectedAway;

  const expectedTotal = expectedHome + expectedAway;
  const projectedTotal = projectedHome + projectedAway;
  const deltaTotal = projectedTotal - expectedTotal;

  const pace = {
    home: {
      team: homeTeam,
      expected: expectedHome,
      projected: projectedHome,
      delta: deltaHome,
    },
    away: {
      team: awayTeam,
      expected: expectedAway,
      projected: projectedAway,
      delta: deltaAway,
    },
    total: {
      expected: expectedTotal,
      projected: projectedTotal,
      delta: deltaTotal,
    },
  };

  // Value Over/Under
  const liveTotal = game.market.totalLive;
  const modelLiveTotal = projectedTotal;
  const ouDiff = modelLiveTotal - liveTotal;

  let ouSide = "NONE";
  if (ouDiff > 2) ouSide = "OVER";
  else if (ouDiff < -2) ouSide = "UNDER";

  const valueOU = {
    side: ouSide,
    edgePts: parseFloat(ouDiff.toFixed(1)),
    modelTotal: modelLiveTotal,
    marketTotal: liveTotal,
  };

  // Value Spread
  const marketMarginHome = -spreadLine;
  const modelMarginHome = projectedHome - projectedAway;
  const edgeSpreadHome = modelMarginHome - marketMarginHome;

  let spreadSide = "NONE";
  if (edgeSpreadHome > 1) spreadSide = "FAVORITE";
  else if (edgeSpreadHome < -1) spreadSide = "DOG";

  const valueSpread = {
    side: spreadSide,
    edgePts: parseFloat(edgeSpreadHome.toFixed(1)),
    spreadLine,
    modelMarginHome: parseFloat(modelMarginHome.toFixed(1)),
  };

  // Value Moneyline
  const modelProbHome = marginToProb(modelMarginHome);
  const marketProbHome = americanToProb(mlHome);
  const edgeProbHome = modelProbHome - marketProbHome;

  let mlBestSide = "NONE";
  let mlEdgeProb = 0;

  if (Math.abs(edgeProbHome) >= 0.03) {
    if (edgeProbHome > 0) {
      mlBestSide = "FAVORITE";
      mlEdgeProb = edgeProbHome;
    } else {
      mlBestSide = "DOG";
      mlEdgeProb = -edgeProbHome;
    }
  }

  const valueML = {
    bestSide: mlBestSide,
    edgeProb: parseFloat(mlEdgeProb.toFixed(3)),
    modelProbHome: parseFloat(modelProbHome.toFixed(3)),
    marketProbHome: parseFloat(marketProbHome.toFixed(3)),
    mlHome,
    mlAway,
  };

  const value = {
    ou: valueOU,
    spread: valueSpread,
    moneyline: valueML,
  };

  // 🔥 Rally & Collapse Predictor
  const rallyPredictor = computeRallyPredictor({
    game,
    pace,
    trend: trendMetrics,
    value,
  });

  return {
    game,
    technicalSignal: {
      liveSignal,
      liveComment,
    },
    trend: trendMetrics,
    pace,
    value,
    rallyPredictor,
  };
}

// --- Helpers para ESPN (live score real) ---

function parseDisplayClock(clockStr) {
  if (!clockStr || typeof clockStr !== "string") return 0;
  const lower = clockStr.toLowerCase();
  if (
    lower.includes("final") ||
    lower.includes("end") ||
    lower.includes("halftime")
  ) {
    return 0;
  }
  const parts = clockStr.split(":");
  if (parts.length !== 2) return 0;
  const minutes = parseInt(parts[0], 10) || 0;
  const seconds = parseInt(parts[1], 10) || 0;
  return minutes * 60 + seconds;
}

function mapEspnEvent(event, idx) {
  if (!event) return null;

  const competitions = event.competitions || [];
  const comp = competitions[0] || {};
  const competitors = comp.competitors || [];

  const homeComp =
    competitors.find((c) => c.homeAway === "home") || competitors[0] || {};
  const awayComp =
    competitors.find((c) => c.homeAway === "away") || competitors[1] || {};

  const homeTeam = homeComp.team || {};
  const awayTeam = awayComp.team || {};

  const homeScore = Number(homeComp.score ?? 0);
  const awayScore = Number(awayComp.score ?? 0);

  const status = event.status || {};
  const statusType = status.type || {};

  const state = statusType.state || "pre"; // "pre", "in", "post"
  const period = status.period ?? 0;
  const displayClock = status.displayClock || "0:00";
  const secondsRemainingQuarter = parseDisplayClock(displayClock);

  return {
    gameId: idx + 1,
    matchup: event.shortName || event.name || "",
    state,
    statusText: statusType.shortDetail || statusType.detail || "",
    period,
    displayClock,
    secondsRemainingQuarter,
    homeTeam: homeTeam.shortDisplayName || homeTeam.name || "",
    homeAbbr: homeTeam.abbreviation || "",
    homeScore,
    awayTeam: awayTeam.shortDisplayName || awayTeam.name || "",
    awayAbbr: awayTeam.abbreviation || "",
    awayScore,
  };
}

// --- Handler GET: ahora usa ESPN para score real ---

export async function GET() {
  try {
    // 1) Llamamos al scoreboard de ESPN directamente (puedes cambiarlo a tu /api/espn/scoreboard si quieres).
    const espnUrl =
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

    const res = await fetch(espnUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("Error al llamar ESPN en /api/live:", res.status);
      // En caso de error, regresamos sin juegos pero ok: false
      return new Response(
        JSON.stringify({
          ok: false,
          error: "No se pudo obtener el scoreboard de ESPN",
          games: [],
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const json = await res.json();
    const events = Array.isArray(json.events) ? json.events : [];

    const mapped = events
      .map(mapEspnEvent)
      .filter((g) => g && (g.state === "in" || g.state === "pre"));

    if (mapped.length === 0) {
      // No hay partidos en vivo o próximos
      return new Response(
        JSON.stringify({
          ok: true,
          games: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const now = Date.now() / 1000;

    // 2) Para cada partido creamos una simulación usando score real
    const sims = mapped.map((g) => {
      // Base total mock, solo para que el motor tenga algo
      const baseTotal = 220 + (g.gameId % 3) * 2;

      const lineHistory = Array.from({ length: 12 }).map((_, i) => {
        const secondsAgo = (12 - i) * 30;
        const trendStep = (g.gameId % 2 === 0 ? 0.3 : -0.2) * i;
        const noise = Math.sin(i / 2) * 1.5;
        return {
          t: now - secondsAgo,
          secondsAgo,
          total: baseTotal + trendStep + noise,
        };
      });

      const scoreHistory = [
        {
          t: now - 600,
          home: Math.max(0, Math.round(g.homeScore * 0.3)),
          away: Math.max(0, Math.round(g.awayScore * 0.3)),
        },
        {
          t: now - 360,
          home: Math.max(0, Math.round(g.homeScore * 0.6)),
          away: Math.max(0, Math.round(g.awayScore * 0.6)),
        },
        {
          t: now - 120,
          home: g.homeScore,
          away: g.awayScore,
        },
      ];

      // Por ahora usamos expectedHome/Away genéricos.
      // Más adelante los llenamos con Covers (PF/PA reales).
      const expectedHome = 115;
      const expectedAway = 112;

      // Líneas mock por ahora
      const spreadLine = -3.5;
      const mlHome = -160;
      const mlAway = 140;

      return buildSimGame({
        gameId: g.gameId,
        matchup: g.matchup,
        homeTeam: g.homeAbbr || g.homeTeam,
        awayTeam: g.awayAbbr || g.awayTeam,
        quarter: g.period || 1,
        secondsRemainingQuarter: g.secondsRemainingQuarter || 0,
        scoreHome: g.homeScore,
        scoreAway: g.awayScore,
        expectedHome,
        expectedAway,
        lineHistory,
        scoreHistory,
        spreadLine,
        mlHome,
        mlAway,
      });
    });

    return new Response(
      JSON.stringify(
        {
          ok: true,
          games: sims,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en /api/live:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Error interno en /api/live",
        games: [],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

