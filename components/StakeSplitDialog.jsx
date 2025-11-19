// components/StakeSplitDialog.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

// Convierte momios americanos a probabilidad implícita (aprox)
function americanToProb(odds) {
  const o = Number(odds);
  if (!isFinite(o) || o === 0) return 0.5;
  if (o < 0) return Math.abs(o) / (Math.abs(o) + 100);
  return 100 / (o + 100);
}

// Utilidad simple: ranking de "mejor precio"
// Para UNDER/OVER (OU) y ML: mejor precio = prob. implícita más baja para el lado favorito (más payoff).
// Aquí, para simplificar: más alto si odds positivos, y si negativos, más cercano a cero.
function priceScore(odds) {
  const o = Number(odds);
  if (!isFinite(o)) return -Infinity;
  if (o > 0) return 1000 + o; // preferir positivos mayores
  return -o;                   // entre negativos, preferir más cercano a 0
}

export default function StakeSplitDialog({
  open,
  onClose,
  advisorside,  // "OVER" | "UNDER" | ...
  market,       // "OU" | "Spread" | "ML"
  totalStake,   // número (unidades)
  providers,    // [{id, name}]
  quotes,       // [{ provider, quote:{quotedPrice,...}, error? }]
}) {
  const [stake, setStake] = useState(Number(totalStake || 1));
  const [mode, setMode] = useState("weighted"); // "equal" | "weighted"
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setStake(Number(totalStake || 1));
  }, [totalStake]);

  // Construir filas con cotizaciones válidas
  const validRows = useMemo(() => {
    return (quotes || [])
      .map(q => {
        const px = q?.quote?.quotedPrice;
        return (typeof px === "number")
          ? { provider: q.provider, quotedPrice: px }
          : null;
      })
      .filter(Boolean);
  }, [quotes]);

  // Sugerencia de split
  useEffect(() => {
    if (!validRows.length) {
      setRows([]);
      return;
    }
    if (mode === "equal") {
      const each = stake / validRows.length;
      setRows(validRows.map(r => ({ ...r, suggested: Number(each.toFixed(2)) })));
      return;
    }
    // weighted por "mejor precio"
    const scores = validRows.map(r => ({ ...r, s: priceScore(r.quotedPrice) }));
    const minS = Math.min(...scores.map(x => x.s));
    const shifted = scores.map(x => ({ ...x, s2: x.s - minS + 1 })); // evitar 0
    const sum = shifted.reduce((a, b) => a + b.s2, 0);
    const alloc = shifted.map(x => ({
      provider: x.provider,
      quotedPrice: x.quotedPrice,
      suggested: Number(((x.s2 / (sum || 1)) * stake).toFixed(2)),
    }));
    setRows(alloc);
  }, [validRows, stake, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
      <div className="w-[95vw] max-w-3xl max-h-[85vh] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Distribución de stake — {market} {advisorside}</h3>
          <button onClick={onClose} className="rounded-md border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800">
            Cerrar
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-[11px] text-gray-400 mb-1">Stake total (u)</p>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100"
            />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 mb-1">Modo de reparto</p>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100"
            >
              <option value="weighted">Ponderado por mejor precio</option>
              <option value="equal">Partes iguales</option>
            </select>
          </div>
          <div className="text-sm text-gray-300 flex items-end">
            <span className="text-xs text-gray-400">
              Tip: ponderado asigna más stake al mejor momio (mayor payoff).
            </span>
          </div>
        </div>

        <div className="rounded-md border border-slate-700 p-2 overflow-auto">
          <table className="min-w-[620px] w-full text-sm">
            <thead className="text-left text-gray-300">
              <tr>
                <th className="py-2">Sportsbook</th>
                <th className="py-2">Momio cotizado</th>
                <th className="py-2">Prob. implícita</th>
                <th className="py-2">Sugerido (u)</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {rows.map((r, idx) => {
                const book = providers.find(p => p.id === r.provider);
                const name = book ? book.name : r.provider;
                const pImpl = americanToProb(r.quotedPrice);
                return (
                  <tr key={idx} className="border-t border-slate-800">
                    <td className="py-2">{name} <span className="text-[10px] text-gray-500">({r.provider})</span></td>
                    <td className="py-2 font-mono">{r.quotedPrice}</td>
                    <td className="py-2 font-mono">{(pImpl * 100).toFixed(1)}%</td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={r.suggested}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setRows(rows.map((x,i)=> i===idx ? { ...x, suggested: v } : x));
                        }}
                        className="w-28 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="text-gray-300">
              <tr className="border-t border-slate-800">
                <td className="py-2 font-semibold">TOTAL</td>
                <td />
                <td />
                <td className="py-2 font-mono">
                  {rows.reduce((a,b)=>a + (Number(b.suggested)||0), 0).toFixed(2)} u
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-[11px] text-gray-500 mt-2">
          Sugerencias basadas en cotización actual. Ajusta libremente y coloca manualmente en cada sportsbook.
        </p>
      </div>
    </div>
  );
}

