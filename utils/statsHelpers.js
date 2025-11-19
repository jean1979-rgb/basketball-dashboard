// utils/statsHelpers.js

export function rollingMean(arr, window = 5) {
  if (!arr || arr.length === 0) return [];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
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

export function computeStreaks(results) {
  let current = { type: null, length: 0 };
  const streaks = [];
  for (const r of results) {
    if (r === current.type) current.length++;
    else {
      if (current.type) streaks.push({ ...current });
      current = { type: r, length: 1 };
    }
  }
  if (current.type) streaks.push(current);
  return streaks;
}

