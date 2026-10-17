<template>
  <div class="duty-review-view max-w-7xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Duty Performance Review</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Analyze scheduled vs. actual duty spans, runtime variances, and telemetry coverage across operations.
        </p>
      </div>
    </div>

    <!-- 1. Filter Component -->
    <DutyReviewFilter @filter-change="handleFilterChange" />

    <!-- 2. Visual / Table Component -->
    <DutyReviewVisual 
      :items="dutyData" 
      :loading="loading" 
      :has-searched="hasSearched" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DutyReviewFilter from '@/components/DutyReviewFilter.vue'
import DutyReviewVisual from '@/components/DutyReviewVisual.vue'

const loading = ref(false)
const dutyData = ref([])
const hasSearched = ref(false)

const fetchDutyReview = async (filterParams = {}) => {
  loading.value = true
  hasSearched.value = true

  try {
    const query = new URLSearchParams()
    
    if (filterParams.divisions && !filterParams.divisions.includes('ALL')) {
      filterParams.divisions.forEach(d => query.append('divisions', d))
    }
    if (filterParams.duties && !filterParams.duties.includes('ALL')) {
      filterParams.duties.forEach(d => query.append('duties', d))
    }
    if (filterParams.duty_text) {
      query.append('duty_text', filterParams.duty_text)
    }
    if (filterParams.startDate) {
      query.append('startDate', filterParams.startDate)
    }
    if (filterParams.endDate) {
      query.append('endDate', filterParams.endDate)
    }
    if (filterParams.daysOfWeek && filterParams.daysOfWeek.length) {
      filterParams.daysOfWeek.forEach(dow => query.append('daysOfWeek', dow))
    }

    const endpoint = `/api/v1/duty/review${query.toString() ? '?' + query.toString() : ''}`
    const res = await fetch(endpoint)
    
    if (res.ok) {
      dutyData.value = await res.json()
    } else {
      console.error('API Error:', res.statusText)
    }
  } catch (err) {
    console.error('Failed to fetch duty review data:', err)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (newFilters) => {
  fetchDutyReview(newFilters)
}
</script>