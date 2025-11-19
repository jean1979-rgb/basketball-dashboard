// components/LiveGamesGrid.jsx
"use client";

import React, { useEffect, useState } from "react";

function formatTime(commenceTime) {
  try {
    const d = new Date(commenceTime);
    return d.toLocaleString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "–";
  }
}

function formatDelta(delta) {
  if (delta == null) return "0.0";
  const num = Number(delta);
  if (Number.isNaN(num)) return "0.0";
  return num > 0 ? `+${num.toFixed(1)}` : num.toFixed(1);
}

function renderTrendBadge(trend, context) {
  if (!trend || !trend.label) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-gray-300">
        🟡 {context}: neutro
      </span>
    );
  }

  const { label, emoji } = trend;

  let text = "neutro";
  if (label === "rally_naciente") text = "rally naciente";
  if (label === "colapso_naciente") text = "colapso naciente";
  if (label === "rally_live") text = "rally live";
  if (label === "colapso_live") text = "colapso live";

  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-gray-200">
      <span className="mr-1">{emoji}</span>
      {context}: {text}
    </span>
  );
}

// Nueva función: etiqueta de momentum del mercado
function getMomentumFromDeltas(totalDelta, liveDelta) {
  if (totalDelta == null && liveDelta == null) {
    return { emoji: "🟡", text: "Momentum: neutral", color: "bg-slate-800 text-gray-200" };
  }

  const td = totalDelta ?? 0;
  const ld = liveDelta ?? 0;

  const absT = Math.abs(td);
  const absL = Math.abs(ld);

  const dir =
    Math.abs(td) >= Math.abs(ld)
      ? td
      : ld; // usamos el que tenga más peso para la dirección

  const strength =
    absT >= 6 || absL >= 3
      ? "fuerte"
      : absT >= 3 || absL >= 1.5
      ? "suave"
      : "neutral";

  if (strength === "neutral") {
    return { emoji: "🟡", text: "Momentum: neutral", color: "bg-slate-800 text-gray-200" };
  }

  if (dir > 0) {
    // Alcista
    return {
      emoji: "🟢",
      text:
        strength === "fuerte"
          ? "Momentum: alcista fuerte"
          : "Momentum: alcista suave",
      color: "bg-emerald-900/60 text-emerald-200",
    };
  } else {
    // Bajista
    return {
      emoji: "🔴",
      text:
        strength === "fuerte"
          ? "Momentum: bajista fuerte"
          : "Momentum: bajista suave",
      color: "bg-rose-900/60 text-rose-200",
    };
  }
}

function MomentumChip({ totalDelta, liveDelta }) {
  const info = getMomentumFromDeltas(totalDelta, liveDelta);

  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] " +
        info.color
      }
    >
      <span className="mr-1">{info.emoji}</span>
      {info.text}
    </span>
  );
}

