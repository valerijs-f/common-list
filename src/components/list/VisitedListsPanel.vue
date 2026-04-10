<script setup lang="ts">
import VisitedListRow from "../VisitedListRow.vue";

defineProps<{
  visitedIdsReady: boolean;
  visitedListIds: string[];
  myAccountId: string;
  onRemoveFromVisited: (id: string) => void;
  onListDeletedByOwner: (id: string) => void;
}>();
</script>

<template>
  <div class="space-y-4 py-2 text-left">
    <h2 class="text-xl font-semibold text-white">Your lists</h2>
    <p class="text-gray-400 text-sm leading-relaxed">
      Lists you opened or created. Use the plus icon below or open a shared link.
    </p>
    <p v-if="!visitedIdsReady" class="text-gray-500 text-sm py-4 text-center">Loading…</p>
    <ul v-else-if="visitedListIds.length > 0" class="space-y-2">
      <li v-for="vid in visitedListIds" :key="vid">
        <VisitedListRow
          :doc-id="vid"
          :my-account-id="myAccountId"
          :on-remove-from-visited="onRemoveFromVisited"
          :on-list-deleted-by-owner="onListDeletedByOwner"
        />
      </li>
    </ul>
    <p v-else class="text-gray-500 text-sm text-center py-6">No lists here yet.</p>
  </div>
</template>
