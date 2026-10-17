<template>
  <div class="dashboard-page">
    <header class="page-header">
      <h2>Runtime Review</h2>
      <p>Route corridor performance statistics across operational peak & off-peak windows.</p>
    </header>

    <!-- Filter Bar Component -->
    <RuntimeFilterBar 
      :routes="routes" 
      :loading="loading" 
      @query="handleQuery" 
      @export="handleExport"
    />

    <!-- Standalone Matrix Table Component -->
    <RuntimeReviewMatrixTable :data="matrixData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RuntimeFilterBar from '@/components/RuntimeFilterBar.vue'
import RuntimeReviewMatrixTable from '@/components/RuntimeReviewMatrixTable.vue'

const loading = ref(false)
const routes = ref([])
const matrixData = ref([])

// 1. Fetch available routes for the filter dropdown
const fetchRoutes = async () => {
  try {
    const res = await fetch('/api/v1/routes/')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    routes.value = (await res.json()) || []
  } catch (err) {
    console.error("Failed to load routes dropdown list:", err)
  }
}

// 2. Query Handler
const handleQuery = async (filters) => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    if (Array.isArray(filters.routeNumbers)) {
      filters.routeNumbers.forEach(route => params.append('routeNumbers', route))
    }

    if (Array.isArray(filters.daysOfWeek)) {
      filters.daysOfWeek.forEach(day => params.append('daysOfWeek', day))
    }

    const res = await fetch(`/api/v1/runtime/review?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    
    matrixData.value = await res.json()
  } catch (err) {
    console.error("Failed to load runtime review matrix:", err)
    matrixData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRoutes()
})

// 3. Client-Side CSV Export Handler
const handleExport = (exportType) => {
  if (!matrixData.value || matrixData.value.length === 0) {
    alert('No data available to export!')
    return
  }

  const periods = ['AM_peak', 'Inter_peak', 'PM_peak', 'Night']
  let headers = []
  let rows = []
  let filename = ''

  if (exportType === 'summary') {
    // Export Option 1: Pattern Summary (P75 Only)
    filename = 'runtime_pattern_summary_p75.csv'
    headers = [
      'route_number',
      'origin',
      'org_desc',
      'destination',
      'dest_desc',
      'AM_peak_p75',
      'Inter_peak_p75',
      'PM_peak_p75',
      'Night_p75'
    ]

    rows = matrixData.value.map(row => {
      const rowValues = [
        `"${row.route_number || ''}"`,
        `"${row.origin || ''}"`,
        `"${row.org_desc || ''}"`,
        `"${row.destination || ''}"`,
        `"${row.dest_desc || ''}"`
      ]

      periods.forEach(p => {
        const p75Val = row.periods && row.periods[p] ? row.periods[p].p75 : ''
        rowValues.push(p75Val !== null && p75Val !== undefined ? p75Val : '')
      })

      return rowValues.join(',')
    })
  } else {
    // Export Option 2: Full Summary Data (All 9 Metrics)
    filename = 'runtime_full_review_export.csv'
    const metrics = [
      'observations',
      'avg_scheduled',
      'avg_actual',
      'min_actual',
      'max_actual',
      'median',
      'p75',
      'std_dev',
      'cov'
    ]
    
    headers = ['route_number', 'origin', 'org_desc', 'destination', 'dest_desc']
    periods.forEach(p => {
      metrics.forEach(m => headers.push(`${p}_${m}`))
    })

    rows = matrixData.value.map(row => {
      const rowValues = [
        `"${row.route_number || ''}"`,
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

  // Trigger Browser Download
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