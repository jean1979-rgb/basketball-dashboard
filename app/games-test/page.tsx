'use client';

import { useEffect, useState } from 'react';
import GameSummaryCard from '../components/GameSummaryCard';
import Modal from '../components/Modal';

type GameRow = {
  apiGameId: number;
  date: string;
  league: string;
  season: string;
  status: string;
  statusShort: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  scores: {
    home: { total: number | null } | null;
    away: { total: number | null } | null;
  };
};

type GamesResponse = {
  date: string;
  season: string;
  games: GameRow[];
};

export default function GamesTestPage() {
  const [gamesData, setGamesData] = useState<GamesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2024-10-25');

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ date: selectedDate });
        const res = await fetch(`/api/basketball/games?${params.toString()}`);

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `Error HTTP ${res.status}`);
        }

        const json = (await res.json()) as GamesResponse;
        console.log('GAMES TEST /games', json);
        setGamesData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [selectedDate]); // <-- ESTE USEEFFECT CIERRA CORRECTAMENTE

  // ---------------------------------
  // RENDER
  // ---------------------------------

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Juegos NBA (test)</h1>
          <p className="text-xs text-neutral-400">
            Lista de juegos y modal con resumen por cuarto.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label className="text-neutral-300">
            Fecha:{' '}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-sm"
            />
          </label>
        </div>
      </header>

      {loading && <div>Cargando juegos…</div>}
      {error && <div className="text-red-400">Error: {error}</div>}

      {gamesData && gamesData.games.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {gamesData.games.map((g) => (
            <button
              key={g.apiGameId}
              onClick={() => setSelectedGameId(String(g.apiGameId))}
              className="p-4 text-left border border-neutral-800 rounded-xl hover:bg-neutral-900"
            >
              <div className="font-semibold">
                {g.awayTeam} @ {g.homeTeam}
              </div>
              <div className="text-sm text-neutral-300">
                {(g.scores.away?.total ?? '-')} :{' '}
                {(g.scores.home?.total ?? '-')}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* MODAL */}
      <Modal
        open={!!selectedGameId}
        onClose={() => setSelectedGameId(null)}
        title="Resumen del juego"
      >
        {selectedGameId && (
          <GameSummaryCard date={selectedDate} gameId={selectedGameId} />
        )}
      </Modal>
    </div>
  );
}

