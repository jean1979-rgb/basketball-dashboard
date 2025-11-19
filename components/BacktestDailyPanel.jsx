// components/BacktestDailyPanel.jsx
"use client";

import React, { useEffect, useState } from "react";

export default function BacktestDailyPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function fetchData(signal) {
    const res = await fetch("/api/backtest", { signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const json = await fetchData(signal);
        setData(json);
        setLoading(false);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e?.message || "Error desconocido");
          setLoading(false);
        }
      }
    }

    // Cargar inmediatamente
    load();

    // 🔁 Refrescar cada 4 segundos
    const id = setInterval(load, 4000);

    // Limpiar cuando se desmonte
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-700 p-3">
        <p className="text-xs text-gray-400">⏳ Cargando backtest diario…</p>
      </div>
    );
  }

  if (err || !data?.ok) {
    return (
      <div className="rounded-lg border border-red-700 bg-red-900/40 p-3">
        <p className="text-xs text-red-200">
          ❌ Error al cargar backtest: {err || "desconocido"}
        </p>
      </div>
    );
  }

  const c = data.counters || {};
  const card = (title, body) => (
    <div className="rounded-md border border-slate-700 p-3">
      <p className="text-[11px] text-gray-400 mb-1">{title}</p>
      {body}
    </div>
  );

  const Stat = ({ label, value, mono }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-300">{label}</span>
      <span className={mono ? "font-mono text-gray-100" : "text-gray-100"}>{value}</span>
    </div>
  );

  const MarketCard = ({ block }) => {
    if (!block) return null;
    const {
      market,
      picks,
      wins,
      losses,
      pushes,
      winrate,
      avgEdgePts,
      avgEdgeProb,
      units,
    } = block;

    return card(
      market,
      <div className="space-y-1">
        <Stat label="Picks" value={picks} mono />
        <Stat label="W - L - Push" value={`${wins} - ${losses} - ${pushes}`} mono />
        <Stat label="Winrate" value={`${winrate}%`} mono />
        {typeof avgEdgePts === "number" && (
          <Stat label="Avg Edge (pts)" value={avgEdgePts} mono />
        )}
        {typeof avgEdgeProb === "number" && (
          <Stat
            label="Avg Edge (prob)"
            value={(avgEdgeProb * 100).toFixed(1) + "%"}
            mono
          />
        )}
        <Stat
          label="Units"
          value={units >= 0 ? `+${units.toFixed(2)}` : units.toFixed(2)}
          mono
        />
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-slate-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">
          🗓️ Backtest diario — {data.date}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <MarketCard block={c.ou} />
        <MarketCard block={c.spread} />
        <MarketCard block={c.ml} />
      </div>

      <div className="rounded-md border border-slate-700 p-2 overflow-auto">
        <p className="text-[11px] text-gray-400 mb-2">
          Últimos eventos (auditoría rápida)
        </p>
        <table className="min-w-[760px] w-full text-sm">
          <thead className="text-left text-gray-300">
            <tr>
              <th className="py-2">Hora (UTC)</th>
              <th className="py-2">Liga</th>
              <th className="py-2">Juego</th>
              <th className="py-2">Mercado</th>
              <th className="py-2">Pick</th>
              <th className="py-2">Modelo</th>
              <th className="py-2">Edge</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Res.</th>
              <th className="py-2">Units</th>
            </tr>
          </thead>
          <tbody className="text-gray-200">
            {(data.lastEvents || []).map((e, idx) => (
              <tr key={idx} className="border-t border-slate-800">
                <td className="py-2 font-mono">{e.ts}</td>
                <td className="py-2">{e.league}</td>
                <td className="py-2">{e.game}</td>
                <td className="py-2">{e.market}</td>
                <td className="py-2">{e.pick}</td>
                <td className="py-2">{e.model}</td>
                <td className="py-2 font-mono">
                  {typeof e.edgePts === "number"
                    ? `${e.edgePts > 0 ? "+" : ""}${e.edgePts.toFixed(1)} pts`
                    : typeof e.edgeProb === "number"
                    ? `${(e.edgeProb * 100).toFixed(1)} %`
                    : "-"}
                </td>
                <td className="py-2 font-mono">{e.price}</td>
                <td className="py-2">{e.result || "-"}</td>
                <td className="py-2 font-mono">
                  {typeof e.units === "number"
                    ? e.units >= 0
                      ? `+${e.units.toFixed(2)}`
                      : e.units.toFixed(2)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

