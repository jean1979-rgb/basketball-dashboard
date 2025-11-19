export default function DashboardPage() {
  const teams = [
    { code: "ATL", name: "Atlanta Hawks", points: 102, rebounds: 45, assists: 25, color: "bg-red-600" },
    { code: "BOS", name: "Boston Celtics", points: 98, rebounds: 42, assists: 28, color: "bg-green-700" },
    { code: "BKN", name: "Brooklyn Nets", points: 105, rebounds: 43, assists: 26, color: "bg-gray-700" },
    { code: "CHA", name: "Charlotte Hornets", points: 97, rebounds: 40, assists: 22, color: "bg-purple-500" },
    { code: "CHI", name: "Chicago Bulls", points: 99, rebounds: 41, assists: 23, color: "bg-red-800" },
    { code: "CLE", name: "Cleveland Cavaliers", points: 101, rebounds: 44, assists: 24, color: "bg-red-500" },
    { code: "DAL", name: "Dallas Mavericks", points: 103, rebounds: 42, assists: 27, color: "bg-blue-700" },
    { code: "DEN", name: "Denver Nuggets", points: 106, rebounds: 46, assists: 29, color: "bg-yellow-600" },
    { code: "DET", name: "Detroit Pistons", points: 95, rebounds: 39, assists: 21, color: "bg-blue-600" },
    { code: "GSW", name: "Golden State Warriors", points: 110, rebounds: 44, assists: 30, color: "bg-yellow-400" },
    { code: "HOU", name: "Houston Rockets", points: 100, rebounds: 41, assists: 25, color: "bg-red-600" },
    { code: "IND", name: "Indiana Pacers", points: 102, rebounds: 43, assists: 26, color: "bg-yellow-500" },
    { code: "LAC", name: "Los Angeles Clippers", points: 98, rebounds: 40, assists: 22, color: "bg-blue-600" },
    { code: "LAL", name: "Los Angeles Lakers", points: 104, rebounds: 45, assists: 28, color: "bg-purple-700" },
    { code: "MEM", name: "Memphis Grizzlies", points: 101, rebounds: 42, assists: 25, color: "bg-blue-500" },
    { code: "MIA", name: "Miami Heat", points: 103, rebounds: 44, assists: 27, color: "bg-red-500" },
    { code: "MIL", name: "Milwaukee Bucks", points: 107, rebounds: 46, assists: 29, color: "bg-green-600" },
    { code: "MIN", name: "Minnesota Timberwolves", points: 99, rebounds: 40, assists: 23, color: "bg-blue-700" },
    { code: "NOP", name: "New Orleans Pelicans", points: 100, rebounds: 41, assists: 24, color: "bg-blue-400" },
    { code: "NYK", name: "New York Knicks", points: 98, rebounds: 39, assists: 21, color: "bg-orange-600" },
    { code: "OKC", name: "Oklahoma City Thunder", points: 97, rebounds: 38, assists: 22, color: "bg-blue-500" },
    { code: "ORL", name: "Orlando Magic", points: 96, rebounds: 40, assists: 23, color: "bg-blue-400" },
    { code: "PHI", name: "Philadelphia 76ers", points: 108, rebounds: 45, assists: 28, color: "bg-blue-700" },
    { code: "PHX", name: "Phoenix Suns", points: 105, rebounds: 43, assists: 26, color: "bg-orange-500" },
    { code: "POR", name: "Portland Trail Blazers", points: 102, rebounds: 41, assists: 25, color: "bg-red-600" },
    { code: "SAC", name: "Sacramento Kings", points: 99, rebounds: 40, assists: 23, color: "bg-purple-600" },
    { code: "SAS", name: "San Antonio Spurs", points: 101, rebounds: 42, assists: 24, color: "bg-gray-600" },
    { code: "TOR", name: "Toronto Raptors", points: 100, rebounds: 41, assists: 25, color: "bg-red-500" },
    { code: "UTA", name: "Utah Jazz", points: 103, rebounds: 44, assists: 27, color: "bg-green-500" },
    { code: "WAS", name: "Washington Wizards", points: 97, rebounds: 39, assists: 22, color: "bg-red-700" }
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">NBA Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.code}
            className={`${team.color} text-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-4 hover:scale-105 transition-transform`}
          >
            <div className="text-4xl font-bold">{team.code}</div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p>Puntos: {team.points}</p>
              <p>Rebotes: {team.rebounds}</p>
              <p>Asistencias: {team.assists}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
