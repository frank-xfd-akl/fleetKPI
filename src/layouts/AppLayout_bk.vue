<template>
  <div class="app-layout">
    <!-- 1. Left Sidebar Navigation -->
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-brand">
        <div class="brand-logo">
            <img src="/favicon.svg" alt="Transit Icon" class="brand-icon" />
            <span>Transit Analytics</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <RouterLink to="/deadhead" class="nav-item">
          <span class="icon">📊</span>
          <span class="label" v-if="!isCollapsed">Deadhead Matrix</span>
        </RouterLink>

        <!-- Placeholder slots for future dashboard pages -->
        <RouterLink to="/otp" class="nav-item disabled-link">
          <span class="icon">⏱️</span>
          <span class="label" v-if="!isCollapsed">On-Time Performance</span>
        </RouterLink>

        <RouterLink to="/fleet" class="nav-item disabled-link">
          <span class="icon">🚌</span>
          <span class="label" v-if="!isCollapsed">Fleet & Depots</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer" v-if="!isCollapsed">
        <span class="db-status-badge">● DuckDB Connected</span>
      </div>
    </aside>

    <!-- 2. Main Workspace -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-left">
          <span class="environment-tag">Operational Analytics Portal</span>
        </div>
        <div class="topbar-right">
          <span class="user-badge">Ops Analyst</span>
        </div>
      </header>

      <!-- 3. Dynamic Page Viewport -->
      <main class="content-body">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const isCollapsed = ref(false)
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  min-width: 1920px;
  min-height: 100vh;
  background-color: #f8fafc;
  color: #1e293b;
  gap: 10px; /* Creates 10px horizontal spacing between Sidebar and Main Workspace */
  padding: 10px; /* Creates 10px spacing around screen edges */
}

/* Sidebar Styling */
.sidebar {
  width: 300px;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease-in-out;
  border-right: 1px solid #1e293b;
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar-brand {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #1e293b;
  font-weight: 700;
  font-size: 1rem;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 30px; /* 8px spacing between text and icon */
  font-weight: 700;
  font-size: 1.05rem;
  color: #ffffff;
}

.brand-icon {
  width: 50px;
  height: 50px;
  display: inline-block;
  object-fit: contain;
  vertical-align: middle;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background-color: #1e293b;
  color: #ffffff;
}

.nav-item.router-link-active {
  background-color: #2563eb;
  color: #ffffff;
}

.disabled-link {
  opacity: 0.5;
  pointer-events: none;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #1e293b;
  font-size: 0.75rem;
}

.db-status-badge {
  color: #4ade80;
  font-weight: 600;
}

/* Main Content Area */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.environment-tag {
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

.user-badge {
  font-size: 0.85rem;
  background-color: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
  color: #334155;
  font-weight: 600;
}

.content-body {
  flex: 1;
  overflow-y: auto;
}
</style>