// app/page.jsx
"use client";

import { useEffect, useState } from "react";
import LiveTechPanel from "../components/LiveTechPanel";
import LiveGamesGrid from "../components/LiveGamesGrid";
import MomentumSparkline from "../components/MomentumSparkline";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [momentumTab, setMomentumTab] = useState("hoy"); // "hoy" | "historico"

  // Juegos para pestaña HOY (TheOddsAPI)
  const [liveGames, setLiveGames] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");

  // Cargar análisis histórico (/api/analyze)
  useEffect(() => {
    async function loadAnalysis() {
      try {
        const res = await fetch("/api/analyze");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error al cargar /api/analyze:", err);
        setErrorMsg(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, []);

  // Cargar juegos de ventana (/api/games-window)
  useEffect(() => {
    async function loadLiveGames() {
      try {
        setLiveLoading(true);
        setLiveError("");
        const res = await fetch("/api/games-window");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Respuesta no OK en games-window");
        }
        setLiveGames(json.games || []);
      } catch (err) {
        console.error("Error al cargar /api/games-window:", err);
        setLiveError(err.message || "Error desconocido en games-window");
      } finally {
        setLiveLoading(false);
      }
    }

    loadLiveGames();
  }, []);

  // Helper para hora local
  function formatCommence(commenceTime) {
    if (!commenceTime) return "-";
    try {
      const d = new Date(commenceTime);
      return d.toLocaleString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return commenceTime;
    }
  }

  // Mientras carga /api/analyze
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-gray-100 p-6 space-y-4">
        <h1 className="text-2xl font-bold">🏀 Dashboard NBA Predictivo</h1>
        <p className="text-sm text-gray-400">
          Modelo de líneas de mercado, momentum y value (pre-game) + módulo
          técnico en vivo con pendiente, puntos de inflexión y ritmo por
          equipo.
        </p>
        <p className="mt-4 text-gray-300">Cargando análisis…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-gray-100 p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">🏀 Dashboard NBA Predictivo</h1>
        <p className="text-sm text-gray-400">
          Modelo de líneas de mercado, momentum y value (pre-game) + módulo
          técnico en vivo con pendiente, puntos de inflexión y ritmo por
          equipo.
        </p>
      </header>

      {/* Error en /api/analyze */}
      {errorMsg && (
        <section className="p-4 bg-red-900/40 border border-red-700 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            ❌ Error al cargar análisis pre-game
          </h2>
          <p className="text-sm text-red-200">
            /api/analyze respondió con error: {errorMsg}
          </p>
        </section>
      )}

      {/* Datos de análisis OK */}
      {data && data.ok && !errorMsg && (
        <>
          {/* Resumen backtest */}
          <section className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-2">
            <h2 className="text-lg font-semibold mb-2">
              📊 Resumen del backtest / análisis
            </h2>
            <p className="text-sm text-gray-300">
              Partidos analizados:{" "}
              <span className="font-mono">{data.summary.games}</span> · k usado:{" "}
              <span className="font-mono">{data.summary.k_used}</span> · MAE:{" "}
              <span className="font-mono">
                {data.summary.MAE?.toFixed
                  ? data.summary.MAE.toFixed(2)
                  : Number(data.summary.MAE || 0).toFixed(2)}
              </span>{" "}
              · MSE:{" "}
              <span className="font-mono">
                {data.summary.MSE?.toFixed
                  ? data.summary.MSE.toFixed(3)
                  : Number(data.summary.MSE || 0).toFixed(3)}
              </span>
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-400">
                Ver JSON completo
              </summary>
              <pre className="mt-2 bg-slate-950/60 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </section>

          {/* Momentum del mercado */}
          <section className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
            {/* Encabezado + pestañas */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  🔍 Momentum del mercado
                </h2>
                <p className="text-xs text-gray-400">
                  Vista rápida de cómo se han movido las líneas de totales y
                  cómo se comportó el modelo, tanto hoy como en los partidos
                  guardados en histórico.
                </p>
              </div>

              <div className="inline-flex rounded-full border border-slate-700 bg-slate-950/40 text-xs self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setMomentumTab("hoy")}
                  className={`px-3 py-1 rounded-full ${
                    momentumTab === "hoy"
                      ? "bg-slate-800 text-amber-200"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setMomentumTab("historico")}
                  className={`px-3 py-1 rounded-full ${
                    momentumTab === "historico"
                      ? "bg-slate-800 text-amber-200"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Histórico
                </button>
              </div>
            </div>

            {/* CONTENIDO HISTÓRICO */}
            {momentumTab === "historico" && (
              <>
                <p className="text-xs text-gray-400">
                  Comparación entre línea de apertura, línea de cierre, total
                  real y predicción del modelo para los últimos partidos
                  analizados (backtest y jornadas ya cerradas).
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.analyzed.map((g) => (
                    <div
                      key={g.gameId}
                      className="border border-slate-700 rounded-md p-3 bg-slate-950/40"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">{g.date}</p>
                          <p className="text-sm font-semibold">{g.matchup}</p>
                        </div>
                        <div className="text-right text-xs">
                          <span
                            className={
                              g.momentum === "bullish"
                                ? "text-green-400"
                                : g.momentum === "bearish"
                                ? "text-red-400"
                                : "text-yellow-300"
                            }
                          >
                            {g.momentum === "bullish" && "🟢 Alcista"}
                            {g.momentum === "bearish" && "🔴 Bajista"}
                            {g.momentum === "neutral" && "🟡 Neutro"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-300 mt-2">
                        <div>
                          <p>
                            Línea apertura:{" "}
                            <span className="font-mono">{g.lineOpen}</span>
                          </p>
                          <p>
                            Línea cierre:{" "}
                            <span className="font-mono">{g.lineClose}</span>
                          </p>
                          <p>
                            Mov. mercado:{" "}
                            <span className="font-mono">{g.marketMove}</span>
                          </p>
                        </div>
                        <div>
                          <p>
                            Total real:{" "}
                            <span className="font-mono">{g.finalTotal}</span>
                          </p>
                          <p>
                            Pred. modelo:{" "}
                            <span className="font-mono">{g.predicted}</span>
                          </p>
                          <p>
                            Error modelo:{" "}
                            <span className="font-mono">{g.error}</span>
                          </p>
                        </div>
                      </div>

                      {/* Mini gráfica Y / -Y */}
                      <MomentumSparkline values={g.momentumCurve} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* CONTENIDO HOY */}
            {momentumTab === "hoy" && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  Partidos de NBA detectados en TheOddsAPI (próximas horas) con
                  su línea de totales y spread. Aquí ya mostramos apertura,
                  última línea disponible y el movimiento en puntos.
                </p>

                {liveLoading && (
                  <p className="text-xs text-gray-300">
                    Cargando partidos de hoy…
                  </p>
                )}

                {liveError && (
                  <p className="text-xs text-red-300">
                    Error al cargar partidos: {liveError}
                  </p>
                )}

                {!liveLoading && !liveError && liveGames.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Por ahora no hay partidos próximos detectados en
                    TheOddsAPI.
                  </p>
                )}

                {!liveLoading && !liveError && liveGames.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {liveGames.map((g) => {
                      const totalDelta =
                        g.totalOpen != null && g.totalCurrent != null
                          ? (g.totalCurrent - g.totalOpen).toFixed(1)
                          : null;

                      const spreadDelta =
                        g.spreadOpen != null && g.spreadCurrent != null
                          ? (g.spreadCurrent - g.spreadOpen).toFixed(1)
                          : null;

                      return (
                        <div
                          key={g.id}
                          className="border border-slate-700 rounded-md p-3 bg-slate-950/40 text-[11px] text-gray-300"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-xs text-gray-400">
                                {formatCommence(g.commenceTime)} (hora local
                                aprox)
                              </p>
                              <p className="text-sm font-semibold">
                                {g.awayTeam} @ {g.homeTeam}
                              </p>
                            </div>
                          </div>

                          {/* Totales */}
                          <p>
                            OU apertura:{" "}
                            <span className="font-mono">
                              {g.totalOpen != null ? g.totalOpen : "-"}
                            </span>
                          </p>
                          <p>
                            OU actual:{" "}
                            <span className="font-mono">
                              {g.totalCurrent != null ? g.totalCurrent : "-"}
                            </span>
                            {totalDelta != null && (
                              <span className="ml-1">
                                (
                                <span
                                  className={
                                    Number(totalDelta) > 0
                                      ? "text-green-300"
                                      : Number(totalDelta) < 0
                                      ? "text-red-300"
                                      : "text-gray-400"
                                  }
                                >
                                  {Number(totalDelta) > 0 ? "+" : ""}
                                  {totalDelta}
                                </span>{" "}
                                pts)
                              </span>
                            )}
                          </p>

                          {/* Spread */}
                          <p className="mt-1">
                            Spread apertura (home):{" "}
                            <span className="font-mono">
                              {g.spreadOpen != null ? g.spreadOpen : "-"}
                            </span>
                          </p>
                          <p>
                            Spread actual (home):{" "}
                            <span className="font-mono">
                              {g.spreadCurrent != null
                                ? g.spreadCurrent
                                : "-"}
                            </span>
                            {spreadDelta != null && (
                              <span className="ml-1">
                                (
                                <span
                                  className={
                                    Number(spreadDelta) > 0
                                      ? "text-green-300"
                                      : Number(spreadDelta) < 0
                                      ? "text-red-300"
                                      : "text-gray-400"
                                  }
                                >
                                  {Number(spreadDelta) > 0 ? "+" : ""}
                                  {spreadDelta}
                                </span>{" "}
                                pts)
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* Panel técnico live (un partido) */}
      <LiveTechPanel />

      {/* Grid live por juego */}
      <LiveGamesGrid />
    </main>
  );
}

