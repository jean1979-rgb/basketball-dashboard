// utils/liveSimulator.js
// =======================================================
// Simulador en vivo de partidos NBA (para pruebas locales)
// =======================================================

// Genera datos dinámicos cada pocos segundos simulando partidos en curso
export function getLiveGamesMock() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Cambios ligeros cada vez para simular movimiento de línea
  const randomShift = () => (Math.random() * 4 - 2).toFixed(1);

  const games = [
    {
      id: 1,
      homeTeam: "LAL",
      awayTeam: "BOS",
      scoreHome: 58 + (minutes % 12),
      scoreAway: 60 + (seconds % 7),
      quarter: `Q${(Math.floor(minutes / 12) % 4) + 1}`,
      time: `${minutes % 12}:${(seconds % 60).toString().padStart(2, "0")}`,
      offRTG_home: 112,
      defRTG_home: 109,
      offRTG_away: 111,
      defRTG_away: 108,
      pace: 98,
      marketTotal: 222.5 + Number(randomShift()),
      marketSpread: 2.5,
      deltaLine: Number(randomShift()),
      acceleration: Math.random() * 3 - 1.5,
      home_injuryImpact: 2,
      away_injuryImpact: 1,
    },
    {
      id: 2,
      homeTeam: "MIA",
      awayTeam: "NYK",
      scoreHome: 47 + (seconds % 10),
      scoreAway: 52 + (minutes % 10),
      quarter: `Q${(Math.floor(minutes / 10) % 4) + 1}`,
      time: `${minutes % 10}:${(seconds % 60).toString().padStart(2, "0")}`,
      offRTG_home: 108,
      defRTG_home: 110,
      offRTG_away: 107,
      defRTG_away: 112,
      pace: 97,
      marketTotal: 217.5 + Number(randomShift()),
      marketSpread: -3.5,
      deltaLine: Number(randomShift()),
      acceleration: Math.random() * 3 - 1.5,
      home_injuryImpact: 1,
      away_injuryImpact: 0,
    },
  ];

  return games;
}

