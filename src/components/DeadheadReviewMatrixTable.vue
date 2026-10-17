<template>
  <div class="matrix-card">
    <div class="table-container">
      <table class="matrix-table">
        <thead>
          <!-- Top Header: Operational Period Groups & Column Labels -->
          <tr class="header-row-top">
            <th rowspan="2" class="sticky-col sticky-corner">origin</th>
            
            <!-- Column 2: org_desc + Search Filter -->
            <th rowspan="2" class="sticky-col sticky-corner">
              <div class="header-filter-wrapper">
                <span>org_desc</span>
                <input
                  v-model="searchOrgDesc"
                  type="text"
                  placeholder="Filter org..."
                  class="header-filter-input"
                />
              </div>
            </th>

            <th rowspan="2" class="sticky-col sticky-corner">destination</th>

            <!-- Column 4: dest_desc + Search Filter -->
            <th rowspan="2" class="sticky-col sticky-corner">
              <div class="header-filter-wrapper">
                <span>dest_desc</span>
                <input
                  v-model="searchDestDesc"
                  type="text"
                  placeholder="Filter dest..."
                  class="header-filter-input"
                />
              </div>
            </th>

            <!-- Updated colspan from 7 to 8 to accommodate Sched Avg -->
            <th 
              v-for="period in periods" 
              :key="period" 
              colspan="8" 
              :class="['period-header', getPeriodCssClass(period)]"
            >
              {{ period }}
            </th>
          </tr>

          <!-- Sub Header: Metric Names -->
          <tr class="header-row-bottom">
            <template v-for="period in periods" :key="period + '-metrics'">
              <th :class="getPeriodCssClass(period)">#Obs</th>
              <th :class="getPeriodCssClass(period)">Sched Avg</th>
              <th :class="getPeriodCssClass(period)">P25</th>
              <th :class="getPeriodCssClass(period)">P75</th>
              <th :class="getPeriodCssClass(period)">median</th>
              <th :class="getPeriodCssClass(period)">Avg</th>
              <th :class="getPeriodCssClass(period)">Std</th>
              <th :class="getPeriodCssClass(period)">COV</th>
            </template>
          </tr>
        </thead>

        <tbody>
          <!-- Iterate over filteredData instead of props.data -->
          <tr v-for="row in filteredData" :key="row.origin + '-' + row.destination">
            <td class="font-bold sticky-col">{{ row.origin }}</td>
            <td class="sticky-col">{{ row.org_desc }}</td>
            <td class="font-bold sticky-col">{{ row.destination }}</td>
            <td class="sticky-col">{{ row.dest_desc }}</td>

            <template v-for="period in periods" :key="period">
              <!-- #Obs Cell: Clickable button when > 0 -->
              <td :class="getPeriodCssClass(period)">
                <button
                  v-if="hasObservations(row, period)"
                  class="obs-clickable-badge"
                  title="Click to view detailed observations"
                  @click="openModal(row, period)"
                >
                  {{ getMetric(row, period, 'observations') }}
                </button>
                <span v-else class="text-muted-obs">
                  {{ getMetric(row, period, 'observations') }}
                </span>
              </td>

              <!-- Scheduled Average Metric -->
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'sched_average') }}</td>

              <!-- Remaining Actual Metrics -->
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'p25') }}</td>
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'p75') }}</td>
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'median') }}</td>
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'average') }}</td>
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'std_dev') }}</td>
              <td :class="getPeriodCssClass(period)">{{ getMetric(row, period, 'cov') }}</td>
            </template>
          </tr>

          <!-- Empty state when no data matches search filters or prop is empty -->
          <tr v-if="filteredData.length === 0">
            <td :colspan="4 + (periods.length * 8)" class="empty-state">
              No trip review records found matching filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Observation Detail Pop-up Modal -->
    <DeadheadObservationModal
      :is-open="isModalOpen"
      :context="selectedContext"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DeadheadObservationModal from './DeadheadObservationModal.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  daysOfWeek: { type: Array, default: () => [] }
})

// Modal State
const isModalOpen = ref(false)
const selectedContext = ref({})

// Reactive local search queries
const searchOrgDesc = ref('')
const searchDestDesc = ref('')

const periods = ['AM_peak', 'Inter_peak', 'PM_peak', 'Night']

