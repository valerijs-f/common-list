<script setup lang="ts">
import { useTemplateRef } from "vue";
import { cn } from "@/lib/cn";

defineProps<{
  ariaLabelledby?: string;
  dialogClass?: string;
}>();

defineEmits<{ close: [] }>();

const dialogRef = useTemplateRef<HTMLDialogElement>("dialogRef");

defineExpose({
  showModal: () => dialogRef.value?.showModal(),
  close: () => dialogRef.value?.close(),
});

const shellClass =
  "fixed left-1/2 top-1/2 z-50 w-[min(100%,24rem)] max-h-[min(90vh,calc(100vh-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200 shadow-xl open:flex open:flex-col open:gap-4 [&::backdrop]:bg-black/70";
</script>

<template>
  <dialog
    ref="dialogRef"
    :class="cn(shellClass, dialogClass)"
    :aria-labelledby="ariaLabelledby"
    @close="$emit('close')"
  >
    <slot name="title" />
    <slot />
    <slot name="actions" />
  </dialog>
</template>
