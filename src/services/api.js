const BACKEND_URL = 'http://localhost:5000';

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

export async function getTemporalShap() {
  const res = await fetch(`${BACKEND_URL}/api/shap/temporal`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}