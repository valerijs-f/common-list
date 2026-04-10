<script setup lang="ts">
import { RouterLink } from "vue-router";
import UiOverflowMenu from "../ui/UiOverflowMenu.vue";

defineProps<{
  displayListName: string;
  /** When set, show list settings in the menu (creator only). */
  settingsListId: string | null;
  /** Number of completed tasks (for “remove completed” visibility). */
  completedTaskCount: number;
}>();

const emit = defineEmits<{
  share: [];
  removeCompleted: [];
}>();

const menuItemClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800";

const settingsLinkClass =
  "block w-full px-3 py-2 text-left text-sm text-gray-200 no-underline hover:bg-gray-800";
</script>

<template>
  <div class="flex items-start justify-between gap-3">
    <h1 class="min-w-0 flex-1 truncate text-2xl font-bold text-white" :title="displayListName">
      {{ displayListName }}
    </h1>
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
        v-if="completedTaskCount > 0"
        type="button"
        role="menuitem"
        :class="menuItemClass"
        @click="emit('removeCompleted')"
      >
        Remove completed tasks
      </button>
    </UiOverflowMenu>
  </div>
</template>
