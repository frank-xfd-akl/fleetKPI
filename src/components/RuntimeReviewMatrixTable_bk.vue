<template>
  <div class="matrix-card">
    <div class="table-container">
      <table class="matrix-table">
        <thead>
          <tr class="header-row">
            <!-- 1. Route Number + Filter -->
            <th class="sticky-col col-route">
              <div class="header-filter-wrapper">
                <span>Route</span>
                <input
                  v-model="searchRoute"
                  type="text"
                  placeholder="Filter..."
                  class="header-filter-input"
                />
              </div>
            </th>

            <!-- 2. Origin Code -->
            <th class="sticky-col col-origin">Origin</th>
            
            <!-- 3. Origin Description + Filter -->
            <th class="sticky-col col-org-desc">
              <div class="header-filter-wrapper">
                <span>Origin Desc</span>
                <input
                  v-model="searchOrgDesc"
                  type="text"
                  placeholder="Filter..."
                  class="header-filter-input"
                />
              </div>
            </th>

            <!-- 4. Destination Code -->
            <th class="sticky-col col-dest">Destination</th>

            <!-- 5. Destination Description + Filter -->
            <th class="sticky-col col-dest-desc">
              <div class="header-filter-wrapper">
                <span>Dest Desc</span>
                <input
                  v-model="searchDestDesc"
                  type="text"
                  placeholder="Filter..."
                  class="header-filter-input"
                />
              </div>
            </th>

            <!-- 6. Hour Column -->
            <th class="sticky-col col-hour">Hour</th>

            <!-- 7-15. Fixed 9 Metric Columns -->
            <th title="Number of Observations"># Obs</th>
            <th title="Average Scheduled Runtime">Sched Avg</th>
            <th title="Average Actual Runtime">Avg Actual</th>
            <th title="Minimum Actual Runtime">Min</th>
            <th title="Maximum Actual Runtime">Max</th>
            <th title="Median Actual Runtime">Median</th>
            <th title="75th Percentile Actual Runtime">P75</th>
            <th title="Standard Deviation">Std Dev</th>
            <th title="Coefficient of Variation">COV</th>
          </tr>
        </thead>

        <tbody>
          <!-- Iterate over each corridor -->
          <template v-for="(row, rowIdx) in filteredData" :key="getRowKey(row, rowIdx)">
            <template v-if="getCorridorHours(row).length > 0">
              <!-- Iterate over each departure hour present for this corridor -->
              <tr 
                v-for="(hour, hIdx) in getCorridorHours(row)" 
                :key="rowIdx + '-' + hour"
                :class="{ 'corridor-border-bottom': hIdx === getCorridorHours(row).length - 1 }"
              >
                <!-- Group Corridor details across all its hourly rows using rowspan -->
                <td v-if="hIdx === 0" :rowspan="getCorridorHours(row).length" class="font-bold sticky-col col-route corridor-cell">
                  {{ row.route_number }}
                </td>
                <td v-if="hIdx === 0" :rowspan="getCorridorHours(row).length" class="font-bold sticky-col col-origin corridor-cell">
                  {{ row.origin }}
                </td>
                <td v-if="hIdx === 0" :rowspan="getCorridorHours(row).length" class="sticky-col col-org-desc corridor-cell">
                  {{ row.org_desc }}
                </td>
                <td v-if="hIdx === 0" :rowspan="getCorridorHours(row).length" class="font-bold sticky-col col-dest corridor-cell">
                  {{ row.destination }}
                </td>
                <td v-if="hIdx === 0" :rowspan="getCorridorHours(row).length" class="sticky-col col-dest-desc corridor-cell">
                  {{ row.dest_desc }}
                </td>

                <!-- Hour Column -->
                <td class="font-bold sticky-col col-hour hour-cell">
                  {{ hour }}
                </td>

                <!-- 9 Metric Columns -->
                <td>{{ getMetric(row, hour, 'observations') }}</td>
                <td>{{ getMetric(row, hour, 'avg_scheduled') }}</td>
                <td>{{ getMetric(row, hour, 'avg_actual') }}</td>
                <td>{{ getMetric(row, hour, 'min_actual') }}</td>
                <td>{{ getMetric(row, hour, 'max_actual') }}</td>
                <td>{{ getMetric(row, hour, 'median') }}</td>
                <td>{{ getMetric(row, hour, 'p75') }}</td>
                <td>{{ getMetric(row, hour, 'std_dev') }}</td>
                <td>{{ getMetric(row, hour, 'cov') }}</td>
              </tr>
            </template>
          </template>

          <!-- Empty State -->
          <tr v-if="filteredData.length === 0">
            <td colspan="15" class="empty-state">
              No runtime records found matching the applied filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

