<template>
  <div class="dashboard-page">
    <header class="page-header">
      <h2>Deadhead & Pull Temporal Analysis</h2>
      <p>Analyze scheduled vs. actual deadhead trip metrics across operational corridors.</p>
    </header>

    <DeadheadFilterBar 
      :places="places" 
      :loading="loading" 
      @query="handleQuery" 
    />

    <DeadheadKpiCards :summary="summary" />

    <!-- Pass performanceData array to Section 3 -->
    <DeadheadVisualizations :data="performanceData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DeadheadFilterBar from '@/components/DeadheadFilterBar.vue'
import DeadheadKpiCards from '@/components/DeadheadKpiCards.vue'
import DeadheadVisualizations from '@/components/DeadheadVisualizations.vue'

const loading = ref(false)
const places = ref([])
const summary = ref({ total_trips: 0, unique_corridors: 0, mean_cov: 0.0 })
const performanceData = ref([])

const fetchPlaces = async () => {
  try {
    const res = await fetch('/api/v1/nodes/')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    places.value = data || []
  } catch (err) {
    console.error("Failed to load node dropdown list:", err)
  }
}

const handleQuery = async (filters) => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    
    // 1. Date Filters
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    // 2. Append multiple origins (e.g. ?origins=LocA&origins=LocB)
    if (Array.isArray(filters.origins) && filters.origins.length > 0) {
      filters.origins.forEach(orig => params.append('origins', orig))
    }

    // 3. Append multiple destinations
    if (Array.isArray(filters.destinations) && filters.destinations.length > 0) {
      filters.destinations.forEach(dest => params.append('destinations', dest))
    }

    // 4. Batch OD text
    if (filters.od_text) {
      params.append('od_text', filters.od_text)
    }

    const res = await fetch(`/api/v1/deadheads/performance?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const json = await res.json()

    summary.value = json.summary || { total_trips: 0, unique_corridors: 0, mean_cov: 0.0 }
    
    // Explicitly re-assign new array instance to trigger Vue reactivity
    performanceData.value = Array.isArray(json.data) ? [...json.data] : []
  } catch (err) {
    console.error("Failed to load deadhead performance data:", err)
    performanceData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPlaces()
  // handleQuery({ origins: [], destinations: [], od_text: '' })
})
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #0f172a;
}
.page-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}
</style>