<template>
  <div class="pvr-view-container">
    <header class="page-header">
      <h2>Peak Vehicle Requirement (PVR) Dashboard</h2>
      <p>Analyze scheduled vehicle allocation, active fleet counts, and peak minute curves across operations.</p>
    </header>

    <!-- Global Error Banner -->
    <div v-if="errorMessage" class="error-banner">
      ⚠️ {{ errorMessage }}
    </div>

    <!-- Top Input / Filter Component -->
    <PVR_FilterBar
      :loading="loading"
      @query="handleQuery"
    />

    <!-- Bottom Data Visual & Table Component -->
    <PVR_Visual
      :data="pvrData"
      :summary="pvrSummary"
      :loading="loading"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PVR_FilterBar from '@/components/PVR_FilterBar.vue'
import PVR_Visual from '@/components/PVR_Visual.vue'

const loading = ref(false)
const errorMessage = ref('')

const pvrSummary = ref({
  peak_pvr: 0,
  peak_time_start: null,
  peak_time_end: null,
  total_blocks_analyzed: 0
})
const pvrData = ref([])

const handleQuery = async (filterParams = {}) => {
  loading.value = true
  errorMessage.value = ''
  pvrData.value = []
  pvrSummary.value = {
    peak_pvr: 0,
    peak_time_start: null,
    peak_time_end: null,
    total_blocks_analyzed: 0
  }

  try {
    const query = new URLSearchParams()
    
    if (filterParams.opDays && filterParams.opDays.length) {
      filterParams.opDays.forEach(day => query.append('opDays', day))
    }
    if (filterParams.garages && filterParams.garages.length) {
      filterParams.garages.forEach(g => query.append('garages', g))
    }
    if (filterParams.divisions && filterParams.divisions.length) {
      filterParams.divisions.forEach(d => query.append('divisions', d))
    }
    if (filterParams.vehGrps && filterParams.vehGrps.length) {
      filterParams.vehGrps.forEach(v => query.append('vehGrps', v))
    }

    const endpoint = `/api/v1/pvr-profile${query.toString() ? '?' + query.toString() : ''}`
    const response = await fetch(endpoint)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Server returned status ${response.status}: ${errorText || response.statusText}`)
    }

    const result = await response.json()
    pvrSummary.value = result.summary || {
      peak_pvr: 0,
      peak_time_start: null,
      peak_time_end: null,
      total_blocks_analyzed: 0
    }
    pvrData.value = result.data || []
  } catch (err) {
    errorMessage.value = `Failed to fetch PVR profile data: ${err.message}`
    console.error('PVR Fetch Error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pvr-view-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  margin: 0 auto;
}

.page-header h2 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: #0f172a;
}

.page-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
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