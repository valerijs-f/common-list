<script setup lang="ts">
import { useListItemApp } from "./composables/useListItemApp";
import OwnerRemovedNoticeBanner from "./components/list/OwnerRemovedNoticeBanner.vue";
import ListHeader from "./components/list/ListHeader.vue";
import VisitedListsPanel from "./components/list/VisitedListsPanel.vue";
import ListItemRow from "./components/list/ListItemRow.vue";
import UiButton from "./components/ui/UiButton.vue";
import UiDialog from "./components/ui/UiDialog.vue";
import UiDialogActions from "./components/ui/UiDialogActions.vue";
import UiTextField from "./components/ui/UiTextField.vue";

const {
  listId,
  listDocumentLoaded,
  listReady,
  displayListName,
  isListCreator,
  shareOrCopy,
  visitedIdsReady,
  visitedListIds,
  myAccountId,
  removeIdFromVisited,
  handleListDeletedByOwner,
  ownerRemovedListNotice,
  dismissOwnerNotice,
  inaccessibleListNotice,
  dismissInaccessibleListNotice,
  newTitle,
  authorName,
  newTaskField,
  addListItem,
  listItemsEl,
  listItems,
  toggleListItem,
  requestDeleteListItem,
  deleteConfirmDialog,
  pendingDeleteTitle,
  onDeleteDialogClose,
  cancelDeleteDialog,
  confirmDeleteListItem,
} = useListItemApp();
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col pb-4">
    <OwnerRemovedNoticeBanner
      v-if="ownerRemovedListNotice"
      :message="ownerRemovedListNotice"
      @dismiss="dismissOwnerNotice"
    />
    <OwnerRemovedNoticeBanner
      v-if="inaccessibleListNotice"
      :message="inaccessibleListNotice"
      @dismiss="dismissInaccessibleListNotice"
    />
    <div class="rounded-xl border border-gray-700 bg-gray-900 p-6">
      <div v-if="listId" class="mb-6 space-y-3">
        <ListHeader
          :display-list-name="displayListName"
          :list-document-loaded="listDocumentLoaded"
          :settings-list-id="isListCreator && listId ? listId : null"
          @share="shareOrCopy"
        />
      </div>

      <VisitedListsPanel
        v-if="!listId"
        :visited-ids-ready="visitedIdsReady"
        :visited-list-ids="visitedListIds"
        :my-account-id="myAccountId"
        :on-remove-from-visited="removeIdFromVisited"
        :on-list-deleted-by-owner="handleListDeletedByOwner"
      />

      <div v-else-if="!listReady" class="py-8 text-center text-gray-400">Loading...</div>

      <template v-else>
        <form class="mb-6 space-y-3" @submit.prevent="addListItem">
          <UiTextField ref="newTaskField" v-model="newTitle" placeholder="New task" />
          <UiButton type="submit" full-width :disabled="!authorName"> Add </UiButton>
        </form>

        <ul ref="listItemsEl" class="space-y-2">
          <ListItemRow
            v-for="listItem in listItems"
            :key="listItem.$jazz.id"
            :list-item="listItem"
            @toggle="toggleListItem"
            @delete-request="requestDeleteListItem"
          />
        </ul>

        <p v-if="listItems.length === 0" class="py-4 text-center text-gray-500">
          No list items yet. Add one above!
        </p>
      </template>
    </div>

    <UiDialog
      ref="deleteConfirmDialog"
      aria-labelledby="delete-dialog-title"
      @close="onDeleteDialogClose"
    >
      <template #title>
        <h2 id="delete-dialog-title" class="text-lg font-semibold text-white">Delete this task?</h2>
      </template>
      <div class="w-full min-w-0 space-y-2 text-sm text-gray-400">
        <p class="min-w-0 truncate text-gray-200" :title="pendingDeleteTitle">
          “{{ pendingDeleteTitle }}”
        </p>
        <p>Will be removed from the list. This can’t be undone.</p>
      </div>
      <template #actions>
        <UiDialogActions>
          <UiButton variant="secondary" type="button" autofocus @click="cancelDeleteDialog">
            Cancel
          </UiButton>
          <UiButton variant="danger" type="button" @click="confirmDeleteListItem">
            Delete
          </UiButton>
        </UiDialogActions>
      </template>
    </UiDialog>
  </div>
</template>
