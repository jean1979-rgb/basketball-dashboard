// components/MomentumSparkline.jsx
"use client";

import React from "react";

/**
 * Gráfica tipo oscilador Y / -Y:
 * - eje X = tiempo (índice del array)
 * - eje Y = momentumScore normalizado (positivo arriba, negativo abajo)
 *
 * Props:
 *  - values: array de números, por ejemplo [0, 2, 5, 3, -1, -4, -2, 0]
 */
export default function MomentumSparkline({ values }) {
  // Valores seguros: si no hay datos, mostramos una curva neutra
  const safeValues =
    Array.isArray(values) && values.length > 1
      ? values
      : [0, 0];

  const width = 260;
  const height = 40;
  const midY = height / 2;

  const maxAbs = Math.max(
    1,
    ...safeValues.map((v) => Math.abs(Number(v) || 0))
  );

  const points = safeValues.map((v, idx) => {
    const x =
      safeValues.length === 1
        ? 0
        : (idx / (safeValues.length - 1)) * width;
    const normalized = (Number(v) || 0) / maxAbs; // -1 a 1
    const y = midY - normalized * (midY - 3); // margen pequeño arriba/abajo
    return `${x},${y}`;
  });

  return (
    <div className="mt-2">
      <div className="text-[10px] text-slate-400 mb-1">
        Momentum de anotación (Y / -Y)
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Fondo */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(15,23,42,0.8)" // slate-900 approx
          rx="6"
        />
        {/* Línea central (0) */}
        <line
          x1="0"
          y1={midY}
          x2={width}
          y2={midY}
          stroke="rgba(148,163,184,0.5)" // slate-400 approx
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />
        {/* Curva */}
        <polyline
          fill="none"
          stroke="rgba(251,191,36,0.9)" // amber-400 approx
          strokeWidth="1.4"
          points={points.join(" ")}
        />
      </svg>
    </div>
  );
}

