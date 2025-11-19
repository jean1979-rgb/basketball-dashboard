// lib/rallyPredictor.js

/**
 * Módulo: Rally & Collapse Predictor
 *
 * Objetivo:
 * Detectar escenarios de:
 * - RALLY_UP: rally real (explosión de puntos sostenible)
 * - COLLAPSE_DOWN: colapso real del ritmo
 * - FAKE_RALLY: rally falso (eficiencia insostenible)
 * - FAKE_COLLAPSE: baja falsa (muchas posesiones desperdiciadas)
 * - NEUTRAL: sin señal clara
 *
 * Este módulo NO ve solo la línea, sino:
 * - Pace (delta vs esperado)
 * - Tendencia de la línea (trend técnico)
 * - Edge del modelo vs mercado (value OU)
 * - Puntos anotados vs tiempo jugado (aprox. intensidad)
 */

export function computeRallyPredictor(ctx = {}) {
  const { game, pace, trend, value } = ctx;

  // Valores por defecto para evitar errores
  const safeGame = game || {};
  const safePace = pace || {};
  const safeTrend = trend || {};
  const safeValue = value || {};

  const totalLive = safeGame.market?.totalLive ?? null;
  const quarter = safeGame.quarter ?? null;
  const secondsRemainingQuarter = safeGame.secondsRemainingQuarter ?? null;
  const scoreHome = safeGame.score?.home ?? 0;
  const scoreAway = safeGame.score?.away ?? 0;

  const paceDeltaTotal = safePace.total?.delta ?? 0; // + = ritmo alto, - = ritmo bajo
  const trendDir = safeTrend.direction || "flat"; // up / down / flat
  const trendStrength = safeTrend.strength || "soft"; // soft / moderate / strong
  const ouEdgePts = safeValue.ou?.edgePts ?? 0; // diferencia modelo - mercado en pts

  const totalGameSeconds = 48 * 60;
  const secondsPerQuarter = 12 * 60;

  let timePlayed = 0;
  if (
    typeof quarter === "number" &&
    quarter >= 1 &&
    quarter <= 4 &&
    typeof secondsRemainingQuarter === "number"
  ) {
    timePlayed =
      (quarter - 1) * secondsPerQuarter +
      (secondsPerQuarter - secondsRemainingQuarter);
  }

  const totalPoints = scoreHome + scoreAway;
  let projectedByRawPace = null;

  if (timePlayed > 0) {
    const factor = totalGameSeconds / timePlayed;
    projectedByRawPace = totalPoints * factor;
  }

  // Valores de salida por defecto
  let state = "NEUTRAL"; // RALLY_UP, COLLAPSE_DOWN, FAKE_RALLY, FAKE_COLLAPSE, NEUTRAL
  let confidence = 0.0;  // 0 a 1
  let edgeDirection = "NONE"; // OVER / UNDER / NONE
  let reasonTags = [];
  let comment = "Sin señal clara de rally o colapso en este momento.";
  let expectedMovePts = 0.0;
  let signalWindowSec = 10; // ventana estimada en segundos

  // ---------- REGLAS PARA ESCENARIOS PRINCIPALES ----------

  // 1) RALLY_UP — ritmo alto + edge OVER + tendencia alcista o neutral
  if (
    paceDeltaTotal >= 8 && // ritmo claramente por encima de lo esperado
    ouEdgePts > 1.5 &&     // modelo por encima de la línea live
    (trendDir === "up" || trendDir === "flat") &&
    (trendStrength === "moderate" || trendStrength === "strong")
  ) {
    state = "RALLY_UP";
    edgeDirection = "OVER";
    confidence = 0.7 + Math.min(0.25, Math.abs(ouEdgePts) / 10);
    reasonTags.push("high_pace", "model_over_edge", "trend_up_or_flat");

    comment =
      "Ritmo total por encima de lo esperado y el modelo proyecta más puntos que la línea live. " +
      "La tendencia técnica apoya o al menos no contradice el movimiento alcista. " +
      "Escenario típico de rally real.";

    expectedMovePts = parseFloat(Math.max(2, Math.min(6, Math.abs(ouEdgePts) * 1.2)).toFixed(1));
  }

  // 2) COLLAPSE_DOWN — ritmo bajo + edge UNDER + tendencia bajista
  else if (
    paceDeltaTotal <= -8 && // ritmo claramente por debajo
    ouEdgePts < -1.5 &&     // modelo por debajo de la línea live
    (trendDir === "down" || trendDir === "flat") &&
    (trendStrength === "moderate" || trendStrength === "strong")
  ) {
    state = "COLLAPSE_DOWN";
    edgeDirection = "UNDER";
    confidence = 0.7 + Math.min(0.25, Math.abs(ouEdgePts) / 10);
    reasonTags.push("low_pace", "model_under_edge", "trend_down_or_flat");

    comment =
      "Ritmo total por debajo de lo esperado y el modelo proyecta menos puntos que la línea live. " +
      "La tendencia técnica apoya o al menos no contradice el movimiento bajista. " +
      "Escenario típico de colapso del ritmo (baja dura).";

    expectedMovePts = parseFloat(Math.max(2, Math.min(6, Math.abs(ouEdgePts) * 1.2)).toFixed(1));
  }

  // 3) FAKE_RALLY — muchos puntos / tendencia alcista, pero ritmo no acompaña
  else if (
    paceDeltaTotal <= 3 && // ritmo no tan alto
    ouEdgePts <= 0 &&      // modelo no ve edge de OVER
    trendDir === "up" &&   // línea live viene subiendo
    (trendStrength === "moderate" || trendStrength === "strong") &&
    totalLive !== null &&
    projectedByRawPace !== null &&
    projectedByRawPace < totalLive // la proyección bruta no soporta la línea
  ) {
    state = "FAKE_RALLY";
    edgeDirection = "UNDER";
    confidence = 0.6;
    reasonTags.push("trend_up", "pace_not_supporting", "model_no_over_edge");

    comment =
      "La línea live ha subido con fuerza pero el ritmo real no acompaña. " +
      "La proyección bruta del partido está por debajo de la propia línea. " +
      "Escenario típico de rally falso (eficiencia o mercado sobrecalentado).";

    expectedMovePts = parseFloat(Math.max(1.5, Math.min(4, (totalLive - projectedByRawPace) / 2 || 2)).toFixed(1));
  }

  // 4) FAKE_COLLAPSE — baja aparente pero con muchas posesiones desperdiciadas
  else if (
    paceDeltaTotal >= 3 &&  // ritmo decente o algo por encima
    ouEdgePts >= 0 &&       // modelo no ve edge fuerte UNDER
    trendDir === "down" &&  // línea live viene bajando
    (trendStrength === "moderate" || trendStrength === "strong") &&
    projectedByRawPace !== null &&
    totalLive !== null &&
    projectedByRawPace > totalLive // la proyección soporta más puntos de los que marca la línea
  ) {
    state = "FAKE_COLLAPSE";
    edgeDirection = "OVER";
    confidence = 0.6;
    reasonTags.push("trend_down", "pace_supports_more", "model_no_under_edge");

    comment =
      "La línea live ha bajado pero el ritmo de posesiones y la proyección bruta apuntan a más puntos. " +
      "Escenario típico de falsa baja por rachas de fallos, con potencial de rally de recuperación.";

    expectedMovePts = parseFloat(Math.max(1.5, Math.min(4, (projectedByRawPace - totalLive) / 2 || 2)).toFixed(1));
  }

  // Ajuste simple de ventana de tiempo sugerida: en Q3/Q4 la ventana tiende a ser más corta
  if (quarter != null) {
    if (quarter >= 3) {
      signalWindowSec = 10;
    } else {
      signalWindowSec = 20;
    }
  }

  // Clamp de confianza
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    state,
    confidence,
    edgeDirection,
    reasonTags,
    comment,
    expectedMovePts: parseFloat(expectedMovePts.toFixed(1)),
    signalWindowSec,
  };
}

