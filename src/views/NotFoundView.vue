<script setup lang="ts">
import { useRouter } from "vue-router";
import UiButton from "../components/ui/UiButton.vue";

const router = useRouter();

function goToLists() {
  void router.push({ name: "list" });
}
</script>

<template>
  <div
    class="min-h-dvh flex flex-col items-center justify-center gap-6 bg-gray-950 px-4 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] text-center"
  >
    <h1 class="text-2xl font-semibold text-white">Page not found</h1>
    <p class="max-w-sm text-sm text-gray-400">
      This address doesn’t match anything here. Check the link or go back to your lists.
    </p>
    <UiButton type="button" @click="goToLists">Back to lists</UiButton>
  </div>
</template>
