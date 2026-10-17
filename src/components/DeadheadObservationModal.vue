<template>
  <div v-if="isOpen" class="modal-backdrop">
    <div class="modal-container split-modal">
      
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Observation Details & Spatial Path Analysis</h3>
          <p class="modal-subtitle">
            <span class="highlight">{{ context.origin }}</span> ({{ context.originDesc }})
            &nbsp;➔&nbsp;
            <span class="highlight">{{ context.destination }}</span> ({{ context.destDesc }})
            <span class="period-badge">{{ context.period }}</span>
          </p>
        </div>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <!-- Body: Split Layout -->
      <div class="modal-body split-body">
        
        <!-- Left Pane: Table (60%) -->
        <div class="left-pane">
          <div v-if="loading" class="state-container">
            <div class="spinner"></div>
            <span>Loading observation details...</span>
          </div>

          <div v-else-if="records.length === 0" class="state-container text-muted">
            No observations found for this selection.
          </div>

          <div v-else class="table-wrapper">
            <table class="modal-table">
              <thead>
                <tr>
                  <th class="text-left">Date</th>
                  <th class="text-left">Day</th>
                  <th class="text-left">Duty #</th>
                  <th class="text-left">Asset</th>
                  <th class="text-center">Sched Window</th>
                  <th class="text-center">Actual Window</th>
                  <th class="text-right">Sched Dur</th>
                  <th class="text-right">Act Dur</th>
                  <th class="text-right">Var</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="row in records" 
                  :key="row.task_id || row.id" 
                  class="modal-row"
                  :class="{ 'row-active': selectedTaskId === (row.task_id || row.id) }"
                >
                  <td class="text-left font-medium text-dark">{{ row.date }}</td>
                  <td class="text-left text-slate">{{ row.day_of_week }}</td>
                  <td class="text-left font-bold text-blue">{{ row.duty_number }}</td>
                  <td class="text-left text-slate">{{ row.asset_code }}</td>
                  <td class="text-center text-slate">
                    {{ row.sched_start || '-' }}–{{ row.sched_end || '-' }}
                  </td>
                  <td class="text-center font-medium">
                    {{ row.actual_start || '-' }}–{{ row.actual_end || '-' }}
                  </td>

                  <!-- Scheduled Duration -->
                  <td class="text-right font-medium text-slate">
                    {{ row.sched_duration_min != null ? `${row.sched_duration_min}m` : '-' }}
                  </td>

                  <!-- Actual Duration -->
                  <td class="text-right font-bold text-dark">
                    {{ row.actual_duration_min != null ? `${row.actual_duration_min}m` : '-' }}
                  </td>

                  <!-- Variance -->
                  <td 
                    class="text-right font-bold"
                    :class="row.variance_min > 0 ? 'text-red' : row.variance_min < 0 ? 'text-emerald' : 'text-slate'"
                  >
                    {{ row.variance_min > 0 ? '+' : '' }}{{ row.variance_min }}m
                  </td>

                  <td class="text-center">
                    <button 
                      class="btn-path-action"
                      :class="{ 'btn-path-active': selectedTaskId === (row.task_id || row.id) }"
                      @click="handleSelectPath(row)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                      </svg>
                      Path
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Pane: Telemetry (Map + Speed Line Chart) (40%) -->
        <div class="right-pane">
          <!-- Placeholder State -->
          <div v-if="!selectedTaskId" class="state-container text-muted placeholder-pane">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            <p>Select a trip row on the left to inspect spatial route and speed variance profile.</p>
          </div>

          <!-- Loading State -->
          <div v-else-if="pathLoading" class="state-container">
            <div class="spinner"></div>
            <span>Fetching spatial telemetry path...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="pathError" class="state-container text-red">
            {{ pathError }}
          </div>

          <!-- Main Visualizations Container -->
          <div 
            v-show="selectedTaskId && !pathLoading && !pathError" 
            class="telemetry-container"
          >
            <!-- Map Container -->
            <div class="map-wrapper">
              <div ref="mapElement" class="map-instance"></div>
            </div>

            <!-- Speed Profile Line Chart -->
            <div class="chart-wrapper">
              <h4 class="chart-title">Speed Profile (km/h)</h4>
              <div class="canvas-container">
                <canvas ref="chartElement"></canvas>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <span class="record-count">{{ records.length }} observation(s) loaded</span>
        <button class="btn-secondary" @click="close">Close</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  CategoryScale
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, Tooltip, CategoryScale)

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  context: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const records = ref([])

