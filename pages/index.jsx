import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import GameCard from '../components/GameCard';

const fetcher = url => fetch(url).then(r=>r.json());

export default function Home(){
  const [league, setLeague] = useState('nba');
  const { data, error } = useSWR(`/api/fetchGames?league=${league}`, fetcher, { refreshInterval: 4000 });
  const [streakMap, setStreakMap] = useState({});

  useEffect(()=>{
    if (!data) return;
    setStreakMap(prev => {
      const next = { ...prev };
      data.forEach(g => {
        const id = g.id;
        const last = prev[id]?.lastValue ?? null;
        const current = g.proj_homeAway ?? g.proj_general;
        let streak = prev[id]?.streak ?? 0;
        if (last === null) streak = 0;
        else if (current > last) streak = (streak>0?streak:0) + 1;
        else if (current < last) streak = (streak<0?streak:0) - 1;
        else streak = 0;
        next[id] = { lastValue: current, streak };
      });
      return next;
    });
  }, [data]);

  if (error) return <div className="p-8">Error cargando datos</div>;

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard en vivo — Baloncesto</h1>
        <div>
          <select value={league} onChange={e=>setLeague(e.target.value)} className="border rounded p-2">
            <option value="nba">NBA</option>
            <option value="wnba">WNBA</option>
            <option value="acb">ACB (España)</option>
            <option value="eurol">EuroLeague</option>
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!data && <div>Cargando...</div>}
        {data && data.map(game => (
          <GameCard key={game.id} game={game} streak={streakMap[game.id]?.streak ?? 0} />
        ))}
      </main>
    </div>
  );
}
