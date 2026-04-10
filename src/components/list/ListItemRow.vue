<script setup lang="ts">
import { XMarkIcon, Bars3Icon, EyeIcon, PencilIcon } from "@heroicons/vue/24/outline";
import { co } from "jazz-tools";
import { ListItem } from "../../schema";
import UiButton from "../ui/UiButton.vue";

defineProps<{
  listItem: co.loaded<typeof ListItem>;
  isMine: boolean;
}>();

const emit = defineEmits<{
  toggle: [item: co.loaded<typeof ListItem>];
  deleteRequest: [item: co.loaded<typeof ListItem>];
  openDetail: [item: co.loaded<typeof ListItem>];
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
    <span class="flex min-w-0 flex-1 items-center gap-1">
      <span
        class="min-w-0 flex-1 truncate py-0.5 text-left"
        :class="listItem.completed ? 'line-through text-gray-500' : 'text-gray-200'"
        :title="listItem.title"
      >
        {{ listItem.title }}
      </span>
      <UiButton
        variant="bare"
        type="button"
        class="shrink-0 p-1 text-gray-500 transition-colors hover:text-blue-400"
        :title="isMine ? 'Edit task' : 'View full task'"
        :aria-label="isMine ? 'Edit task' : 'View full task'"
        @click.stop="emit('openDetail', listItem)"
      >
        <PencilIcon v-if="isMine" class="h-4 w-4" aria-hidden="true" />
        <EyeIcon v-else class="h-4 w-4" aria-hidden="true" />
      </UiButton>
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
