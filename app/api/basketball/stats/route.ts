import { NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_BASKETBALL_BASE_URL ?? 'https://v1.basketball.api-sports.io';

const API_KEY = process.env.API_BASKETBALL_KEY;
const LEAGUE_ID = process.env.API_BASKETBALL_LEAGUE_ID ?? '12'; // NBA

export async function GET(req: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Falta API_BASKETBALL_KEY en .env.local' },
        { status: 500 },
      );
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json(
        { error: 'Falta el parámetro gameId' },
        { status: 400 },
      );
    }

    // ---- URL ACTUALIZADA CON LEAGUE ----
    const url = `${API_BASE_URL}/games/statistics?game=${gameId}&league=${LEAGUE_ID}`;

    console.log('API-Basketball URL:', url);

    // Llamada a la API real
    const res = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      cache: 'no-store',
    });

    const data = await res.json();

    console.log('STATUS:', res.status, 'ERRORS:', data?.errors);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Error en API-Basketball',
          status: res.status,
          details: data,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      gameId,
      statistics: data.response ?? [],
    });
  } catch (err: any) {
    console.error('Error en /api/basketball/stats:', err);
    return NextResponse.json(
      { error: 'Error interno en /api/basketball/stats' },
      { status: 500 },
    );
  }
}