const selectedTaskId = ref(null)
const pathLoading = ref(false)
const pathError = ref(null)
const pathPoints = ref([])

const mapElement = ref(null)
const chartElement = ref(null)
let leafletMap = null
let polylineLayer = null
let markerGroup = null
let speedChartInstance = null

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedTaskId.value = null
    pathPoints.value = []
    pathError.value = null
    fetchObservationDetails()
  } else {
    destroyVisualizations()
  }
})

watch(mapElement, async (el) => {
  if (el && pathPoints.value.length > 0) {
    await nextTick()
    renderMapAndChart()
  }
})

const fetchObservationDetails = async () => {
  if (!props.context.origin || !props.context.destination || !props.context.period) return

  loading.value = true
  records.value = []

  try {
    const query = new URLSearchParams({
      origin: props.context.origin,
      destination: props.context.destination,
      period: props.context.period
    })

    if (props.context.startDate) query.append('startDate', props.context.startDate)
    if (props.context.endDate) query.append('endDate', props.context.endDate)
    if (props.context.daysOfWeek && props.context.daysOfWeek.length) {
      props.context.daysOfWeek.forEach(dow => query.append('daysOfWeek', dow))
    }

    const res = await fetch(`/api/v1/deadheads/observations?${query.toString()}`)
    if (res.ok) {
      records.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch observation details:', err)
  } finally {
    loading.value = false
  }
}

const handleSelectPath = async (row) => {
  const taskId = row.task_id || row.id
  if (selectedTaskId.value === taskId) return
  
  selectedTaskId.value = taskId
  pathLoading.value = true
  pathError.value = null
  pathPoints.value = []

  try {
    const res = await fetch(`/api/v1/deadheads/observations/${taskId}/path`)
    if (!res.ok) throw new Error(`HTTP ${res.status}: Path not found`)
    
    const data = await res.json()

    if (Array.isArray(data.path)) {
      pathPoints.value = data.path
    } else if (Array.isArray(data)) {
      pathPoints.value = data
    } else {
      pathPoints.value = []
    }

    if (pathPoints.value.length === 0) {
      pathError.value = "No GPS coordinates recorded for this trip."
      return
    }

    pathLoading.value = false
    await nextTick()
    renderMapAndChart()
  } catch (err) {
    console.error('Failed to fetch trip path:', err)
    pathError.value = "Failed to load path geometry for this observation."
    pathLoading.value = false
  }
}

const renderMapAndChart = () => {
  renderLeafletMap()
  renderSpeedChart()
}

const renderLeafletMap = () => {
  if (!mapElement.value || pathPoints.value.length === 0) return

  const validPoints = pathPoints.value.filter(pt => typeof pt.lat === 'number' && typeof pt.lon === 'number')
  if (validPoints.length === 0) return

  const latLngs = validPoints.map(pt => [pt.lat, pt.lon])

  if (!leafletMap) {
    leafletMap = L.map(mapElement.value).setView(latLngs[0], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(leafletMap)

    markerGroup = L.layerGroup().addTo(leafletMap)
  } else {
    markerGroup.clearLayers()
    if (polylineLayer) leafletMap.removeLayer(polylineLayer)
  }

  polylineLayer = L.polyline(latLngs, {
    color: '#2563eb',
    weight: 4,
    opacity: 0.85
  }).addTo(leafletMap)

  const startPt = validPoints[0]
  L.circleMarker([startPt.lat, startPt.lon], {
    radius: 7,
    fillColor: '#16a34a',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 1
  }).addTo(markerGroup).bindPopup(`<b>Start Trip</b><br>Time: ${formatTime(startPt.ping_time)}`)

  const endPt = validPoints[validPoints.length - 1]
  L.circleMarker([endPt.lat, endPt.lon], {
    radius: 7,
    fillColor: '#dc2626',
    color: '#ffffff',
    weight: 2,
    fillOpacity: 1
  }).addTo(markerGroup).bindPopup(`<b>End Trip</b><br>Time: ${formatTime(endPt.ping_time)}`)

  validPoints.forEach((pt) => {
    if (['VehicleStopped', 'DriverLogin', 'DriverLogout'].includes(pt.event_type)) {
      const color = pt.event_type === 'VehicleStopped' ? '#f59e0b' : '#8b5cf6'
      L.circleMarker([pt.lat, pt.lon], {
        radius: 4,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        fillOpacity: 0.9
      }).addTo(markerGroup).bindPopup(`<b>${pt.event_type}</b><br>Time: ${formatTime(pt.ping_time)}<br>Speed: ${pt.speed} km/h`)
    }
  })

  leafletMap.fitBounds(polylineLayer.getBounds(), { padding: [30, 30] })
  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize()
  }, 100)
}

