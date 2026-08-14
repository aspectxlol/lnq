import { createRouter, createWebHistory } from "vue-router";

import DashboardLayout from "@/layouts/DashboardLayout.vue";
import HomeView from "@/views/HomeView.vue";

import LoginView from "../views/LoginView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: DashboardLayout,
      children: [
        {
          path: "",
          component: HomeView,
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
  ],
});

export default router;
