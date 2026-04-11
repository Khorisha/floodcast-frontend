<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">7-Day Flood Risk Forecast</div>
      <div class="card-subtitle">Daily flood probability based on expected rainfall</div>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading forecast data...
    </div>
    
    <div v-else-if="error" class="error-state">
      Unable to load forecast
    </div>
    
    <div v-else class="forecast-grid">
      <div v-for="day in forecastDays" :key="day.date" class="forecast-day">
        <div class="forecast-day-name">{{ day.dayName }}</div>
        <div class="forecast-date">{{ day.dateShort }}</div>
        
        <div class="forecast-probability" :style="{ color: getRiskColor(day.riskScore) }">
          {{ day.riskPercent }}%
        </div>
        <div class="forecast-prob-label">flood risk</div>
        
        <div class="forecast-rain">
          {{ day.rainfall }}<span class="rain-unit">mm</span>
        </div>
        <div class="forecast-rain-label">expected rain</div>
        
        <div class="prob-bar">
          <div class="prob-fill" :style="{ width: day.riskPercent + '%', background: getRiskColor(day.riskScore) }"></div>
        </div>
        
        <div class="forecast-risk-badge" :class="getRiskBadgeClass(day.riskScore)">
          {{ day.riskLabel }}
        </div>
      </div>
    </div>
    
    <div v-if="!loading && !error" class="forecast-summary">
      <div class="summary-item">
        <div class="summary-label">Peak Risk Day</div>
        <div class="summary-value" :style="{ color: getRiskColor(peakRiskScore) }">
          {{ peakRiskDay }}
          <span v-if="peakRiskScore > 0" class="summary-percent">({{ peakRiskPercent }}%)</span>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Weekly Total Rain</div>
        <div class="summary-value">{{ weeklyRainTotal }} mm</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Avg Daily Risk</div>
        <div class="summary-value" :style="{ color: getRiskColor(avgRisk) }">
          {{ avgRiskPercent }}%
        </div>
      </div>
    </div>
    
    <div v-if="!loading && !error" class="forecast-note">
      Flood probability is estimated from expected rainfall intensity
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getForecast7Day } from '../services/api'

const forecastData = ref(null)
const loading = ref(true)
const error = ref(false)

function getRiskColor(risk) {
  if (risk >= 0.04) return '#2c7a8a'   // High: 4%+
  if (risk >= 0.02) return '#5a9a8a'   // Medium: 2-4%
  if (risk >= 0.01) return '#8abaaa'   // Low: 1-2%
  return '#b0c8d0'                      // Minimal: <1%
}

function getRiskLabel(risk) {
  if (risk >= 0.04) return 'High Risk'
  if (risk >= 0.02) return 'Medium Risk'
  if (risk >= 0.01) return 'Low Risk'
  return 'Minimal Risk'
}

function getRiskBadgeClass(risk) {
  if (risk >= 0.04) return 'badge-high'
  if (risk >= 0.02) return 'badge-medium'
  if (risk >= 0.01) return 'badge-low'
  return 'badge-minimal'
}

const forecastDays = computed(() => {
  if (!forecastData.value || !forecastData.value.forecast) {
    return []
  }
  
  const result = []
  const days = forecastData.value.forecast.slice(0, 7)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const date = new Date(day.date)
    let riskScore = day.max_risk_score || 0.01
    
    result.push({
      date: day.date,
      dateShort: (date.getMonth() + 1) + '/' + date.getDate(),
      dayName: dayNames[date.getDay()],
      rainfall: Math.round(day.total_rainfall * 10) / 10,
      riskScore: riskScore,
      riskPercent: Math.round(riskScore * 100),
      riskLabel: getRiskLabel(riskScore)
    })
  }
  
  return result
})

const peakRiskDay = computed(() => {
  if (forecastDays.value.length === 0) return 'None'
  
  let maxDay = forecastDays.value[0]
  for (let i = 1; i < forecastDays.value.length; i++) {
    if (forecastDays.value[i].riskScore > maxDay.riskScore) {
      maxDay = forecastDays.value[i]
    }
  }
  return maxDay.dayName
})

const peakRiskScore = computed(() => {
  if (forecastDays.value.length === 0) return 0
  
  let maxScore = 0
  for (let i = 0; i < forecastDays.value.length; i++) {
    if (forecastDays.value[i].riskScore > maxScore) {
      maxScore = forecastDays.value[i].riskScore
    }
  }
  return maxScore
})

const peakRiskPercent = computed(() => {
  return Math.round(peakRiskScore.value * 100)
})

const weeklyRainTotal = computed(() => {
  if (forecastDays.value.length === 0) return 0
  
  let total = 0
  for (let i = 0; i < forecastDays.value.length; i++) {
    total = total + forecastDays.value[i].rainfall
  }
  return total
})

const avgRisk = computed(() => {
  if (forecastDays.value.length === 0) return 0
  
  let total = 0
  for (let i = 0; i < forecastDays.value.length; i++) {
    total = total + forecastDays.value[i].riskScore
  }
  return total / forecastDays.value.length
})

const avgRiskPercent = computed(() => {
  return Math.round(avgRisk.value * 100)
})

onMounted(async () => {
  try {
    const data = await getForecast7Day()
    forecastData.value = data
    loading.value = false
    console.log('Forecast data:', data)
  } catch (err) {
    console.error('Failed to load forecast:', err)
    error.value = true
    loading.value = false
  }
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.card-header {
  margin-bottom: 20px;
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

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.forecast-day {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px 6px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.forecast-day-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a3a4a;
}

.forecast-date {
  font-size: 10px;
  color: #7a9aaa;
  margin-bottom: 8px;
}

.forecast-probability {
  font-size: 24px;
  font-weight: 700;
  margin-top: 4px;
}

.forecast-prob-label {
  font-size: 9px;
  color: #7a9aaa;
  margin-bottom: 6px;
}

.forecast-rain {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a4a;
}

.rain-unit {
  font-size: 9px;
  font-weight: normal;
  color: #7a9aaa;
}

.forecast-rain-label {
  font-size: 9px;
  color: #7a9aaa;
  margin-bottom: 8px;
}

.prob-bar {
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
}

.prob-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.forecast-risk-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 600;
  margin-top: 6px;
}

.badge-high {
  background: #2c7a8a20;
  color: #2c7a8a;
}

.badge-medium {
  background: #5a9a8a20;
  color: #5a9a8a;
}

.badge-low {
  background: #8abaaa20;
  color: #8abaaa;
}

.badge-minimal {
  background: #b0c8d020;
  color: #b0c8d0;
}

.forecast-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 10px;
  color: #7a9aaa;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a4a;
}

.summary-percent {
  font-size: 11px;
  font-weight: normal;
}

.forecast-note {
  font-size: 10px;
  color: #7a9aaa;
  text-align: center;
  font-style: italic;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
  color: #7a9aaa;
  font-size: 13px;
}

@media (max-width: 800px) {
  .forecast-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 500px) {
  .forecast-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>