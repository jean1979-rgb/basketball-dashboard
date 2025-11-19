"use client";

import { useEffect, useState } from "react";

export default function LiveTechPanel() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/live");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setLiveData(json);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLive();
  }, []);

  if (loading) {
    return (
      <section className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">⚙️ Panel técnico live</h2>
        <p className="text-sm text-gray-400">Cargando datos en vivo...</p>
      </section>
    );
  }

  if (errorMsg || !liveData || !liveData.ok) {
    return (
      <section className="mt-6 p-4 bg-red-900/40 border border-red-700 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">⚙️ Panel técnico live</h2>
        <p className="text-sm text-red-200">
          Error al cargar /api/live: {errorMsg || "respuesta no válida"}
        </p>
      </section>
    );
  }

  const game = liveData.game || liveData.games?.[0] || {};
  const trend = liveData.trend || {};
  const value = liveData.value || {};

  const ou = value.ou || {};
  const spread = value.spread || {};
  const ml = value.moneyline || {};

  const trendIcon =
    trend.direction === "up" ? "↗️" :
    trend.direction === "down" ? "↘️" :
    "➡️";

  let trendText = "Tendencia no disponible.";
  if (trend.direction === "up") trendText = "Tendencia alcista (OVER).";
  else if (trend.direction === "down") trendText = "Tendencia bajista (UNDER).";
  else if (trend.direction === "flat") trendText = "Mercado lateral / neutro.";
  if (trend.inflexion) trendText += " ⚠️ Posible punto de inflexión.";

  return (
    <section className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            ⚙️ Panel técnico live — {game.matchup || "Partido en vivo"}
          </h2>
          <p className="text-xs text-gray-400">
            Q{game.quarter || "-"} ·{" "}
            {Math.floor((game.secondsRemainingQuarter || 0) / 60)}:
            {String((game.secondsRemainingQuarter || 0) % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono text-gray-200">
            {game.awayTeam || "Visitante"} {game.scoreAway ?? game.score?.away ?? "-"}
          </p>
          <p className="font-mono text-gray-200">
            {game.homeTeam || "Local"} {game.scoreHome ?? game.score?.home ?? "-"}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Total live:{" "}
            <span className="font-mono">
              {Number(game.liveTotal || 0).toFixed(1)}
            </span>
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-300 space-y-1">
        <p>
          {trendIcon} {trendText}
        </p>
        <p>
          📊 Over/Under:{" "}
          {ou.side
            ? `${ou.side} (${(ou.edgePts || 0).toFixed(1)} pts)`
            : "sin value claro"}
        </p>
        <p>
          📐 Spread:{" "}
          {spread.side
            ? `${spread.side} (${(spread.edgePts || 0).toFixed(1)} pts)`
            : "sin value claro"}
        </p>
        <p>
          💰 Moneyline:{" "}
          {ml.bestSide
            ? `${ml.bestSide} (${((ml.edgeProb || 0) * 100).toFixed(1)}%)`
            : "sin value claro"}
        </p>
      </div>

      <p className="text-[11px] text-gray-500">
        Este panel resume la lectura del modelo contra el mercado en este instante.
      </p>
    </section>
  );
}

