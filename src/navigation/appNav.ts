import type { RouteLocationRaw } from "vue-router";

/** Extend when you add tabs with new icons. */
export type AppNavIcon = "list";

export interface AppNavTab {
  label: string;
  to: RouteLocationRaw;
  icon: AppNavIcon;
}

export const appNavTabs: AppNavTab[] = [
  { label: "List", to: { name: "list" }, icon: "list" },
];
