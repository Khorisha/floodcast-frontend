<template>
  <div class="date-selector-card">
    <div class="date-selector-header">
      <div class="date-selector-title">
        <span class="date-icon"></span>
        Select Date
      </div>
      <div class="date-selector-subtitle">View predictions for any date</div>
    </div>
    
    <div class="date-selector-controls">
      <input 
        type="date" 
        v-model="selectedDate" 
        :max="maxDate"
        :min="minDate"
        class="date-input"
        @change="onDateChange"
      />
      <div class="date-buttons">
        <button class="date-btn" @click="setToday" :disabled="isToday">Today</button>
        <button class="date-btn" @click="setYesterday">Yesterday</button>
        <button class="date-btn" @click="setTomorrow">Tomorrow</button>
      </div>
    </div>
    
    <div class="date-info">
      <span class="date-info-label">Selected:</span>
      <span class="date-info-value">{{ formattedDate }}</span>
      <span v-if="isHistorical" class="date-badge historical">Historical</span>
      <span v-else-if="isFuture" class="date-badge future">Forecast</span>
      <span v-else class="date-badge today">Today</span>
    </div>
    
    <div v-if="isLoading" class="date-loading">
      Loading data for {{ formattedDate }}...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Always use local date components — toISOString() converts to UTC and can give the wrong day
function toLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const props = defineProps({
  modelValue: {
    type: String,
    default: () => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
  }
})

const emit = defineEmits(['update:modelValue', 'date-change'])

const selectedDate = ref(props.modelValue)
const isLoading = ref(false)

const maxDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return toLocalISO(d)
})

// Allow selection back to 2010 — archive API covers all historical data
const minDate = '2010-01-01'

const formattedDate = computed(() => {
  // Parse as local midnight to avoid UTC-offset date shifts
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const todayStr = computed(() => toLocalISO(new Date()))

const isToday = computed(() => selectedDate.value === todayStr.value)
const isHistorical = computed(() => selectedDate.value < todayStr.value)
const isFuture = computed(() => selectedDate.value > todayStr.value)

function onDateChange() {
  isLoading.value = true
  emit('update:modelValue', selectedDate.value)
  emit('date-change', selectedDate.value)
  setTimeout(() => { isLoading.value = false }, 500)
}

function setToday() {
  selectedDate.value = toLocalISO(new Date())
  onDateChange()
}

function setYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  selectedDate.value = toLocalISO(d)
  onDateChange()
}

function setTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  selectedDate.value = toLocalISO(d)
  onDateChange()
}

watch(() => props.modelValue, (newVal) => {
  if (newVal !== selectedDate.value) {
    selectedDate.value = newVal
  }
})
</script>

<style scoped>
.date-selector-card {
  background: white;
  border-radius: 20px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
}

.date-selector-header {
  margin-bottom: 12px;
}

.date-selector-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a4a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-icon {
  font-size: 16px;
}

.date-selector-subtitle {
  font-size: 11px;
  color: #7a9aaa;
  margin-top: 2px;
}

.date-selector-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: #f8fafc;
  color: #1a3a4a;
}

.date-input:focus {
  outline: none;
  border-color: #5a9a8a;
}

.date-buttons {
  display: flex;
  gap: 8px;
}

.date-btn {
  background: #f0f6f2;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  color: #5a8a9a;
  transition: all 0.2s;
}

.date-btn:hover:not(:disabled) {
  background: #e0ece8;
  color: #2c7a8a;
}

.date-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.date-info-label {
  font-size: 11px;
  color: #7a9aaa;
}

.date-info-value {
  font-size: 12px;
  font-weight: 500;
  color: #1a3a4a;
}

.date-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}

.date-badge.historical {
  background: #8abaaa20;
  color: #8abaaa;
}

.date-badge.future {
  background: #5a9a8a20;
  color: #5a9a8a;
}

.date-badge.today {
  background: #2c7a8a20;
  color: #2c7a8a;
}

.date-loading {
  margin-top: 10px;
  font-size: 11px;
  color: #5a9a8a;
  text-align: center;
}
</style>