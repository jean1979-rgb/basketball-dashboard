import { NextResponse } from 'next/server';
import { buildGameQuarterData } from '../../../../lib/basketball/transform';

const API_BASE_URL =
  process.env.API_BASKETBALL_BASE_URL ?? 'https://v1.basketball.api-sports.io';

const API_KEY = process.env.API_BASKETBALL_KEY;
const LEAGUE_ID = process.env.API_BASKETBALL_LEAGUE_ID ?? '12'; // NBA
const DEFAULT_SEASON = process.env.API_BASKETBALL_SEASON ?? '2024-2025';

// GET /api/basketball/game-summary?date=YYYY-MM-DD&gameId=413890
export async function GET(req: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Falta API_BASKETBALL_KEY en .env.local' },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const gameIdParam = searchParams.get('gameId');
    const seasonParam = searchParams.get('season');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Falta parámetro date (YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    if (!gameIdParam) {
      return NextResponse.json(
        { error: 'Falta parámetro gameId' },
        { status: 400 },
      );
    }

    const season = seasonParam ?? DEFAULT_SEASON;

    const url = new URL(`${API_BASE_URL}/games`);
    url.searchParams.set('date', dateParam);
    url.searchParams.set('league', LEAGUE_ID);
    url.searchParams.set('season', season);
    url.searchParams.set('timezone', 'America/Mexico_City');

    console.log('GAME-SUMMARY GAMES URL:', url.toString());

    const res = await fetch(url.toString(), {
      headers: {
        'x-apisports-key': API_KEY,
      },
      cache: 'no-store',
    });

    const data = await res.json();

    console.log('GAME-SUMMARY STATUS:', res.status, 'ERRORS:', data?.errors);

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

    const games = data.response ?? [];

    // Buscar el juego cuyo id coincide con gameIdParam
    const game = games.find((g: any) => {
      const rawId = g.id ?? g.game?.id;
      return String(rawId) === String(gameIdParam);
    });

    if (!game) {
      return NextResponse.json(
        {
          error: 'No se encontró el juego con ese gameId en esa fecha',
          gameId: gameIdParam,
          date: dateParam,
        },
        { status: 404 },
      );
    }

    const quarterData = buildGameQuarterData(game);

    const responsePayload = {
      meta: {
        gameId: gameIdParam,
        apiGameId: game.id ?? game.game?.id,
        date: game.date ?? game.game?.date,
        league: game.league?.name,
        season: game.season ?? season,
        status: game.status?.long ?? game.status?.short,
        homeTeam: game.teams?.home?.name,
        awayTeam: game.teams?.away?.name,
        homeTeamId: game.teams?.home?.id,
        awayTeamId: game.teams?.away?.id,
      },
      quarters: {
        home: quarterData.home,
        away: quarterData.away,
      },
      cumulative: {
        home: quarterData.homeCumulative,
        away: quarterData.awayCumulative,
      },
      diffPerQuarter: quarterData.diffPerQuarter,
      finalTotal: quarterData.finalTotal,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('Error en /api/basketball/game-summary:', err);
    return NextResponse.json(
      { error: 'Error interno en /api/basketball/game-summary' },
      { status: 500 },
    );
  }
}

