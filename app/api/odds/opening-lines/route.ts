// app/api/odds/opening-lines/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message:
        "Endpoint /api/odds/opening-lines todavía no se usa. La lógica de momentum se está manejando por ahora vía /api/games-window.",
    },
    { status: 200 }
  );
}

