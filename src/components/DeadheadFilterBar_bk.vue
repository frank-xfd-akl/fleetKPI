<template>
  <div class="filter-card">
    <h3 class="filter-title">Filter Parameters</h3>
    
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

      <!-- 3. Multi-Select Origin Place -->
      <div class="field-group select-col">
        <label>Origin Places</label>
        <Multiselect
          v-model="filters.origins"
          mode="tags"
          :options="formattedPlaces"
          :searchable="true"
          :close-on-select="false"
          placeholder="Select origin(s)..."
          class="custom-multiselect"
          @change="onDropdownChange"
        />
      </div>

      <!-- 4. Multi-Select Destination Place -->
      <div class="field-group select-col">
        <label>Destination Places</label>
        <Multiselect
          v-model="filters.destinations"
          mode="tags"
          :options="formattedPlaces"
          :searchable="true"
          :close-on-select="false"
          placeholder="Select destination(s)..."
          class="custom-multiselect"
          @change="onDropdownChange"
        />
      </div>

      <!-- 5. Days of Week -->
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

      <!-- 6. Batch OD Pairs (Optional) -->
      <div class="field-group od-col">
        <div class="label-row">
          <label>Batch OD Pairs (one pair per line)</label>
        </div>
        <textarea
          v-model="filters.odText"
          @input="onTextAreaInput"
          rows="1"
          placeholder="e.g. DEPOT_N, STOP_1"
          class="input-control textarea-control"
          title="Format: DEPOT_N, STOP_1 (one pair per line)"
        ></textarea>
      </div>

      <!-- 7. Action Buttons -->
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
  places: { 
    type: Array, 
    default: () => [] 
  }
})

const emit = defineEmits(['query'])

// 1. Primitive and Reactive state declarations MUST come first
const rawPlaces = ref(props.places || [])
const errorMessage = ref('')

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
  origins: [],
  destinations: [],
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  odText: ''
})

// 2. Watchers safely declared after state initialization
watch(
  () => props.places,
  (newPlaces) => {
    if (Array.isArray(newPlaces)) {
      rawPlaces.value = newPlaces
    }
  },
  { immediate: true, deep: true }
)

// Auto-clear validation error once user selects at least one day
watch(
  () => filters.daysOfWeek,
  (newDays) => {
    if (newDays && newDays.length > 0) {
      errorMessage.value = ''
    }
  }
)

// 3. Computed properties and Action Methods
const formattedPlaces = computed(() => {
  return rawPlaces.value.map(p => {
    if (typeof p === 'object' && p !== null) {
      const id = p.place_id || p.value || ''
      const desc = p.place_desc || p.label || ''
      return {
        value: id,
        label: desc ? `${id} (${desc})` : id
      }
    }
    return { value: p, label: p }
  })
})

const selectAllDays = () => {
  filters.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
}

const clearAllDays = () => {
  filters.daysOfWeek = []
}

const onDropdownChange = () => {
  if (filters.origins.length > 0 || filters.destinations.length > 0) {
    filters.odText = ''
  }
}

const onTextAreaInput = () => {
  if (filters.odText.trim().length > 0) {
    filters.origins = []
    filters.destinations = []
  }
}

const onQuery = () => {
  // Front-End Validation Check
  if (!filters.daysOfWeek || filters.daysOfWeek.length === 0) {
    errorMessage.value = 'Please select at least one Day of Week before running the query.'
    return
  }

  errorMessage.value = ''

  emit('query', {
    startDate: filters.startDate,
    endDate: filters.endDate,
    origins: filters.origins,
    destinations: filters.destinations,
    daysOfWeek: filters.daysOfWeek,
    od_text: filters.odText.trim()
  })
}

const onReset = () => {
  errorMessage.value = ''
  filters.startDate = ''
  filters.endDate = ''
  filters.origins = []
  filters.destinations = []
  filters.daysOfWeek = [0, 1, 2, 3, 4, 5, 6]
  filters.odText = ''
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
  flex: 1 1 180px;
  min-width: 150px;
}

.weekday-col {
  flex: 1.2 1 290px;
  min-width: 270px;
}

.od-col {
  flex: 1 1 160px;
  min-width: 140px;
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

.textarea-control {
  font-family: monospace;
  resize: vertical;
  min-height: 38px;
  padding: 6px 8px;
  line-height: 1.2;
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