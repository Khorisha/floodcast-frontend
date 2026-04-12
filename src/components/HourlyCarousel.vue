<template>
  <div class="card">
    <div class="carousel-header">
      <div class="card-title">Hourly Flood Risk</div>
      <div class="card-subtitle">Tap any hour for details</div>
    </div>

    <div class="carousel-wrap">
      <button class="btn-scroll" @click="scrollBack" aria-label="scroll back">‹</button>

      <div class="hourly-row" ref="rowRef">
        <div v-if="dateHoursLoading && !isToday && !isFuture" class="hour-msg">
          Loading hourly flood data…
        </div>
        <div v-else-if="dateHoursError && !isToday && !isFuture" class="hour-msg hour-msg--error">
          Could not load hourly data
        </div>
        <template v-else>
          <button
            v-for="hour in displayedHours"
            :key="hour.offset"
            class="hour-tile"
            :class="{ 'hour-tile--now': hour.isNow, ['hour-tile--' + riskKey(hour.probability)]: true }"
            @click="openPopup(hour)"
          >
            <div class="tile-time">{{ hour.timeLabel }}</div>
            <div class="tile-prob" :style="{ color: riskColor(hour.probability) }">
              {{ pct(hour.probability) }}%
            </div>
            <div class="tile-bar">
              <div class="tile-bar-fill" :style="{ width: pct(hour.probability) + '%', background: riskColor(hour.probability) }"></div>
            </div>
            <div class="tile-rain" v-if="hour.rainfall_mm !== undefined">
              <span class="rain-drop">&#x1F327;</span>{{ hour.rainfall_mm }}mm
            </div>
            <div class="tile-badge" :style="badgeStyle(hour.probability)">
              {{ riskLabel(hour.probability) }}
            </div>
          </button>
        </template>
      </div>

      <button class="btn-scroll" @click="scrollForward" aria-label="scroll forward">›</button>
    </div>

    <!-- Detail popup -->
    <Teleport to="body">
      <div v-if="popup" class="popup-backdrop" @click.self="popup = null">
        <div class="popup-card">
          <button class="popup-close" @click="popup = null">×</button>

          <div class="popup-time">{{ popup.timeLabel }}</div>

          <div class="popup-prob" :style="{ color: riskColor(popup.probability) }">
            {{ pct(popup.probability) }}%
          </div>
          <div class="popup-sublabel">flood probability</div>

          <div class="popup-risk-badge" :style="badgeStyle(popup.probability)">
            {{ riskLabel(popup.probability) }}
          </div>

          <div class="popup-divider"></div>

          <div class="popup-stats">
            <div class="stat-row">
              <span class="stat-key">Rainfall this hour</span>
              <span class="stat-val">{{ popup.rainfall_mm != null ? popup.rainfall_mm + ' mm' : '—' }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-key">6-hour total</span>
              <span class="stat-val">{{ popup.rain_6h_mm != null ? popup.rain_6h_mm + ' mm' : '—' }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-key">24-hour total</span>
              <span class="stat-val">{{ popup.rain_24h_mm != null ? popup.rain_24h_mm + ' mm' : '—' }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-key">Soil saturation</span>
              <span class="stat-val">{{ popup.soil_moisture != null ? soilPct(popup.soil_moisture) + '%' : '—' }}</span>
            </div>
          </div>

          <div class="popup-divider"></div>

          <div class="popup-driver" v-if="popup.top_driver">
            <div class="driver-label">Primary flood driver</div>
            <div class="driver-value" :style="{ color: riskColor(popup.probability) }">
              {{ popup.top_driver }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getHourPrediction, getDateHours } from '../services/api';

function toLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const props = defineProps({
  currentProbability: { type: Number, default: null },
  selectedDate: {
    type: String,
    default: () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
});

const todayStr = computed(() => toLocalISO(new Date()));
const isToday  = computed(() => props.selectedDate === todayStr.value);
const isFuture = computed(() => props.selectedDate > todayStr.value);

const hourOffset       = ref(0);
const hoursData        = ref({});
const currentTime      = ref(new Date());
const dateHoursData    = ref([]);
const dateHoursLoading = ref(false);
const dateHoursError   = ref(false);
const dateHourOffset   = ref(0);
const popup            = ref(null);
const rowRef           = ref(null);

watch(() => props.selectedDate, async (newDate) => {
  if (newDate && newDate < todayStr.value) {
    await loadDateHours(newDate);
  } else {
    dateHoursData.value  = [];
    dateHourOffset.value = 0;
    dateHoursError.value = false;
  }
}, { immediate: true });

async function loadDateHours(date) {
  dateHoursLoading.value = true;
  dateHoursError.value   = false;
  dateHoursData.value    = [];
  dateHourOffset.value   = 0;
  try {
    const data = await getDateHours(date);
    if (data && data.hourly && data.hourly.length > 0) {
      dateHoursData.value = data.hourly;
    } else {
      dateHoursError.value = true;
    }
  } catch (err) {
    console.error('Failed to load date hours:', err);
    dateHoursError.value = true;
  } finally {
    dateHoursLoading.value = false;
  }
}

const displayedHours = computed(() => {
  if (!isToday.value && !isFuture.value) {
    return dateHoursData.value
      .slice(dateHourOffset.value, dateHourOffset.value + 10)
      .map(h => ({
        offset:        h.hour,
        timeLabel:     `${String(h.hour).padStart(2, '0')}:00`,
        probability:   h.probability ?? 0.02,
        isNow:         false,
        rainfall_mm:   h.rainfall_now_mm,
        rain_6h_mm:    h.rain_6h_mm,
        rain_24h_mm:   h.rain_24h_mm,
        soil_moisture: h.soil_moisture,
        top_driver:    h.top_driver,
      }));
  }

  const hours = [];
  for (let i = -3; i <= 6; i++) {
    const offset = hourOffset.value + i;
    const stored = hoursData.value[offset];
    const probability = (offset === 0 && props.currentProbability !== null)
      ? props.currentProbability
      : (stored?.probability ?? 0.02);
    hours.push({
      offset,
      timeLabel:     getTimeLabel(offset),
      probability,
      isNow:         offset === 0,
      rainfall_mm:   stored?.rainfall_mm,
      rain_6h_mm:    stored?.rain_6h_mm,
      rain_24h_mm:   stored?.rain_24h_mm,
      soil_moisture: stored?.soil_moisture,
      top_driver:    stored?.top_driver,
    });
  }
  return hours;
});

function getTimeLabel(offsetHours) {
  const target    = new Date(currentTime.value);
  target.setHours(target.getHours() + offsetHours);
  const now       = currentTime.value;
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tDay      = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const hh        = String(target.getHours()).padStart(2, '0');
  if (offsetHours === 0)                            return `Now ${hh}:00`;
  if (tDay.getTime() === today.getTime())           return `${hh}:00`;
  if (tDay.getTime() === tomorrow.getTime())        return `+1d ${hh}:00`;
  if (tDay.getTime() === yesterday.getTime())       return `-1d ${hh}:00`;
  return `${target.getMonth() + 1}/${target.getDate()} ${hh}:00`;
}

function scrollBack() {
  if (!isToday.value && !isFuture.value) {
    dateHourOffset.value = Math.max(0, dateHourOffset.value - 3);
  } else {
    hourOffset.value -= 3;
    [-1, 0, 1, 2].forEach(i => loadHour(hourOffset.value + i));
  }
}

function scrollForward() {
  if (!isToday.value && !isFuture.value) {
    const max = Math.max(0, dateHoursData.value.length - 10);
    dateHourOffset.value = Math.min(max, dateHourOffset.value + 3);
  } else {
    hourOffset.value += 3;
    [-1, 0, 1, 2].forEach(i => loadHour(hourOffset.value + i));
  }
}

async function loadHour(offset) {
  if (hoursData.value[offset]) return;
  try {
    const data = await getHourPrediction(offset);
    hoursData.value[offset] = {
      probability:   data.prediction?.calibrated_probability ?? 0.02,
      rainfall_mm:   data.rainfall_now_mm,
      rain_6h_mm:    data.rain_6h_mm,
      rain_24h_mm:   data.rain_24h_mm,
      soil_moisture: data.soil_moisture,
      top_driver:    data.top_driver,
    };
  } catch {
    hoursData.value[offset] = { probability: 0.02 };
  }
}

function openPopup(hour) {
  popup.value = hour;
}

// Risk helpers
function pct(p)        { return Math.round((p || 0) * 100); }
function soilPct(sm)   { return sm !== undefined ? Math.round(sm / 0.4 * 100) : '—'; }

function riskColor(p) {
  if (p >= 0.05) return '#2c7a8a';
  if (p >= 0.02) return '#5a9a8a';
  if (p >= 0.01) return '#8abaaa';
  return '#b0c8d0';
}

function riskKey(p) {
  if (p >= 0.05) return 'high';
  if (p >= 0.02) return 'advisory';
  if (p >= 0.01) return 'watch';
  return 'low';
}

function riskLabel(p) {
  if (p >= 0.05) return 'High flood risk';
  if (p >= 0.02) return 'Elevated risk';
  if (p >= 0.01) return 'Monitor conditions';
  return 'No flood risk';
}

function badgeStyle(p) {
  const c = riskColor(p);
  return { background: c + '22', color: c, border: `1px solid ${c}55` };
}

let intervalId = null;

onMounted(() => {
  [-1, 0, 1, 2].forEach(i => loadHour(i));
  intervalId = setInterval(() => { currentTime.value = new Date(); }, 60000);
});

onUnmounted(() => { if (intervalId) clearInterval(intervalId); });
</script>

<style scoped>
.card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a3a4a;
}

.card-subtitle {
  font-size: 11px;
  color: #7a9aaa;
}

.carousel-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-scroll {
  background: #f0f6f2;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: #5a8a9a;
  flex-shrink: 0;
  transition: background 0.15s;
}
.btn-scroll:hover { background: #e0ece8; }

.hourly-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  padding: 4px 0 6px;
  scrollbar-width: none;
}
.hourly-row::-webkit-scrollbar { display: none; }

.hour-msg {
  text-align: center;
  padding: 24px;
  color: #7a9aaa;
  font-size: 13px;
  width: 100%;
}
.hour-msg--error { color: #c44a3a; }

/* Hour tile */
.hour-tile {
  flex-shrink: 0;
  width: 78px;
  background: #f8fafc;
  border-radius: 14px;
  padding: 10px 6px 8px;
  text-align: center;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.hour-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44,122,138,0.12);
}
.hour-tile--now {
  border: 2px solid #5a9a8a;
  background: #f0f8f5;
}

.tile-time {
  font-size: 10px;
  font-weight: 600;
  color: #7a9aaa;
  white-space: nowrap;
}

.tile-prob {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}

.tile-bar {
  width: 100%;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}
.tile-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s;
}

.tile-rain {
  font-size: 10px;
  color: #5a8a9a;
  display: flex;
  align-items: center;
  gap: 2px;
}
.rain-drop { font-size: 10px; }

.tile-badge {
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 20px;
  white-space: nowrap;
}

/* Popup overlay */
.popup-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 30, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.popup-card {
  background: white;
  border-radius: 20px;
  padding: 24px 20px 20px;
  width: 100%;
  max-width: 320px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  max-height: 90vh;
  overflow-y: auto;
}

.popup-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: #f0f6f2;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  color: #5a8a9a;
}
.popup-close:hover { background: #e0ece8; }

.popup-time {
  font-size: 12px;
  font-weight: 600;
  color: #7a9aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.popup-prob {
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
}

.popup-sublabel {
  font-size: 11px;
  color: #7a9aaa;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.popup-risk-badge {
  display: inline-block;
  margin-top: 10px;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.popup-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 14px 0;
}

.popup-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.popup-stats--empty {
  font-size: 12px;
  color: #7a9aaa;
  font-style: italic;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.stat-key { color: #7a9aaa; }
.stat-val { font-weight: 600; color: #1a3a4a; }

.popup-driver {
  text-align: center;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 12px;
}
.driver-label {
  font-size: 10px;
  color: #7a9aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.driver-value {
  font-size: 14px;
  font-weight: 700;
}

/* Responsive */
@media (max-width: 600px) {
  .card { padding: 12px; }
  .hour-tile {
    width: 62px;
    padding: 8px 4px 6px;
    border-radius: 10px;
  }
  .tile-prob { font-size: 16px; }
  .tile-time { font-size: 9px; }
  .tile-badge { font-size: 8px; padding: 2px 4px; }
  .tile-rain { font-size: 9px; }
  .popup-prob { font-size: 40px; }
  .popup-card {
    padding: 18px 14px 14px;
    border-radius: 16px;
    max-width: calc(100vw - 32px);
  }
  .btn-scroll { width: 26px; height: 26px; font-size: 16px; }
}

@media (max-width: 380px) {
  .hour-tile { width: 56px; }
  .tile-prob { font-size: 14px; }
  .popup-prob { font-size: 34px; }
  .stat-row { font-size: 12px; }
}
</style>
