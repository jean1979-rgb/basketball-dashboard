import { NextResponse } from "next/server";
import { fetchNbaOdds } from "../../../lib/oddsApi";

export async function GET() {
  try {
    const odds = await fetchNbaOdds();

    return NextResponse.json(
      {
        success: true,
        count: Array.isArray(odds) ? odds.length : 0,
        data: odds,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al obtener odds:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

