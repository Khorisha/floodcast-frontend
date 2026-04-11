<template>
  <div class="card">
    <div class="flex-between">
      <div class="card-title">Hourly Risk Timeline</div>
    </div>
    <div class="hourly-row-wrapper">
      <button class="btn-scroll" @click="hourOffset -= 3">‹</button>
      <div class="hourly-row">
        <div v-for="hour in displayedHours" :key="hour.offset" class="hour-item" :class="{ now: hour.offset === 0 }">
          <div class="hour-time">{{ hour.timeLabel }}</div>
          <div class="hour-prob" :style="{ color: getRiskColor(hour.probability) }">{{ Math.round(hour.probability * 100) }}%</div>
          <div class="hour-bar">
            <div class="hour-bar-fill" :style="{ width: (hour.probability * 100) + '%', background: getRiskColor(hour.probability) }"></div>
          </div>
        </div>
      </div>
      <button class="btn-scroll" @click="hourOffset += 3">›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getHourPrediction } from '../services/api';

const props = defineProps({
  currentProbability: {
    type: Number,
    default: null
  }
});

const hourOffset = ref(0);
const hoursData = ref({});
const currentTime = ref(new Date());

function getTimeLabel(offsetHours) {
  const targetDate = new Date(currentTime.value);
  targetDate.setHours(currentTime.value.getHours() + offsetHours);
  
  const now = new Date(currentTime.value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const hour = targetDate.getHours();
  const hourStr = hour.toString().padStart(2, '0');
  
  if (offsetHours === 0) {
    return `Now ${hourStr}:00`;
  }
  
  if (targetDay.getTime() === today.getTime()) {
    return `Today ${hourStr}:00`;
  } else if (targetDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${hourStr}:00`;
  } else if (targetDay.getTime() === yesterday.getTime()) {
    return `Yesterday ${hourStr}:00`;
  } else {
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    return `${month}/${day} ${hourStr}:00`;
  }
}

const displayedHours = computed(() => {
  const hours = [];
  for (let i = -3; i <= 6; i++) {
    const offset = hourOffset.value + i;
    let probability = 0.02;
    
    if (offset === 0 && props.currentProbability !== null) {
      probability = props.currentProbability;
    } else if (hoursData.value[offset]) {
      probability = hoursData.value[offset].probability;
    }
    
    hours.push({
      offset: offset,
      timeLabel: getTimeLabel(offset),
      probability: probability
    });
  }
  return hours;
});

async function loadHour(offset) {
  if (offset !== 0 && !hoursData.value[offset]) {
    try {
      const data = await getHourPrediction(offset);
      hoursData.value[offset] = { probability: data.prediction?.calibrated_probability || 0.02 };
    } catch (error) {
      hoursData.value[offset] = { probability: 0.02 };
    }
  }
}

function goBack() {
  hourOffset.value -= 3;
  for (let i = -1; i <= 2; i++) {
    const offset = hourOffset.value + i;
    if (offset !== 0) {
      loadHour(offset);
    }
  }
}

function goForward() {
  hourOffset.value += 3;
  for (let i = -1; i <= 2; i++) {
    const offset = hourOffset.value + i;
    if (offset !== 0) {
      loadHour(offset);
    }
  }
}

function getRiskColor(prob) {
  if (prob >= 0.05) return '#2c7a8a';
  if (prob >= 0.02) return '#5a9a8a';
  if (prob >= 0.01) return '#8abaaa';
  return '#b0c8d0';
}

let intervalId = null;

onMounted(() => {
  for (let i = -1; i <= 2; i++) {
    if (i !== 0) {
      loadHour(i);
    }
  }
  
  intervalId = setInterval(() => {
    currentTime.value = new Date();
  }, 3600000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>