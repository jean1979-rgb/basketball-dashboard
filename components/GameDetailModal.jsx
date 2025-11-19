// components/GameDetailModal.jsx
"use client";

import React, { useEffect, useState } from "react";

// Mapeo simple de nombres / abreviaturas a un código estándar
const TEAM_ALIASES = {
  // Cavaliers
  "cleveland cavaliers": "cle",
  cavaliers: "cle",
  cleveland: "cle",
  cle: "cle",
  // Grizzlies
  "memphis grizzlies": "mem",
  grizzlies: "mem",
  memphis: "mem",
  mem: "mem",
  // Ejemplos extra para futuro
  lakers: "lal",
  "los angeles lakers": "lal",
  warriors: "gsw",
  "golden state warriors": "gsw",
  nuggets: "den",
  "denver nuggets": "den",
  heat: "mia",
  "miami heat": "mia",
  celtics: "bos",
  "boston celtics": "bos",
};

function normalizeTeam(name) {
  const n = (name || "").toLowerCase().trim();
  return TEAM_ALIASES[n] || n;
}

function formatSeconds(secs) {
  if (secs == null) return "0:00";
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// Helper de clasificación de movimientos
function describeTotalDelta(delta) {
  if (delta == null) return "-";
  const d = Number(delta);
  const sign = d > 0 ? "+" : "";
  const base = `${sign}${d.toFixed(1)} pts`;
  if (d > 2) return `${base} (alcista fuerte)`;
  if (d > 1) return `${base} (alcista suave)`;
  if (d < -2) return `${base} (bajista fuerte)`;
  if (d < -1) return `${base} (bajista suave)`;
  return `${base} (neutral)`;
}

function describeSpreadDelta(delta) {
  if (delta == null) return "-";
  const d = Number(delta);
  const sign = d > 0 ? "+" : "";
  const base = `${sign}${d.toFixed(1)} pts`;
  if (Math.abs(d) < 0.5) return `${base} (neutral)`;
  if (d > 0)
    return `${base} (más carga al favorito)`;
  return `${base} (se cierra a favor del underdog)`;
}

function describeMlDelta(delta) {
  if (delta == null) return "-";
  const d = Number(delta);
  const sign = d > 0 ? "+" : "";
  const base = `${sign}${d.toFixed(0)} pts vs apertura`;
  if (Math.abs(d) < 20) return `${base} (cambio suave)`;
  if (d < 0) return `${base} (mercado afloja al favorito)`;
  return `${base} (mercado aprieta al favorito)`;
}

export default function GameDetailModal({ open, onClose, game }) {
  // --- Hooks para odds reales ---
  const [ouTotal, setOuTotal] = useState(null);
  const [spreadLive, setSpreadLive] = useState(null);
  const [mlHome, setMlHome] = useState(null);
  const [mlAway, setMlAway] = useState(null);

  // Juego normalizado
  const g = (game && (game.game || game)) || {};
  const market = g.market || {};
  const score = g.score || {};
  const technical = g.technicalSignal || {};
  const value = g.value || {};
  const rally = g.rallyPred || {};
  const trend = g.trend || {};
  const pace = g.pace || {};

  const homeTeam = g.homeTeam || "HOME";
  const awayTeam = g.awayTeam || "AWAY";

  const quarter = g.quarter ?? "-";
  const secRemaining = g.secondsRemainingQuarter ?? 0;
  const totalLive = market.totalLive ?? market.total_live ?? null;

  // 👉 TOTAL DEL MODELO (la punta de la flecha)
  const modelTotal =
    pace.projectedTotal ??
    pace.expectedTotal ??
    g.modelTotal ??
    null;

  const visible = !!(open && game);

  // --- Efecto: traer odds desde /api/odds ---
  useEffect(() => {
    if (!game) return;

    async function cargarOdds() {
      try {
        const res = await fetch("/api/odds");
        if (!res.ok) {
          console.error("Error al llamar /api/odds");
          return;
        }

        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) {
          console.error("Formato inesperado en /api/odds");
          return;
        }

        const homeLocal = normalizeTeam(homeTeam);
        const awayLocal = normalizeTeam(awayTeam);

        const oddsGame = json.data.find((og) => {
          const homeApi = normalizeTeam(og.home_team);
          const awayApi = normalizeTeam(og.away_team);
          return homeApi === homeLocal && awayApi === awayLocal;
        });

        if (!oddsGame) {
          console.log("No se encontró este juego en /api/odds");
          return;
        }

        const firstBook = oddsGame.bookmakers?.[0];
        if (!firstBook) {
          console.log("Juego sin bookmakers en /api/odds");
          return;
        }

        const markets = firstBook.markets || [];

        // Totales (OU)
        const totalsMarket = markets.find((m) => m.key === "totals");
        if (totalsMarket && Array.isArray(totalsMarket.outcomes)) {
          const overOutcome = totalsMarket.outcomes.find(
            (o) => (o.name || "").toLowerCase() === "over"
          );
          if (overOutcome?.point != null) {
            setOuTotal(overOutcome.point);
          }
        }

        // Spreads
        const spreadsMarket = markets.find((m) => m.key === "spreads");
        if (spreadsMarket && Array.isArray(spreadsMarket.outcomes)) {
          const homeNorm = normalizeTeam(homeTeam);
          const homeSpread = spreadsMarket.outcomes.find(
            (o) => normalizeTeam(o.name) === homeNorm
          );
          if (homeSpread?.point != null) {
            setSpreadLive(homeSpread.point);
          }
        }

        // Moneyline (h2h)
        const h2hMarket = markets.find((m) => m.key === "h2h");
        if (h2hMarket && Array.isArray(h2hMarket.outcomes)) {
          const homeNorm = normalizeTeam(homeTeam);
          const awayNorm = normalizeTeam(awayTeam);
          const homeMl = h2hMarket.outcomes.find(
            (o) => normalizeTeam(o.name) === homeNorm
          );
          const awayMl = h2hMarket.outcomes.find(
            (o) => normalizeTeam(o.name) === awayNorm
          );
          if (homeMl?.price != null) setMlHome(homeMl.price);
          if (awayMl?.price != null) setMlAway(awayMl.price);
        }
      } catch (e) {
        console.error("Error general al cargar odds:", e);
      }
    }

    cargarOdds();
  }, [game, homeTeam, awayTeam]);

  const tiempoRestante = formatSeconds(secRemaining);

  if (!visible) return null;

  // --- Movimiento reciente usando datos REALES (open vs live) ---

  const totalOpen = market.totalOpen ?? ouTotal ?? null;
  const spreadOpen = market.spreadOpen ?? null;
  const mlHomeOpen = market.mlHomeOpen ?? null;

  const totalDeltaOpenLive =
    totalLive != null && totalOpen != null ? totalLive - totalOpen : null;

  const spreadDeltaOpenLive =
    spreadLive != null && spreadOpen != null ? spreadLive - spreadOpen : null;

  const mlDeltaHomeOpenLive =
    mlHome != null && mlHomeOpen != null ? mlHome - mlHomeOpen : null;

  // Diferencia modelo vs mercado (para info)
  const diffModeloMercado =
    modelTotal != null && totalLive != null
      ? (modelTotal - totalLive).toFixed(1)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">
              Q{quarter} · {tiempoRestante} · Total live (mercado):{" "}
              {totalLive != null ? totalLive.toFixed(1) : "-"}
              {" · "}
              Total modelo:{" "}
              {modelTotal != null ? modelTotal.toFixed(1) : "-"}
            </p>
            <h2 className="text-lg md:text-2xl font-semibold">
              {awayTeam} @ {homeTeam}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm border border-slate-700 rounded-full px-3 py-1"
          >
            Cerrar
          </button>
        </div>

        {/* Marcador + Mercado */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Marcador */}
          <div className="rounded-lg border border-slate-800 p-3">
            <p className="text-xs text-gray-400 mb-1">Marcador</p>
            <div className="flex justify-between items-center text-sm">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{awayTeam}</span>
                <span className="font-medium">{homeTeam}</span>
              </div>
              <div className="flex flex-col items-end gap-1 text-xl font-semibold">
                <span>{score.away ?? 0}</span>
                <span>{score.home ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Mercado */}
          <div className="rounded-lg border border-slate-800 p-3">
            <p className="text-xs text-gray-400 mb-1">Mercado</p>
            <div className="text-xs md:text-sm space-y-1">
              <p>
                OU apertura:{" "}
                <b>{totalOpen != null ? totalOpen : "-"}</b> · cierre:{" "}
                <b>{market.totalClose ?? "-"}</b>
              </p>
              <p>
                OU live (mercado):{" "}
                <b>
                  {totalLive != null
                    ? totalLive.toFixed(1)
                    : market.totalLive ?? "-"}
                </b>
              </p>
              <p>
                Spread live:{" "}
                <b>
                  {spreadLive != null
                    ? spreadLive
                    : market.spreadLive ?? "-"}
                </b>{" "}
                · ML live:{" "}
                <b>
                  {mlHome != null ? mlHome : "-"} /{" "}
                  {mlAway != null ? mlAway : "-"}
                </b>
              </p>
              <p>
                Total modelo (tendencia):{" "}
                <b>
                  {modelTotal != null
                    ? modelTotal.toFixed(1)
                    : "-"}
                </b>
              </p>
              {diffModeloMercado != null && (
                <p className="text-[11px] text-slate-400">
                  Diferencia modelo vs mercado:{" "}
                  <b>{diffModeloMercado} pts</b>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bloques inferiores */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Escenario motor */}
          <div className="rounded-lg border border-slate-800 p-3 space-y-1">
            <p className="text-xs text-gray-400 mb-1">
              🧠 Escenario del motor (Rally / Colapso)
            </p>
            <p className="text-sm">
              {rally.label || "Sin escenario claro (neutral)"}{" "}
              <span className="text-xs text-slate-400">
                · Confianza: {rally.confidence ?? 0}%
              </span>
            </p>
          </div>

          {/* Ritmo / modelo vs mercado + movimiento reciente */}
          <div className="rounded-lg border border-slate-800 p-3 space-y-1">
            <p className="text-xs text-gray-400 mb-1">
              ⚡ Ritmo / Modelo vs mercado
            </p>
            <p className="text-xs text-slate-400">
              Ritmo esperado: {pace.expectedTotal ?? "-"} · Proyectado
              (modelo):{" "}
              {modelTotal != null ? modelTotal.toFixed(1) : "-"}
            </p>
            <p className="text-xs text-slate-400">
              Señal de valor: {value.signal || "NINGUNA"} · Edge:{" "}
              {value.edge != null ? value.edge.toFixed(2) : "-"}
            </p>
            <p className="text-xs text-slate-400">
              Tendencia: {trend.label || "Neutral"}
            </p>

            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
              <p className="text-[11px] text-gray-400">
                Movimiento reciente del mercado (open → live)
              </p>
              <p className="text-[11px]">
                Total:{" "}
                <b>
                  {totalDeltaOpenLive != null
                    ? describeTotalDelta(totalDeltaOpenLive)
                    : "-"}
                </b>
              </p>
              <p className="text-[11px]">
                Spread:{" "}
                <b>
                  {spreadDeltaOpenLive != null
                    ? describeSpreadDelta(spreadDeltaOpenLive)
                    : "-"}
                </b>
              </p>
              <p className="text-[11px]">
                ML (home):{" "}
                <b>
                  {mlDeltaHomeOpenLive != null
                    ? describeMlDelta(mlDeltaHomeOpenLive)
                    : "-"}
                </b>
              </p>
            </div>
          </div>
        </div>

        {/* Botón de histórico (UI por ahora) */}
        <div className="mt-4 flex justify-end">
          <button
            className="text-xs md:text-sm rounded-full border border-amber-400 px-3 py-1 text-amber-200 hover:bg-amber-400/10"
            type="button"
          >
            Mandar a histórico (pronto)
          </button>
        </div>
      </div>
    </div>
  );
}

