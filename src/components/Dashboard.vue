<template>
  <div>
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

        <div class="card">
          <div class="card-header">
            <div class="card-title">Why This Prediction?</div>
            <div class="card-subtitle">How weather factors affect flood risk</div>
          </div>
          <ShapPreview @openModal="openShapModal" />
        </div>

        <!-- Date Selector Container -->
        <div class="date-selector-container">
          <DateSelector v-model="selectedDate" @date-change="onDateChange" />
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div class="right-panel">
        
        <HourlyCarousel :currentProbability="cityProb" />

        <!-- Map moved here - below Hourly Carousel -->
        <MapContainer ref="mapContainerRef" :cityProb="cityProb" />

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

        <Forecast7Day />
      </div>

      <ShapModal v-if="showShapModal" @close="closeShapModal" :currentWeather="prediction?.current_weather" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getCurrentPrediction, getPredictionForDate } from '../services/api';
import DateSelector from './DateSelector.vue';
import ShapModal from './ShapModal.vue';
import ShapPreview from './ShapPreview.vue';
import HourlyCarousel from './HourlyCarousel.vue';
import MapContainer from './MapContainer.vue';
import Forecast7Day from './Forecast7Day.vue';

const prediction = ref(null);
const loading = ref(true);
const error = ref(null);
const showShapModal = ref(false);
const mapContainerRef = ref(null);
const selectedDate = ref(new Date().toISOString().split('T')[0]);

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

function openShapModal() {
  showShapModal.value = true;
}

function closeShapModal() {
  showShapModal.value = false;
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
    mapContainerRef.value.centerOnZone(zone.name);
  }
}

async function onDateChange(date) {
  loading.value = true;
  error.value = null;
  try {
    const pred = await getPredictionForDate(date);
    prediction.value = pred;
    loading.value = false;
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load data for selected date';
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const pred = await getCurrentPrediction();
    prediction.value = pred;
    loading.value = false;
  } catch (err) {
    console.error(err);
    error.value = 'Cannot connect to prediction service. Make sure backend is running on port 5000.';
    loading.value = false;
  }
});
</script>

<style scoped>
.main-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

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
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 11px;
  color: #7a9aaa;
}

.date-selector-container {
  margin-top: 8px;
}

.gauge {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  position: relative;
}

.gauge-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.gauge-number {
  font-size: 36px;
  font-weight: 700;
  color: #1a3a4a;
}

.gauge-label {
  font-size: 11px;
  color: #7a9aaa;
}

.weather-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.weather-label {
  font-size: 12px;
  color: #7a9aaa;
}

.weather-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a3a4a;
}

.zone-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.zone-tile {
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  border: 1px solid #e2e8f0;
}

.zone-tile:hover {
  background: #f0f6f2;
}

.zone-name {
  font-size: 12px;
  font-weight: 500;
  color: #1a3a4a;
}

.zone-risk-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  margin-top: 6px;
}

.mt-3 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}

.bg-risk-high {
  background: #2c7a8a20;
  color: #2c7a8a;
}

.bg-risk-medium {
  background: #5a9a8a20;
  color: #5a9a8a;
}

.bg-risk-low {
  background: #8abaaa20;
  color: #8abaaa;
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
</style>