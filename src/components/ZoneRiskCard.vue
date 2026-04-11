<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">Zone Flood Risk</div>
      <div class="card-subtitle">City prediction × zone risk multiplier</div>
    </div>
    
    <div class="zone-grid">
      <div v-for="zone in zoneProbabilities" :key="zone.name" class="zone-tile">
        <div class="zone-name">{{ zone.name }}</div>
        <div class="zone-probability" :style="{ color: getRiskColor(zone.probability) }">
          {{ Math.round(zone.probability * 100) }}%
        </div>
        <div class="zone-bar">
          <div class="zone-bar-fill" :style="{ width: (zone.probability * 100) + '%', background: getRiskColor(zone.probability) }"></div>
        </div>
        <div class="zone-multiplier">×{{ zone.multiplier }} factor</div>
      </div>
    </div>
    
    <div class="info-note">
      City risk: {{ Math.round(cityProb * 100) }}% × zone multiplier
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getZoneRiskMultipliers } from '../services/api';

const props = defineProps({
  cityProb: {
    type: Number,
    default: 0
  }
});

const zoneMultipliers = ref({});
const zoneRiskScores = ref({});

const zoneProbabilities = computed(() => {
  const zones = [
    'Vallee des Pretres', 'La Cure', 'Bell Village', 'Plaine Verte',
    'Roche Bois', 'Port Louis CBD', 'Vallee Pitot', 'Champ de Mars', 'Canal Dayot'
  ];
  
  return zones.map(zone => {
    const multiplier = zoneMultipliers.value[zone] || 1.0;
    const probability = Math.min(0.99, props.cityProb * multiplier);
    return {
      name: zone,
      probability: probability,
      multiplier: multiplier,
      riskScore: zoneRiskScores.value[zone] || 3.5
    };
  }).sort((a, b) => b.probability - a.probability);
});

function getRiskColor(prob) {
  if (prob >= 0.05) return '#2c7a8a';
  if (prob >= 0.02) return '#5a9a8a';
  return '#8abaaa';
}

onMounted(async () => {
  try {
    const data = await getZoneRiskMultipliers();
    zoneMultipliers.value = data.zones;
    zoneRiskScores.value = data.risk_scores;
  } catch (error) {
    console.error('Failed to load zone multipliers:', error);
    zoneMultipliers.value = {
      'Vallee des Pretres': 1.10,
      'La Cure': 1.05,
      'Bell Village': 1.05,
      'Plaine Verte': 1.02,
      'Roche Bois': 1.02,
      'Port Louis CBD': 1.00,
      'Vallee Pitot': 0.99,
      'Champ de Mars': 0.92,
      'Canal Dayot': 0.79
    };
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
  font-size: 11px;
  color: #7a9aaa;
  margin-top: 2px;
}

.zone-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.zone-tile {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.zone-name {
  font-size: 12px;
  font-weight: 600;
  color: #1a3a4a;
  margin-bottom: 8px;
}

.zone-probability {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.zone-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.zone-bar-fill {
  height: 100%;
  border-radius: 2px;
}

.zone-multiplier {
  font-size: 10px;
  color: #7a9aaa;
}

.info-note {
  font-size: 11px;
  color: #7a9aaa;
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}
</style>