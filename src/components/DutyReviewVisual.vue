<template>
  <div class="visual-container">
    
    <!-- KPI Overview Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Total Duty Days</span>
        <div class="kpi-value dark">{{ totalDutyRecords }}</div>
      </div>
      
      <div class="kpi-card">
        <span class="kpi-label">Avg Span Variance</span>
        <div 
          class="kpi-value"
          :class="avgSpanVariance > 0 ? 'text-red' : 'text-emerald'"
        >
          {{ avgSpanVariance > 0 ? '+' : '' }}{{ avgSpanVariance }} <span class="unit">min</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Avg Runtime Variance</span>
        <div 
          class="kpi-value"
          :class="avgRuntimeVariance > 0 ? 'text-amber' : 'text-blue'"
        >
          {{ avgRuntimeVariance > 0 ? '+' : '' }}{{ avgRuntimeVariance }} <span class="unit">min</span>
        </div>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Avg Match Rate</span>
        <div class="kpi-value dark">{{ avgMatchRate }}%</div>
      </div>
    </div>

    <!-- Duty Performance Table -->
    <div class="table-card">
      <div class="table-header">
        <h3 class="table-title">Duty Performance Overview</h3>
        <span class="badge badge-gray">
          {{ items.length }} Records Found
        </span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-left">Date / Day</th>
              <th class="text-left">Division</th>
              <th class="text-left">Duty #</th>
              <th class="text-center">Planned Trips</th>
              <th class="text-center">Match Rate</th>
              <th class="text-right">Start Delay</th>
              <th class="text-right">End Delay</th>
              <th class="text-right">Span Var</th>
              <th class="text-right">Runtime Var</th>
            </tr>
          </thead>
          <tbody>
            <!-- 1. Loading State -->
            <tr v-if="loading">
              <td colspan="9" class="empty-cell">
                <div class="loading-state">
                  <svg class="spinner" viewBox="0 0 24 24" fill="none">
                    <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading performance metrics...</span>
                </div>
              </td>
            </tr>

            <!-- 2. Initial State (Before User Runs Query) -->
            <tr v-else-if="!hasSearched">
              <td colspan="9" class="empty-cell initial-prompt-cell">
                <div class="prompt-box">
                  <span class="prompt-icon">🔍</span>
                  <p class="prompt-text">Please select filter criteria above and click <strong>Query</strong> to view performance results.</p>
                </div>
              </td>
            </tr>

            <!-- 3. Empty State (Query Executed, 0 Results Returned) -->
            <tr v-else-if="items.length === 0">
              <td colspan="9" class="empty-cell text-muted">
                No duty data available for selected filters.
              </td>
            </tr>

            <!-- 4. Data Rows -->
            <tr 
              v-else 
              v-for="(row, idx) in items" 
              :key="idx"
              class="data-row"
            >
              <td class="text-left font-medium text-dark whitespace-nowrap">
                {{ row.date }} <span class="subtext">({{ row.day_of_week }})</span>
              </td>
              <td class="text-left text-slate font-medium">{{ row.division }}</td>
              <td class="text-left font-bold text-blue">{{ row.duty_number }}</td>
              <td class="text-center">
                <span class="font-semibold text-dark">{{ row.total_planned_trips }}</span>
                <span v-if="row.unprocessed_trips" class="subtext block">({{ row.unprocessed_trips }} unproc)</span>
              </td>
              <td class="text-center">
                <span 
                  class="badge"
                  :class="row.match_rate_pct >= 90 ? 'badge-emerald' : 'badge-amber'"
                >
                  {{ row.match_rate_pct }}%
                </span>
              </td>
              <!-- Start Delay -->
              <td class="text-right font-medium" :class="row.start_delay_min > 5 ? 'text-red font-bold' : 'text-slate'">
                {{ row.start_delay_min > 0 ? '+' : '' }}{{ row.start_delay_min }} m
              </td>
              <!-- End Delay -->
              <td class="text-right font-medium" :class="row.end_delay_min > 5 ? 'text-red font-bold' : 'text-slate'">
                {{ row.end_delay_min > 0 ? '+' : '' }}{{ row.end_delay_min }} m
              </td>
              <!-- Span Variance -->
              <td class="text-right font-bold" :class="row.span_variance_min > 0 ? 'text-red' : 'text-emerald'">
                {{ row.span_variance_min > 0 ? '+' : '' }}{{ row.span_variance_min }} m
              </td>
              <!-- Runtime Variance -->
              <td class="text-right font-bold" :class="row.runtime_variance_min > 0 ? 'text-amber' : 'text-blue'">
                {{ row.runtime_variance_min > 0 ? '+' : '' }}{{ row.runtime_variance_min }} m
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasSearched: {
    type: Boolean,
    default: false
  }
})

// Summary Calculations
const totalDutyRecords = computed(() => props.items.length)

const avgSpanVariance = computed(() => {
  if (!props.items.length) return 0
  const sum = props.items.reduce((acc, curr) => acc + (curr.span_variance_min || 0), 0)
  return (sum / props.items.length).toFixed(1)
})

const avgRuntimeVariance = computed(() => {
  if (!props.items.length) return 0
  const sum = props.items.reduce((acc, curr) => acc + (curr.runtime_variance_min || 0), 0)
  return (sum / props.items.length).toFixed(1)
})

const avgMatchRate = computed(() => {
  if (!props.items.length) return 0
  const sum = props.items.reduce((acc, curr) => acc + (curr.match_rate_pct || 0), 0)
  return (sum / props.items.length).toFixed(1)
})
</script>

<style scoped>
.visual-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* KPI Overview Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 16px;
}

@media (min-width: 640px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.kpi-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.kpi-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 1.875rem;
  font-weight: 800;
  margin-top: 8px;
  line-height: 1.2;
}

.unit {
  font-size: 1rem;
  font-weight: 400;
  color: #64748b;
}

/* Table Section */
.table-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.data-table th {
  background-color: #f1f5f9;
  color: #475569;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.data-row {
  transition: background-color 0.15s ease;
}

.data-row:hover {
  background-color: #f8fafc;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-gray {
  background-color: #e2e8f0;
  color: #334155;
  font-weight: 600;
}

.badge-emerald {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-amber {
  background-color: #fef3c7;
  color: #92400e;
}

/* Typography Helpers & Color Utility Classes */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.text-dark { color: #0f172a; }
.text-slate { color: #475569; }
.text-muted { color: #94a3b8; }
.text-blue { color: #2563eb; }
.text-red { color: #dc2626; }
.text-emerald { color: #059669; }
.text-amber { color: #d97706; }

.whitespace-nowrap { white-space: nowrap; }
.block { display: block; }

.subtext {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 400;
}

/* Loading & Empty States */
.empty-cell {
  padding: 48px 16px !important;
  text-align: center;
}

.initial-prompt-cell {
  background-color: #f8fafc;
}

.prompt-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.prompt-icon {
  font-size: 1.5rem;
}

.prompt-text {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.prompt-text strong {
  color: #2563eb;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #64748b;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  color: #2563eb;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-head {
  opacity: 0.75;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>