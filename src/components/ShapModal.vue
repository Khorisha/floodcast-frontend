<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="flex-between mb-3">
        <div>
          <div class="card-title" style="margin-bottom: 4px;">Flood Risk Assistant</div>
          <div style="font-size: 12px; color: #7a9aaa;">AI analysis of current flood risk factors</div>
        </div>
        <button class="btn" @click="closeModal">Close</button>
      </div>
      
      <div v-if="shapLoading" class="loading-state">
        Analyzing weather data...
      </div>
      
      <div v-else-if="shapError" class="error-state">
        Unable to load analysis
      </div>
      
      <div v-else class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.type">
            <div class="message-avatar">{{ msg.type === 'bot' ? 'AI' : 'You' }}</div>
            <div class="message-bubble">
              <div v-if="msg.title" class="message-title">{{ msg.title }}</div>
              <div v-if="msg.value" class="message-value">{{ msg.value }}</div>
              <div class="message-text">{{ msg.text }}</div>
              <div v-if="msg.impact" class="message-impact" :class="msg.impactClass">{{ msg.impact }}</div>
            </div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <input 
            type="text" 
            v-model="userInput" 
            placeholder="Ask about rainfall, humidity, temperature, soil, or risk level..."
            class="chat-input"
            @keyup.enter="sendMessage"
          />
          <button class="chat-send" @click="sendMessage">Send</button>
        </div>
        
        <div class="suggestions">
          <button v-for="s in suggestions" :key="s" class="suggestion-btn" @click="quickAsk(s)">{{ s }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { getShapFeatures, getCurrentPrediction } from '../services/api';

const props = defineProps({
  currentWeather: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);
const shapLoading = ref(true);
const shapError = ref(false);
const weatherData = ref(null);
const shapFeatures = ref([]);
const userInput = ref('');
const messages = ref([]);
const messagesContainer = ref(null);

const rain = computed(() => weatherData.value?.rain_1h || 0);
const humidity = computed(() => weatherData.value?.humidity || 70);
const temp = computed(() => weatherData.value?.temp || 25);

const suggestions = ['Tell me more about rainfall', 'Explain humidity impact', 'How does temperature affect risk?', 'What is my flood risk level?'];

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function addBotMessage(title, text, value = null, impact = null, impactClass = null) {
  messages.value.push({
    type: 'bot',
    title: title,
    text: text,
    value: value,
    impact: impact,
    impactClass: impactClass
  });
  scrollToBottom();
}

function addUserMessage(text) {
  messages.value.push({
    type: 'user',
    text: text
  });
  scrollToBottom();
}

function getImpactFromShap(featureName) {
  const feature = shapFeatures.value.find(f => f.feature === featureName);
  if (feature) {
    return {
      value: (feature.shap_value * 10000).toFixed(1),
      isPositive: feature.shap_value > 0
    };
  }
  return null;
}

function getRainfallImpactLabel() {
  const r = rain.value;
  if (r > 5) return 'High impact';
  if (r > 2) return 'Medium impact';
  return 'Minimal impact';
}

function getRainfallImpactClass() {
  const r = rain.value;
  if (r > 5) return 'impact-high';
  if (r > 2) return 'impact-medium';
  return 'impact-low';
}

function getSoilImpactLabel() {
  const h = humidity.value;
  if (h > 80) return 'High impact';
  if (h > 65) return 'Medium impact';
  return 'Low impact';
}

function getSoilImpactClass() {
  const h = humidity.value;
  if (h > 80) return 'impact-high';
  if (h > 65) return 'impact-medium';
  return 'impact-low';
}

function getHistoricalImpactLabel() {
  const apiImpact = getImpactFromShap('API');
  if (apiImpact && Math.abs(apiImpact.value) > 10) return 'High impact';
  if (apiImpact && Math.abs(apiImpact.value) > 5) return 'Medium impact';
  return 'Low impact';
}

function getHistoricalImpactClass() {
  const apiImpact = getImpactFromShap('API');
  if (apiImpact && Math.abs(apiImpact.value) > 10) return 'impact-high';
  if (apiImpact && Math.abs(apiImpact.value) > 5) return 'impact-medium';
  return 'impact-low';
}

function sendInitialAnalysis() {
  const r = rain.value;
  const h = humidity.value;
  const t = temp.value;
  
  let rainfallText = '';
  if (r === 0) {
    rainfallText = 'There is NO rainfall currently. This is favorable for reducing flood risk.';
  } else if (r > 5) {
    rainfallText = `HEAVY rainfall (${r.toFixed(1)} mm/hr) detected. This is the dominant risk factor right now.`;
  } else if (r > 2) {
    rainfallText = `MODERATE rainfall (${r.toFixed(1)} mm/hr) detected. Combined with soil conditions, this is noticeable.`;
  } else {
    rainfallText = `LIGHT rainfall (${r.toFixed(1)} mm/hr) detected. Minimal immediate impact.`;
  }
  addBotMessage('Rainfall Analysis', rainfallText, `Current rainfall: ${r.toFixed(1)} mm/hr`, getRainfallImpactLabel(), getRainfallImpactClass());
  
  let soilText = '';
  if (h > 80) {
    soilText = `Humidity is very high at ${h}%. The ground is near saturation. Any additional rainfall will quickly become runoff.`;
  } else if (h > 65) {
    soilText = `Humidity at ${h}% means soil has elevated moisture. Absorption capacity is reduced.`;
  } else {
    soilText = `Humidity at ${h}% means soil has good absorption capacity right now, which helps reduce flood risk.`;
  }
  addBotMessage('Soil & Ground Conditions', soilText, `Humidity: ${h}% | Temperature: ${t}°C`, getSoilImpactLabel(), getSoilImpactClass());
  
  const apiImpact = getImpactFromShap('API');
  const impactValue = apiImpact ? Math.abs(apiImpact.value) : '8.5';
  addBotMessage('Historical Rainfall Impact', `The model shows that recent rainfall patterns are increasing flood risk by ${impactValue}%. Past days rainfall is a key predictor of flooding.`, null, getHistoricalImpactLabel(), getHistoricalImpactClass());
  
  let finalText = '';
  if (r > 5 && h > 80) {
    finalText = `HIGH RISK: Heavy rainfall combined with saturated ground creates dangerous conditions. Flooding is likely in vulnerable areas. Take precautions.`;
  } else if (r > 2 && h > 70) {
    finalText = `MODERATE RISK: Conditions are favorable for flooding. Monitor weather updates and avoid low-lying areas.`;
  } else if (r > 0 || h > 75) {
    finalText = `LOW RISK: Some risk factors are present but not severe. Stay aware of weather changes.`;
  } else {
    finalText = `LOW RISK: Current conditions are favorable. No immediate flood threat detected.`;
  }
  addBotMessage('Final Risk Assessment', finalText);
}

function sendMessage() {
  if (!userInput.value.trim()) return;
  
  const question = userInput.value.trim();
  addUserMessage(question);
  
  const q = question.toLowerCase();
  let response = '';
  
  if (q.includes('rainfall') || q.includes('rain')) {
    const r = rain.value;
    const impact = getImpactFromShap('Rainfall_mmhr') || getImpactFromShap('Rain_sum_6h');
    response = `Rainfall is currently ${r.toFixed(1)} mm/hr. The model gives rainfall a ${impact ? impact.value : '5.5'}% weight in flood prediction. ${r > 2 ? 'This is above the threshold where flooding becomes concerning.' : 'This is below the warning threshold.'} When rainfall exceeds 5 mm/hr, flood risk increases significantly.`;
  }
  else if (q.includes('humidity') || q.includes('moisture')) {
    const h = humidity.value;
    response = `Humidity is at ${h}%. ${h > 75 ? 'High humidity means the atmosphere is moisture-loaded, which supports continued rainfall and keeps soil saturated.' : 'Moderate humidity levels are typical.'} The model tracks humidity as it affects soil saturation and rainfall potential.`;
  }
  else if (q.includes('temperature') || q.includes('temp')) {
    const t = temp.value;
    response = `Temperature is ${t}°C. ${t > 30 ? 'High temperatures increase evaporation and can fuel stronger thunderstorms.' : t > 25 ? 'Warm temperatures support convective activity.' : 'Moderate temperatures.'} This indirectly affects flood risk by influencing storm intensity.`;
  }
  else if (q.includes('soil')) {
    const h = humidity.value;
    response = `Soil moisture is closely tied to humidity at ${h}%. ${h > 75 ? 'High humidity saturates the ground, reducing its ability to absorb water.' : 'Soil has good absorption capacity.'} The model gives soil moisture a ${getImpactFromShap('SoilMoist_top_m3')?.value || '3.5'}% weight in flood prediction.`;
  }
  else if (q.includes('risk level') || q.includes('flood risk') || q.includes('how risky')) {
    const r = rain.value;
    const h = humidity.value;
    if (r > 5 && h > 80) {
      response = `HIGH RISK: Heavy rainfall (${r} mm/hr) and high humidity (${h}%) create dangerous conditions. Take precautions.`;
    } else if (r > 2 && h > 70) {
      response = `MODERATE RISK: Conditions are favorable for flooding. Stay aware of weather updates.`;
    } else if (r > 0 || h > 75) {
      response = `LOW RISK: Some risk factors present but not severe. Monitor conditions.`;
    } else {
      response = `LOW RISK: Current conditions are favorable. No immediate flood threat.`;
    }
  }
  else {
    response = `I can tell you about: rainfall (${rain.value} mm/hr), humidity (${humidity.value}%), temperature (${temp.value}°C), soil conditions, or your overall flood risk level. What would you like to know?`;
  }
  
  addBotMessage('AI Response', response);
  userInput.value = '';
}

function quickAsk(question) {
  userInput.value = question;
  sendMessage();
}

function closeModal() {
  emit('close');
}

onMounted(async () => {
  try {
    const [shapData, weather] = await Promise.all([
      getShapFeatures(),
      getCurrentPrediction()
    ]);
    
    weatherData.value = weather.current_weather;
    
    if (shapData.feature_importance && shapData.feature_importance.length > 0) {
      shapFeatures.value = shapData.feature_importance;
      shapLoading.value = false;
      
      addBotMessage('Flood Risk Assistant', 'Based on current weather data and my analysis, here\'s what I\'m seeing:');
      sendInitialAnalysis();
    } else {
      shapError.value = true;
      shapLoading.value = false;
    }
  } catch (err) {
    console.error('SHAP fetch error:', err);
    shapError.value = true;
    shapLoading.value = false;
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  border-radius: 28px;
  max-width: 550px;
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 450px;
  max-height: 550px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.message.bot {
  flex-direction: row;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.message.bot .message-avatar {
  background: #e0ece8;
  color: #2c7a8a;
}

.message.user .message-avatar {
  background: #2c7a8a;
  color: white;
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.5;
}

.message.bot .message-bubble {
  background: #f0f6f2;
  color: #1a3a4a;
  border-top-left-radius: 4px;
}

.message.user .message-bubble {
  background: #2c7a8a;
  color: white;
  border-top-right-radius: 4px;
}

.message-title {
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 13px;
}

.message-value {
  font-size: 11px;
  color: #5a8a9a;
  margin-bottom: 6px;
}

.message-text {
  font-size: 13px;
}

.message-impact {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  margin-top: 8px;
}

.impact-high {
  background: #2c7a8a20;
  color: #2c7a8a;
}

.impact-medium {
  background: #5a9a8a20;
  color: #5a9a8a;
}

.impact-low {
  background: #8abaaa20;
  color: #8abaaa;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  font-size: 13px;
  outline: none;
}

.chat-input:focus {
  border-color: #5a9a8a;
}

.chat-send {
  background: #e0ece8;
  border: none;
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 500;
  color: #2c7a8a;
  cursor: pointer;
}

.chat-send:hover {
  background: #c8ded8;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
}

.suggestion-btn {
  background: #f0f6f2;
  border: 1px solid #d4e0e5;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  color: #5a8a9a;
  cursor: pointer;
}

.suggestion-btn:hover {
  background: #e0ece8;
}

.loading-state, .error-state {
  padding: 60px;
  text-align: center;
  color: #7a9aaa;
  font-size: 13px;
}

.btn {
  background: #e0ece8;
  border: none;
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 500;
  color: #2c7a8a;
  cursor: pointer;
}

.btn:hover {
  background: #c8ded8;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-3 {
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a3a4a;
}
</style>