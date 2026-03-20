<script setup lang="ts">
import { JazzVueProvider } from "community-jazz-vue";
import "jazz-tools/inspector/register-custom-element";
import PasskeyAuthBootstrap from "./auth/PasskeyAuthBootstrap.vue";
import { AppAccount } from "./appAccount";

const showJazzInspector = import.meta.env.VITE_SHOW_JAZZ_INSPECTOR === "true";
const syncConfig = {
  peer: import.meta.env.VITE_JAZZ_PEER_URL as `wss://${string}`,
  when: "always" as const,
};
</script>

<template>
  <JazzVueProvider :sync="syncConfig" :AccountSchema="AppAccount">
    <PasskeyAuthBootstrap />
    <router-view />
    <jazz-inspector v-if="showJazzInspector" />
  </JazzVueProvider>
</template>
