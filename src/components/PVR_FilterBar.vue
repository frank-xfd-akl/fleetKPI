<template>
  <div class="filter-card">
    <h3 class="filter-title">Filter Parameters</h3>
    
    <!-- Single Unified Row Layout -->
    <div class="single-row-grid">
      <!-- 1. Multi-Select Garage -->
      <div class="field-group select-col">
        <label>Garages</label>
        <Multiselect
          v-model="filters.garages"
          mode="tags"
          :options="formattedGarages"
          :searchable="true"
          :close-on-select="false"
          placeholder="Select garage(s)..."
          class="custom-multiselect"
        />
      </div>

      <!-- 2. Multi-Select Division -->
      <div class="field-group select-col">
        <label>Divisions</label>
        <Multiselect
          v-model="filters.divisions"
          mode="tags"
          :options="formattedDivisions"
          :searchable="true"
          :close-on-select="false"
          placeholder="Select division(s)..."
          class="custom-multiselect"
        />
      </div>

      <!-- 3. Multi-Select Vehicle Group -->
      <div class="field-group select-col">
        <label>Vehicle Groups</label>
        <Multiselect
          v-model="filters.vehGrps"
          mode="tags"
          :options="formattedVehGrps"
          :searchable="true"
          :close-on-select="false"
          placeholder="Select vehicle group(s)..."
          class="custom-multiselect"
        />
      </div>

      <!-- 4. Days of Week -->
      <div class="field-group weekday-col">
        <div class="label-row">
          <label>Operational Days</label>
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
              v-model="filters.opDays"
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
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

const props = defineProps({
  loading: { type: Boolean, default: false },
  garages: { type: Array, default: () => [] },
  divisions: { type: Array, default: () => [] },
  vehGrps: { type: Array, default: () => [] }
})

const emit = defineEmits(['query'])

const errorMessage = ref('')

const weekDaysOptions = [
  { label: 'Mon', value: 'Monday' },
  { label: 'Tue', value: 'Tuesday' },
  { label: 'Wed', value: 'Wednesday' },
  { label: 'Thu', value: 'Thursday' },
  { label: 'Fri', value: 'Friday' },
  { label: 'Sat', value: 'Saturday' },
  { label: 'Sun', value: 'Sunday' }
]

const filters = reactive({
  garages: [],
  divisions: [],
  vehGrps: [],
  opDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
})

// Auto-clear validation error once user selects at least one day
watch(
  () => filters.opDays,
  (newDays) => {
    if (newDays && newDays.length > 0) {
      errorMessage.value = ''
    }
  }
)

// Standardize options array for Multiselect
const formatOptions = (list) => {
  return (list || []).map(item => {
    if (typeof item === 'object' && item !== null) {
      const val = item.value || item.id || ''
      const label = item.label || item.desc || val
      return { value: val, label: label }
    }
    return { value: item, label: item }
  })
}

const formattedGarages = computed(() => formatOptions(props.garages))
const formattedDivisions = computed(() => formatOptions(props.divisions))
const formattedVehGrps = computed(() => formatOptions(props.vehGrps))

const selectAllDays = () => {
  filters.opDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
}

const clearAllDays = () => {
  filters.opDays = []
}

const onQuery = () => {
  if (!filters.opDays || filters.opDays.length === 0) {
    errorMessage.value = 'Please select at least one Operational Day before running the query.'
    return
  }

  errorMessage.value = ''

  emit('query', {
    opDays: filters.opDays,
    garages: filters.garages,
    divisions: filters.divisions,
    vehGrps: filters.vehGrps
  })
}

const onReset = () => {
  errorMessage.value = ''
  filters.garages = []
  filters.divisions = []
  filters.vehGrps = []
  filters.opDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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

.select-col {
  flex: 1 1 180px;
  min-width: 150px;
}

.weekday-col {
  flex: 1.4 1 320px;
  min-width: 300px;
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
</style>