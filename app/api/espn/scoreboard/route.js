// app/api/espn/scoreboard/route.js
// Endpoint que trae el scoreboard REAL de ESPN y lo deja en un formato sencillo.

export const dynamic = "force-dynamic";

/**
 * Convierte el reloj tipo "5:40" a segundos restantes en el cuarto.
 * Si viene algo raro ("Halftime", "Final", etc.), devolvemos 0.
 */
function parseDisplayClock(clockStr) {
  if (!clockStr || typeof clockStr !== "string") return 0;

  const lower = clockStr.toLowerCase();

  if (
    lower.includes("final") ||
    lower.includes("end") ||
    lower.includes("halftime")
  ) {
    return 0;
  }

  const parts = clockStr.split(":");
  if (parts.length !== 2) return 0;

  const minutes = parseInt(parts[0], 10) || 0;
  const seconds = parseInt(parts[1], 10) || 0;
  return minutes * 60 + seconds;
}

/**
 * Mapea un "event" del JSON de ESPN a un objeto más limpio para nuestro sistema.
 *
 * Estructura típica:
 * json.events[i].competitions[0].competitors[x]
 * json.events[i].status.period
 * json.events[i].status.displayClock
 */
function mapEspnEvent(event) {
  if (!event) return null;

  const competitions = event.competitions || [];
  const comp = competitions[0] || {};
  const competitors = comp.competitors || [];

  const homeComp =
    competitors.find((c) => c.homeAway === "home") || competitors[0] || {};
  const awayComp =
    competitors.find((c) => c.homeAway === "away") || competitors[1] || {};

  const homeTeam = homeComp.team || {};
  const awayTeam = awayComp.team || {};

  const homeScore = Number(homeComp.score ?? 0);
  const awayScore = Number(awayComp.score ?? 0);

  const status = event.status || {};
  const statusType = status.type || {};

  const state = statusType.state || "pre"; // "pre", "in", "post"
  const period = status.period ?? 0;
  const displayClock = status.displayClock || "0:00";
  const secondsRemainingQuarter = parseDisplayClock(displayClock);

  return {
    rawId: event.id,
    matchup: event.shortName || event.name || "",
    state,
    statusText: statusType.shortDetail || statusType.detail || "",
    period,
    displayClock,
    secondsRemainingQuarter,
    home: {
      name: homeTeam.shortDisplayName || homeTeam.name || "",
      abbr: homeTeam.abbreviation || "",
      score: homeScore,
    },
    away: {
      name: awayTeam.shortDisplayName || awayTeam.name || "",
      abbr: awayTeam.abbreviation || "",
      score: awayScore,
    },
  };
}

export async function GET() {
  try {
    const espnUrl =
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

    const res = await fetch(espnUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("Error al llamar a ESPN:", res.status, await res.text());
      return new Response(
        JSON.stringify({
          ok: false,
          error: "No se pudo obtener el scoreboard de ESPN",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const json = await res.json();
    const events = Array.isArray(json.events) ? json.events : [];

    const mapped = events.map(mapEspnEvent).filter(Boolean);

    const liveGames = mapped.filter((g) => g.state === "in");
    const preGames = mapped.filter((g) => g.state === "pre");
    const finishedGames = mapped.filter((g) => g.state === "post");

    return new Response(
      JSON.stringify(
        {
          ok: true,
          source: "espn",
          timestamp: new Date().toISOString(),
          counts: {
            total: mapped.length,
            live: liveGames.length,
            pre: preGames.length,
            post: finishedGames.length,
          },
          games: mapped,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en /api/espn/scoreboard:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Error interno al leer ESPN",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

