// utils/predictor.js
// =======================================================
// Herramientas básicas para analizar partidos NBA en vivo
// =======================================================

// --- 1. Predicción simple del total de puntos ---
export function predictTotalSimple(g) {
  const offScoreHome = g.offRTG_home || 110;
  const defScoreAway = g.defRTG_away || 108;
  const pace = g.pace || 99;
  const total = ((offScoreHome + defScoreAway) / 2) * (pace / 100);
  return Number(total.toFixed(1));
}

// --- 2. Cálculo del spread (ventaja) ---
export function predictSpread(g) {
  const offHome = g.offRTG_home || 110;
  const defAway = g.defRTG_away || 108;
  const offAway = g.offRTG_away || 107;
  const defHome = g.defRTG_home || 109;
  return Number(((offHome - defAway) - (offAway - defHome)).toFixed(1));
}

// --- 3. Detección de aceleración o inflexión en la línea ---
export function detectLineInflection(g) {
  const ΔL = g.deltaLine || 0;
  const a = g.acceleration || 1;
  const inflection = Math.abs(a) > 1.3;
  const signal = a > 1.3 ? "sharp_up" : a < -1.3 ? "sharp_down" : "stable";
  return { ok: true, ΔL, a, inflection, signal };
}

// --- 4. Predicción general del partido ---
export function predictGame(g) {
  const predictedTotal = predictTotalSimple(g);
  const predictedSpread = predictSpread(g);

  const marketTotal = g.marketTotal ?? 225;
  const marketSpread = g.marketSpread ?? 0;

  const deltaTotal = predictedTotal - marketTotal;
  const deltaSpread = predictedSpread - marketSpread;

  const recommendation =
    deltaTotal > 5 ? "lean_over" :
    deltaTotal < -5 ? "lean_under" :
    "neutral";

  const confidence = Math.min(99, Math.abs(deltaTotal) * 3);

  const lineInfo = detectLineInflection(g);
  const injuryAdj = (g.home_injuryImpact || 0) + (g.away_injuryImpact || 0);

  return {
    predictedTotal,
    predictedSpread,
    marketTotal,
    marketSpread,
    deltaTotal,
    deltaSpread,
    recommendation,
    confidence,
    lineInfo,
    reasons: [
      `PredTotal=${predictedTotal}`,
      `MarketTotal=${marketTotal}`,
      `DeltaTotal=${deltaTotal}`,
      `LineSignal=${lineInfo.signal}${lineInfo.inflection ? ";inflection" : ""}`,
      `InjuryAdj=${injuryAdj}`,
    ],
  };
}

