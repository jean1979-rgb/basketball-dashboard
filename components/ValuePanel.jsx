// components/ValuePanel.jsx
"use client";

export default function ValuePanel({ games }) {
  if (!games || games.length === 0) {
    return (
      <div className="bg-slate-900 text-slate-400 border border-slate-700 p-4 rounded-lg text-sm">
        No hay datos para calcular value por partido.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-gray-200 rounded-lg border border-slate-700 p-4 space-y-4">
      <p className="text-sm text-slate-300 mb-2">
        Resumen de oportunidades de <span className="font-semibold text-emerald-300">value</span> según el modelo
        comparado con la línea de mercado en totales, spread y moneyline (pre-juego).
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {games.map((g) => (
          <ValueCard key={g.gameId} game={g} />
        ))}
      </div>
    </div>
  );
}

function ValueCard({ game }) {
  const totalVal = game.totalValue || { tier: "NONE", side: "NONE" };
  const spreadVal = game.spreadValue || { tier: "NONE", side: "NONE" };
  const mlVal = game.moneyline?.value || { tier: "NONE", side: "NONE" };

  const totalLabel = describeTotalValue(totalVal, game);
  const spreadLabel = describeSpreadValue(spreadVal, game);
  const mlLabel = describeMoneylineValue(mlVal, game);

  const overallTier = pickOverallTier(totalVal.tier, spreadVal.tier, mlVal.tier);
  const badge = tierToBadge(overallTier);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-2 text-xs md:text-sm">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-slate-400 text-[11px]">JUEGO {game.gameId}</p>
          <p className="font-semibold text-sm">{game.matchup}</p>
          <p className="text-[11px] text-slate-500">{game.date}</p>
        </div>
        <div className="text-right">{badge}</div>
      </div>

      <div className="space-y-1.5 mt-1">
        {/* Totales */}
        <div className="bg-slate-900/60 rounded px-2 py-1.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-0.5">
            Totales (Over/Under)
          </p>
          <p className="font-mono text-[11px] text-slate-300">
            Cierre: {game.lineClose} · Modelo: {game.predicted} · Edge:{" "}
            {game.edgeTotalRounded >= 0 ? "+" : ""}
            {game.edgeTotalRounded} pts
          </p>
          <p className="text-[11px] mt-0.5">{totalLabel}</p>
        </div>

        {/* Spread */}
        <div className="bg-slate-900/60 rounded px-2 py-1.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-0.5">Spread</p>
          <p className="font-mono text-[11px] text-slate-300">
            Mercado: {formatSpread(game.spreadClose, game.homeTeam)} · Modelo:{" "}
            {formatSpread(game.modelSpread, game.homeTeam)} · Diff:{" "}
            {game.spreadEdgeRounded >= 0 ? "+" : ""}
            {game.spreadEdgeRounded}
          </p>
          <p className="text-[11px] mt-0.5">{spreadLabel}</p>
        </div>

        {/* Moneyline */}
        <div className="bg-slate-900/60 rounded px-2 py-1.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-0.5">Moneyline</p>
          <p className="font-mono text-[11px] text-slate-300">
            ML mercado: {game.homeTeam} {formatMl(game.moneyline.market.home)} ·{" "}
            {game.awayTeam} {formatMl(game.moneyline.market.away)}
          </p>
          <p className="font-mono text-[11px] text-slate-300">
            ML modelo: {game.homeTeam} {formatMl(game.moneyline.model.fairMlHome)} ·{" "}
            {game.awayTeam} {formatMl(game.moneyline.model.fairMlAway)}
          </p>
          <p className="text-[11px] mt-0.5">{mlLabel}</p>
        </div>
      </div>
    </div>
  );
}

function tierToBadge(tier) {
  if (tier === "STRONG") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900 text-emerald-300 text-[11px] border border-emerald-500/60">
        🟢 Strong Value
      </span>
    );
  }
  if (tier === "MODERATE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-950 text-emerald-200 text-[11px] border border-emerald-400/50">
        🟡 Moderate Value
      </span>
    );
  }
  if (tier === "LIGHT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 text-emerald-200 text-[11px] border border-emerald-300/40">
        🟢 Light Value
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 text-slate-300 text-[11px] border border-slate-600/60">
      ⚪ Neutral / No Value
    </span>
  );
}

function pickOverallTier(tTotal, tSpread, tMl) {
  const score = (t) => {
    if (t === "STRONG") return 3;
    if (t === "MODERATE") return 2;
    if (t === "LIGHT") return 1;
    return 0;
  };
  const sTotal = score(tTotal);
  const sSpread = score(tSpread);
  const sMl = score(tMl);
  const maxScore = Math.max(sTotal, sSpread, sMl);

  if (maxScore === 3) return "STRONG";
  if (maxScore === 2) return "MODERATE";
  if (maxScore === 1) return "LIGHT";
  return "NONE";
}

function describeTotalValue(totalVal, game) {
  if (totalVal.tier === "NONE" || totalVal.side === "NONE") {
    return "VALUE neutro en totales: la diferencia modelo vs línea no es lo suficientemente grande.";
  }

  const dir = totalVal.side === "OVER" ? "OVER" : "UNDER";
  const tierWord =
    totalVal.tier === "STRONG"
      ? "VALUE fuerte"
      : totalVal.tier === "MODERATE"
      ? "VALUE moderado"
      : "VALUE ligero";

  return `${tierWord} hacia el ${dir}: el modelo se separa aprox. ${game.edgeTotalRounded.toFixed(
    1
  )} pts de la línea de cierre.`;
}

function describeSpreadValue(spreadVal, game) {
  if (spreadVal.tier === "NONE" || spreadVal.side === "NONE") {
    return "VALUE neutro en spread: la diferencia entre el spread del modelo y el de mercado es pequeña.";
  }

  const side =
    spreadVal.side === "DOG"
      ? `perro (${game.awayTeam} si el home es favorito)`
      : "favorito (home)";

  const tierWord =
    spreadVal.tier === "STRONG"
      ? "VALUE fuerte"
      : spreadVal.tier === "MODERATE"
      ? "VALUE moderado"
      : "VALUE ligero";

  return `${tierWord} en spread a favor del ${side}: el modelo se separa ≈ ${game.spreadEdgeRounded.toFixed(
    1
  )} pts del número de mercado.`;
}

function describeMoneylineValue(mlVal, game) {
  if (mlVal.tier === "NONE" || mlVal.side === "NONE") {
    return "VALUE neutro en moneyline: las probabilidades del modelo están cerca de las del mercado.";
  }

  const sideTeam = mlVal.side === "HOME" ? game.homeTeam : game.awayTeam;
  const tierWord =
    mlVal.tier === "STRONG"
      ? "VALUE fuerte"
      : mlVal.tier === "MODERATE"
      ? "VALUE moderado"
      : "VALUE ligero";

  const edgePct =
    mlVal.side === "HOME" ? mlVal.edgeHome * 100 : mlVal.edgeAway * 100;

  return `${tierWord} en ML hacia ${sideTeam}: el modelo da ≈ ${edgePct.toFixed(
    1
  )}% más probabilidad de ganar que la implícita en el momio de mercado.`;
}

function formatSpread(spread, homeTeam) {
  if (spread === 0) return "PK";
  const sign = spread > 0 ? "+" : "";
  return `${homeTeam} ${sign}${spread}`;
}

function formatMl(odds) {
  if (odds > 0) return `+${odds}`;
  return `${odds}`;
}

