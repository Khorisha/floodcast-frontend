<template>
  <div v-if="loading" class="text-center" style="padding: 80px;">Loading flood data...</div>
  <div v-else-if="error" class="text-center" style="padding: 80px; color: #c44a3a;">{{ error }}</div>
  <div v-else class="main-grid">
    
    <!-- LEFT PANEL -->
    <div class="left-panel">
      
      <div class="card">
        <div class="card-title">Current Flood Risk</div>
        <div class="text-center">
          <div class="gauge">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r="72" fill="none" stroke="#d4e0e5" stroke-width="8"/>
              <circle cx="80" cy="80" r="72" fill="none" :stroke="riskColor" stroke-width="8" 
                      :stroke-dasharray="452" :stroke-dashoffset="452 * (1 - (cityProb || 0))"
                      transform="rotate(-90 80 80)" style="transition: all 1s;"/>
            </svg>
            <div class="gauge-center">
              <div class="gauge-number">{{ Math.round((cityProb || 0) * 100) }}</div>
              <div class="gauge-label">flood probability</div>
            </div>
          </div>
          <div class="mt-3" :class="riskBgClass" style="padding: 12px; border-radius: 20px;">
            <strong>{{ riskTitle }}</strong><br>
            <span style="font-size: 13px;">{{ riskMessage }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Current Weather</div>
        <div class="weather-row">
          <span class="weather-label">Temperature</span>
          <span class="weather-value">{{ Math.round(weatherTemp) }}°C</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Humidity</span>
          <span class="weather-value">{{ weatherHumidity }}%</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Wind Speed</span>
          <span class="weather-value">{{ weatherWind }} m/s</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Pressure</span>
          <span class="weather-value">{{ weatherPressure }} hPa</span>
        </div>
        <div class="weather-row">
          <span class="weather-label">Rainfall (1h)</span>
          <span class="weather-value">{{ weatherRain }} mm</span>
        </div>
      </div>

      <ShapPreview @openModal="openShapModal" />
    </div>

    <!-- RIGHT PANEL -->
    <div class="right-panel">
      
      <HourlyCarousel :currentProbability="cityProb" />

      <div class="card">
        <div class="card-title">Flood Risk by Zone</div>
        <div class="zone-grid">
          <div v-for="zone in zones" :key="zone.name" class="zone-tile" @click="centerMapOnZone(zone)">
            <div class="zone-name">{{ zone.name }}</div>
            <div class="zone-risk-badge" :style="{ background: getZoneRiskBg(zone.risk), color: getZoneRiskText(zone.risk) }">
              {{ getRiskLabelShort(zone.risk) }}
            </div>
          </div>
        </div>
      </div>

      <MapContainer ref="mapContainerRef" />

      <div class="card full-width">
        <div class="card-title">7-Day Flood Outlook</div>
        <div class="forecast-row">
          <div v-for="day in forecastDays" :key="day.date" class="forecast-item">
            <div class="forecast-day">{{ day.dayName }}</div>
            <div class="forecast-risk" :style="{ color: getRiskColor(day.max_risk_score) }">
              {{ getRiskLabelShort(day.max_risk_score) }}
            </div>
            <div class="forecast-bar">
              <div class="forecast-bar-fill" :style="{ width: (day.max_risk_score * 100) + '%', background: getRiskColor(day.max_risk_score) }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ShapModal v-if="showShapModal" @close="closeShapModal" :currentWeather="prediction?.current_weather" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getCurrentPrediction, getForecast7Day } from '../services/api';
import ShapModal from './ShapModal.vue';
import ShapPreview from './ShapPreview.vue';
import HourlyCarousel from './HourlyCarousel.vue';
import MapContainer from './MapContainer.vue';

const prediction = ref(null);
const forecastData = ref(null);
const loading = ref(true);
const error = ref(null);
const showShapModal = ref(false);
const mapContainerRef = ref(null);

const zones = ref([
  { name: 'Vallee des Pretres', risk: 4.274, lat: -20.1750, lng: 57.5070 },
  { name: 'La Cure', risk: 4.048, lat: -20.1820, lng: 57.5100 },
  { name: 'Bell Village', risk: 4.083, lat: -20.1700, lng: 57.5050 },
  { name: 'Plaine Verte', risk: 3.956, lat: -20.1610, lng: 57.5020 },
  { name: 'Roche Bois', risk: 3.966, lat: -20.1480, lng: 57.5100 },
  { name: 'Port Louis CBD', risk: 3.874, lat: -20.1620, lng: 57.4990 },
  { name: 'Vallee Pitot', risk: 3.850, lat: -20.1650, lng: 57.4980 },
  { name: 'Champ de Mars', risk: 3.581, lat: -20.1550, lng: 57.5030 },
  { name: 'Canal Dayot', risk: 3.068, lat: -20.1580, lng: 57.4960 }
]);

const cityProb = computed(() => prediction.value?.city_prediction?.calibrated_probability || 0);
const weatherTemp = computed(() => prediction.value?.current_weather?.temp || 25);
const weatherHumidity = computed(() => prediction.value?.current_weather?.humidity || 70);
const weatherWind = computed(() => prediction.value?.current_weather?.wind_speed || 5);
const weatherPressure = computed(() => prediction.value?.current_weather?.pressure || 1013);
const weatherRain = computed(() => prediction.value?.current_weather?.rain_1h || 0);

const riskColor = computed(() => {
  const p = cityProb.value;
  if (p >= 0.05) return '#2c7a8a';
  if (p >= 0.02) return '#5a9a8a';
  return '#b0c8d0';
});

const riskBgClass = computed(() => {
  const p = cityProb.value;
  if (p >= 0.05) return 'bg-risk-high';
  if (p >= 0.02) return 'bg-risk-medium';
  return 'bg-risk-low';
});

const riskTitle = computed(() => {
  const p = cityProb.value;
  if (p >= 0.05) return 'FLOOD WARNING';
  if (p >= 0.02) return 'FLOOD WATCH';
  return 'NORMAL';
});

const riskMessage = computed(() => {
  const p = cityProb.value;
  if (p >= 0.05) return 'Flooding expected. Take action now.';
  if (p >= 0.02) return 'Conditions being monitored.';
  return 'No flood risk detected.';
});

const forecastDays = computed(() => {
  if (!forecastData.value?.forecast) return [];
  return forecastData.value.forecast.slice(0, 7).map(day => {
    const date = new Date(day.date);
    return {
      date: day.date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      max_risk_score: day.max_risk_score || 0.02,
    };
  });
});

function openShapModal() {
  showShapModal.value = true;
}

function closeShapModal() {
  showShapModal.value = false;
}

function getRiskColor(prob) {
  if (prob >= 0.05) return '#2c7a8a';
  if (prob >= 0.02) return '#5a9a8a';
  return '#b0c8d0';
}

function getRiskLabelShort(risk) {
  if (risk >= 4.0) return 'High';
  if (risk >= 3.7) return 'Medium';
  return 'Low';
}

function getZoneRiskBg(risk) {
  if (risk >= 4.0) return '#2c7a8a20';
  if (risk >= 3.7) return '#5a9a8a20';
  return '#8abaaa20';
}

function getZoneRiskText(risk) {
  if (risk >= 4.0) return '#2c7a8a';
  if (risk >= 3.7) return '#5a9a8a';
  return '#8abaaa';
}

function centerMapOnZone(zone) {
  if (mapContainerRef.value && mapContainerRef.value.centerOnZone) {
    mapContainerRef.value.centerOnZone(zone);
  }
}

onMounted(async () => {
  try {
    const [pred, forecast] = await Promise.all([
      getCurrentPrediction(),
      getForecast7Day()
    ]);
    
    prediction.value = pred;
    forecastData.value = forecast;
    loading.value = false;
    
  } catch (err) {
    console.error(err);
    error.value = 'Cannot connect to prediction service. Make sure backend is running on port 5000.';
    loading.value = false;
  }
});
</script>