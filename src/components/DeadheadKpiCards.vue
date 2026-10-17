<template>
  <div class="kpi-grid">
    <!-- 1. Total Trips -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Total Trips</span>
        <span class="kpi-icon blue">🚌</span>
      </div>
      <div class="kpi-value">{{ formatNumber(summary.total_trips) }}</div>
      <div class="kpi-subtext">Filtered deadhead trips</div>
    </div>

    <!-- 2. Unique Corridors -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Unique Corridors</span>
        <span class="kpi-icon purple">🗺️</span>
      </div>
      <div class="kpi-value">{{ formatNumber(summary.unique_corridors) }}</div>
      <div class="kpi-subtext">Active OD routes</div>
    </div>

    <!-- 3. Mean COV (Coefficient of Variation) -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Mean COV</span>
        <span class="kpi-icon" :class="covStatusClass">📊</span>
      </div>
      <div class="kpi-value">{{ formatCov(summary.mean_cov) }}</div>
      <div class="kpi-subtext">
        <span class="badge" :class="covStatusClass">{{ covStatusLabel }}</span>
        Reliability indicator
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({
      total_trips: 0,
      unique_corridors: 0,
      mean_cov: 0.0
    })
  }
})

// Format large numbers with commas
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString()
}

// Format COV to two decimal places
const formatCov = (val) => {
  if (val === undefined || val === null) return '0.00'
  return Number(val).toFixed(2)
}

// Color status badge depending on mean COV volatility
const covStatusClass = computed(() => {
  const cov = props.summary.mean_cov || 0
  if (cov <= 0.2) return 'green'
  if (cov <= 0.4) return 'orange'
  return 'red'
})

const covStatusLabel = computed(() => {
  const cov = props.summary.mean_cov || 0
  if (cov <= 0.2) return 'High Reliability'
  if (cov <= 0.4) return 'Moderate Volatility'
  return 'High Volatility'
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #ffffff;
  padding: 18px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-icon {
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f1f5f9;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  margin-bottom: 6px;
}

.kpi-subtext {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Status Badges */
.badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.green {
  background-color: #dcfce7;
  color: #15803d;
}

.orange {
  background-color: #fef3c7;
  color: #b45309;
}

.red {
  background-color: #fee2e2;
  color: #b91c1c;
}

.blue {
  background-color: #dbeafe;
}

.purple {
  background-color: #f3e8ff;
}
</style>