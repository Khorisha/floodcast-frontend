<template>
  <div class="app">
    <div class="container">
      <!-- Top row: favicon + title -->
      <div class="flex-between" style="margin-bottom: 20px; align-items: center;">
        <div class="flex" style="align-items: center;">
          <!-- Blue square background with favicon inside -->
          <div style="width: 36px; height: 36px; background: #5a9a8a; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
            <img 
              src="/favicon.ico" 
              alt="FloodCast logo" 
              style="width: 20px; height: 20px;"
            />
          </div>
          <div>
            <h1 style="font-size: 22px; font-weight: 700; color: #1a3a4a; margin: 0;">FloodCast</h1>
            <p style="font-size: 11px; color: #7a9aaa; margin: 0;">Port Louis Flash Flood Warning</p>
          </div>
        </div>
      </div>

      <!-- Banner row -->
      <div style="margin-bottom: 20px;">
        <img 
          src="/images/banner.png" 
          alt="FloodCast Banner" 
          style="width: 100%; height: 300px; object-fit: cover; object-position: bottom; border-radius: 6px; display: block;"
        />
      </div>

      <Dashboard />
    </div>
  </div>
</template>

<script setup>
import Dashboard from './components/Dashboard.vue';
</script>
