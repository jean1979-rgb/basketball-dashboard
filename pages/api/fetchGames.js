import fetch from 'node-fetch';

const LEAGUE_PATHS = { nba: 'nba', wnba: 'wnba', acb: 'esp.1', eurol: 'euroleague' };

function safeNum(v, fallback=110){ const n = Number(v); return Number.isFinite(n)? n : fallback }

function stdev(arr){ if(!arr||arr.length<2) return 0; const mean = arr.reduce((a,b)=>a+b,0)/arr.length; const sq = arr.reduce((s,x)=>s+(x-mean)*(x-mean),0); return Math.sqrt(sq/(arr.length-1)); }

function projectWithEfficiency(ortgHome, drtgAway, ortgAway, drtgHome, paceHome, paceAway, leaguePace=100){
  const homeExp = (ortgHome + drtgAway)/2;
  const awayExp = (ortgAway + drtgHome)/2;
  const paceAdj = ((paceHome||leaguePace) + (paceAway||leaguePace))/2 / leaguePace;
  return Math.round(((homeExp + awayExp) * paceAdj) * 10) / 10;
}

function projectFallback(homePpg, awayPpg){ return Math.round((safeNum(homePpg) + safeNum(awayPpg)) * 10) / 10 }

export default async function handler(req, res){
  try{
    const { league = 'nba' } = req.query;
    const leagueCode = LEAGUE_PATHS[league] || 'nba';
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/${leagueCode}/scoreboard`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) throw new Error('Fallo al consultar el scoreboard');
    const data = await resp.json();
    const events = data.events || [];

    const out = events.map(ev => {
      const comp = ev.competitions?.[0] || {};
      const homeComp = comp.competitors?.find(c => c.homeAway === 'home') || {};
      const awayComp = comp.competitors?.find(c => c.homeAway === 'away') || {};

      const odds = comp.odds?.[0] || null;
      const market_total = odds?.overUnder ? Number(odds.overUnder) : null;
      const market_spread = odds?.spread ? Number(odds.spread) : null;

      const homeStats = {
        ppg: Number(homeComp?.team?.stats?.find(s=>s.name==='ppg')?.value) || null,
        ortg: Number(homeComp?.team?.stats?.find(s=>s.name==='ortg')?.value) || null,
        drtg: Number(homeComp?.team?.stats?.find(s=>s.name==='drtg')?.value) || null,
        pace: Number(homeComp?.team?.stats?.find(s=>s.name==='pace')?.value) || null,
        ppg_home: null, ppg_away: null
      };
      const awayStats = {
        ppg: Number(awayComp?.team?.stats?.find(s=>s.name==='ppg')?.value) || null,
        ortg: Number(awayComp?.team?.stats?.find(s=>s.name==='ortg')?.value) || null,
        drtg: Number(awayComp?.team?.stats?.find(s=>s.name==='drtg')?.value) || null,
        pace: Number(awayComp?.team?.stats?.find(s=>s.name==='pace')?.value) || null,
        ppg_home: null, ppg_away: null
      };

      if (!homeStats.ppg) homeStats.ppg = 110;
      if (!awayStats.ppg) awayStats.ppg = 110;

      const canUseEfficiency = homeStats.ortg && awayStats.ortg && homeStats.drtg && awayStats.drtg && (homeStats.pace || awayStats.pace);
      const proj_general = canUseEfficiency ? projectWithEfficiency(homeStats.ortg, awayStats.drtg, awayStats.ortg, homeStats.drtg, homeStats.pace, awayStats.pace) : projectFallback(homeStats.ppg, awayStats.ppg);

      const homeAdv = 2.5;
      const proj_homeAway = Math.round((proj_general + homeAdv) * 10) / 10;

      const k = 0.25;
      const proj_favorite = (typeof market_spread === 'number') ? Math.round((proj_general + (-market_spread)*k)*10)/10 : proj_general;

      const netHome = (homeStats.ortg?homeStats.ortg:100) - (homeStats.drtg?homeStats.drtg:100);
      const netAway = (awayStats.ortg?awayStats.ortg:100) - (awayStats.drtg?awayStats.drtg:100);
      const projectedSpread = Math.round(((netHome - netAway)/2) * 10)/10;

      const projectionHistory = ev.projection_history || [proj_general];
      const momentum = projectionHistory.length ? projectionHistory.slice(-5).reduce((acc, x, i)=> (i>0 && x>projectionHistory[i-1] ? acc+1 : acc), 0) : 0;
      const volatility = stdev(projectionHistory);

      return {
        id: ev.id,
        league,
        home: { name: homeComp?.team?.shortDisplayName || 'Home', ppg: homeStats.ppg },
        away: { name: awayComp?.team?.shortDisplayName || 'Away', ppg: awayStats.ppg },
        market_total,
        market_spread,
        proj_general,
        proj_homeAway,
        proj_favorite,
        diff_general: proj_general - (market_total ?? 0),
        diff_homeAway: proj_homeAway - (market_total ?? 0),
        diff_favorite: proj_favorite - (market_total ?? 0),
        projectedSpread,
        spreadDiff: projectedSpread - (market_spread ?? 0),
        momentum,
        volatility,
        projection_history: projectionHistory,
        status: ev.status?.type?.description || 'scheduled'
      };
    });

    res.setHeader('Cache-Control','s-maxage=2, stale-while-revalidate');
    return res.json(out);
  } catch (e){
    console.error('fetchGames error', e.message);
    return res.status(500).json({ error: e.message });
  }
}
