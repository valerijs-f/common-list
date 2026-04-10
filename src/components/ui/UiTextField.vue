<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from "vue";
import { cn } from "@/lib/cn";

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ default: "" });

const inputRef = useTemplateRef<HTMLInputElement>("inputRef");

defineExpose({
  focus: () => inputRef.value?.focus(),
});

const props = defineProps<{
  id?: string;
  label?: string;
  /** Merged with default label styles (e.g. `sr-only`). */
  labelClass?: string;
  hint?: string;
  inputClass?: string;
}>();

const attrs = useAttrs();

const baseInput =
  "w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none invalid:border-gray-600 invalid:shadow-none focus:invalid:border-transparent focus:invalid:ring-2 focus:invalid:ring-blue-500";

const inputClasses = computed(() =>
  cn(baseInput, props.inputClass, attrs.class as string | undefined),
);

/** Strip keys that must be controlled by the model so `v-bind` cannot override them (breaks Add/Save until another keystroke). */
const restAttrs = computed(() => {
  const a = { ...(attrs as Record<string, unknown>) };
  delete a.class;
  delete a.value;
  delete a.modelValue;
  delete a.onInput;
  delete a.onChange;
  return a;
});

function onInput(e: Event) {
  model.value = (e.target as HTMLInputElement).value;
}

function onCompositionEnd(e: CompositionEvent) {
  model.value = (e.target as HTMLInputElement).value;
}
</script>

<template>
  <div class="min-w-0">
    <label
      v-if="label"
      :class="cn('mb-1 block text-sm text-gray-400', props.labelClass)"
      :for="id"
      >{{ label }}</label
    >
    <input
      ref="inputRef"
      :id="id"
      :class="inputClasses"
      v-bind="restAttrs"
      :value="model"
      @input="onInput"
      @compositionend="onCompositionEnd"
    />
    <p v-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>
