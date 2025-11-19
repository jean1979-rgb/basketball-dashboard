// components/PredictorCard.jsx
import React from 'react';

export default function PredictorCard({ prediction }) {
  if (!prediction) return null;

  const { predictedTotal, deltaTotal, recommendation, confidence, lineInfo } = prediction;

  const color =
    recommendation === 'lean_over'
      ? 'text-green-500'
      : recommendation === 'lean_under'
      ? 'text-red-500'
      : 'text-yellow-500';

  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-md w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-center">Predicción del Modelo</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Predicción Total:</div>
        <div>{predictedTotal.toFixed(1)}</div>
        <div>Diferencia vs. Mercado:</div>
        <div className={color}>{deltaTotal.toFixed(1)}</div>
        <div>Recomendación:</div>
        <div className={color}>{recommendation}</div>
        <div>Confianza:</div>
        <div>{confidence}%</div>
        <div>Señal de Línea:</div>
        <div>{lineInfo.signal}</div>
      </div>
    </div>
  );
}

