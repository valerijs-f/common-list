import { createRouter, createWebHistory } from "vue-router";
import { until } from "@vueuse/core";
import { passkeyAuthResolved, passkeySignedIn } from "../auth/passkeyAuthState";
import ProtectedLayout from "../layouts/ProtectedLayout.vue";
import LoginView from "../views/LoginView.vue";
import ListItemView from "../views/ListItemView.vue";

function safeInternalPath(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//"))
    return "/lists";
  return raw;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: "/",
      component: ProtectedLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          redirect: { name: "list" },
        },
        {
          path: "lists/:listId?",
          name: "list",
          component: ListItemView,
        },
      ],
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  await until(passkeyAuthResolved).toBe(true);

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth === true);
  const signedIn = passkeySignedIn.value;

  if (requiresAuth && !signedIn) {
    next({
      name: "login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  if (to.name === "login" && signedIn) {
    next(safeInternalPath(to.query.redirect));
    return;
  }

  next();
});

export default router;
