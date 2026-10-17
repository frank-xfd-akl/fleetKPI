import { createRouter, createWebHistory } from 'vue-router'
import DeadheadDashboardView from '../views/DeadheadDashboardView.vue'
import DeadheadTripReviewView from '../views/DeadheadTripReviewView.vue'
import DeadheadCalculatorView from '../views/DeadheadCalculatorView.vue'
import RuntimeReviewView from '../views/RuntimeReviewView.vue'
import DutyReviewView from '../views/DutyReviewView.vue'
import PVR_view from '@/views/PVR_view.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'deadhead-dashboard',
      component: DeadheadDashboardView,
    },
    {
      path: '/deadhead',
      name: 'deadhead-dashboard',
      component: DeadheadDashboardView
    },
    {
    path: '/deadheads_review',
    name: 'deadhead-review',
    component: DeadheadTripReviewView
    },
    {
    path: '/deadheads_calculate',
    name: 'deadhead-calculate',
    component: DeadheadCalculatorView
    },
    {
    path: '/runtime_review',
    name: 'runtime_review',
    component: RuntimeReviewView
    },
    {
    path: '/duty_review',
    name: 'duty_review',
    component: DutyReviewView
    },
    {
    path: '/pvr_profile',
    name: 'pvr_profile',
    component: PVR_view
    },
  ],
})

export default router
