<template>
  <div class="card">
    <div class="card-header">
      <div class="flex-between">
        <div>
          <div class="card-title">Current Flood Risk</div>
          <div class="card-subtitle">Port Louis city-wide</div>
        </div>
      </div>
    </div>
    
    <div class="text-center">
      <div class="prob-circle">
        <svg width="160" height="160" style="position: absolute; top: 0; left: 0;">
          <circle cx="80" cy="80" r="70" fill="none" stroke="#e8e0d5" stroke-width="8"/>
          <circle cx="80" cy="80" r="70" fill="none" :stroke="riskColor" stroke-width="8" 
                  :stroke-dasharray="circumference" :stroke-dashoffset="strokeOffset"
                  transform="rotate(-90 80 80)" style="transition: all 1s;"/>
        </svg>
        <div class="prob-value">
          <span class="big">{{ Math.round(prob * 100) }}%</span>
          <div class="text-small" style="margin-top: 4px;">flood probability</div>
        </div>
      </div>
      
      <div class="mt-3" :class="bgClass" style="padding: 12px; border-radius: 12px;">
        <p style="font-weight: 500;">{{ riskMessage }}</p>
      </div>
    </div>
    
    <div class="grid-2" style="margin-top: 16px; gap: 12px;">
      <div class="text-center">
        <div class="text-small">Detection Rate</div>
        <div style="font-size: 20px; font-weight: 600;">45%</div>
      </div>
      <div class="text-center">
        <div class="text-small">Alert Threshold</div>
        <div style="font-size: 20px; font-weight: 600;">{{ threshold }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['prediction']);

const prob = computed(() => props.prediction?.city_prediction?.calibrated_probability || 0);
const threshold = computed(() => props.prediction?.city_prediction?.threshold_used || 0.02);
const circumference = 2 * Math.PI * 70;
const strokeOffset = computed(() => circumference * (1 - prob.value));

const riskColor = computed(() => {
  const p = prob.value;
  if (p >= 0.05) return '#bc6c25';
  if (p >= 0.02) return '#d4a373';
  if (p >= 0.01) return '#c4a27a';
  return '#8db0b0';
});

const bgClass = computed(() => {
  const p = prob.value;
  if (p >= 0.05) return 'bg-warning';
  if (p >= 0.02) return 'bg-advisory';
  if (p >= 0.01) return 'bg-watch';
  return 'bg-low';
});

const riskMessage = computed(() => {
  const p = prob.value;
  if (p >= 0.05) return 'Flooding expected in high-risk areas. Take precautions.';
  if (p >= 0.02) return 'Conditions favorable for flooding. Monitor updates.';
  if (p >= 0.01) return 'Slightly elevated risk. Stay aware of weather changes.';
  return 'Normal conditions. No immediate flood threat.';
});
</script>