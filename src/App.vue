<script setup lang="ts">
import { ref, computed } from "vue";
import { JazzVueProvider } from "community-jazz-vue";
import "jazz-tools/inspector/register-custom-element";
import TodoApp from "./TodoApp.vue";

const isOnline = ref(true);
// DEV is Vite’s built-in (true in dev server, false in prod). Use VITE_SHOW_JAZZ_INSPECTOR in .env to hide the inspector in dev (e.g. VITE_SHOW_JAZZ_INSPECTOR=false).
const showJazzInspector = import.meta.env.VITE_SHOW_JAZZ_INSPECTOR;
const syncConfig = computed(() => ({
  peer: import.meta.env.VITE_JAZZ_PEER_URL as `wss://${string}`,
  when: isOnline.value ? ("always" as const) : ("never" as const),
}));
</script>

<template>
  <JazzVueProvider :sync="syncConfig">
    <TodoApp v-model:is-online="isOnline" />
    <jazz-inspector v-if="showJazzInspector" />
  </JazzVueProvider>
</template>
