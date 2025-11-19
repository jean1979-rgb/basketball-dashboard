// lib/data/realtimeEspn.js
// Une ESPN scoreboard + cálculo de pace para alimentar /api/live.
// Ahora puede usar stats reales desde data/preStats.json.
// Si no encuentra stats para un partido, usa dummies.

import { getCached, setCached } from "./simpleCache";
import { fetchNBAGamesFromESPN } from "./espnNbaScoreboard";
import preStats from "../../data/preStats.json";

// Queremos parecer "humano": consulta cada ~10–12 segundos a ESPN.
// El front puede seguir llamando /api/live cada 4s, aquí cacheamos.
const MIN_TTL_MS = 10_000; // 10 segundos
const MAX_TTL_MS = 12_000; // 12 segundos

function randomTtlMs() {
  const span = MAX_TTL_MS - MIN_TTL_MS;
  return MIN_TTL_MS + Math.floor(Math.random() * (span + 1));
}

/** ---------------------- HELPERS PRESTATS ---------------------- **/

function safeSide(side = {}) {
  return {
    team: side.team,
    all: side.all || {},
    home: side.home || {},
    away: side.away || {},
    fav: side.fav || {},
    dog: side.dog || {},
    l5: side.l5 || {},
    l5Home: side.l5Home || {},
    l5Away: side.l5Away || {},
    conf: side.conf || {},
    confHome: side.confHome || {},
    confAway: side.confAway || {},
  };
}

function sumPair(a = {}, b = {}) {
  const f = (a.for ?? 0) + (b.for ?? 0);
  const ag = (a.against ?? 0) + (b.against ?? 0);
  return { for: Number(f.toFixed(1)), against: Number(ag.toFixed(1)) };
}

function buildTotalFromSides(away, home) {
  const a = safeSide(away);
  const h = safeSide(home);

  return {
    team: "TOTAL",
    all: sumPair(a.all, h.all),
    home: sumPair(a.home, h.home),
    away: sumPair(a.away, h.away),
    fav: sumPair(a.fav, h.fav),
    dog: sumPair(a.dog, h.dog),
    l5: sumPair(a.l5, h.l5),
    conf: sumPair(a.conf, h.conf),
  };
}

function findPreStatsForGame(game) {
  if (!preStats || !Array.isArray(preStats.games)) return null;
  return (
    preStats.games.find(
      (g2) =>
        String(g2.homeTeam).toUpperCase() ===
          String(game.homeTeam).toUpperCase() &&
        String(g2.awayTeam).toUpperCase() ===
          String(game.awayTeam).toUpperCase()
    ) || null
  );
}

/** ---------------------- DUMMIES (fallback) ---------------------- **/

// Dummy: stats pre-juego (pts y reb) para que el modal se vea lleno.
// Más adelante sustituiremos estos números por Covers si no hay preStats.
function buildDummyStats(game) {
  const homeTeam = game.homeTeam;
  const awayTeam = game.awayTeam;

  // Puntos "esperados" genéricos
  const ptsAwayAllFor = 115;
  const ptsAwayAllAgainst = 112;
  const ptsHomeAllFor = 118;
  const ptsHomeAllAgainst = 110;

  // Rebotes "esperados" genéricos
  const rebAwayAllFor = 44;
  const rebAwayAllAgainst = 43;
  const rebHomeAllFor = 45;
  const rebHomeAllAgainst = 42;

  function buildSidePts(isHome) {
    const allFor = isHome ? ptsHomeAllFor : ptsAwayAllFor;
    const allAgainst = isHome ? ptsHomeAllAgainst : ptsAwayAllAgainst;

    const homeFor = isHome ? ptsHomeAllFor : Math.round(ptsAwayAllFor * 0.97);
    const homeAgainst = isHome
      ? ptsHomeAllAgainst
      : Math.round(ptsAwayAllAgainst * 1.03);

    const awayFor = isHome ? Math.round(ptsHomeAllFor * 0.96) : ptsAwayAllFor;
    const awayAgainst = isHome
      ? Math.round(ptsHomeAllAgainst * 1.04)
      : ptsAwayAllAgainst;

    const l5 = {
      for: Math.round(allFor * 1.03),
      against: Math.round(allAgainst * 0.99),
    };
    const conf = {
      for: Math.round(allFor * 1.01),
      against: Math.round(allAgainst * 1.0),
    };

    const l5Home = {
      for: Math.round(homeFor * 1.02),
      against: Math.round(homeAgainst * 1.0),
    };
    const l5Away = {
      for: Math.round(awayFor * 1.02),
      against: Math.round(awayAgainst * 1.0),
    };

    const confHome = {
      for: Math.round(homeFor * 1.01),
      against: Math.round(homeAgainst * 1.0),
    };
    const confAway = {
      for: Math.round(awayFor * 1.01),
      against: Math.round(awayAgainst * 1.0),
    };

    return {
      team: isHome ? homeTeam : awayTeam,
      all: { for: allFor, against: allAgainst },
      home: { for: homeFor, against: homeAgainst },
      away: { for: awayFor, against: awayAgainst },
      fav: {
        for: Math.round(allFor * 1.02),
        against: Math.round(allAgainst * 0.98),
      },
      dog: {
        for: Math.round(allFor * 0.97),
        against: Math.round(allAgainst * 1.03),
      },
      l5,
      l5Home,
      l5Away,
      conf,
      confHome,
      confAway,
    };
  }

  function buildSideReb(isHome) {
    const allFor = isHome ? rebHomeAllFor : rebAwayAllFor;
    const allAgainst = isHome ? rebHomeAllAgainst : rebAwayAllAgainst;

    const homeFor = isHome ? rebHomeAllFor : Math.round(rebAwayAllFor * 0.97);
    const homeAgainst = isHome
      ? rebHomeAllAgainst
      : Math.round(rebAwayAllAgainst * 1.03);

    const awayFor = isHome ? Math.round(rebHomeAllFor * 0.96) : rebAwayAllFor;
    const awayAgainst = isHome
      ? Math.round(rebHomeAllAgainst * 1.04)
      : rebAwayAllAgainst;

    const l5 = {
      for: Math.round(allFor * 1.03),
      against: Math.round(allAgainst * 1.0),
    };
    const conf = {
      for: Math.round(allFor * 1.01),
      against: Math.round(allAgainst * 1.0),
    };

    const l5Home = {
      for: Math.round(homeFor * 1.02),
      against: Math.round(homeAgainst * 1.0),
    };
    const l5Away = {
      for: Math.round(awayFor * 1.02),
      against: Math.round(awayAgainst * 1.0),
    };

    const confHome = {
      for: Math.round(homeFor * 1.01),
      against: Math.round(homeAgainst * 1.0),
    };
    const confAway = {
      for: Math.round(awayFor * 1.01),
      against: Math.round(awayAgainst * 1.0),
    };

    return {
      team: isHome ? homeTeam : awayTeam,
      all: { for: allFor, against: allAgainst },
      home: { for: homeFor, against: homeAgainst },
      away: { for: awayFor, against: awayAgainst },
      fav: {
        for: Math.round(allFor * 1.02),
        against: Math.round(allAgainst * 0.99),
      },
      dog: {
        for: Math.round(allFor * 0.98),
        against: Math.round(allAgainst * 1.01),
      },
      l5,
      l5Home,
      l5Away,
      conf,
      confHome,
      confAway,
    };
  }

  const awayPts = buildSidePts(false);
  const homePts = buildSidePts(true);
  const awayReb = buildSideReb(false);
  const homeReb = buildSideReb(true);

  return {
    pts: {
      away: awayPts,
      home: homePts,
      total: buildTotalFromSides(awayPts, homePts),
    },
    reb: {
      away: awayReb,
      home: homeReb,
      total: buildTotalFromSides(awayReb, homeReb),
    },
  };
}

