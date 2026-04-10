<script setup lang="ts">
import { useTemplateRef } from "vue";
import { cn } from "@/lib/cn";

defineProps<{
  ariaLabelledby?: string;
  dialogClass?: string;
}>();

const emit = defineEmits<{ close: [] }>();

const dialogRef = useTemplateRef<HTMLDialogElement>("dialogRef");

defineExpose({
  showModal: () => dialogRef.value?.showModal(),
  close: () => dialogRef.value?.close(),
});

function closeFromBackdrop() {
  dialogRef.value?.close();
}

const layerClass =
  "fixed inset-0 z-50 m-0 max-h-none w-full max-w-none cursor-default border-0 bg-transparent p-0 shadow-none open:flex open:items-start open:justify-center open:px-4 open:pb-4 open:pt-[min(12dvh,3rem)] [&::backdrop]:bg-black/70";

const panelClass =
  "flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full max-w-[min(24rem,calc(100vw-2rem))] touch-manipulation flex-col gap-4 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200 shadow-xl";
</script>

<template>
  <dialog
    ref="dialogRef"
    :class="layerClass"
    :aria-labelledby="ariaLabelledby"
    @click.self="closeFromBackdrop"
    @close="emit('close')"
  >
    <div :class="cn(panelClass, dialogClass)">
      <slot name="title" />
      <slot />
      <slot name="actions" />
    </div>
  </dialog>
</template>
