// lib/data/apisports.js
const APISPORTS_URL = "https://v1.basketball.api-sports.io";

function tzDateISO(tz) {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    const parts = fmt.formatToParts(new Date());
    const y = parts.find(p=>p.type==="year")?.value;
    const m = parts.find(p=>p.type==="month")?.value;
    const d = parts.find(p=>p.type==="day")?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return new Date().toISOString().slice(0,10);
  }
}

export async function fetchNBAGamesLiveOrToday() {
  const key = process.env.APISPORTS_KEY;
  if (!key) throw new Error("Falta APISPORTS_KEY");
  const headers = { "x-apisports-key": key };

  // 1) Intento live (todos)
  let res = await fetch(`${APISPORTS_URL}/games?live=all`, { headers, cache: "no-store" });
  let json = await res.json();
  let items = Array.isArray(json?.response) ? json.response : [];
  let nba = items.filter(g => g?.league?.name?.toUpperCase() === "NBA");

  // 2) Si no hay live, traemos HOY
  if (nba.length === 0) {
    const tz = process.env.APP_TZ || "America/Mexico_City";
    const today = tzDateISO(tz);
    res = await fetch(`${APISPORTS_URL}/games?date=${today}&timezone=${encodeURIComponent(tz)}`, { headers, cache: "no-store" });
    json = await res.json();
    items = Array.isArray(json?.response) ? json.response : [];
    nba = items.filter(g => g?.league?.name?.toUpperCase() === "NBA");
  }

  // Mapeo a shape común
  return nba.map((g) => {
    const homeTeam = g?.teams?.home?.code || g?.teams?.home?.name || "HOME";
    const awayTeam = g?.teams?.away?.code || g?.teams?.away?.name || "AWAY";
    const homeScore = Number(g?.scores?.home?.points ?? 0);
    const awayScore = Number(g?.scores?.away?.points ?? 0);

    const quarter = Number(g?.periods?.current || 0) || null;
    const secondsRemainingQuarter = 0; // API-SPORTS no siempre expone reloj exacto por periodo

    return {
      gameId: g?.id || `${awayTeam}@${homeTeam}-${g?.time || ""}`,
      matchup: `${awayTeam} @ ${homeTeam}`,
      quarter,
      secondsRemainingQuarter,
      awayTeam,
      homeTeam,
      score: { away: awayScore, home: homeScore },
      league: g?.league?.name || "NBA",
    };
  });
}

