<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Cog6ToothIcon, ShareIcon } from "@heroicons/vue/24/outline";
import UiButton from "../ui/UiButton.vue";

defineProps<{
  displayListName: string;
  listDocumentLoaded: boolean;
  /** When set, show a link to list settings (creator only). */
  settingsListId: string | null;
}>();

const emit = defineEmits<{
  share: [];
}>();

const settingsLinkClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-600 p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200";
</script>

<template>
  <div class="flex items-start justify-between gap-3">
    <h1 class="min-w-0 flex-1 truncate text-2xl font-bold text-white" :title="displayListName">
      {{ displayListName }}
    </h1>
    <div class="flex shrink-0 items-start gap-2">
      <RouterLink
        v-if="listDocumentLoaded && settingsListId"
        :to="{ name: 'listSettings', params: { listId: settingsListId } }"
        :class="settingsLinkClass"
        aria-label="List settings"
        title="List settings"
      >
        <Cog6ToothIcon class="h-5 w-5" aria-hidden="true" />
      </RouterLink>
      <UiButton
        variant="icon"
        type="button"
        aria-label="Share list"
        title="Share list"
        @click="emit('share')"
      >
        <ShareIcon class="h-5 w-5" aria-hidden="true" />
      </UiButton>
    </div>
  </div>
</template>
