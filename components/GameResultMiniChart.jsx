// components/GameResultMiniChart.jsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Mini gráfica por juego:
 * Muestra Apertura, Cierre, Total Real y Predicción del modelo
 * para un solo partido, abajo de la tarjeta de ese juego.
 */
export default function GameResultMiniChart({ game }) {
  if (!game) {
    return null;
  }

  const chartData = [
    {
      name: "Apertura",
      value: game.lineOpen,
    },
    {
      name: "Cierre",
      value: game.lineClose,
    },
    {
      name: "Real",
      value: game.finalTotal,
    },
    {
      name: "Modelo",
      value: game.predicted,
    },
  ];

  return (
    <div className="mt-3 h-32 bg-slate-950/60 rounded-md border border-slate-800 px-2 py-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #334155",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value) => [`${value}`, "Puntos"]}
          />
          <Bar
            dataKey="value"
            name="Pts"
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

