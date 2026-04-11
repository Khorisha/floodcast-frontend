<template>
  <div class="app">
    <div class="container">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div class="flex">
          <div style="width: 36px; height: 36px; background: #2c7a8a; border-radius: 12px;"></div>
          <div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1a3a4a;">FloodCast</h1>
            <p style="font-size: 11px; color: #7a9aaa;">Port Louis Flash Flood Warning</p>
          </div>
        </div>
        <div class="flex">
          <div style="width: 8px; height: 8px; background: #5a9a8a; border-radius: 50%;"></div>
          <span style="font-size: 11px; color: #5a8a9a;">Live Monitoring</span>
        </div>
      </div>

      <Dashboard />
    </div>
  </div>
</template>

<script setup>
import Dashboard from './components/Dashboard.vue';
</script>