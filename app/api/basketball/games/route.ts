import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_BASKETBALL_BASE_URL ?? 'https://v1.basketball.api-sports.io';

const API_KEY = process.env.API_BASKETBALL_KEY;
const LEAGUE_ID = process.env.API_BASKETBALL_LEAGUE_ID ?? '12'; // NBA
const DEFAULT_SEASON = process.env.API_BASKETBALL_SEASON ?? '2024-2025';

export async function GET(req: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Falta API_BASKETBALL_KEY en .env.local' },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);

    // Puedes pasar ?date=YYYY-MM-DD en la URL para probar otros días
    const dateParam = searchParams.get('date');
    const seasonParam = searchParams.get('season');

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    const dateStr = dateParam ?? todayStr;
    const season = seasonParam ?? DEFAULT_SEASON;

    const url = new URL(`${API_BASE_URL}/games`);
    url.searchParams.set('date', dateStr);
    url.searchParams.set('league', LEAGUE_ID);
    url.searchParams.set('season', season);
    url.searchParams.set('timezone', 'America/Mexico_City');

    console.log('API-Basketball GAMES URL:', url.toString());

    const res = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': API_KEY,
      },
      cache: 'no-store',
    });

    const data = await res.json();

    console.log('GAMES STATUS:', res.status, 'ERRORS:', data?.errors);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Error en API-Basketball (games)',
          status: res.status,
          details: data,
        },
        { status: 500 },
      );
    }

    const games = (data.response ?? []).map((g: any) => ({
      apiGameId: g.id ?? g.game?.id,
      date: g.date ?? g.game?.date,
      league: g.league?.name,
      season: g.season,
      status: g.status?.long ?? g.status?.short,
      statusShort: g.status?.short,
      homeTeam: g.teams?.home?.name,
      awayTeam: g.teams?.away?.name,
      homeTeamId: g.teams?.home?.id,
      awayTeamId: g.teams?.away?.id,
      scores: {
        home: g.scores?.home ?? null,
        away: g.scores?.away ?? null,
      },
      pointsByQuarter: {
        home: g.scores?.periods?.home ?? g.periods?.home ?? null,
        away: g.scores?.periods?.away ?? g.periods?.away ?? null,
      },
    }));

    return NextResponse.json({ date: dateStr, season, games });
  } catch (err: any) {
    console.error('Error en /api/basketball/games:', err);
    return NextResponse.json(
      { error: 'Error interno en /api/basketball/games' },
      { status: 500 },
    );
  }
}

