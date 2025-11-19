// lib/patterns.js
// Calcula similitud entre el estado EN VIVO del juego y perfiles históricos básicos
// (Home/Away × Favorite/Dog). Puedes extender con más ligas y features.

function norm(x, mean = 0, std = 1) {
  const s = std === 0 ? 1 : std;
  return (x - mean) / s;
}

// Distancia euclidiana en un vector de características ya normalizadas.
function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// Convierte distancia → similitud [0..1] con decaimiento suave.
function distToSim(d) {
  // curva suave: sim = 1 / (1 + d)
  return 1 / (1 + d);
}

/**
 * Construye el vector de características live (normalizado).
 * Puedes ajustar medias/desviaciones si más adelante entrenas con datos reales.
 */
export function buildLiveFeatures({ game, market, pace }) {
  const q = Number(game?.quarter || 0);
  const sRem = Number(game?.secondsRemainingQuarter || 0);
  const margin = Number((game?.score?.home || 0) - (game?.score?.away || 0));
  const totalLive = Number(market?.totalLive ?? 0);
  const deltaTotal = Number(pace?.total?.delta ?? 0);

  // Fav/dog live a partir de spread live
  const spreadLive = Number(market?.spreadLive ?? 0); // negativo = favorito local
  const homeFav = spreadLive < 0 ? 1 : 0;

  // Normalizaciones (heurísticas base – ajusta cuando tengas estadística real):
  const features = [
    norm(q, 2.5, 1),                   // etapa del partido
    norm(sRem, 360, 180),              // tiempo restante en cuarto
    norm(margin, 0, 12),               // margen marcador
    norm(totalLive, 225, 12),          // OU live típico NBA
    norm(deltaTotal, 0, 20),           // desviación vs esperado
    homeFav,                           // indicador favorito local
  ];

  return { features, flags: { homeFav }};
}

/**
 * Perfiles base (puedes calibrarlos con tus propios promedios históricos).
 * Para cada perfil construimos un vector "target".
 */
export function getBaseProfiles() {
  // targetFeatures: [q, sRem, margin, totalLive, deltaTotal, homeFav]
  // Usamos puntos medios razonables por patrón; ajusta con tus datos.
  return [
    {
      key: "HOME_FAV",
      label: "Local Favorito",
      vector: [norm(2, 2.5, 1), norm(420, 360, 180), norm(+4, 0, 12), norm(226, 225, 12), norm(+5, 0, 20), 1],
    },
    {
      key: "HOME_DOG",
      label: "Local No Favorito",
      vector: [norm(2, 2.5, 1), norm(420, 360, 180), norm(-2, 0, 12), norm(222, 225, 12), norm(-3, 0, 20), 0],
    },
    {
      key: "AWAY_FAV",
      label: "Visitante Favorito",
      vector: [norm(2, 2.5, 1), norm(420, 360, 180), norm(+3, 0, 12), norm(224, 225, 12), norm(+2, 0, 20), 0],
    },
    {
      key: "AWAY_DOG",
      label: "Visitante No Favorito",
      vector: [norm(2, 2.5, 1), norm(420, 360, 180), norm(-3, 0, 12), norm(223, 225, 12), norm(-2, 0, 20), 0],
    },
  ];
}

/**
 * Devuelve top matches por similitud con explicación breve.
 */
export function matchProfiles({ game, market, pace }) {
  const { features } = buildLiveFeatures({ game, market, pace });
  const base = getBaseProfiles();

  const scored = base.map(p => {
    const d = euclidean(features, p.vector);
    const sim = distToSim(d); // 0..1
    return { key: p.key, label: p.label, similarity: Number(sim.toFixed(3)) };
  });

  // ordena por similitud desc
  scored.sort((a, b) => b.similarity - a.similarity);

  const top3 = scored.slice(0, 3);

  let alertText = "";
  const best = top3[0];
  if (best) {
    if (best.key === "HOME_FAV") alertText = "Juego con dinámica típica de local favorito (posible presión hacia OVER si el delta es positivo).";
    else if (best.key === "HOME_DOG") alertText = "Local perro: suele ir a ritmos más erráticos; cuidado con swings y UNDER situacional.";
    else if (best.key === "AWAY_FAV") alertText = "Visitante favorito controlando ritmo; busca value en spreads cortos o ML si hay edge.";
    else if (best.key === "AWAY_DOG") alertText = "Visitante perro con empuje: evalúa live spreads a su favor y UNDER si el ritmo cae.";
  }

  return { top: top3, alertText };
}

