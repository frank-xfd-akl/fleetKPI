<template>
  <div class="app-layout">
    <!-- 1. Left Sidebar Navigation -->
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <img src="/favicon.svg" alt="Transit Icon" class="brand-icon" />
          <span v-if="!isCollapsed">Transit Analytics</span>
        </div>
        <button class="toggle-btn" @click="isCollapsed = !isCollapsed" title="Toggle Sidebar">
          {{ isCollapsed ? '❯' : '❮' }}
        </button>
      </div>

      <nav class="sidebar-menu">
        <RouterLink to="/deadhead" class="nav-item">
          <span class="icon">📊</span>
          <span class="label" v-if="!isCollapsed">Deadhead & Pull Profile</span>
        </RouterLink>

        <RouterLink to="/deadheads_review" class="nav-item">
          <span class="icon">⏱️</span>
          <span class="label" v-if="!isCollapsed">Deadhead & Pull Review</span>
        </RouterLink>

        <RouterLink to="/deadheads_calculate" class="nav-item">
          <span class="icon">🧮</span>
          <span class="label" v-if="!isCollapsed">Deadhead Calculator</span>
        </RouterLink>

        <RouterLink to="/runtime_review" class="nav-item">
          <span class="icon">⏱️</span>
          <span class="label" v-if="!isCollapsed">Runtime Review</span>
        </RouterLink>

        <RouterLink to="/duty_review" class="nav-item">
          <span class="icon">📊</span>
          <span class="label" v-if="!isCollapsed">Duty Review</span>
        </RouterLink>
        
        <RouterLink to="/pvr_profile" class="nav-item">
          <span class="icon">📊</span>
          <span class="label" v-if="!isCollapsed">PVR Profile</span>
        </RouterLink>

      </nav>

      <div class="sidebar-footer" v-if="!isCollapsed">
        <span class="db-status-badge" :class="statusClass">
          {{ dbStatus }}
        </span>
      </div>
    </aside>

    <!-- 2. Main Workspace -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-left">
          <span class="environment-tag">Scheduling and Operational Analytics Portal</span>
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

// Connection State: 'connected' | 'disconnected' | 'checking'
const dbStatus = ref('DB connected')
</script>

<style scoped>
/* Reset & Shell Layout */
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #f1f5f9;
  color: #1e293b;
  overflow: hidden;
  box-sizing: border-box;
}

/* Sidebar Styling */
.sidebar {
  width: 360px;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid #1e293b;
  flex-shrink: 0;
}

.sidebar.is-collapsed {
  width: 100px;
}

.sidebar-brand {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #1e293b;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 1.05rem;
  color: #ffffff;
  overflow: hidden;
  white-space: nowrap;
}

.brand-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  object-fit: contain;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 6px;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.toggle-btn:hover {
  background-color: #1e293b;
  color: #ffffff;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 12px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
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
  opacity: 0.4;
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
  height: 100vh;
  overflow: hidden;
}

.topbar {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  flex-shrink: 0;
}

.environment-tag {
  font-weight: 600;
  color: #475569;
  font-size: 0.95rem;
}

.user-badge {
  font-size: 0.85rem;
  background-color: #f1f5f9;
  padding: 6px 14px;
  border-radius: 16px;
  color: #334155;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.content-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  box-sizing: border-box;
}
</style>