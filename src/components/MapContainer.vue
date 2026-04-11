<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">Port Louis Flood Hazard Map</div>
      <div class="card-subtitle">Actual district locations from OpenStreetMap</div>
    </div>
    
    <div class="map-wrapper">
      <div id="flood-map" style="width: 100%; height: 100%;"></div>
    </div>
    
    <div class="flex" style="justify-content: center; gap: 16px; margin-top: 12px;">
      <div class="flex"><div style="width: 12px; height: 12px; background: #2c7a8a; border-radius: 2px;"></div><span style="font-size: 11px;">High Risk (4.0+)</span></div>
      <div class="flex"><div style="width: 12px; height: 12px; background: #5a9a8a; border-radius: 2px;"></div><span style="font-size: 11px;">Medium Risk (3.7-4.0)</span></div>
      <div class="flex"><div style="width: 12px; height: 12px; background: #8abaaa; border-radius: 2px;"></div><span style="font-size: 11px;">Low Risk (below 3.7)</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const mapInstance = ref(null);
const zoneMarkers = ref([]);

function getRiskColor(risk) {
  if (risk >= 4.0) return '#2c7a8a';
  if (risk >= 3.7) return '#5a9a8a';
  return '#8abaaa';
}

function getRiskLabel(risk) {
  if (risk >= 4.0) return 'High';
  if (risk >= 3.7) return 'Medium';
  return 'Low';
}

async function getCoordinatesFromOSM(placeName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FloodCastApp/1.0' }
    });
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (error) {
    console.error(`Failed to fetch coordinates for ${placeName}:`, error);
  }
  return null;
}

onMounted(async () => {
  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');
  
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
  
  mapInstance.value = L.map('flood-map').setView([-20.1609, 57.5012], 13);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: 'OpenStreetMap & CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance.value);
  
  const districts = [
    { name: 'Vallee des Pretres', query: 'Vallee des Pretres, Port Louis, Mauritius', risk: 4.27 },
    { name: 'La Cure', query: 'La Cure, Port Louis, Mauritius', risk: 4.05 },
    { name: 'Bell Village', query: 'Bell Village, Port Louis, Mauritius', risk: 4.08 },
    { name: 'Plaine Verte', query: 'Plaine Verte, Port Louis, Mauritius', risk: 3.96 },
    { name: 'Roche Bois', query: 'Roche Bois, Port Louis, Mauritius', risk: 3.97 },
    { name: 'Port Louis CBD', query: 'Port Louis, Mauritius', risk: 3.87 },
    { name: 'Vallee Pitot', query: 'Vallee Pitot, Port Louis, Mauritius', risk: 3.85 },
    { name: 'Champ de Mars', query: 'Champ de Mars, Port Louis, Mauritius', risk: 3.58 },
    { name: 'Canal Dayot', query: 'Canal Dayot, Port Louis, Mauritius', risk: 3.07 }
  ];
  
  for (const district of districts) {
    const coords = await getCoordinatesFromOSM(district.query);
    
    if (coords) {
      const color = getRiskColor(district.risk);
      const riskLabel = getRiskLabel(district.risk);
      
      const marker = L.circleMarker([coords.lat, coords.lon], {
        radius: 12,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 3
      }).addTo(mapInstance.value);
      
      marker.bindTooltip(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong>${district.name}</strong><br>
          Risk Level: ${riskLabel}<br>
          Risk Score: ${district.risk}
        </div>
      `, { sticky: true, direction: 'top' });
      
      zoneMarkers.value.push({
        name: district.name,
        lat: coords.lat,
        lon: coords.lon,
        marker: marker,
        risk: district.risk
      });
    }
  }
});
</script>

<style scoped>
.card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.card-header {
  margin-bottom: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a4a;
}

.card-subtitle {
  font-size: 12px;
  color: #7a9aaa;
  margin-top: 2px;
}

.map-wrapper {
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.flex {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