/** ---------------------- BUILDER PRINCIPAL DE STATS ---------------------- **/

function buildStats(game) {
  const pre = findPreStatsForGame(game);

  if (pre && pre.pts && pre.reb) {
    const ptsAway = safeSide(pre.pts.away || {});
    const ptsHome = safeSide(pre.pts.home || {});
    const rebAway = safeSide(pre.reb.away || {});
    const rebHome = safeSide(pre.reb.home || {});

    return {
      pts: {
        away: ptsAway,
        home: ptsHome,
        total: buildTotalFromSides(ptsAway, ptsHome),
      },
      reb: {
        away: rebAway,
        home: rebHome,
        total: buildTotalFromSides(rebAway, rebHome),
      },
    };
  }

  // Si no hay stats pre-cargadas, usamos dummies
  return buildDummyStats(game);
}

/** ---------------------- REFS DUMMY ---------------------- **/

function buildDummyRefs(game) {
  return {
    crew: ["Ref A", "Ref B", "Ref C"],
    avgTotal: 229.4,
    overRate: 0.62,
    bias: "OVER",
    biasText: "Sesgo ligero hacia OVER en totales según histórico de árbitros.",
  };
}

/** ---------------------- FUNCIÓN PRINCIPAL ---------------------- **/

export async function getLiveBlocksFromESPN() {
  // 1) Scores desde cache
  let games = getCached("espn:nba:scores");

  if (!games) {
    games = await fetchNBAGamesFromESPN();
    const ttl = randomTtlMs();
    setCached("espn:nba:scores", games, ttl);
  }

  // 2) Cálculo de ritmo (pace) sencillo
  const totalGameSeconds = 48 * 60;
  const secondsPerQuarter = 12 * 60;

  const blocks = games.map((g) => {
    const expectedHome = 118; // por ahora fijos (luego usaremos stats reales para pace)
    const expectedAway = 115;

    const q = g.quarter || 1;
    const sRem =
      typeof g.secondsRemainingQuarter === "number"
        ? g.secondsRemainingQuarter
        : secondsPerQuarter;

    const timePlayed =
      (q - 1) * secondsPerQuarter + (secondsPerQuarter - sRem);

    let projectedHome = expectedHome;
    let projectedAway = expectedAway;

    if (timePlayed > 0) {
      const factor = totalGameSeconds / timePlayed;
      projectedHome = (g.score.home || 0) * factor;
      projectedAway = (g.score.away || 0) * factor;
    }

    const pace = {
      home: {
        team: g.homeTeam,
        expected: expectedHome,
        projected: Number(projectedHome.toFixed(1)),
        delta: Number((projectedHome - expectedHome).toFixed(1)),
      },
      away: {
        team: g.awayTeam,
        expected: expectedAway,
        projected: Number(projectedAway.toFixed(1)),
        delta: Number((projectedAway - expectedAway).toFixed(1)),
      },
      total: {
        expected: expectedHome + expectedAway,
        projected: Number(
          (projectedHome + projectedAway).toFixed(1)
        ),
        delta: Number(
          (
            projectedHome +
            projectedAway -
            (expectedHome + expectedAway)
          ).toFixed(1)
        ),
      },
    };

    const stats = buildStats(g);
    const refs = buildDummyRefs(g);

    return {
      game: g,
      market: g.market || {},
      stats,
      model: {},
      pace,
      trend: {
        direction: "flat",
        strength: "soft",
        inflexion: false,
      },
      technicalSignal: { liveSignal: "NO_BET" },
      refs,
    };
  });

  return blocks;
}

