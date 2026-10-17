<template>
  <div class="filter-card">
    <h3 class="filter-title">Runtime Review Filters</h3>
    
    <!-- Single Unified Row Layout -->
    <div class="single-row-grid">
      <!-- 1. Start Date -->
      <div class="field-group date-col">
        <label>Start Date</label>
        <input type="date" v-model="filters.startDate" class="input-control" />
      </div>

      <!-- 2. End Date -->
      <div class="field-group date-col">
        <label>End Date</label>
        <input type="date" v-model="filters.endDate" class="input-control" />
      </div>

      <!-- 3. Multi-Select Route Numbers -->
      <div class="field-group select-col">
        <label>Route Numbers</label>
        <Multiselect
          v-model="filters.routeNumbers"
          mode="tags"
          :options="formattedRoutes"
          :searchable="true"
          :create-option="true"
          :close-on-select="false"
          placeholder="Select or type route(s)..."
          class="custom-multiselect"
        />
      </div>

      <!-- 4. Days of Week -->
      <div class="field-group weekday-col">
        <div class="label-row">
          <label>Days of Week</label>
          <div class="quick-select-actions">
            <button type="button" class="btn-link" @click="selectAllDays">Select All</button>
            <span class="divider">|</span>
            <button type="button" class="btn-link" @click="clearAllDays">Clear</button>
          </div>
        </div>
        <div class="weekday-checkboxes">
          <label v-for="day in weekDaysOptions" :key="day.value" class="checkbox-pill">
            <input
              type="checkbox"
              :value="day.value"
              v-model="filters.daysOfWeek"
            />
            <span>{{ day.label }}</span>
          </label>
        </div>
      </div>

      <!-- 5. Action Buttons -->
      <div class="field-group actions-col">
        <div class="label-spacer"></div>
        <div class="btn-group">
          <button @click="onQuery" class="btn-primary" :disabled="loading">
            <span v-if="!loading">Query</span>
            <span v-else>...</span>
          </button>
          <button @click="onReset" class="btn-secondary" :disabled="loading">Reset</button>
        </div>
      </div>
    </div>

    <!-- Error Banner when Validation Fails -->
    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- Export Confirmation Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-card">
        <h4 class="modal-title">Select CSV Export Format</h4>
        <p class="modal-subtitle">Choose the output structure for your runtime review download:</p>

        <div class="export-options">
          <label class="option-card" :class="{ selected: selectedExportType === 'full' }">
            <input type="radio" value="full" v-model="selectedExportType" />
            <div class="option-info">
              <strong>1. Full Summary Data</strong>
              <span>Exports all route runtime metrics across departure hours (Observations, P75, Median, Variance, etc.).</span>
            </div>
          </label>

          <label class="option-card" :class="{ selected: selectedExportType === 'summary' }">
            <input type="radio" value="summary" v-model="selectedExportType" />
            <div class="option-info">
              <strong>2. Pattern Summary (P75 Only)</strong>
              <span>Exports Route Number, Origin, Destination, Departure Hour, and P75 Runtime values.</span>
            </div>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button class="btn-primary" @click="confirmExport">Download CSV</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
  routes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['query', 'export'])

const rawRoutes = ref(props.routes || [])
const errorMessage = ref('')
const showExportModal = ref(false)
const selectedExportType = ref('full')

const weekDaysOptions = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 }
]

const filters = reactive({
  startDate: '',
  endDate: '',
  routeNumbers: [],
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
})

watch(
  () => props.routes,
  (newRoutes) => {
    if (Array.isArray(newRoutes)) {
      rawRoutes.value = newRoutes
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => filters.daysOfWeek,
  (newDays) => {
    if (newDays && newDays.length > 0) {
      errorMessage.value = ''
    }
  }
)

const formattedRoutes = computed(() => {
  return rawRoutes.value.map(r => {
    if (typeof r === 'object' && r !== null) {
      const val = r.route_number || r.value || ''
      const desc = r.route_name || r.label || ''
      return {
        value: val,
        label: desc ? `${val} - ${desc}` : val
      }
    }
    return { value: r, label: r }
  })
})

const selectAllDays = () => {
  filters.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
}

const clearAllDays = () => {
  filters.daysOfWeek = []
}

const openExportModal = () => {
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const confirmExport = () => {
  emit('export', selectedExportType.value)
  closeExportModal()
}

const onQuery = () => {
  if (!filters.daysOfWeek || filters.daysOfWeek.length === 0) {
    errorMessage.value = 'Please select at least one Day of Week before running the query.'
    return
  }

  errorMessage.value = ''

  emit('query', {
    startDate: filters.startDate,
    endDate: filters.endDate,
    routeNumbers: filters.routeNumbers,
    daysOfWeek: filters.daysOfWeek
  })
}

const onReset = () => {
  errorMessage.value = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.routeNumbers = []
  filters.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
}
</script>

<style scoped>
.filter-card {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.filter-title {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
  color: #1e293b;
}

.single-row-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.date-col {
  flex: 0 0 135px;
}

.select-col {
  flex: 1 1 220px;
  min-width: 180px;
}

.weekday-col {
  flex: 1.2 1 270px;
  min-width: 250px;
}

.actions-col {
  flex: 0 0 auto;
  margin-left: auto;
}

.label-spacer {
  height: 21px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  height: 15px;
}

.weekday-checkboxes {
  display: flex;
  justify-content: space-between;
  gap: 3px;
  height: 38px;
  align-items: center;
}

.checkbox-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 5px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.78rem;
  color: #334155;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  flex: 1;
  height: 100%;
  box-sizing: border-box;
}

.checkbox-pill:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.checkbox-pill input[type="checkbox"] {
  accent-color: #2563eb;
  cursor: pointer;
  margin: 0;
}

.quick-select-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  margin-left: auto;
}

.divider {
  color: #cbd5e1;
}

.btn-link {
  background: none;
  border: none;
  color: #2563eb;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-link:hover {
  text-decoration: underline;
}

.input-control {
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
  height: 38px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-control:focus {
  border-color: #3b82f6;
}

.custom-multiselect {
  --ms-border-color: #cbd5e1;
  --ms-border-radius: 6px;
  --ms-font-size: 0.85rem;
  --ms-tag-bg: #e0f2fe;
  --ms-tag-color: #0369a1;
  --ms-tag-font-weight: 600;
  --ms-tag-radius: 4px;
  --ms-ring-color: #3b82f622;
  --ms-spinner-color: #2563eb;
  min-height: 38px;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0 16px;
  height: 38px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0 14px;
  height: 38px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.error-banner {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  margin-top: 10px;
}

/* Modal Overlay & Dialog Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-card {
  background: #ffffff;
  border-radius: 10px;
  width: 440px;
  padding: 20px 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-title {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  color: #0f172a;
}

.modal-subtitle {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 0;
  margin-bottom: 16px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.option-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  background-color: #f8fafc;
}

.option-card:hover {
  border-color: #94a3b8;
  background-color: #f1f5f9;
}

.option-card.selected {
  border-color: #2563eb;
  background-color: #eff6ff;
}

.option-card input[type="radio"] {
  margin-top: 2px;
  accent-color: #2563eb;
}

.option-info {
  display: flex;
  flex-direction: column;
  font-size: 0.82rem;
}

.option-info strong {
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 2px;
}

.option-info span {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.35;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>