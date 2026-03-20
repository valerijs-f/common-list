<script setup lang="ts">
import { XMarkIcon, Bars3Icon } from "@heroicons/vue/24/outline";
import { co } from "jazz-tools";
import { ListItem } from "../../schema";
import UiButton from "../ui/UiButton.vue";

defineProps<{
  listItem: co.loaded<typeof ListItem>;
}>();

const emit = defineEmits<{
  toggle: [item: co.loaded<typeof ListItem>];
  deleteRequest: [item: co.loaded<typeof ListItem>];
}>();
</script>

<template>
  <li class="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800">
    <span
      class="drag-handle cursor-grab active:cursor-grabbing text-gray-600 group-hover:text-gray-400 transition-colors select-none"
      title="Drag to reorder"
    >
      <Bars3Icon class="w-4 h-4" aria-hidden="true" />
    </span>
    <input
      type="checkbox"
      :checked="listItem.completed"
      class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
      @change="emit('toggle', listItem)"
    />
    <span class="flex-1 min-w-0">
      <span
        class="block min-w-0 truncate"
        :title="listItem.title"
        :class="listItem.completed ? 'line-through text-gray-500' : 'text-gray-200'"
      >
        {{ listItem.title }}
      </span>
      <span class="block text-xs text-gray-500 mt-0.5 truncate">
        Added by {{ listItem.author }}
      </span>
    </span>
    <UiButton
      variant="bare"
      type="button"
      class="list-item-delete shrink-0 p-1 text-gray-500 transition-colors hover:text-red-400"
      title="Delete"
      @click.stop="emit('deleteRequest', listItem)"
    >
      <XMarkIcon class="w-4 h-4" aria-hidden="true" />
    </UiButton>
  </li>
</template>
