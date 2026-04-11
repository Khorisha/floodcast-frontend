<template>
  <div class="card" style="cursor: pointer;" @click="emit('openModal')">
    <div class="card-header">
      <div class="card-title">Why This Prediction?</div>
      <div class="card-subtitle">How weather factors affect flood risk</div>
    </div>
    
    <div v-if="loading" class="loading-placeholder">
      Loading analysis...
    </div>
    
    <div v-else-if="error" class="error-placeholder">
      Unable to load analysis
    </div>
    
    <div v-else class="factors-list">
      <div class="factor-item">
        <div class="factor-header">
          <span class="factor-name">Rainfall intensity</span>
          <span class="factor-value" :style="{ color: getRainImpactColor() }">{{ getRainImpact() }}%</span>
        </div>
        <div class="factor-bar-container">
          <div class="factor-bar" :style="{ width: Math.abs(getRainImpactValue()) + '%', background: getRainImpactColor() }"></div>
        </div>
        <div class="factor-desc">{{ getRainDescription() }}</div>
      </div>
      
      <div class="factor-item">
        <div class="factor-header">
          <span class="factor-name">Rainfall accumulation</span>
          <span class="factor-value" :style="{ color: getAccumulationImpactColor() }">{{ getAccumulationImpact() }}%</span>
        </div>
        <div class="factor-bar-container">
          <div class="factor-bar" :style="{ width: Math.abs(getAccumulationImpactValue()) + '%', background: getAccumulationImpactColor() }"></div>
        </div>
        <div class="factor-desc">{{ getAccumulationDescription() }}</div>
      </div>
      
      <div class="factor-item">
        <div class="factor-header">
          <span class="factor-name">Soil moisture</span>
          <span class="factor-value" :style="{ color: getSoilImpactColor() }">{{ getSoilImpact() }}%</span>
        </div>
        <div class="factor-bar-container">
          <div class="factor-bar" :style="{ width: Math.abs(getSoilImpactValue()) + '%', background: getSoilImpactColor() }"></div>
        </div>
        <div class="factor-desc">{{ getSoilDescription() }}</div>
      </div>
      
      <div class="factor-item">
        <div class="factor-header">
          <span class="factor-name">Humidity level</span>
          <span class="factor-value" :style="{ color: getHumidityImpactColor() }">{{ getHumidityImpact() }}%</span>
        </div>
        <div class="factor-bar-container">
          <div class="factor-bar" :style="{ width: Math.abs(getHumidityImpactValue()) + '%', background: getHumidityImpactColor() }"></div>
        </div>
        <div class="factor-desc">{{ getHumidityDescription() }}</div>
      </div>
      
      <div class="factor-item">
        <div class="factor-header">
          <span class="factor-name">Temperature effect</span>
          <span class="factor-value" :style="{ color: getTempImpactColor() }">{{ getTempImpact() }}%</span>
        </div>
        <div class="factor-bar-container">
          <div class="factor-bar" :style="{ width: Math.abs(getTempImpactValue()) + '%', background: getTempImpactColor() }"></div>
        </div>
        <div class="factor-desc">{{ getTempDescription() }}</div>
      </div>
    </div>
    
    <div class="text-small text-center mt-3" style="color: #7a9aaa;">
      Tap to see detailed analysis
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCurrentPrediction } from '../services/api';

const emit = defineEmits(['openModal']);
const loading = ref(true);
const error = ref(false);
const weatherData = ref(null);

const rain = ref(0);
const humidity = ref(0);
const temp = ref(0);

function getRainImpact() {
  const r = rain.value;
  if (r > 5) return '+65';
  if (r > 2) return '+42';
  if (r > 0) return '+25';
  return '+10';
}

function getRainImpactValue() {
  const r = rain.value;
  if (r > 5) return 65;
  if (r > 2) return 42;
  if (r > 0) return 25;
  return 10;
}

function getRainImpactColor() {
  const r = rain.value;
  if (r > 2) return '#2c7a8a';
  return '#5a9a8a';
}

