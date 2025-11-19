'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

type QuarterLine = {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  ot?: number | null;
};

type GameSummaryResponse = {
  meta: {
    gameId: string;
    apiGameId: number;
    date: string;
    league: string;
    season: string;
    status: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamId: number;
    awayTeamId: number;
  };
  quarters: {
    home: QuarterLine;
    away: QuarterLine;
  };
  cumulative: {
    home: number[];
    away: number[];
  };
  diffPerQuarter: number[];
  finalTotal: {
    home: number;
    away: number;
  };
};

type Props = {
  date: string;   // "2024-10-25"
  gameId: string; // "413890"
};

export default function GameSummaryCard({ date, gameId }: Props) {
  const [data, setData] = useState<GameSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          date,
          gameId,
        });

        const res = await fetch(
          `/api/basketball/game-summary?${params.toString()}`,
        );

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error || `Error HTTP ${res.status}`);
        }

        const json = (await res.json()) as GameSummaryResponse;
        setData(json);
      } catch (err: any) {
        console.error('Error al cargar game-summary:', err);
        setError(err.message ?? 'Error al cargar resumen del juego');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [date, gameId]);

  if (loading) {
    return (
      <div className="border rounded-xl p-4 text-sm">
        Cargando resumen del juego…
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-xl p-4 text-sm text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border rounded-xl p-4 text-sm">
        No hay datos para este juego.
      </div>
    );
  }

  const { meta, quarters, cumulative, diffPerQuarter, finalTotal } = data;

  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];

  const chartData = quarterLabels.map((label, idx) => ({
    quarter: label,
    home: cumulative.home[idx],
    away: cumulative.away[idx],
    diff: diffPerQuarter[idx],
  }));

  return (
    <div className="border rounded-2xl p-4 md:p-6 bg-white/5 backdrop-blur space-y-6">
      <div>
        <h2 className="font-semibold text-lg mb-1">
          {meta.awayTeam} @ {meta.homeTeam}
        </h2>
        <p className="text-xs text-neutral-400">
          {meta.league} · {meta.season} · {meta.status}
        </p>
      </div>

      {/* Tabla de puntos por cuarto */}
      <div className="overflow-x-auto text-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left">Equipo</th>
              {quarterLabels.map((q) => (
                <th key={q} className="border px-2 py-1 text-center">
                  {q}
                </th>
              ))}
              <th className="border px-2 py-1 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 font-medium">{meta.awayTeam}</td>
              <td className="border px-2 py-1 text-center">
                {quarters.away.q1}
              </td>
              <td className="border px-2 py-1 text-center">
                {quarters.away.q2}
              </td>
              <td className="border px-2 py-1 text-center">
                {quarters.away.q3}
              </td>
              <td className="border px-2 py-1 text-center">
                {quarters.away.q4}
              </td>
              <td className="border px-2 py-1 text-center">
                {finalTotal.away}
              </td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-medium">{meta.homeTeam}</td>
              <td className="border px-2 py-1 text-center">
                {quarters.home.q1}
              </td>
              <td className="border px-2 py-1 text-center">
                {quarters.home.q2}
              </td>
              <td className="border px-2 py-1 text-center">
                {quarters.home.q3}
              </td>
              <td className="border px-2 py-1 text-center">
                {quarters.home.q4}
              </td>
              <td className="border px-2 py-1 text-center">
                {finalTotal.home}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Diferencia acumulada por cuarto (mini Y/-Y) */}
      <div className="text-sm space-y-2">
        <h3 className="font-semibold">
          Diferencia acumulada (home - away) por cuarto
        </h3>
        <div className="flex gap-2">
          {diffPerQuarter.map((diff, idx) => (
            <div
              key={idx}
              className="flex-1 border rounded-xl p-2 text-center"
            >
              <div className="text-xs text-neutral-400">
                {quarterLabels[idx]}
              </div>
              <div
                className={
                  'font-semibold ' +
                  (diff > 0
                    ? 'text-green-400'
                    : diff < 0
                    ? 'text-red-400'
                    : 'text-neutral-200')
                }
              >
                {diff > 0 ? `+${diff}` : diff}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfica Y/–Y básica */}
      <div className="h-64">
        <h3 className="font-semibold mb-2 text-sm">
          Gráfica Y/–Y (diferencia acumulada)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis />
            <Tooltip />
            {/* Línea base en 0, para ver claro cuándo está en negativo */}
            <ReferenceLine y={0} strokeWidth={1} />
            {/* Línea de diferencia */}
            <Line
              type="monotone"
              dataKey="diff"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

