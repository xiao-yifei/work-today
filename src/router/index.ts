import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CalcView from '../views/CalcView.vue'
import CalendarView from '../views/CalendarView.vue'
import ProfileView from '../views/ProfileView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '今日' } },
    { path: '/calc', name: 'calc', component: CalcView, meta: { title: '换算' } },
    { path: '/calendar', name: 'calendar', component: CalendarView, meta: { title: '日历' } },
    { path: '/me', name: 'me', component: ProfileView, meta: { title: '我的' } },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
