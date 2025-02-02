// router.js
import { createRouter, createWebHistory } from 'vue-router';
import SellerPage from '../views/SellerPage.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
  { path: '/:sellerId', component: SellerPage },
  { path: '/:pathMatch(.*)*', component: NotFound }, // 404 처리
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;