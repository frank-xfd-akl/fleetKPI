<template>
  <div class="filter-card">
    <h3 class="filter-title">Filter Parameters</h3>
    
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

      <!-- 3. Division Multi-Select -->
      <div class="field-group select-col">
        <label>Division</label>
        <Multiselect
          v-model="filters.divisions"
          mode="tags"
          :options="divisionOptions"
          :searchable="true"
          :close-on-select="false"
          :disabled="loadingDivisions"
          placeholder="Select division(s)..."
          class="custom-multiselect"
        />
        <span v-if="loadingDivisions" class="loading-text">Loading divisions...</span>
      </div>

      <!-- 4. Duty Numbers Multi-Select -->
      <div class="field-group select-col">
        <label>Duties</label>
        <Multiselect
          v-model="filters.duties"
          mode="tags"
          :options="dutyOptions"
          :searchable="true"
          :close-on-select="false"
          :disabled="loadingDuties"
          placeholder="Select duty number(s)..."
          class="custom-multiselect"
        />
        <span v-if="loadingDuties" class="loading-text">Loading duties...</span>
      </div>

      <!-- 5. Free-text Search Duty -->
      <div class="field-group text-col">
        <label>Search Duty</label>
        <input
          v-model="filters.duty_text"
          type="text"
          placeholder="e.g. D101"
          class="input-control"
        />
      </div>

      <!-- 6. Actions -->
      <div class="field-group actions-col">
        <div class="label-spacer"></div>
        <div class="btn-group">
          <button @click="applyFilters" class="btn-primary" type="button">Query</button>
          <button @click="resetFilters" class="btn-secondary" type="button">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

const emit = defineEmits(['filter-change'])

const loadingDivisions = ref(false)
const rawDivisions = ref([])

const loadingDuties = ref(false)
const rawDuties = ref([])

const filters = reactive({
  startDate: '',
  endDate: '',
  divisions: [],
  duties: [],
  duty_text: '',
  daysOfWeek: []
})

// Format raw array response into Vueform Multiselect options format: { value, label }
const divisionOptions = computed(() => {
  return rawDivisions.value.map(item => {
    if (typeof item === 'object' && item !== null) {
      return { value: item.value || item.id, label: item.label || item.name }
    }
    return { value: item, label: String(item) }
  })
})

const dutyOptions = computed(() => {
  return rawDuties.value.map(item => {
    if (typeof item === 'object' && item !== null) {
      return { value: item.value || item.id, label: item.label || item.duty_number }
    }
    return { value: item, label: String(item) }
  })
})

const fetchDivisions = async () => {
  loadingDivisions.value = true
  try {
    const res = await fetch('/api/v1/divisions/')
    if (res.ok) rawDivisions.value = await res.json()
  } catch (err) {
    console.error('Failed to load divisions:', err)
  } finally {
    loadingDivisions.value = false
  }
}

const fetchDutyNumbers = async () => {
  loadingDuties.value = true
  try {
    const res = await fetch('/api/v1/duties/')
    if (res.ok) rawDuties.value = await res.json()
  } catch (err) {
    console.error('Failed to load duty numbers:', err)
  } finally {
    loadingDuties.value = false
  }
}

const applyFilters = () => {
  emit('filter-change', { ...filters })
}

const resetFilters = () => {
  filters.startDate = ''
  filters.endDate = ''
  filters.divisions = []
  filters.duties = []
  filters.duty_text = ''
  filters.daysOfWeek = []
  applyFilters()
}

onMounted(() => {
  Promise.all([fetchDivisions(), fetchDutyNumbers()])
})
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
  flex: 1 1 200px;
  min-width: 170px;
}

.text-col {
  flex: 1 1 140px;
  min-width: 130px;
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
  margin-bottom: 4px;
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
  background-color: #ffffff;
}

.input-control:focus {
  border-color: #3b82f6;
}

/* Custom Multiselect Theme Overrides */
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

.loading-text {
  font-size: 0.72rem;
  color: #3b82f6;
  margin-top: 2px;
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

.btn-primary:hover {
  background-color: #1d4ed8;
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

.btn-secondary:hover {
  background-color: #e2e8f0;
}
</style>