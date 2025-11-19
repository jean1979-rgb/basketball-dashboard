// app/odds/page.tsx

type OddsApiResponse = {
  success: boolean;
  count: number;
  data: any[];
};

async function getOdds(): Promise<OddsApiResponse> {
  // Llamamos a nuestra propia API interna
  const res = await fetch("http://localhost:3000/api/odds", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las odds");
  }

  return res.json();
}

export default async function OddsPage() {
  const { success, count, data } = await getOdds();

  if (!success) {
    return (
      <main className="p-4">
        <h1 className="text-xl font-bold mb-4">Odds NBA</h1>
        <p>No se pudieron cargar las cuotas.</p>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Odds NBA (The Odds API)</h1>
      <p className="text-sm text-gray-400">
        Juegos encontrados: {count}
      </p>

      <div className="space-y-4">
        {data.map((game: any) => (
          <div
            key={game.id}
            className="border border-gray-700 rounded-lg p-3 space-y-2"
          >
            <div className="font-semibold">
              {game.away_team} @ {game.home_team}
            </div>
            <div className="text-xs text-gray-400">
              Commence time: {game.commence_time}
            </div>

            <div className="space-y-1">
              <div className="font-semibold text-sm">Bookmakers:</div>
              {game.bookmakers?.map((book: any) => (
                <div
                  key={book.key}
                  className="border border-gray-600 rounded-md p-2 mb-1"
                >
                  <div className="text-sm font-medium">
                    {book.title || book.key}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mt-1">
                    {book.markets?.map((market: any) => (
                      <div
                        key={market.key}
                        className="border border-gray-700 rounded p-1"
                      >
                        <div className="font-semibold mb-1">
                          {market.key.toUpperCase()}
                        </div>
                        {market.outcomes?.map((o: any, idx: number) => (
                          <div key={idx}>
                            {o.name}: {o.point ?? "—"} | cuota {o.price}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

