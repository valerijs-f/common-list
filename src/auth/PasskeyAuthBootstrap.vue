<script setup lang="ts">
import { watch } from "vue";
import { usePasskeyAuth } from "community-jazz-vue";
import { passkeyAuthResolved, passkeySignedIn } from "./passkeyAuthState";
import { PASSKEY_APP_NAME, PASSKEY_HOSTNAME } from "./passkeyConfig";

const auth = usePasskeyAuth({
  appName: PASSKEY_APP_NAME,
  appHostname: PASSKEY_HOSTNAME,
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
