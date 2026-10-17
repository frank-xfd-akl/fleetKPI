<template>
  <div class="dashboard-page">
    <header class="page-header">
      <h2>Deadhead & Pull Trip Review</h2>
      <p>Corridor performance statistics across operational peak & off-peak windows.</p>
    </header>

    <!-- Filter Bar (Reused or cloned component) -->
    <DeadheadFilterBar 
      :places="places" 
      :loading="loading" 
      @query="handleQuery" 
      @export="handleExport"
    />

    <!-- Standalone Matrix Table with active parent filters bound -->
    <DeadheadReviewMatrixTable 
      :data="matrixData"
      :start-date="activeFilters.startDate"
      :end-date="activeFilters.endDate"
      :days-of-week="activeFilters.daysOfWeek"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DeadheadFilterBar from '@/components/DeadheadFilterBarReview.vue'
import DeadheadReviewMatrixTable from '@/components/DeadheadReviewMatrixTable.vue'

const loading = ref(false)
const places = ref([])
const matrixData = ref([])

// Store current active filters to pass into drill-down child modal
const activeFilters = ref({
  startDate: null,
  endDate: null,
  daysOfWeek: []
})

const fetchPlaces = async () => {
  try {
    const res = await fetch('/api/v1/nodes/')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    places.value = await res.json() || []
  } catch (err) {
    console.error("Failed to load node dropdown list:", err)
  }
}

const handleQuery = async (filters) => {
  loading.value = true

  // Save active filter state for child components
  activeFilters.value = {
    startDate: filters.startDate || null,
    endDate: filters.endDate || null,
    daysOfWeek: Array.isArray(filters.daysOfWeek) ? filters.daysOfWeek : []
  }

  try {
    const params = new URLSearchParams()
    
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    if (Array.isArray(filters.daysOfWeek)) {
      filters.daysOfWeek.forEach(dow => params.append('daysOfWeek', dow))
    }

    if (Array.isArray(filters.origins)) {
      filters.origins.forEach(orig => params.append('origins', orig))
    }

    if (Array.isArray(filters.destinations)) {
      filters.destinations.forEach(dest => params.append('destinations', dest))
    }

    if (filters.od_text) {
      params.append('od_text', filters.od_text)
    }

    // Call backend endpoint: /api/v1/deadhead/review
    const res = await fetch(`/api/v1/deadheads/review?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    
    matrixData.value = await res.json()
  } catch (err) {
    console.error("Failed to load trip review matrix:", err)
    matrixData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPlaces()
})

const handleExport = (exportType) => {
  if (!matrixData.value || matrixData.value.length === 0) {
    alert('No data available to export!')
    return
  }

  const periods = ['AM_peak', 'Inter_peak', 'PM_peak', 'Night']
  let headers = []
  let rows = []
  let filename = ''

  if (exportType === 'oir') {
    // 1. OIR Format: origin, destination, p75 for each period
    filename = 'deadhead_oir_format.csv'
    headers = ['origin', 'destination', 'AM_peak_p75', 'Inter_peak_p75', 'PM_peak_p75', 'Night_p75']

    rows = matrixData.value.map(row => {
      const rowValues = [
        `"${row.origin || ''}"`,
        `"${row.destination || ''}"`
      ]

      periods.forEach(p => {
        const p75Val = row.periods && row.periods[p] ? row.periods[p].p75 : ''
        rowValues.push(p75Val !== null && p75Val !== undefined ? p75Val : '')
      })

      return rowValues.join(',')
    })
  } else {
    // 2. Full Format: All columns
    filename = 'deadhead_full_export.csv'
    const metrics = ['observations', 'p25', 'p75', 'median', 'average', 'std_dev', 'cov']
    
    headers = ['origin', 'org_desc', 'destination', 'dest_desc']
    periods.forEach(p => {
      metrics.forEach(m => headers.push(`${p}_${m}`))
    })

    rows = matrixData.value.map(row => {
      const rowValues = [
        `"${row.origin || ''}"`,
        `"${row.org_desc || ''}"`,
        `"${row.destination || ''}"`,
        `"${row.dest_desc || ''}"`
      ]

      periods.forEach(p => {
        metrics.forEach(m => {
          const val = row.periods && row.periods[p] ? row.periods[p][m] : ''
          rowValues.push(val !== null && val !== undefined ? val : '')
        })
      })

      return rowValues.join(',')
    })
  }

  // Trigger File Download
  const csvContent = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
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