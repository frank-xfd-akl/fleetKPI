<template>
  <div class="visualizations-container">
    <div class="viz-card">
      <div class="card-header">
        <h3>Hourly Distribution & Variance Trend</h3>
        <span class="chart-subtitle">Scheduled Duration vs. Actual Distribution (IQR & Outliers)</span>
      </div>
      <div class="chart-wrapper">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <div class="viz-card">
      <div class="card-header">
        <h3>Corridor Matrix Breakdown</h3>
        <span class="badge-count">{{ data ? data.length : 0 }} Records</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Origin</th>
              <th>Destination</th>
              <th>Departure Hour</th>
              <th>Trip Count</th>
              <th>Sched. Avg (min)</th>
              <th>Actual Avg (min)</th>
              <th>Std Dev (min)</th>
              <th>Min - Max (min)</th>
              <th>COV</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!data || data.length === 0">
              <td colspan="9" class="empty-state">No performance records found for the selected query.</td>
            </tr>
            <tr v-for="(row, idx) in data" :key="idx">
              <td class="font-medium">{{ row.origin }}</td>
              <td class="font-medium">{{ row.destination }}</td>
              <td>{{ formatHour(row.departure_hour) }}</td>
              <td>{{ row.trip_count }}</td>
              <td>{{ row.scheduled_avg_min != null ? row.scheduled_avg_min.toFixed(1) : '0.0' }}</td>
              <td :class="getDurationDeltaClass(row.actual_avg_min, row.scheduled_avg_min)">
                {{ row.actual_avg_min != null ? row.actual_avg_min.toFixed(1) : '0.0' }}
              </td>
              <td class="text-subtle">{{ row.actual_stddev != null ? row.actual_stddev.toFixed(1) : '0.0' }}</td>
              <td class="text-subtle">{{ row.min_max_min }}</td>
              <td>
                <span class="cov-tag" :class="getCovClass(row.actual_cov)">
                  {{ row.actual_cov != null ? row.actual_cov.toFixed(2) : '0.00' }}
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot'

Chart.register(BoxPlotController, BoxAndWiskers)

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  hourlyTrend: {
    type: Array,
    default: () => []
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const formatHour = (hour) => {
  if (hour === undefined || hour === null) return '--:--'
  return `${String(hour).padStart(2, '0')}:00`
}

const updateChart = () => {
  if (!chartCanvas.value) return

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const scheduledAvgData = new Array(24).fill(null)
  const boxplotData = new Array(24).fill(null)

  const sourceTrend = (props.hourlyTrend && props.hourlyTrend.length > 0) 
    ? props.hourlyTrend 
    : props.data

  if (Array.isArray(sourceTrend)) {
    sourceTrend.forEach(item => {
      const h = item.departure_hour
      if (h >= 0 && h < 24) {
        scheduledAvgData[h] = item.scheduled_avg_min
        if (item.stats) {
          boxplotData[h] = {
            min: item.stats.min,
            q1: item.stats.q1,
            median: item.stats.median,
            q3: item.stats.q3,
            max: item.stats.max,
            whiskerLow: item.stats.whiskerLow ?? item.stats.min,
            whiskerHigh: item.stats.whiskerHigh ?? item.stats.max
          }
        }
      }
    })
  }

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'boxplot',
    data: {
      labels: hours.map(formatHour),
      datasets: [
        {
          type: 'line',
          label: 'Scheduled Duration (Avg)',
          data: scheduledAvgData,
          borderColor: '#ef4444',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#ef4444',
          fill: false,
          tension: 0.3
        },
        {
          type: 'boxplot',
          label: 'Actual Duration Distribution',
          data: boxplotData,
          backgroundColor: 'rgba(37, 99, 235, 0.4)',
          borderColor: '#1d4ed8',
          borderWidth: 1.5,
          itemRadius: 2
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
            label: (ctx) => {
              if (ctx.dataset.type === 'line') {
                return `Scheduled Avg: ${ctx.raw} mins`
              }
              const stats = ctx.raw
              if (!stats) return ''
              return [
                `Max: ${stats.max}m`,
                `Q3 (75%): ${stats.q3}m`,
                `Median: ${stats.median}m`,
                `Q1 (25%): ${stats.q1}m`,
                `Min: ${stats.min}m`
              ]
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Departure Hour' },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'Duration (Minutes)' },
          beginAtZero: true
        }
      }
    }
  })
}

const getDurationDeltaClass = (actual, scheduled) => {
  if (!actual || !scheduled) return ''
  if (actual > scheduled * 1.15) return 'text-danger'
  if (actual < scheduled * 0.9) return 'text-success'
  return ''
}

const getCovClass = (cov) => {
  if (!cov) return 'cov-low'
  if (cov <= 0.2) return 'cov-low'
  if (cov <= 0.4) return 'cov-mid'
  return 'cov-high'
}

watch([() => props.data, () => props.hourlyTrend], () => {
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
.visualizations-container { display: flex; flex-direction: column; gap: 24px; }
.viz-card { background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
.chart-subtitle { font-size: 0.82rem; color: #64748b; }
.badge-count { font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
.chart-wrapper { position: relative; height: 320px; width: 100%; }
.table-responsive { width: 100%; overflow-x: auto; max-height: 450px; margin-top: 12px; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
.data-table th { background-color: #f8fafc; color: #475569; font-weight: 600; padding: 10px 12px; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 1; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.font-medium { font-weight: 600; }
.text-subtle { color: #64748b; font-size: 0.82rem; }
.text-danger { color: #dc2626; font-weight: 600; }
.text-success { color: #16a34a; font-weight: 600; }
.empty-state { text-align: center; color: #94a3b8; padding: 30px 0 !important; }
.cov-tag { padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
.cov-low { background: #dcfce7; color: #15803d; }
.cov-mid { background: #fef3c7; color: #b45309; }
.cov-high { background: #fee2e2; color: #b91c1c; }
</style>