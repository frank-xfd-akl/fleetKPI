<template>
  <div class="section-card output-section">
    <div class="output-header">
      <h3 class="section-title">2. Calculation Results</h3>
      <div v-if="resultsData.length > 0" class="results-actions">
        <span class="record-count">{{ resultsData.length }} result(s) calculated</span>
        <button class="btn-secondary btn-sm" @click="downloadCSV">Export CSV</button>
      </div>
    </div>

    <!-- Processing Loading Indicator -->
    <div v-if="isCalculating" class="status-box">
      <div class="spinner large"></div>
      <p>Querying TomTom Matrix API across time windows...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="resultsData.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <p>No calculated data available yet.</p>
    </div>

    <!-- Dynamic Output Table -->
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Timeband</th>
            <th>Depart At</th>
            <th>Start Code</th>
            <th>End Code</th>
            <th>Duration (min)</th>
            <th>Distance (km)</th>
            <th>Mode</th>
            <th>Traffic</th>
            <th>Route Type</th>
            <th>Route Path</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in resultsData" :key="idx">
            <td class="font-bold">{{ row.timeband_name ?? '-' }}</td>
            <td class="font-mono text-subtle">{{ row.depart_at_datetime ?? '-' }}</td>
            <td class="font-mono">{{ row.starting_place_code ?? '-' }}</td>
            <td class="font-mono">{{ row.ending_place_code ?? '-' }}</td>
            <td class="font-bold text-primary">{{ row.travel_time_minutes ?? '-' }}</td>
            <td class="font-bold">{{ row.distance_km ?? '-' }}</td>
            <td><span class="badge">{{ row.travel_mode ?? '-' }}</span></td>
            <td><span class="badge">{{ row.traffic_model ?? '-' }}</span></td>
            <td><span class="badge">{{ row.route_type ?? '-' }}</span></td>
            <td>
              <button 
                class="btn-route-action"
                :disabled="!hasValidPolyline(row.polyline_path)"
                :title="!hasValidPolyline(row.polyline_path) ? 'Polylines unavailable in Matrix v2' : 'View map route'"
                @click="openMapModal(row)"
              >
                🗺️ View Route
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Route Map Modal Overlay -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeMapModal">
      <div class="modal-container">
        <div class="modal-header">
          <h4>
            Route Path: 
            <span class="font-mono">{{ activeRow?.starting_place_code }}</span> ➔ 
            <span class="font-mono">{{ activeRow?.ending_place_code }}</span>
            <span v-if="activeRow?.timeband_name" class="modal-timeband-tag">({{ activeRow.timeband_name }})</span>
          </h4>
          <button class="modal-close-btn" @click="closeMapModal">✖</button>
        </div>
        
        <div class="modal-body">
          <div id="mapContainer" ref="mapContainerRef" class="map-view"></div>
        </div>
        
        <div class="modal-footer">
          <span>Distance: <strong>{{ activeRow?.distance_km }} km</strong> | Duration: <strong>{{ activeRow?.travel_time_minutes }} min</strong></span>
          <button class="btn-secondary btn-sm" @click="closeMapModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  resultsData: { type: Array, default: () => [] },
  isCalculating: { type: Boolean, default: false }
})

const showModal = ref(false)
const activeRow = ref(null)
const mapContainerRef = ref(null)
let leafletMap = null

// Helper to check if row has a non-empty polyline path array
const hasValidPolyline = (polylinePath) => {
  if (!polylinePath || polylinePath === '[]') return false
  if (Array.isArray(polylinePath)) return polylinePath.length > 0
  if (typeof polylinePath === 'string') {
    try {
      const parsed = JSON.parse(polylinePath)
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return false
    }
  }
  return false
}

// Inject Leaflet CSS dynamically into head if missing
onMounted(() => {
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
})

// Dynamically load Leaflet JS script when modal opens
const loadLeafletScript = () => {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    document.head.appendChild(script)
  })
}

const openMapModal = async (row) => {
  if (!hasValidPolyline(row.polyline_path)) return

  activeRow.value = row
  showModal.value = true

  await nextTick()
  const L = await loadLeafletScript()

  let rawPath = row.polyline_path
  if (typeof rawPath === 'string') {
    try { rawPath = JSON.parse(rawPath) } catch { rawPath = [] }
  }

  if (!rawPath || rawPath.length === 0) return

  const latLngs = rawPath.map(p => Array.isArray(p) ? p : [p.latitude || p.lat, p.longitude || p.lng])

  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }

  leafletMap = L.map(mapContainerRef.value)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(leafletMap)

  const polyline = L.polyline(latLngs, { color: '#2563eb', weight: 5, opacity: 0.8 }).addTo(leafletMap)

  L.marker(latLngs[0]).addTo(leafletMap).bindPopup(`Start: ${row.starting_place_code}`)
  L.marker(latLngs[latLngs.length - 1]).addTo(leafletMap).bindPopup(`End: ${row.ending_place_code}`)

  leafletMap.fitBounds(polyline.getBounds(), { padding: [40, 40] })
}