const renderSpeedChart = () => {
  if (!chartElement.value || pathPoints.value.length === 0) return

  if (speedChartInstance) {
    speedChartInstance.destroy()
  }

  const labels = pathPoints.value.map(pt => formatTime(pt.ping_time))
  const speeds = pathPoints.value.map(pt => pt.speed ?? 0)

  const ctx = chartElement.value.getContext('2d')
  speedChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Speed (km/h)',
        data: speeds,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, font: { size: 10 } }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'km/h', font: { size: 10 } },
          ticks: { font: { size: 10 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Speed: ${ctx.parsed.y} km/h`
          }
        }
      }
    }
  })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  if (timeStr.includes(' ')) {
    return timeStr.split(' ')[1].substring(0, 8)
  }
  if (timeStr.includes('T')) {
    return timeStr.split('T')[1].substring(0, 8)
  }
  return timeStr
}

const destroyVisualizations = () => {
  if (speedChartInstance) {
    speedChartInstance.destroy()
    speedChartInstance = null
  }
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    polylineLayer = null
    markerGroup = null
  }
}

onBeforeUnmount(() => {
  destroyVisualizations()
})

const close = () => emit('close')
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-container.split-modal {
  background: #ffffff;
  width: 96vw;
  max-width: 1600px;
  height: 88vh;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}
.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.modal-subtitle { margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; }
.highlight { font-weight: 700; color: #0f172a; }
.period-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 700;
  font-size: 0.75rem;
  border-radius: 4px;
}
.close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }

.split-body {
  display: flex;
  flex: 1;
  padding: 0 !important;
  overflow: hidden;
}

.left-pane {
  width: 60%;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.right-pane {
  width: 40%;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.table-wrapper { 
  overflow: auto; 
  width: 100%;
  height: 100%;
  position: relative;
}

.modal-table { 
  width: 100%; 
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.82rem; 
}

.modal-table th { 
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f1f5f9; 
  color: #475569; 
  font-weight: 600; 
  font-size: 0.72rem; 
  text-transform: uppercase; 
  padding: 10px 8px; 
  border-bottom: 1px solid #cbd5e1; 
  white-space: nowrap;
}

.modal-table td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.modal-row:hover { background-color: #f1f5f9; }
.modal-row.row-active { background-color: #eff6ff; }

.btn-path-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}
.btn-path-action:hover {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}
.btn-path-action.btn-path-active {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.placeholder-pane {
  flex-direction: column;
  gap: 12px;
  font-size: 0.9rem;
  max-width: 320px;
  margin: auto;
}
.telemetry-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.map-wrapper {
  flex: 1.2;
  position: relative;
  border-bottom: 1px solid #e2e8f0;
  min-height: 250px;
}
.map-instance {
  width: 100%;
  height: 100%;
}
.chart-wrapper {
  flex: 0.8;
  padding: 12px 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}
.chart-title {
  margin: 0 0 8px 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}
.canvas-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

.modal-footer { 
  padding: 12px 24px; 
  border-top: 1px solid #e2e8f0; 
  background-color: #f8fafc; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}
.record-count { font-size: 0.8rem; color: #64748b; }
.btn-secondary { background: #ffffff; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn-secondary:hover { background: #f1f5f9; }

.state-container { padding: 40px; text-align: center; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 10px; height: 100%; }
.spinner { width: 18px; height: 18px; border: 2px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.text-dark { color: #0f172a; }
.text-slate { color: #475569; }
.text-blue { color: #2563eb; }
.text-red { color: #dc2626; }
.text-emerald { color: #059669; }
</style>