import GameSummaryCard from '../components/GameSummaryCard';

export default function TestGamePage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">
        Test resumen de juego (API-Basketball)
      </h1>

      <GameSummaryCard date="2024-10-25" gameId="413890" />
    </div>
  );
}

