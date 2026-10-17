<template>
  <div class="visualizations-container">
    <!-- Peak PVR Summary KPI Cards -->
    <div class="summary-cards-grid" v-if="summary">
      <div class="kpi-card">
        <span class="kpi-title">Peak PVR</span>
        <div class="kpi-value text-primary">
          {{ summary.peak_pvr != null ? summary.peak_pvr : 0 }}
        </div>
        <span class="kpi-subtext">Max vehicles operating simultaneously</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-title">Peak Window</span>
        <div class="kpi-value text-slate">
          <template v-if="summary.peak_time_start && summary.peak_time_end">
            {{ summary.peak_time_start }} - {{ summary.peak_time_end }}
          </template>
          <template v-else>N/A</template>
        </div>
        <span class="kpi-subtext">Duration of maximum fleet requirement</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-title">Analyzed Blocks</span>
        <div class="kpi-value text-dark">
          {{ summary.total_blocks_analyzed != null ? summary.total_blocks_analyzed : 0 }}
        </div>
        <span class="kpi-subtext">Total distinct vehicle blocks evaluated</span>
      </div>
    </div>

    <!-- PVR Timeline Chart -->
    <div class="viz-card">
      <div class="card-header">
        <h3>PVR Timeline Profile</h3>
        <span class="chart-subtitle">Active Vehicles Operating per Minute of Day</span>
      </div>
      <div class="chart-wrapper">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- PVR Detailed Timeline Table -->
    <div class="viz-card">
      <div class="card-header">
        <h3>PVR Timeline Breakdown</h3>
        <span class="badge-count">{{ data ? data.length : 0 }} Minute Records</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Minute of Day</th>
              <th>Time</th>
              <th>Active Vehicles</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!data || data.length === 0">
              <td colspan="4" class="empty-state">No PVR timeline data available for the current filter criteria.</td>
            </tr>
            <tr v-for="(row, idx) in data" :key="idx" :class="{ 'peak-row': isPeakRow(row.active_vehicles) }">
              <td class="font-medium text-subtle">{{ row.minute_of_day }}</td>
              <td class="font-medium time-cell">{{ row.time_str }}</td>
              <td class="font-semibold">{{ row.active_vehicles }}</td>
              <td>
                <span v-if="isPeakRow(row.active_vehicles) && row.active_vehicles > 0" class="peak-badge">
                  PEAK
                </span>
                <span v-else-if="row.active_vehicles === 0" class="idle-badge">
                  IDLE
                </span>
                <span v-else class="normal-badge">
                  ACTIVE
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  summary: {
    type: Object,
    default: () => ({
      peak_pvr: 0,
      peak_time_start: null,
      peak_time_end: null,
      total_blocks_analyzed: 0
    })
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const isPeakRow = (activeVehicles) => {
  return props.summary && props.summary.peak_pvr > 0 && activeVehicles === props.summary.peak_pvr
}

const updateChart = () => {
  if (!chartCanvas.value) return

  const timelineData = Array.isArray(props.data) ? props.data : []
  
  // Downsample ticks for x-axis readability (display hourly labels)
  const labels = timelineData.map(item => item.time_str)
  const activeVehiclesData = timelineData.map(item => item.active_vehicles)

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Active Vehicles (PVR)',
          data: activeVehiclesData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#1d4ed8'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            title: (items) => `Time: ${items[0].label}`,
            label: (ctx) => `Active Vehicles: ${ctx.raw}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Time of Day' },
          grid: { display: false },
          ticks: {
            maxTicksLimit: 24
          }
        },
        y: {
          title: { display: true, text: 'Active Vehicle Count' },
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  })
}

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  updateChart()
})

onUnmounted(() => {
  if (chartInstance) chartInstance.destroy()
})
</script>

<style scoped>
.visualizations-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.kpi-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 6px 0 2px 0;
}

.text-primary { color: #2563eb; }
.text-slate { color: #0f172a; }
.text-dark { color: #334155; }

.kpi-subtext {
  font-size: 0.78rem;
  color: #94a3b8;
}

.viz-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.chart-subtitle {
  font-size: 0.82rem;
  color: #64748b;
}

.badge-count {
  font-size: 0.75rem;
  background: #f1f5f9;
  color: #475569;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.chart-wrapper {
  position: relative;
  height: 340px;
  width: 100%;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  max-height: 450px;
  margin-top: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.data-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.peak-row {
  background-color: #eff6ff;
}

.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }

.time-cell {
  color: #0f172a;
}

.text-subtle { color: #64748b; font-size: 0.82rem; }

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 30px 0 !important;
}

.peak-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.idle-badge {
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.normal-badge {
  background: #f0fdf4;
  color: #166534;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>