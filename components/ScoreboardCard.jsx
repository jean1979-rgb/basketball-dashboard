// components/ScoreboardCard.jsx
import React from "react";

export default function ScoreboardCard({ game }) {
  if (!game) return null;

  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    quarter,
    time,
    marketTotal,
    predictedTotal,
    trend,
  } = game;

  return (
    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-lg">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-center flex-1">
          <p className="font-bold text-lg">{homeTeam}</p>
          <p className="text-2xl font-extrabold text-blue-400">{homeScore}</p>
        </div>

        <div className="text-center w-10 font-semibold text-gray-300">VS</div>

        <div className="text-center flex-1">
          <p className="font-bold text-lg">{awayTeam}</p>
          <p className="text-2xl font-extrabold text-red-400">{awayScore}</p>
        </div>
      </div>

      {/* Periodo y tiempo */}
      <p className="text-center text-sm text-gray-400">
        {time} • {quarter}
      </p>

      {/* Tendencia */}
      <h3 className="text-center text-sm mt-2 text-gray-300 tracking-wide">
        TENDENCIA
      </h3>

      {/* Datos de tendencia */}
      <div className="flex justify-around text-xs mt-2 text-gray-400">
        <div>
          <p>Mercado: {marketTotal}</p>
        </div>
        <div>
          <p>Predicción: {predictedTotal}</p>
        </div>
        <div>
          <p>Tendencia: {trend}</p>
        </div>
      </div>
    </div>
  );
}

