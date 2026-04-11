<script setup lang="ts">
import { watch } from "vue";
import { usePasskeyAuth } from "community-jazz-vue";
import { passkeyAuthResolved, passkeySignedIn } from "./passkeyAuthState";
import { APP_DISPLAY_NAME } from "../appDisplayName";

const auth = usePasskeyAuth({
  appName: APP_DISPLAY_NAME,
});

watch(
  () => auth.value.state,
  (state) => {
    passkeySignedIn.value = state === "signedIn";
    passkeyAuthResolved.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>
