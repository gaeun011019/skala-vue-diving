import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'diving-home',
      component: () => import('@/views/DivingHomeView.vue'),
    },
    {
      path: '/about',
      name: 'diving-about',
      component: () => import('@/views/DivingAboutView.vue'),
    },
    {
      path: '/safety',
      name: 'diving-safety',
      component: () => import('@/views/DivingSafetyView.vue'),
    },
    {
      path: '/updates',
      name: 'point-updates',
      component: () => import('@/views/PointUpdatesView.vue'),
    },
    {
      path: '/forecast',
      name: 'diving-forecast',
      component: () => import('@/views/DivingForecastView.vue'),
    },
    {
      path: '/diving/:spotId',
      name: 'diving-detail',
      component: () => import('@/views/DivingDetailView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],

  scrollBehavior() {
    return {
      top: 0,
      behavior: 'smooth',
    }
  },
})

export default router
