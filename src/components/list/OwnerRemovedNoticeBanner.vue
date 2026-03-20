<script setup lang="ts">
import UiButton from "../ui/UiButton.vue";

defineProps<{
  message: string;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <div
    role="status"
    class="mb-3 flex gap-2 rounded-lg border border-amber-500/35 bg-amber-950/50 px-3 py-2 text-sm text-amber-100"
  >
    <p class="min-w-0 flex-1 leading-snug">{{ message }}</p>
    <UiButton
      variant="bare"
      type="button"
      class="shrink-0 text-amber-200/90 underline-offset-2 hover:text-white hover:underline"
      @click="emit('dismiss')"
    >
      Dismiss
    </UiButton>
  </div>
</template>
