// components/GameMiniChart.jsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Mini–gráfica por juego:
 * Muestra Apertura, Cierre, Total Real y Predicción del modelo.
 * Se usa dentro de cada tarjeta de "Momentum reciente".
 */
export default function GameMiniChart({ game }) {
  if (!game) return null;

  const data = [
    { name: "Open", value: game.lineOpen },
    { name: "Close", value: game.lineClose },
    { name: "Real", value: game.finalTotal },
    { name: "Pred", value: game.predicted },
  ];

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value, name) => [`${value}`, name]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Valor"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