function getRainDescription() {
  const r = rain.value;
  if (r > 5) return `Heavy rainfall (${r.toFixed(1)}mm/hr) significantly increases flood risk.`;
  if (r > 2) return `Moderate rainfall (${r.toFixed(1)}mm/hr) is increasing flood risk.`;
  if (r > 0) return `Light rainfall (${r.toFixed(1)}mm/hr) has minimal impact.`;
  return `No rainfall detected. Dry conditions.`;
}

function getAccumulationImpact() {
  const h = humidity.value;
  if (h > 85) return '+55';
  if (h > 70) return '+35';
  return '+15';
}

function getAccumulationImpactValue() {
  const h = humidity.value;
  if (h > 85) return 55;
  if (h > 70) return 35;
  return 15;
}

function getAccumulationImpactColor() {
  const h = humidity.value;
  if (h > 80) return '#2c7a8a';
  return '#5a9a8a';
}

function getAccumulationDescription() {
  const h = humidity.value;
  if (h > 85) return `Very humid (${h}%) conditions indicate moisture-loaded atmosphere.`;
  if (h > 70) return `Humid (${h}%) conditions support continued rainfall.`;
  return `Normal humidity (${h}%) levels.`;
}

function getSoilImpact() {
  const h = humidity.value;
  if (h > 80) return '+45';
  if (h > 65) return '+30';
  return '+20';
}

function getSoilImpactValue() {
  const h = humidity.value;
  if (h > 80) return 45;
  if (h > 65) return 30;
  return 20;
}

function getSoilImpactColor() {
  const h = humidity.value;
  if (h > 80) return '#2c7a8a';
  return '#5a9a8a';
}

function getSoilDescription() {
  const h = humidity.value;
  if (h > 80) return `Soil is near saturation. Water cannot be absorbed quickly.`;
  if (h > 65) return `Soil moisture is elevated. Reduced absorption capacity.`;
  return `Soil has good absorption capacity.`;
}

function getHumidityImpact() {
  const h = humidity.value;
  if (h > 85) return '+35';
  if (h > 70) return '+20';
  return '+10';
}

function getHumidityImpactValue() {
  const h = humidity.value;
  if (h > 85) return 35;
  if (h > 70) return 20;
  return 10;
}

function getHumidityImpactColor() {
  const h = humidity.value;
  if (h > 80) return '#2c7a8a';
  return '#5a9a8a';
}

function getHumidityDescription() {
  const h = humidity.value;
  if (h > 85) return `High humidity (${h}%) increases flood potential.`;
  if (h > 70) return `Elevated humidity (${h}%) supports rainfall development.`;
  return `Normal humidity (${h}%) levels.`;
}

function getTempImpact() {
  const t = temp.value;
  if (t > 30) return '+25';
  if (t > 25) return '+15';
  return '+5';
}

function getTempImpactValue() {
  const t = temp.value;
  if (t > 30) return 25;
  if (t > 25) return 15;
  return 5;
}

function getTempImpactColor() {
  const t = temp.value;
  if (t > 30) return '#2c7a8a';
  return '#5a9a8a';
}

function getTempDescription() {
  const t = temp.value;
  if (t > 30) return `High temperature (${t}°C) increases evaporation and storm potential.`;
  if (t > 25) return `Warm temperature (${t}°C) supports convective activity.`;
  return `Moderate temperature (${t}°C) conditions.`;
}

onMounted(async () => {
  try {
    const data = await getCurrentPrediction();
    weatherData.value = data;
    rain.value = data.current_weather?.rain_1h || 0;
    humidity.value = data.current_weather?.humidity || 70;
    temp.value = data.current_weather?.temp || 25;
    loading.value = false;
  } catch (err) {
    console.error('Weather fetch error:', err);
    error.value = true;
    loading.value = false;
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

.factors-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.factor-item {
  width: 100%;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.factor-name {
  font-weight: 500;
  color: #1a3a4a;
}

.factor-value {
  font-weight: 600;
}

.factor-bar-container {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.factor-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.factor-desc {
  font-size: 10px;
  color: #7a9aaa;
  margin-top: 4px;
  line-height: 1.4;
}

.text-small {
  font-size: 11px;
}

.text-center {
  text-align: center;
}

.mt-3 {
  margin-top: 16px;
}

.loading-placeholder, .error-placeholder {
  padding: 30px;
  text-align: center;
  color: #7a9aaa;
  font-size: 13px;
}
</style>