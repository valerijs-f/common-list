<script setup lang="ts">
import { JazzVueProvider } from "community-jazz-vue";
import "jazz-tools/inspector/register-custom-element";
import PasskeyAuthGate from "./PasskeyAuthGate.vue";
import TodoApp from "./TodoApp.vue";

const showJazzInspector = import.meta.env.VITE_SHOW_JAZZ_INSPECTOR === "true";
const passkeyAppName = "Vue Jazz Common Lists";
const passkeyHostname = import.meta.env.VITE_JAZZ_PASSKEY_HOSTNAME || undefined;
const syncConfig = {
  peer: import.meta.env.VITE_JAZZ_PEER_URL as `wss://${string}`,
  when: "always" as const,
};
</script>

<template>
  <JazzVueProvider :sync="syncConfig">
    <PasskeyAuthGate :app-name="passkeyAppName" :app-hostname="passkeyHostname">
      <TodoApp />
    </PasskeyAuthGate>
    <jazz-inspector v-if="showJazzInspector" />
  </JazzVueProvider>
</template>
