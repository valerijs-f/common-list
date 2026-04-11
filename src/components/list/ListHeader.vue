<script setup lang="ts">
import { RouterLink } from "vue-router";
import UiOverflowMenu from "../ui/UiOverflowMenu.vue";

defineProps<{
  displayListName: string;
  /** When set, show list settings in the menu (creator only). */
  settingsListId: string | null;
  /** Number of completed list items (for “remove completed” visibility). */
  completedListItemCount: number;
  /** Shown under the title when the list is loaded (e.g. 1/2 completed). */
  listItemProgress: { completed: number; total: number } | null;
}>();

const emit = defineEmits<{
  share: [];
  removeCompleted: [];
}>();

const menuItemClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800";

const settingsLinkClass =
  "block w-full px-3 py-2 text-left text-sm text-gray-200 no-underline hover:bg-gray-800";

const menuItemDangerClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800";
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <div class="min-w-0 flex-1">
      <h1 class="truncate text-2xl font-bold text-white" :title="displayListName">
        {{ displayListName }}
      </h1>
      <p v-if="listItemProgress" class="mt-1 text-sm text-gray-500">
        {{ listItemProgress.completed }}/{{ listItemProgress.total }} completed
      </p>
    </div>
    <UiOverflowMenu menu-aria-label="List actions" align="end">
      <button type="button" role="menuitem" :class="menuItemClass" @click="emit('share')">
        Share list
      </button>
      <RouterLink
        v-if="settingsListId"
        role="menuitem"
        :to="{ name: 'listSettings', params: { listId: settingsListId } }"
        :class="settingsLinkClass"
      >
        List settings
      </RouterLink>
      <button
        v-if="completedListItemCount > 0"
        type="button"
        role="menuitem"
        :class="menuItemDangerClass"
        @click="emit('removeCompleted')"
      >
        Remove completed list items
      </button>
    </UiOverflowMenu>
  </div>
</template>
