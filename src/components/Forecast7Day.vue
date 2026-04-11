<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">7-Day Forecast</div>
      <div class="card-subtitle">Expected rainfall and flood risk</div>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
      <div v-for="day in forecastDays" :key="day.date" class="forecast-day">
        <div style="font-weight: 600;">{{ day.dayName }}</div>
        <div class="text-small" style="margin-bottom: 8px;">{{ day.dateShort }}</div>
        <div style="font-size: 20px; font-weight: 600; margin: 8px 0;">{{ Math.round(day.total_rainfall) }}mm</div>
        <div class="prob-bar">
          <div class="prob-fill" :style="{ width: (day.max_risk_score * 100) + '%', background: getRiskColor(day.max_risk_score) }"></div>
        </div>
        <div class="text-small mt-2">{{ getRiskLabel(day.max_risk_score) }}</div>
      </div>
    </div>
    
    <div class="flex-between mt-3" style="padding-top: 16px; border-top: 1px solid #e8e0d5;">
      <div>
        <div class="text-small">Highest risk day</div>
        <div style="font-weight: 600;">{{ peakRiskDay?.dayName || 'None' }}</div>
      </div>
      <div>
        <div class="text-small">Total weekly rainfall</div>
        <div style="font-weight: 600;">{{ totalWeeklyRain }} mm</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getForecast7Day } from '../services/api';

const forecastData = ref(null);

const forecastDays = computed(() => {
  if (!forecastData.value?.forecast) return [];
  return forecastData.value.forecast.slice(0, 7).map(day => {
    const date = new Date(day.date);
    return {
      date: day.date,
      dateShort: `${date.getMonth()+1}/${date.getDate()}`,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      total_rainfall: day.total_rainfall,
      max_risk_score: day.max_risk_score,
    };
  });
});

const peakRiskDay = computed(() => {
  if (!forecastDays.value.length) return null;
  return forecastDays.value.reduce((max, d) => d.max_risk_score > max.max_risk_score ? d : max, forecastDays.value[0]);
});

const totalWeeklyRain = computed(() => {
  if (!forecastDays.value.length) return 0;
  return forecastDays.value.reduce((sum, d) => sum + d.total_rainfall, 0).toFixed(1);
});

function getRiskColor(risk) {
  if (risk >= 0.05) return '#bc6c25';
  if (risk >= 0.02) return '#d4a373';
  if (risk >= 0.01) return '#c4a27a';
  return '#8db0b0';
}

function getRiskLabel(risk) {
  if (risk >= 0.05) return 'High';
  if (risk >= 0.02) return 'Medium';
  if (risk >= 0.01) return 'Low';
  return 'Minimal';
}

onMounted(async () => {
  forecastData.value = await getForecast7Day();
});
</script>