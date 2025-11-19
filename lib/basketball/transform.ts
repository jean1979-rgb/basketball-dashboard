export type QuarterScores = {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  ot?: number | null;
};

export type GameQuarterData = {
  home: QuarterScores;
  away: QuarterScores;
  homeCumulative: number[];      // puntos acumulados por cuarto (home)
  awayCumulative: number[];      // puntos acumulados por cuarto (away)
  diffPerQuarter: number[];      // diferencia acumulada home - away por cuarto
  finalTotal: { home: number; away: number };
};

/**
 * Recibe un objeto "game" tal como viene de API-Basketball (endpoint /games)
 * y devuelve info organizada por cuartos.
 */
export function buildGameQuarterData(game: any): GameQuarterData {
  const h = game.scores?.home ?? {};
  const a = game.scores?.away ?? {};

  const home: QuarterScores = {
    q1: h.quarter_1 ?? 0,
    q2: h.quarter_2 ?? 0,
    q3: h.quarter_3 ?? 0,
    q4: h.quarter_4 ?? 0,
    ot: h.over_time ?? null,
  };

  const away: QuarterScores = {
    q1: a.quarter_1 ?? 0,
    q2: a.quarter_2 ?? 0,
    q3: a.quarter_3 ?? 0,
    q4: a.quarter_4 ?? 0,
    ot: a.over_time ?? null,
  };

  const homeCumulative = [
    home.q1,
    home.q1 + home.q2,
    home.q1 + home.q2 + home.q3,
    home.q1 + home.q2 + home.q3 + home.q4,
  ];

  const awayCumulative = [
    away.q1,
    away.q1 + away.q2,
    away.q1 + away.q2 + away.q3,
    away.q1 + away.q2 + away.q3 + away.q4,
  ];

  const diffPerQuarter = [
    home.q1 - away.q1,
    (home.q1 + home.q2) - (away.q1 + away.q2),
    (home.q1 + home.q2 + home.q3) - (away.q1 + away.q2 + away.q3),
    (home.q1 + home.q2 + home.q3 + home.q4) -
      (away.q1 + away.q2 + away.q3 + away.q4),
  ];

  return {
    home,
    away,
    homeCumulative,
    awayCumulative,
    diffPerQuarter,
    finalTotal: {
      home: h.total ?? homeCumulative[3],
      away: a.total ?? awayCumulative[3],
    },
  };
}

