// components/BacktestChart.jsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function BacktestChart({ games }) {
  if (!games || games.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-sm text-center bg-slate-900 rounded border border-slate-700">
        No hay datos de backtest disponibles.
      </div>
    );
  }

  // Estructura de datos para Recharts
  const chartData = games.map((g, index) => ({
    name: `G${index + 1}`,
    Apertura: g.lineOpen,
    Cierre: g.lineClose,
    "Total Real": g.finalTotal,
    "Predicción": g.predicted,
  }));

  return (
    <div className="w-full h-80 bg-slate-900 rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            label={{
              value: "Juegos (G1–G10)",
              position: "insideBottom",
              offset: -5,
              fill: "#94a3b8",
            }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend
            wrapperStyle={{
              color: "#cbd5e1",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="Apertura"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Línea Apertura"
          />
          <Line
            type="monotone"
            dataKey="Cierre"
            stroke="#60a5fa"
            strokeWidth={2}
            name="Línea Cierre"
          />
          <Line
            type="monotone"
            dataKey="Total Real"
            stroke="#22c55e"
            strokeWidth={2}
            name="Total Real"
          />
          <Line
            type="monotone"
            dataKey="Predicción"
            stroke="#a855f7"
            strokeWidth={2}
            name="Predicción Modelo"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