export default function LiveGamesGrid() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await fetch("/api/games-window", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Respuesta no OK de /api/games-window");
        }
        setGames(json.games || []);
      } catch (err) {
        console.error("Error al cargar /api/games-window:", err);
        setErrorMsg(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    loadGames();

    // Refresco automático cada 45s
    const id = setInterval(loadGames, 45000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <section className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-1">
          📈 Momentum mercado HOY (pre-game + live)
        </h2>
        <p className="text-xs text-gray-400">
          Cargando partidos y movimiento de líneas…
        </p>
      </section>
    );
  }

  if (errorMsg) {
    return (
      <section className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-1">
          📈 Momentum mercado HOY (pre-game + live)
        </h2>
        <p className="text-xs text-red-300">
          Error al cargar /api/games-window: {errorMsg}
        </p>
      </section>
    );
  }

  if (!games.length) {
    return (
      <section className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-1">
          📈 Momentum mercado HOY (pre-game + live)
        </h2>
        <p className="text-xs text-gray-400">
          No hay partidos disponibles por el momento.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
      <header className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            📈 Momentum mercado HOY (pre-game + live)
          </h2>
          <p className="text-xs text-gray-400">
            Vemos cómo se mueven las líneas de OU/spread desde la apertura,
            y marcamos rallies / colapsos tempranos en ventanas de 5 min (pre-game)
            y 2.5 min (live).
          </p>
        </div>
        <p className="text-[10px] text-gray-500">
          Fuente: TheOddsAPI · Snapshots guardados en odds_window.json
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {games.map((g) => {
          const hasTotal =
            g.totalOpen != null || g.totalCurrent != null;

          const totalOpen = g.totalOpen ?? null;
          const totalCurrent = g.totalCurrent ?? null;
          const spreadOpen = g.spreadOpen ?? null;
          const spreadCurrent = g.spreadCurrent ?? null;

          const totalDelta =
            totalOpen != null && totalCurrent != null
              ? totalCurrent - totalOpen
              : null;

          const spreadDelta =
            spreadOpen != null && spreadCurrent != null
              ? spreadCurrent - spreadOpen
              : null;

          const liveDelta = g.liveDelta ?? null;

          return (
            <article
              key={g.id}
              className="border border-slate-700 rounded-md p-3 bg-slate-950/60 flex flex-col gap-2"
            >
              {/* Encabezado */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] text-gray-400">
                    {formatTime(g.commenceTime)} · NBA
                  </p>
                  <p className="text-sm font-semibold">
                    {g.awayTeamDisplay || g.awayTeam || "Visitante"} @{" "}
                    {g.homeTeam || "Local"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {/* Momentum del mercado (nuevo chip) */}
                  <MomentumChip
                    totalDelta={totalDelta}
                    liveDelta={liveDelta}
                  />
                  {/* Tendencia pre-game */}
                  {renderTrendBadge(g.preGameTrend, "pre-game")}
                  {/* Tendencia live */}
                  {g.liveTrend && renderTrendBadge(g.liveTrend, "live")}
                </div>
              </div>

              {/* Líneas y deltas */}
              {hasTotal ? (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                  <div>
                    <p>
                      OU apertura:{" "}
                      <span className="font-mono">
                        {totalOpen != null ? totalOpen : "–"}
                      </span>
                    </p>
                    <p>
                      OU actual:{" "}
                      <span className="font-mono">
                        {totalCurrent != null ? totalCurrent : "–"}
                      </span>{" "}
                      {totalDelta != null && (
                        <span
                          className={
                            totalDelta > 0
                              ? "text-green-400"
                              : totalDelta < 0
                              ? "text-red-400"
                              : "text-gray-400"
                          }
                        >
                          ({formatDelta(totalDelta)})
                        </span>
                      )}
                    </p>
                    <p>
                      Δ pre-game (5 min):{" "}
                      <span className="font-mono">
                        {g.preGameDelta != null
                          ? formatDelta(g.preGameDelta)
                          : "0.0"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p>
                      Spread apertura (home):{" "}
                      <span className="font-mono">
                        {spreadOpen != null ? spreadOpen : "–"}
                      </span>
                    </p>
                    <p>
                      Spread actual (home):{" "}
                      <span className="font-mono">
                        {spreadCurrent != null ? spreadCurrent : "–"}
                      </span>{" "}
                      {spreadDelta != null && (
                        <span
                          className={
                            spreadDelta < 0
                              ? "text-green-400"
                              : spreadDelta > 0
                              ? "text-red-400"
                              : "text-gray-400"
                          }
                        >
                          ({formatDelta(spreadDelta)})
                        </span>
                      )}
                    </p>
                    <p>
                      Δ live (2.5 min):{" "}
                      <span className="font-mono">
                        {liveDelta != null
                          ? formatDelta(liveDelta)
                          : "0.0"}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500">
                  No hay línea de OU disponible todavía para este partido.
                </p>
              )}

              {/* Info chiquita abajo */}
              <p className="text-[10px] text-gray-500 mt-1">
                Snapshots guardados: {g.snapshotCount ?? 0}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

