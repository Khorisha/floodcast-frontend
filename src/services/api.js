const BACKEND_URL = 'http://127.0.0.1:5000';

export async function getCurrentPrediction() {
  const res = await fetch(`${BACKEND_URL}/api/predict/now`);
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

export async function getOSMBoundaries() {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const query = `
    [out:json];
    area["name"="Port Louis"]["admin_level"="6"]->.portlouis;
    (
      relation(area.portlouis)["admin_level"="8"];
      way(area.portlouis)["admin_level"="8"];
    );
    out geom;
  `;
  
  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('OSM fetch error:', error);
    return null;
  }
}

