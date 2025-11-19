// app/api/backtest/route.js
export async function GET() {
  // Fecha del "corte" (mock)
  const dateIso = new Date().toISOString().slice(0, 10);

  // Estadísticas acumuladas del día por mercado (mock)
  const counters = {
    ou: {
      market: "Over/Under",
      picks: 17,
      wins: 10,
      losses: 6,
      pushes: 1,
      winrate: Number(((10 / 16) * 100).toFixed(1)), // se excluyen pushes
      avgEdgePts: 2.6,
      units: 3.85, // asumiendo flat stake y -110 std
    },
    spread: {
      market: "Spread",
      picks: 14,
      wins: 8,
      losses: 6,
      pushes: 0,
      winrate: Number(((8 / 14) * 100).toFixed(1)),
      avgEdgePts: 1.9,
      units: 1.85,
    },
    ml: {
      market: "Moneyline",
      picks: 9,
      wins: 5,
      losses: 4,
      pushes: 0,
      winrate: Number(((5 / 9) * 100).toFixed(1)),
      avgEdgeProb: 0.046, // 4.6% promedio
      units: 1.12,
    },
  };

  // Últimos eventos registrados (mock breve para auditoría)
  const lastEvents = [
    {
      ts: `${dateIso}T02:34:00Z`,
      league: "NBA",
      game: "LAL @ DEN",
      market: "OU",
      pick: "UNDER 221.5",
      model: "ProjTotal 218.3",
      edge: "+3.2 pts",
      price: "-110",
      result: "W",
      units: "+0.95",
    },
    {
      ts: `${dateIso}T02:18:00Z`,
      league: "NBA",
      game: "BOS @ MIA",
      market: "Spread",
      pick: "BOS -3.5",
      model: "ModelMargin -5.1",
      edge: "+1.6 pts",
      price: "-108",
      result: "L",
      units: "-1.00",
    },
    {
      ts: `${dateIso}T01:57:00Z`,
      league: "NBA",
      game: "NYK @ PHI",
      market: "ML",
      pick: "PHI ML -135",
      model: "ModelProb 0.60",
      edge: "+0.05",
      price: "-135",
      result: "W",
      units: "+0.74",
    },
  ];

  return new Response(
    JSON.stringify({
      ok: true,
      date: dateIso,
      counters,
      lastEvents,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

