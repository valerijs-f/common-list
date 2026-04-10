<script setup lang="ts">
import { ChevronLeftIcon } from "@heroicons/vue/24/outline";
import { useRouter } from "vue-router";

withDefaults(defineProps<{ label?: string }>(), { label: "Back" });

const router = useRouter();

function goBack() {
  const back = (window.history.state as { back?: unknown } | null)?.back;
  if (back != null) {
    router.back();
    return;
  }
  void router.push({ name: "list" });
}
</script>

<template>
  <div class="mb-4">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
      @click="goBack"
    >
      <ChevronLeftIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
      {{ label }}
    </button>
  </div>
</template>
