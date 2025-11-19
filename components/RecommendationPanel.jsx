"use client";

function getSignal(edge) {
  // edge = predicted - lineClose
  if (edge >= 3) {
    return {
      side: "OVER",
      strength: "Fuerte",
      colorDot: "bg-green-500",
      colorText: "text-green-400",
      message:
        "La predicción está varios puntos por encima de la línea de cierre. Señal fuerte hacia el OVER.",
    };
  }
  if (edge >= 1) {
    return {
      side: "OVER",
      strength: "Leve",
      colorDot: "bg-green-300",
      colorText: "text-green-300",
      message:
        "La predicción está algo por encima de la línea de cierre. Sesgo ligero hacia el OVER.",
    };
  }
  if (edge <= -3) {
    return {
      side: "UNDER",
      strength: "Fuerte",
      colorDot: "bg-red-500",
      colorText: "text-red-400",
      message:
        "La predicción está varios puntos por debajo de la línea de cierre. Señal fuerte hacia el UNDER.",
    };
  }
  if (edge <= -1) {
    return {
      side: "UNDER",
      strength: "Leve",
      colorDot: "bg-red-300",
      colorText: "text-red-300",
      message:
        "La predicción está algo por debajo de la línea de cierre. Sesgo ligero hacia el UNDER.",
    };
  }

  return {
    side: "No Bet",
    strength: "Neutro",
    colorDot: "bg-slate-400",
    colorText: "text-slate-300",
    message:
      "La diferencia entre la predicción y la línea de cierre es pequeña. No hay ventaja clara.",
  };
}

export default function RecommendationPanel({ data }) {
  if (!data || !data.analyzed || data.analyzed.length === 0) {
    return null;
  }

  // Calculamos el edge para cada juego
  const gamesWithEdge = data.analyzed.map((g) => {
    const edge = Number((g.predicted - g.lineClose).toFixed(2));
    return { ...g, edge, signal: getSignal(edge) };
  });

  // Ordenamos por valor absoluto del edge (mayor ventaja primero)
  const sorted = [...gamesWithEdge].sort(
    (a, b) => Math.abs(b.edge) - Math.abs(a.edge)
  );

  const top = sorted.slice(0, 3); // Top 3 oportunidades

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">
        🎯 Oportunidades según el modelo (OVER / UNDER)
      </h2>
      <p className="text-xs text-slate-400">
        Estas señales se basan en la diferencia entre la predicción ajustada
        del modelo y la línea de cierre de mercado. No son consejos de
        inversión, solo un mapa del edge teórico del modelo.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {top.map((g) => (
          <div
            key={g.gameId}
            className="bg-slate-800/70 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-xs uppercase text-slate-300">
                Juego {g.gameId}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${g.signal.colorDot}`}
                />
                <span
                  className={`text-xs font-medium ${g.signal.colorText}`}
                >
                  {g.signal.side} · {g.signal.strength}
                </span>
              </div>
            </div>

            <div className="text-sm font-medium mb-1">{g.matchup}</div>

            <div className="text-xs text-slate-300 mb-2 grid grid-cols-2 gap-x-2">
              <div>
                <div>Línea cierre:</div>
                <div className="font-mono">{g.lineClose}</div>
              </div>
              <div>
                <div>Predicción modelo:</div>
                <div className="font-mono">{g.predicted}</div>
              </div>
              <div>
                <div>Total real (histórico):</div>
                <div className="font-mono">{g.finalTotal}</div>
              </div>
              <div>
                <div>Edge (pred - cierre):</div>
                <div className="font-mono">
                  {g.edge > 0 ? "+" : ""}
                  {g.edge} pts
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">{g.signal.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

