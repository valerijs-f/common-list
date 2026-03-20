<script setup lang="ts">
import { ref, computed } from "vue";
import { JazzVueProvider } from "community-jazz-vue";
import "jazz-tools/inspector/register-custom-element";
import PasskeyAuthGate from "./PasskeyAuthGate.vue";
import TodoApp from "./TodoApp.vue";

const isOnline = ref(true);
const showJazzInspector = import.meta.env.VITE_SHOW_JAZZ_INSPECTOR === "true";
const passkeyAppName = "Vue Jazz Common Lists";
const passkeyHostname = import.meta.env.VITE_JAZZ_PASSKEY_HOSTNAME || undefined;
const syncConfig = computed(() => ({
  peer: import.meta.env.VITE_JAZZ_PEER_URL as `wss://${string}`,
  when: isOnline.value ? ("always" as const) : ("never" as const),
}));
</script>

<template>
  <JazzVueProvider :sync="syncConfig">
    <PasskeyAuthGate :app-name="passkeyAppName" :app-hostname="passkeyHostname">
      <TodoApp v-model:is-online="isOnline" />
    </PasskeyAuthGate>
    <jazz-inspector v-if="showJazzInspector" />
  </JazzVueProvider>
</template>
