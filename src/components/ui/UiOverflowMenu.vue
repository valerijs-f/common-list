<script setup lang="ts">
import { useTemplateRef } from "vue";
import { onClickOutside, useEventListener } from "@vueuse/core";
import { EllipsisVerticalIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
  defineProps<{
    /** Accessible label for the menu trigger (e.g. “List actions”). */
    menuAriaLabel: string;
    align?: "end" | "start";
  }>(),
  { align: "end" },
);

const open = defineModel<boolean>({ default: false });

const root = useTemplateRef<HTMLElement>("root");

onClickOutside(root, () => {
  open.value = false;
});

function toggle() {
  open.value = !open.value;
}

function onPanelClick(e: MouseEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return;
  if (el.closest('button, a[href], [role="menuitem"]')) {
    open.value = false;
  }
}

useEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && open.value) open.value = false;
});

defineExpose({
  close: () => {
    open.value = false;
  },
  toggle,
});
</script>

<template>
  <div ref="root" class="relative inline-flex shrink-0">
    <slot name="trigger" :toggle="toggle" :open="open">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-600 p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 -outline-offset-2"
        :aria-expanded="open"
        aria-haspopup="menu"
        :aria-label="menuAriaLabel"
        @click="toggle"
      >
        <EllipsisVerticalIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
      </button>
    </slot>
    <div
      v-show="open"
      role="menu"
      class="absolute z-50 mt-1 min-w-[11rem] rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl"
      :class="props.align === 'end' ? 'right-0' : 'left-0'"
      @click="onPanelClick"
    >
      <slot />
    </div>
  </div>
</template>
