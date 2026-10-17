<template>
  <div class="calculator-view-container">
    <header class="page-header">
      <h2>Deadhead Route Calculator</h2>
      <p>Estimate travel durations and distances across key time windows using TomTom's Routing API.</p>
    </header>

    <!-- Global Error Banner -->
    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- Top Input Component -->
    <DeadheadCalculatorInput
      :is-calculating="isCalculating"
      :error-message="errorMessage"
      @start-calculation="handleCalculate"
    />

    <!-- Bottom Data Table Component -->
    <DeadheadCalculatorTable
      :results-data="resultsData"
      :is-calculating="isCalculating"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DeadheadCalculatorInput from '@/components/DeadheadCalculatorInput.vue'
import DeadheadCalculatorTable from '@/components/DeadheadCalculatorTable.vue'

const isCalculating = ref(false)
const errorMessage = ref('')
const resultsData = ref([])

const parseCSVToJSON = (csvText) => {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    
    // Simple CSV parser handling standard comma-separated lines
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const entry = {}
    headers.forEach((header, index) => {
      entry[header] = values[index] !== undefined && values[index] !== '' ? values[index] : null
    })
    rows.push(entry)
  }
  return rows
}

const handleCalculate = async ({ locationsFile, timebandsFile, options }) => {
  if (!locationsFile || !timebandsFile) {
    errorMessage.value = 'Please select both Locations and Timebands CSV files.'
    return
  }

  isCalculating.value = true
  errorMessage.value = ''
  resultsData.value = []

  // Construct dual-file multipart request payload
  const formData = new FormData()
  formData.append('locations_file', locationsFile)
  formData.append('timebands_file', timebandsFile)
  formData.append('travel_mode', options.travelMode)
  formData.append('traffic', options.traffic)
  formData.append('route_type', options.routeType)

  try {
    const response = await fetch('/api/v1/deadheads/calculate', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Server returned status ${response.status}: ${errorText || response.statusText}`)
    }

    const csvResponseText = await response.text()
    resultsData.value = parseCSVToJSON(csvResponseText)
  } catch (err) {
    errorMessage.value = `Calculation failed: ${err.message}`
  } finally {
    isCalculating.value = false
  }
}
</script>

<style scoped>
.calculator-view-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  margin: 0 auto;
}

.error-banner {
  padding: 10px 14px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.85rem;
}
</style>