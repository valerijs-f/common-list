<script setup lang="ts">
import { Bars3Icon } from "@heroicons/vue/24/outline";
import { co } from "jazz-tools";
import { ListItem } from "../../schema";
import UiOverflowMenu from "../ui/UiOverflowMenu.vue";

defineProps<{
  listItem: co.loaded<typeof ListItem>;
  isMine: boolean;
}>();

const emit = defineEmits<{
  toggle: [item: co.loaded<typeof ListItem>];
  deleteRequest: [item: co.loaded<typeof ListItem>];
  openDetail: [item: co.loaded<typeof ListItem>];
}>();

const menuItemClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800";

const menuItemDangerClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800";
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
      class="h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
      @change="emit('toggle', listItem)"
    />
    <span
      class="min-w-0 flex-1 truncate py-0.5 text-left"
      :class="listItem.completed ? 'line-through text-gray-500' : 'text-gray-200'"
      :title="listItem.title"
    >
      {{ listItem.title }}
    </span>
    <UiOverflowMenu class="list-item-menu" menu-aria-label="Task actions" align="end">
      <button
        type="button"
        role="menuitem"
        :class="menuItemClass"
        @click="emit('openDetail', listItem)"
      >
        {{ isMine ? "Edit task" : "View task" }}
      </button>
      <button
        type="button"
        role="menuitem"
        :class="menuItemDangerClass"
        @click="emit('deleteRequest', listItem)"
      >
        Delete
      </button>
    </UiOverflowMenu>
  </li>
</template>
