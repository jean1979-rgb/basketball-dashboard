// lib/data/theodds.js
const THEODDS_BASE = "https://api.the-odds-api.com/v4";

export async function fetchNBAOdds({ markets = "totals,spreads,h2h", bookmakers = "bet365,pinnacle", regions="us,uk" } = {}) {
  const key = process.env.THEODDSAPI_KEY;
  if (!key) throw new Error("Falta THEODDSAPI_KEY");
  const url = `${THEODDS_BASE}/sports/basketball_nba/odds?apiKey=${encodeURIComponent(key)}&markets=${encodeURIComponent(markets)}&regions=${encodeURIComponent(regions)}&bookmakers=${encodeURIComponent(bookmakers)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheOddsAPI HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function pickMarketTotalsSpreadML(oddsArr, game) {
  function normalize(s){return String(s||"").toUpperCase().replace(/[\s\.\-]/g,"");}
  const key = `${normalize(game.awayTeam)}@${normalize(game.homeTeam)}`;

  // Indexar odds por matchup
  const byMatch = new Map();
  for (const o of oddsArr) {
    const home = normalize(o.home_team);
    const away = normalize(o.away_team);
    const k = `${away}@${home}`;
    if (!byMatch.has(k)) byMatch.set(k, []);
    byMatch.get(k).push(o);
  }
  const od = byMatch.get(key) || [];

  const extract = (marketKey) => {
    for (const book of od) {
      const bm = (book?.bookmakers || []).find(b => ["bet365","pinnacle"].includes((b?.key||"").toLowerCase()));
      if (!bm) continue;
      const mk = (bm?.markets || []).find(m => (m?.key||"") === marketKey);
      if (!mk) continue;

      if (marketKey === "totals") {
        const pts = mk.outcomes?.map(o => o.point).filter(n => typeof n === "number");
        if (pts?.length) return Number((pts.reduce((a,b)=>a+b,0)/pts.length).toFixed(1));
      }
      if (marketKey === "spreads") {
        const home = mk.outcomes?.find(o => o.name?.toUpperCase().includes(game.homeTeam.toUpperCase()));
        if (typeof home?.point === "number") return home.point;
      }
      if (marketKey === "h2h") {
        const home = mk.outcomes?.find(o => o.name?.toUpperCase().includes(game.homeTeam.toUpperCase()));
        if (typeof home?.price === "number") return home.price;
      }
    }
    return null;
  };

  return {
    totalLive: extract("totals"),
    spreadLive: extract("spreads"),
    moneylineLive: extract("h2h")
  };
}

