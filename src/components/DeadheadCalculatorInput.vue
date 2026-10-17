<template>
  <div class="section-card input-section">
    <h3 class="section-title">1. Import Data Files</h3>
    <p class="section-subtitle">Upload CSV files for origins/destinations and timeband departure times, then configure TomTom routing options.</p>

    <!-- File 1: Origins & Destinations CSV -->
    <div class="file-picker-group">
      <label class="field-label">1. Origins & Destinations CSV (org_place_ID, org_lat, org_lon, dest_place_ID, dest_lat, dest_lon)</label>
      <div class="file-picker-row">
        <input
          type="text"
          class="input-control readonly-path"
          :value="locationsFileDisplay"
          readonly
          placeholder="No locations CSV selected..."
        />
        <input
          type="file"
          ref="locationsInputRef"
          accept=".csv"
          @change="handleLocationsFileChange"
          class="hidden-file-input"
        />
        <button
          type="button"
          class="btn-secondary"
          @click="locationsInputRef.click()"
          :disabled="isCalculating"
        >
          Browse...
        </button>
      </div>
    </div>

    <!-- File 2: Timeband Datetime CSV -->
    <div class="file-picker-group">
      <label class="field-label">2. Timeband Departure CSV (timeband_name, depart_at_datetime)</label>
      <div class="file-picker-row">
        <input
          type="text"
          class="input-control readonly-path"
          :value="timebandsFileDisplay"
          readonly
          placeholder="No timeband CSV selected..."
        />
        <input
          type="file"
          ref="timebandsInputRef"
          accept=".csv"
          @change="handleTimebandsFileChange"
          class="hidden-file-input"
        />
        <button
          type="button"
          class="btn-secondary"
          @click="timebandsInputRef.click()"
          :disabled="isCalculating"
        >
          Browse...
        </button>
      </div>
    </div>

    <!-- TomTom API Configurations (Single Horizontal Row) -->
    <div class="options-row">
      <!-- #1 Travel Mode -->
      <div class="option-group">
        <label class="field-label">Travel Mode</label>
        <div class="button-toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.travelMode === 'truck' }"
            @click="options.travelMode = 'truck'"
            :disabled="isCalculating"
          >
            🚚 Truck
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.travelMode === 'car' }"
            @click="options.travelMode = 'car'"
            :disabled="isCalculating"
          >
            🚗 Car / Van
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.travelMode === 'pedestrian' }"
            @click="options.travelMode = 'pedestrian'"
            :disabled="isCalculating"
          >
            🚶 Pedestrian
          </button>
        </div>
      </div>

      <!-- #2 Traffic Model -->
      <div class="option-group">
        <label class="field-label">Traffic Model</label>
        <div class="button-toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.traffic === 'live' }"
            @click="options.traffic = 'live'"
            :disabled="isCalculating"
          >
            ⚡ Live Traffic
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.traffic === 'historical' }"
            @click="options.traffic = 'historical'"
            :disabled="isCalculating"
          >
            📊 Historical
          </button>
        </div>
      </div>

      <!-- #3 Route Type -->
      <div class="option-group">
        <label class="field-label">Route Type</label>
        <div class="button-toggle-group">
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.routeType === 'fastest' }"
            @click="options.routeType = 'fastest'"
            :disabled="isCalculating"
          >
            ⏱️ Fastest
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.routeType === 'shortest' }"
            @click="options.routeType = 'shortest'"
            :disabled="isCalculating"
          >
            📏 Shortest
          </button>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: options.routeType === 'efficient' }"
            @click="options.routeType = 'efficient'"
            :disabled="isCalculating"
          >
            🌱 Efficient
          </button>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <button
        type="button"
        class="btn-primary"
        @click="handleCalculate"
        :disabled="!locationsFile || !timebandsFile || isCalculating"
      >
        <span v-if="!isCalculating">Calculate Matrix Deadhead</span>
        <span v-else class="loading-state">
          <span class="spinner"></span> Processing...
        </span>
      </button>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  isCalculating: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' }
})

const emit = defineEmits(['start-calculation'])

// File Input References
const locationsInputRef = ref(null)
const timebandsInputRef = ref(null)

// Selected File States
const locationsFile = ref(null)
const locationsFileDisplay = ref('')
const timebandsFile = ref(null)
const timebandsFileDisplay = ref('')

// Configurable TomTom v2 Options
const options = reactive({
  travelMode: 'car',
  traffic: 'historical',
  routeType: 'fastest'
})

const handleLocationsFileChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    locationsFile.value = files[0]
    locationsFileDisplay.value = files[0].name
  }
}

const handleTimebandsFileChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    timebandsFile.value = files[0]
    timebandsFileDisplay.value = files[0].name
  }
}

const handleCalculate = () => {
  emit('start-calculation', {
    locationsFile: locationsFile.value,
    timebandsFile: timebandsFile.value,
    options: { ...options }
  })
}
</script>

<style scoped>
.section-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  color: #0f172a;
}

.section-subtitle {
  margin: 0 0 16px 0;
  font-size: 0.82rem;
  color: #64748b;
}

.file-picker-group {
  margin-bottom: 14px;
}

.file-picker-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.input-control {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  box-sizing: border-box;
  background-color: #ffffff;
  width: 100%;
}

.readonly-path {
  background-color: #f8fafc;
  color: #334155;
  cursor: not-allowed;
  flex: 1;
}

.hidden-file-input {
  display: none;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0 20px;
  height: 38px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
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
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0 16px;
  height: 38px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e2e8f0;
}

/* Horizontal single row container */
.options-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.button-toggle-group {
  display: flex;
  background-color: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  gap: 3px;
}

.toggle-btn {
  flex: 1;
  height: 36px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.toggle-btn:hover:not(:disabled) {
  color: #0f172a;
}

/* Clearer Selected (Active) State */
.toggle-btn.active {
  background-color: #ffffff;
  color: #2563eb;
  font-weight: 700;
  border-color: #bfdbfe;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12), 0 0 0 1px #2563eb;
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.error-banner {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.82rem;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>