const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class FloodApi {
  async getCurrentPrediction() {
    const response = await fetch(`${BACKEND_URL}/api/predict/now`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }

  async getForecast7Day() {
    const response = await fetch(`${BACKEND_URL}/api/forecast/7day`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }

  async getGisZones() {
    const response = await fetch(`${BACKEND_URL}/api/gis/zones`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }

  async getHourPrediction(offset) {
    const response = await fetch(`${BACKEND_URL}/api/predict/hour/${offset}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }

  async getShapFeatures() {
    const response = await fetch(`${BACKEND_URL}/api/shap/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequence: [] })
    });
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }

  async getTemporalShap() {
    const response = await fetch(`${BACKEND_URL}/api/shap/temporal`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
}

export default new FloodApi();