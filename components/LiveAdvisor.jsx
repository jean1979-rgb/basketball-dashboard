// components/LiveAdvisor.jsx
"use client";
import React, { useEffect, useState } from "react";
import StakeSplitDialog from "./StakeSplitDialog";

export default function LiveAdvisor({ game }) {
  const market = game?.market || {};
  const pace = game?.pace || {};
  const value = game?.value || {};
  const prof = game?.profileMatch || { top: [] };

  const delta = Number(pace?.total?.delta ?? 0);
  const liveTotal = Number(market?.totalLive ?? 0);
  const ouEdgePts =
    typeof value?.ou?.edgePts === "number" ? value.ou.edgePts : (delta || 0); // fallback

  // Señal simple (puedes refinar luego)
  let action = "NO BET";
  let rationale = [];
  let confidence = "baja";

  if (ouEdgePts > 3 && delta > 10) {
    action = `OVER ${liveTotal.toFixed(1)}`;
    rationale.push("Ritmo por encima de lo esperado (delta > +10)");
    rationale.push("Edge en OU > +3 pts");
    confidence = "media";
  } else if (ouEdgePts < -3 && delta < -10) {
    action = `UNDER ${liveTotal.toFixed(1)}`;
    rationale.push("Ritmo por debajo de lo esperado (delta < -10)");
    rationale.push("Edge en OU < -3 pts");
    confidence = "media";
  }

  const bestProfile = prof?.top?.[0];
  if (bestProfile) {
    rationale.push(`Patrón dominante: ${bestProfile.label} (sim=${bestProfile.similarity})`);
  }

  // ---- Nueva UI: cuadro de distribución ----
  const [available, setAvailable] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stake, setStake] = useState(1.0);
  const [quotes, setQuotes] = useState([]);
  const [qErr, setQErr] = useState(null);
  const [openSplit, setOpenSplit] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  async function loadProviders() {
    try {
      const r = await fetch("/api/orders");
      const j = await r.json();
      if (j?.providers) {
        setAvailable(j.providers);
        setProviders(j.providers.map(p => p.id)); // seleccionar todos por default
      }
    } catch (e) {
      // silencio UI
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  const parsed = action.startsWith("OVER") || action.startsWith("UNDER")
    ? { market: "OU", side: action.split(" ")[0], price: -110 }
    : { market: "OU", side: "NO_BET", price: -110 };

  async function openDistribution() {
    setQErr(null);
    setQuotes([]);
    if (parsed.side === "NO_BET") {
      setQErr("No hay señal clara por ahora.");
      return;
    }
    if (!providers.length) {
      setQErr("Selecciona al menos un sportsbook.");
      return;
    }
    setLoadingQuotes(true);
    try {
      const r = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providers,
          market: parsed.market,
          side: parsed.side,
          price: parsed.price
        }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Error en /api/quotes");
      setQuotes(j.quotes || []);
      setOpenSplit(true);
    } catch (e) {
      setQErr(e?.message || "No se pudieron obtener cotizaciones");
    } finally {
      setLoadingQuotes(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 p-3">
      <p className="text-xs text-gray-400 mb-2">🧭 Asesor en vivo (reglas base) + cuadro de distribución</p>

      {/* Recomendación */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">Recomendación:</span>
        <span
          className={`text-sm font-semibold px-2 py-0.5 rounded border border-slate-600
          ${action === "NO BET"
            ? "text-gray-300"
            : action.startsWith("OVER")
            ? "text-green-300"
            : "text-red-300"}`}
        >
          {action}
        </span>
        <span className="text-[11px] text-gray-400">Confianza: {confidence}</span>
      </div>

      {/* Rationale */}
      <ul className="list-disc list-inside text-sm text-gray-200 space-y-1 mb-3">
        {rationale.length ? rationale.map((r, i) => <li key={i}>{r}</li>) : <li>Sin señal clara por ahora.</li>}
      </ul>

      {/* Selector de sportsbooks + stake */}
      <div className="grid md:grid-cols-3 gap-3 mb-2">
        <div className="md:col-span-2">
          <p className="text-[11px] text-gray-400 mb-1">Sportsbooks (puedes integrar más en lib/exchanges/*)</p>
          <div className="flex flex-wrap gap-2">
            {available.map((p) => {
              const checked = providers.includes(p.id);
              return (
                <label key={p.id} className="text-xs text-gray-200 border border-slate-600 rounded px-2 py-1 flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setProviders([...providers, p.id]);
                      else setProviders(providers.filter((x) => x !== p.id));
                    }}
                  />
                  {p.name} <span className="text-[10px] text-gray-400">({p.id})</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 mb-1">Stake total (u)</p>
          <input
            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100"
            type="number"
            step="0.1"
            min="0.1"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
        </div>
      </div>

      {/* Botón abrir cuadro */}
      <div className="flex items-center gap-2">
        <button
          disabled={action === "NO BET" || loadingQuotes}
          onClick={openDistribution}
          className={`rounded-md border px-3 py-2 text-sm
            ${action === "NO BET" || loadingQuotes
              ? "border-slate-700 bg-slate-800 text-gray-500"
              : "border-slate-600 bg-slate-900 hover:bg-slate-800 text-gray-100"}`}
        >
          {loadingQuotes ? "Cotizando..." : "Abrir cuadro de distribución"}
        </button>
        {qErr && <span className="text-xs text-red-300">❌ {qErr}</span>}
      </div>

      {/* Modal de distribución */}
      <StakeSplitDialog
        open={openSplit}
        onClose={() => setOpenSplit(false)}
        advisorside={parsed.side}
        market={parsed.market}
        totalStake={Number(stake)}
        providers={available}
        quotes={quotes}
      />

      <p className="text-[11px] text-gray-500 mt-2">
        Este flujo es solo guía (manual). Ajusta montos y coloca en cada casa.
      </p>
    </div>
  );
}

