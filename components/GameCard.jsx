import React from 'react';
import clsx from 'clsx';

function TrendBadge({streak}){
  if (streak>0) return <div className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white transform transition-all duration-300">🔵 +{streak}</div>
  if (streak<0) return <div className="px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white transform transition-all duration-300">🔴 {streak}</div>
  return <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">—</div>
}

export default function GameCard({game, streak}){
  const dominantDiff = Math.abs(game.diff_homeAway) > Math.abs(game.diff_general) ? game.diff_homeAway : game.diff_general;
  const isPositive = dominantDiff > 0;
  const cardBg = isPositive ? 'bg-gradient-to-r from-white to-blue-50' : 'bg-gradient-to-r from-white to-red-50';
  const showAlert = Math.abs(game.diff_general) >= 5 || Math.abs(game.diff_homeAway) >=5;

  return (
    <div className={clsx('p-4 rounded-2xl shadow-md border', cardBg)}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-slate-500">{game.league?.toUpperCase()}</div>
          <div className="text-lg font-bold">{game.away.name} @ {game.home.name}</div>
          <div className="text-xs text-slate-400">{game.status}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold">{game.market_total ?? '—'}</div>
          <div className="text-sm text-slate-500">Spread: {game.market_spread ?? '—'}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white">
          <div className="text-xs text-slate-400">General</div>
          <div className="font-semibold text-lg">{game.proj_general}</div>
          <div className="text-xs">Diff: {Number(game.diff_general).toFixed(1)}</div>
        </div>

        <div className="p-3 rounded-lg bg-white">
          <div className="text-xs text-slate-400">Casa/Visita</div>
          <div className="font-semibold text-lg">{game.proj_homeAway}</div>
          <div className="text-xs">Diff: {Number(game.diff_homeAway).toFixed(1)}</div>
        </div>

        <div className="p-3 rounded-lg bg-white">
          <div className="text-xs text-slate-400">Favorito</div>
          <div className="font-semibold text-lg">{game.proj_favorite}</div>
          <div className="text-xs">Diff: {Number(game.diff_favorite).toFixed(1)}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendBadge streak={streak} />
          {showAlert && <div className="px-2 py-1 rounded-md bg-yellow-400 text-sm font-medium">ALERTA</div>}
          <div className="text-sm text-slate-500">Vol: {Number(game.volatility).toFixed(2)}</div>
          <div className="text-sm text-slate-500">Mom: {game.momentum}</div>
        </div>
        <div className="text-xs text-slate-400">Actualizado: ahora</div>
      </div>
    </div>
  )
}
