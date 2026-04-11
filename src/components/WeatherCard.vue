<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">Current Conditions</div>
      <div class="card-subtitle">Port Louis</div>
    </div>
    
    <div class="flex" style="align-items: baseline; margin-bottom: 16px;">
      <span style="font-size: 48px; font-weight: 600;">{{ Math.round(temp) }}°</span>
      <span style="color: #7f8c8d;">Celsius</span>
    </div>
    
    <div class="weather-grid">
      <div class="weather-item">
        <span class="text-small">Humidity</span>
        <span style="font-weight: 500;">{{ humidity }}%</span>
      </div>
      <div class="weather-item">
        <span class="text-small">Wind Speed</span>
        <span style="font-weight: 500;">{{ windSpeed }} m/s</span>
      </div>
      <div class="weather-item">
        <span class="text-small">Pressure</span>
        <span style="font-weight: 500;">{{ pressure }} hPa</span>
      </div>
      <div class="weather-item">
        <span class="text-small">Rain (1h)</span>
        <span style="font-weight: 500;">{{ rain }} mm</span>
      </div>
    </div>
    
    <div class="text-small" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e8e0d5;">
      Updated: {{ time }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['weather']);

const temp = computed(() => props.weather?.temp || 25);
const humidity = computed(() => props.weather?.humidity || 70);
const windSpeed = computed(() => props.weather?.wind_speed || 5);
const pressure = computed(() => props.weather?.pressure || 1013);
const rain = computed(() => props.weather?.rain_1h || 0);
const time = computed(() => new Date().toLocaleTimeString());
</script>