const closeMapModal = () => {
  showModal.value = false
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
}

const downloadCSV = () => {
  if (props.resultsData.length === 0) return

  const csvHeaders = [
    'start_code',
    'end_code',
    'Duration_AM_peak_min',
    'AM_Distance_Km',
    'Duration_Inter_peak_min',
    'Inter_Distance_Km',
    'Duration_PM_peak_min',
    'PM_Distance_Km',
    'Duration_Night_min',
    'Night_Distance_Km'
  ]

  const groupedPairs = new Map()

  props.resultsData.forEach(row => {
    const pairKey = `${row.starting_place_code}_${row.ending_place_code}`

    if (!groupedPairs.has(pairKey)) {
      groupedPairs.set(pairKey, {
        start_code: row.starting_place_code ?? '',
        end_code: row.ending_place_code ?? '',
        timebands: {}
      })
    }

    const entry = groupedPairs.get(pairKey)
    
    // Normalize timeband string: replace underscores with spaces & lowercase
    // e.g., "AM_peak", "AM Peak", "am_peak" all become "am peak"
    const rawTb = row.timeband_name ? String(row.timeband_name).replace(/_/g, ' ').trim().toLowerCase() : ''

    if (rawTb.includes('am')) {
      entry.timebands['Duration_AM_peak_min'] = row.travel_time_minutes ?? ''
      entry.timebands['AM_Distance_Km'] = row.distance_km ?? ''
    } else if (rawTb.includes('inter')) {
      entry.timebands['Duration_Inter_peak_min'] = row.travel_time_minutes ?? ''
      entry.timebands['Inter_Distance_Km'] = row.distance_km ?? ''
    } else if (rawTb.includes('pm')) {
      entry.timebands['Duration_PM_peak_min'] = row.travel_time_minutes ?? ''
      entry.timebands['PM_Distance_Km'] = row.distance_km ?? ''
    } else if (rawTb.includes('night')) {
      entry.timebands['Duration_Night_min'] = row.travel_time_minutes ?? ''
      entry.timebands['Night_Distance_Km'] = row.distance_km ?? ''
    }
  })

  // Build CSV payload
  const csvLines = [csvHeaders.join(',')]

  groupedPairs.forEach(pair => {
    const rowValues = [
      `"${pair.start_code}"`,
      `"${pair.end_code}"`,
      `"${pair.timebands['Duration_AM_peak_min'] ?? ''}"`,
      `"${pair.timebands['AM_Distance_Km'] ?? ''}"`,
      `"${pair.timebands['Duration_Inter_peak_min'] ?? ''}"`,
      `"${pair.timebands['Inter_Distance_Km'] ?? ''}"`,
      `"${pair.timebands['Duration_PM_peak_min'] ?? ''}"`,
      `"${pair.timebands['PM_Distance_Km'] ?? ''}"`,
      `"${pair.timebands['Duration_Night_min'] ?? ''}"`,
      `"${pair.timebands['Night_Distance_Km'] ?? ''}"`
    ]
    csvLines.push(rowValues.join(','))
  })

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `deadhead_matrix_pivoted_${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.section-card { background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); padding: 20px 24px; }
.section-title { margin: 0 0 4px 0; font-size: 1.05rem; color: #0f172a; }
.output-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.results-actions { display: flex; align-items: center; gap: 12px; }
.record-count { font-size: 0.8rem; color: #64748b; font-weight: 500; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
.status-box { display: flex; flex-direction: column; align-items: center; padding: 40px 0; color: #475569; font-size: 0.88rem; }
.table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 6px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; text-align: left; }
.data-table th { background-color: #f8fafc; color: #475569; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; white-space: nowrap; }
.data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
.data-table tr:hover { background-color: #f8fafc; }
.font-mono { font-family: monospace; }
.font-bold { font-weight: 600; }
.text-subtle { color: #64748b; font-size: 0.78rem; }
.text-primary { color: #2563eb; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.btn-secondary { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-sm { height: 30px; padding: 0 12px; font-size: 0.78rem; }

.btn-route-action {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-route-action:hover:not(:disabled) { background-color: #dbeafe; }
.btn-route-action:disabled { opacity: 0.4; cursor: not-allowed; background-color: #f1f5f9; border-color: #e2e8f0; color: #94a3b8; }

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-container {
  background: #ffffff;
  border-radius: 10px;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h4 { margin: 0; font-size: 0.98rem; color: #0f172a; }
.modal-timeband-tag { margin-left: 6px; color: #64748b; font-weight: normal; font-size: 0.85rem; }
.modal-close-btn { background: none; border: none; font-size: 1rem; color: #64748b; cursor: pointer; }
.modal-body { padding: 12px; }
.map-view { width: 100%; height: 420px; border-radius: 6px; }
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #475569;
}
.spinner.large { width: 24px; height: 24px; border: 2px solid rgba(37, 99, 235, 0.2); border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>