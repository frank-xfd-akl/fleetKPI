<template>
  <div class="section-card input-section">
    <h3 class="section-title">1. Import Data File</h3>
    <p class="section-subtitle">Select a formatted CSV file containing origin-destination pairs and period departure times.</p>

    <div class="file-picker-row">
      <div class="input-wrapper">
        <label class="field-label">Selected File Path</label>
        <input
          type="text"
          class="input-control readonly-path"
          :value="displayPath"
          readonly
          placeholder="No file selected..."
        />
      </div>

      <div class="button-group">
        <input
          type="file"
          ref="fileInputRef"
          accept=".csv"
          @change="handleFileChange"
          class="hidden-file-input"
        />

        <button
          type="button"
          class="btn-secondary"
          @click="triggerBrowse"
          :disabled="isCalculating"
        >
          Browse...
        </button>

        <button
          type="button"
          class="btn-primary"
          @click="$emit('start-calculation')"
          :disabled="!selectedFile || isCalculating"
        >
          <span v-if="!isCalculating">Calculate</span>
          <span v-else class="loading-state">
            <span class="spinner"></span> Processing...
          </span>
        </button>
      </div>
    </div>

    <div v-if="selectedFile" class="file-meta">
      <span>File: <strong>{{ selectedFile.name }}</strong></span>
      <span class="divider">|</span>
      <span>Size: {{ (selectedFile.size / 1024).toFixed(1) }} KB</span>
    </div>

    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isCalculating: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' }
})

const emit = defineEmits(['file-selected', 'start-calculation'])

const fileInputRef = ref(null)
const selectedFile = ref(null)
const displayPath = ref('')

const triggerBrowse = () => {
  if (fileInputRef.value) fileInputRef.value.click()
}

const handleFileChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    displayPath.value = event.target.value || files[0].name
    emit('file-selected', files[0])
  }
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
.section-title { margin: 0 0 4px 0; font-size: 1.05rem; color: #0f172a; }
.section-subtitle { margin: 0 0 16px 0; font-size: 0.82rem; color: #64748b; }
.file-picker-row { display: flex; align-items: flex-end; gap: 12px; }
.input-wrapper { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.input-control { height: 38px; padding: 0 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; }
.readonly-path { background-color: #f8fafc; color: #334155; cursor: not-allowed; }
.hidden-file-input { display: none; }
.button-group { display: flex; gap: 8px; }
.btn-primary { background-color: #2563eb; color: #ffffff; border: none; padding: 0 20px; height: 38px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; white-space: nowrap; }
.btn-primary:hover:not(:disabled) { background-color: #1d4ed8; }
.btn-primary:disabled { background-color: #93c5fd; cursor: not-allowed; }
.btn-secondary { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 0 16px; height: 38px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; white-space: nowrap; }
.btn-secondary:hover:not(:disabled) { background-color: #e2e8f0; }
.file-meta { margin-top: 10px; font-size: 0.78rem; color: #64748b; display: flex; gap: 8px; }
.divider { color: #cbd5e1; }
.error-banner { margin-top: 12px; padding: 8px 12px; background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; font-size: 0.82rem; }
.spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: #ffffff; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>