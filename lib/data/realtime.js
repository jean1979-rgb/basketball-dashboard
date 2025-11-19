// lib/data/realtime.js
import { getCache, setCache } from "./cache";
import { fetchNBAGamesLiveOrToday } from "./apisports";
import { fetchNBAOdds, pickMarketTotalsSpreadML } from "./theodds";

// TTL (ms)
const SCORE_TTL = 15_000; // ~15s
const ODDS_TTL  = 40_000; // ~40s

export async function getLiveBlocksCached() {
  // 1) Scores NBA (cache)
  const cacheScoresKey = "nba:scores";
  let games = getCache(cacheScoresKey);
  if (!games) {
    games = await fetchNBAGamesLiveOrToday();
    setCache(cacheScoresKey, games, SCORE_TTL);
  }

  // 2) Odds NBA (cache)
  const cacheOddsKey = "nba:odds";
  let odds = getCache(cacheOddsKey);
  if (!odds) {
    odds = await fetchNBAOdds({ markets: "totals,spreads,h2h", bookmakers: "bet365,pinnacle", regions: "us,uk" });
    setCache(cacheOddsKey, odds, ODDS_TTL);
  }

  // 3) Unir al shape de tu UI
  const blocks = games.map((g) => {
    const market = pickMarketTotalsSpreadML(odds, g);

    // Pace básico con promedios dummy (ajustaremos luego con tus datos reales)
    const expectedHome = 115, expectedAway = 112;
    const totalGameSeconds = 48 * 60;
    const secondsPerQuarter = 12 * 60;
    const q = Number(g.quarter || 1);
    const sRem = Number(g.secondsRemainingQuarter || secondsPerQuarter);
    const timePlayed = (q - 1) * secondsPerQuarter + (secondsPerQuarter - sRem);

    let projectedHome = expectedHome, projectedAway = expectedAway;
    if (timePlayed > 0) {
      const factor = totalGameSeconds / timePlayed;
      projectedHome = (g.score.home || 0) * factor;
      projectedAway = (g.score.away || 0) * factor;
    }

    const pace = {
      home: { team: g.homeTeam, expected: expectedHome, projected: Number(projectedHome.toFixed(1)), delta: Number((projectedHome - expectedHome).toFixed(1)) },
      away: { team: g.awayTeam, expected: expectedAway, projected: Number(projectedAway.toFixed(1)), delta: Number((projectedAway - expectedAway).toFixed(1)) },
      total:{ expected: expectedHome + expectedAway, projected: Number((projectedHome + projectedAway).toFixed(1)), delta: Number((projectedHome + projectedAway - (expectedHome + expectedAway)).toFixed(1)) }
    };

    return {
      game: {
        gameId: g.gameId,
        matchup: g.matchup,
        quarter: g.quarter,
        secondsRemainingQuarter: g.secondsRemainingQuarter,
        awayTeam: g.awayTeam,
        homeTeam: g.homeTeam,
        score: g.score,
        market: { totalLive: market.totalLive }
      },
      market,        // { totalLive, spreadLive, moneylineLive }
      stats: {},     // (placeholder)
      model: {},     // (placeholder)
      trend: { direction: "flat", strength: "soft", inflexion: false },
      technicalSignal: { liveSignal: "NO_BET" },
      pace,
    };
  });

  return blocks;
}

