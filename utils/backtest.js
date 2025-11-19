// utils/backtest.js
// Script de backtest para calibrar el parámetro k
// Ejecutar con: npm run backtest  (definido en package.json)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadHistory() {
  const filePath = path.join(__dirname, "..", "data_history", "lines_history.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return data;
}

/**
 * Dado un valor de k y una lista de juegos,
 * calcula MAE y MSE de la predicción:
 *
 *   pred = lineOpen + k * (lineClose - lineOpen)
 *
 * comparada contra el total real (finalTotal).
 */
function runBacktestForK(k, games) {
  let absErrorSum = 0;
  let squaredErrorSum = 0;
  const n = games.length;

  for (const g of games) {
    const predicted = g.lineOpen + k * (g.lineClose - g.lineOpen);
    const error = predicted - g.finalTotal;

    absErrorSum += Math.abs(error);
    squaredErrorSum += error * error;
  }

  const mae = absErrorSum / n;
  const mse = squaredErrorSum / n;

  return {
    k: Number(k.toFixed(2)),
    MAE: Number(mae.toFixed(3)),
    MSE: Number(mse.toFixed(3)),
  };
}

function main() {
  console.log("📂 Cargando histórico desde data_history/lines_history.json...\n");

  const games = loadHistory();

  if (!games || games.length === 0) {
    console.error("❌ No se encontraron juegos en el histórico.");
    process.exit(1);
  }

  console.log(`Se cargaron ${games.length} partidos.\n`);

  // Lista de valores de k a probar
  const kValues = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  const results = kValues.map((k) => runBacktestForK(k, games));

  console.log("📊 RESULTADOS DEL BACKTEST");
  console.table(results);

  // Encontrar el mejor k según MAE (podrías cambiar a MSE si lo prefieres)
  let best = results[0];
  for (const r of results) {
    if (r.MAE < best.MAE) {
      best = r;
    }
  }

  console.log("\n✅ Mejor k según MAE:");
  console.log(`k = ${best.k}  |  MAE = ${best.MAE}  |  MSE = ${best.MSE}`);
}

main();

