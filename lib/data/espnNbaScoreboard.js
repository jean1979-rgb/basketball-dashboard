// lib/data/espnNbaScoreboard.js
// Lector del scoreboard oculto de ESPN para NBA.
// Endpoint público (no oficial): ver documentación de la comunidad.

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

/**
 * Convierte el reloj tipo "5:40" o "0.3" a segundos restantes en el cuarto.
 */
function parseClockToSeconds(clock) {
  if (!clock) return 0;

  const str = String(clock).trim();

  // Formato "MM:SS"
  if (str.includes(":")) {
    const [m, s] = str.split(":");
    const minutes = parseInt(m, 10) || 0;
    const seconds = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
    return Math.round(minutes * 60 + seconds);
  }

  // Formato "0.3", "12.0", etc.
  const seconds = parseFloat(str.replace(/[^\d.]/g, "")) || 0;
  return Math.round(seconds);
}

/**
 * Llama al scoreboard de ESPN y devuelve un arreglo de juegos en un formato
 * amigable para tu UI (gameId, matchup, marcador, periodo, market live).
 */
export async function fetchNBAGamesFromESPN() {
  const res = await fetch(ESPN_SCOREBOARD_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`ESPN scoreboard HTTP ${res.status}`);
  }

  const data = await res.json();
  const events = Array.isArray(data?.events) ? data.events : [];

  return events.map((ev) => {
    const gameId = ev.id || ev.uid || ev.guid || ev.shortName || "unknown";

    const competition =
      (Array.isArray(ev.competitions) && ev.competitions[0]) || {};
    const status = competition.status || ev.status || {};
    const period = status.period ?? status.displayPeriod ?? null;
    const displayClock = status.displayClock || status.clock || "0:00";

    const competitors = Array.isArray(competition.competitors)
      ? competition.competitors
      : [];

    let homeTeam = "HOME";
    let awayTeam = "AWAY";
    let homeScore = 0;
    let awayScore = 0;

    for (const c of competitors) {
      const side = String(c.homeAway || "").toLowerCase();
      const abbr =
        c.team?.abbreviation ||
        c.team?.shortDisplayName ||
        c.team?.name ||
        "";
      const score = Number(c.score ?? 0);

      if (side === "home") {
        homeTeam = abbr || homeTeam;
        homeScore = score;
      } else if (side === "away") {
        awayTeam = abbr || awayTeam;
        awayScore = score;
      }
    }

    const secondsRemainingQuarter = parseClockToSeconds(displayClock);

    // Odds: OU, spread y ML si ESPN los expone para ese juego.
    let totalLive = null;
    let spreadLive = null;
    let moneylineHome = null;

    const odds = Array.isArray(competition.odds) ? competition.odds[0] : null;
    if (odds) {
      if (odds.overUnder != null) {
        totalLive = Number(odds.overUnder);
      }
      if (odds.spread != null) {
        spreadLive = Number(odds.spread);
      }
      if (odds.homeTeamOdds?.moneyLine != null) {
        moneylineHome = Number(odds.homeTeamOdds.moneyLine);
      } else if (odds.moneyLine != null) {
        moneylineHome = Number(odds.moneyLine);
      }
    }

    const matchup =
      ev.shortName || `${awayTeam} @ ${homeTeam}`;

    return {
      gameId,
      matchup,
      quarter:
        typeof period === "number"
          ? period
          : Number(period || 0) || null,
      secondsRemainingQuarter,
      awayTeam,
      homeTeam,
      score: { away: awayScore, home: homeScore },
      market: {
        totalLive,
        spreadLive,
        moneylineLive: moneylineHome,
      },
    };
  });
}

