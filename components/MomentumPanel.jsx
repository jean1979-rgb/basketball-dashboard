"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function getMomentumConfig(m) {
  if (m === "bullish") {
    return {
      label: "Alcista",
      colorDot: "bg-green-500",
      colorText: "text-green-400",
      description:
        "El mercado empujó al alza: presión hacia líneas más altas (OVER).",
    };
  }
  if (m === "bearish") {
    return {
      label: "Bajista",
      colorDot: "bg-red-500",
      colorText: "text-red-400",
      description:
        "El mercado empujó a la baja: presión hacia líneas más bajas (UNDER).",
    };
  }
  return {
    label: "Neutro",
    colorDot: "bg-yellow-400",
    colorText: "text-yellow-300",
    description:
      "Movimiento moderado: el mercado se mantuvo relativamente estable.",
  };
}

export default function MomentumPanel({ data }) {
  if (!data || !data.analyzed || data.analyzed.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">
        ⚡ Momentum reciente del mercado (por juego)
      </h2>
      <p className="text-xs text-slate-400">
        Cada tarjeta muestra cómo se movió la línea desde la apertura hasta el
        cierre, cómo se compara la predicción del modelo con el total real y un
        minigráfico tipo backtest individual por partido.
      </p>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.analyzed.map((g) => {
          const cfg = getMomentumConfig(g.momentum);

          // Datos para el minigráfico de este partido
          const miniData = [
            { name: "Open", value: g.lineOpen },
            { name: "Close", value: g.lineClose },
            { name: "Pred", value: g.predicted },
            { name: "Real", value: g.finalTotal },
          ];

          return (
            <div
              key={g.gameId}
              className="bg-slate-800/70 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs uppercase text-slate-300">
                  Juego {g.gameId}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${cfg.colorDot}`}
                  />
                  <span className={`text-xs font-medium ${cfg.colorText}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="text-sm font-medium">{g.matchup}</div>

              <div className="text-xs text-slate-300 grid grid-cols-2 gap-x-2 mb-1">
                <div>
                  <div>Apertura:</div>
                  <div className="font-mono">{g.lineOpen}</div>
                </div>
                <div>
                  <div>Cierre:</div>
                  <div className="font-mono">{g.lineClose}</div>
                </div>
                <div>
                  <div>Total real:</div>
                  <div className="font-mono">{g.finalTotal}</div>
                </div>
                <div>
                  <div>Predicción:</div>
                  <div className="font-mono">{g.predicted}</div>
                </div>
              </div>

              {/* Minigráfico por partido */}
              <div className="h-28 bg-slate-900/60 rounded-md px-2 py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniData}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => `Punto: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Movimiento del mercado:{" "}
                <span className="font-mono">
                  {g.marketMove > 0 ? "+" : ""}
                  {g.marketMove}
                </span>{" "}
                pts · Error del modelo:{" "}
                <span className="font-mono">
                  {g.error > 0 ? "+" : ""}
                  {g.error}
                </span>{" "}
                pts
              </div>

              <p className="text-xs text-slate-400">{cfg.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

