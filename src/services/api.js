// Auto-detect: local dev always hits localhost backend; production uses the env URL
const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BACKEND_URL = isLocal
  ? 'http://localhost:5000'
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

export async function getCurrentPrediction() {
  const res = await fetch(`${BACKEND_URL}/api/predict/now`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getPredictionForDate(date) {
  const res = await fetch(`${BACKEND_URL}/api/predict/date/${date}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getForecast7Day() {
  const res = await fetch(`${BACKEND_URL}/api/forecast/7day`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getGisZones() {
  const res = await fetch(`${BACKEND_URL}/api/gis/zones`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getHourPrediction(offset) {
  const res = await fetch(`${BACKEND_URL}/api/predict/hour/${offset}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getShapFeatures() {
  const res = await fetch(`${BACKEND_URL}/api/shap/features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence: [] })
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getForecast7DayFrom(date) {
  const res = await fetch(`${BACKEND_URL}/api/forecast/7day?from=${date}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export async function getDateHours(date) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/predict/date/${date}/hours`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`getDateHours API error ${res.status}: ${errorText}`);
      throw new Error(`Failed to fetch hourly data: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error('getDateHours error:', err);
    throw err;
  }
}

export async function getTemporalShap() {
  const res = await fetch(`${BACKEND_URL}/api/shap/temporal`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}