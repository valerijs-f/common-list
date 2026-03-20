<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/cn";

defineOptions({ inheritAttrs: false });

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "muted"
  | "icon"
  | "iconGhost"
  | "bare";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    fullWidth?: boolean;
  }>(),
  {
    variant: "primary",
    fullWidth: false,
  },
);

const attrs = useAttrs();

type ButtonType = "button" | "submit" | "reset";

const buttonType = computed((): ButtonType => {
  const t = attrs.type as string | undefined;
  if (t === "submit" || t === "reset" || t === "button") return t;
  return "button";
});

const restAttrs = computed(() => {
  const a = { ...(attrs as Record<string, unknown>) };
  delete a.class;
  delete a.type;
  return a;
});

const variantClass: Record<Variant, string> = {
  primary:
    "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 disabled:opacity-50",
  danger:
    "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
  muted:
    "rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 disabled:opacity-50",
  icon:
    "shrink-0 rounded-lg border border-gray-600 p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200",
  iconGhost:
    "rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200",
  bare: "",
};

const layoutClass = computed(() => {
  if (props.variant === "bare") return "inline-flex items-center justify-center";
  if (props.variant === "icon" || props.variant === "iconGhost") return "inline-flex items-center justify-center";
  return "inline-flex items-center justify-center";
});

const buttonClass = computed(() =>
  cn(
    layoutClass.value,
    variantClass[props.variant],
    props.fullWidth && "w-full",
    attrs.class as string | undefined,
  ),
);
</script>

<template>
  <button :type="buttonType" :class="buttonClass" v-bind="restAttrs">
    <slot />
  </button>
</template>