// Header Filters
const searchRoute = ref('')
const searchOrgDesc = ref('')
const searchDestDesc = ref('')

// Filter data by Route, Origin Desc, Dest Desc
const filteredData = computed(() => {
  if (!props.data) return []

  const routeQuery = searchRoute.value.trim().toLowerCase()
  const orgQuery = searchOrgDesc.value.trim().toLowerCase()
  const destQuery = searchDestDesc.value.trim().toLowerCase()

  return props.data.filter(row => {
    const routeStr = String(row.route_number || '').toLowerCase()
    const matchRoute = !routeQuery || routeStr.includes(routeQuery)
    const matchOrg = !orgQuery || (row.org_desc && row.org_desc.toLowerCase().includes(orgQuery))
    const matchDest = !destQuery || (row.dest_desc && row.dest_desc.toLowerCase().includes(destQuery))
    
    return matchRoute && matchOrg && matchDest
  })
})

// Get sorted list of hours for a specific corridor row
const getCorridorHours = (row) => {
  if (!row || !row.hours) return []
  return Object.keys(row.hours).sort()
}

const getRowKey = (row, index) => {
  return `${row.route_number || ''}-${row.origin || ''}-${row.destination || ''}-${index}`
}

const getMetric = (row, hour, key) => {
  if (row.hours && row.hours[hour]) {
    const val = row.hours[hour][key]
    return val !== undefined && val !== null ? val : '-'
  }
  return '-'
}
</script>

<style scoped>
.matrix-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 16px;
  margin-top: 20px;
}

.table-container {
  overflow-x: auto;
  max-height: 75vh;
  max-width: 100%;
}

.matrix-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 0.82rem;
  white-space: nowrap;
}

.matrix-table th, 
.matrix-table td {
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  padding: 6px 12px;
  text-align: center;
}

.matrix-table th {
  background-color: #f8fafc;
  color: #334155;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  border-top: 1px solid #cbd5e1;
}

/* Sticky Left Columns */
.sticky-col {
  position: sticky;
  background-color: #ffffff;
  z-index: 5;
}

.col-route { left: 0; min-width: 80px; }
.col-origin { left: 80px; min-width: 65px; }
.col-org-desc { left: 145px; min-width: 120px; }
.col-dest { left: 265px; min-width: 65px; }
.col-dest-desc { left: 330px; min-width: 120px; }
.col-hour { 
  left: 450px; 
  min-width: 70px; 
  border-right: 2px solid #94a3b8 !important; 
}

th.sticky-col { z-index: 20 !important; }

/* Corridor cells & thick border separating corridors */
.corridor-cell {
  vertical-align: top;
  background-color: #ffffff;
  border-bottom: 2px solid #64748b !important;
}

.corridor-border-bottom td {
  border-bottom: 2px solid #64748b !important;
}

.hour-cell {
  background-color: #f8fafc;
  color: #0f172a;
}

.highlight-header {
  color: #1e40af;
  background-color: #eff6ff !important;
}

.highlight-p75 {
  font-weight: 700;
  color: #1e40af;
  background-color: #eff6ff;
}

.header-filter-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.header-filter-input {
  width: 100%;
  min-width: 70px;
  padding: 2px 5px;
  font-size: 0.72rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
  background-color: #ffffff;
}

.font-bold { font-weight: 700; }

.empty-state {
  padding: 30px;
  color: #94a3b8;
}

/* Hover effects across hourly rows */
.matrix-table tbody tr:hover td {
  background-color: #f1f5f9 !important;
}
</style>