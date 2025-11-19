// utils/accel.js
export function rollingMean(arr, window = 3) {
  if (!arr || arr.length === 0) return [];
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1);
    res.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return res;
}

export function ewma(arr, alpha = 0.3) {
  if (!arr || arr.length === 0) return [];
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    const prev = out[out.length - 1];
    out.push(alpha * arr[i] + (1 - alpha) * prev);
  }
  return out;
}

export function computeAcceleration(series) {
  if (!series || series.length < 3) return [];
  const accel = [];
  for (let i = 2; i < series.length; i++) {
    const a = series[i] - series[i - 1];
    const b = series[i - 1] - series[i - 2];
    accel.push(a - b);
  }
  return [null, null, ...accel];
}

export function detectInflectionPoints(series, sensitivity = 0) {
  const accel = computeAcceleration(series);
  const inflections = [];
  for (let i = 1; i < accel.length; i++) {
    const prev = accel[i - 1];
    const curr = accel[i];
    if (prev == null || curr == null) continue;
    if (Math.sign(prev) !== Math.sign(curr) && Math.abs(curr) > sensitivity) {
      inflections.push({ index: i, value: series[i], accel: curr, direction: curr > 0 ? "up" : "down" });
    }
  }
  return inflections;
}

export function analyzeTrend(data, { window = 3, alpha = 0.25 } = {}) {
  if (!Array.isArray(data)) data = Array.from(data || []);
  const smoothed = ewma(rollingMean(data, window), alpha);
  const accel = computeAcceleration(smoothed);
  const inflections = detectInflectionPoints(smoothed);
  const trend = smoothed.map((v, i) => ({ index: i, value: v, accel: accel[i] ?? null, inflection: inflections.find(p => p.index === i) || null }));
  return { smooth: smoothed, accel, inflections, trend };
}