// Client-side instant keyword filter
const filteredData = computed(() => {
  if (!props.data) return []

  const orgQuery = searchOrgDesc.value.trim().toLowerCase()
  const destQuery = searchDestDesc.value.trim().toLowerCase()

  return props.data.filter(row => {
    const matchOrg = !orgQuery || (row.org_desc && row.org_desc.toLowerCase().includes(orgQuery))
    const matchDest = !destQuery || (row.dest_desc && row.dest_desc.toLowerCase().includes(destQuery))
    
    return matchOrg && matchDest
  })
})

const getPeriodCssClass = (period) => {
  if (period === 'Inter_peak') return 'col-inter-peak'
  if (period === 'Night') return 'col-night'
  return ''
}

const getMetric = (row, period, key) => {
  if (row.periods && row.periods[period]) {
    const val = row.periods[period][key]
    return val !== undefined && val !== null ? val : '-'
  }
  return '-'
}

const hasObservations = (row, period) => {
  const count = getMetric(row, period, 'observations')
  return typeof count === 'number' && count > 0
}

const openModal = (row, period) => {
  selectedContext.value = {
    origin: row.origin,
    originDesc: row.org_desc,
    destination: row.destination,
    destDesc: row.dest_desc,
    period: period,
    startDate: props.startDate,
    endDate: props.endDate,
    daysOfWeek: props.daysOfWeek
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
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
  max-height: 70vh; /* Scrollable height boundary */
  max-width: 100%;
}

.matrix-table {
  border-collapse: separate; /* Required for sticky borders to align properly */
  border-spacing: 0;
  width: 100%;
  font-size: 0.82rem;
  white-space: nowrap;
}

.matrix-table th, 
.matrix-table td {
  border-bottom: 1px solid #cbd5e1;
  border-right: 1px solid #cbd5e1;
  padding: 8px 10px;
  text-align: center;
}

.matrix-table th:first-child,
.matrix-table td:first-child {
  border-left: 1px solid #cbd5e1;
}

.matrix-table th {
  background-color: #f8fafc;
  color: #334155;
  font-weight: 600;
}

/* Frozen Top Header Logic */
.header-row-top th {
  position: sticky;
  top: 0;
  z-index: 10;
  border-top: 1px solid #cbd5e1;
}

.header-row-bottom th {
  position: sticky;
  top: 36px; /* Offset based on row height of top header */
  z-index: 10;
}

.period-header {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

/* Sticky First 4 Columns */
.sticky-col {
  position: sticky;
  background-color: #ffffff;
  z-index: 5;
}

.matrix-table td.sticky-col {
  background-color: #ffffff;
}

/* Top-Left Header Corners (High z-index to stay above body & header scrolling) */
.sticky-corner {
  z-index: 20 !important;
}

/* --- Filter Inputs Styling inside Headers --- */
.header-filter-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.header-filter-input {
  width: 100%;
  min-width: 110px;
  padding: 3px 6px;
  font-size: 0.75rem;
  font-weight: normal;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  outline: none;
  background-color: #ffffff;
  color: #1e293b;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.header-filter-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.font-bold {
  font-weight: 700;
}

/* --- Clickable #Obs Badge Styling --- */
.obs-clickable-badge {
  background-color: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  display: inline-block;
}

.obs-clickable-badge:hover {
  background-color: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
}

.text-muted-obs {
  color: #94a3b8;
}

/* Background tinting for operational periods */
.col-inter-peak {
  background-color: #f0fdf4 !important;
}

th.col-inter-peak {
  background-color: #dcfce7 !important;
}

.col-night {
  background-color: #f8fafc !important;
}

th.col-night {
  background-color: #e2e8f0 !important;
}

.empty-state {
  padding: 30px;
  color: #94a3b8;
}

/* Hover effects */
.matrix-table tbody tr:hover td {
  background-color: #f1f5f9 !important;
  transition: background-color 0.15s ease-in-out;
}

.matrix-table tbody tr:hover td.sticky-col {
  background-color: #f1f5f9 !important;
}

.matrix-table tbody tr:hover td.col-inter-peak {
  background-color: #dcfce7 !important;
}

.matrix-table tbody tr:hover td.col-night {
  background-color: #e2e8f0 !important;
}
</style>