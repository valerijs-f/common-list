<script setup lang="ts">
import { useListItemApp } from "./composables/useListItemApp";
import { LIST_ITEM_TITLE_MAX_LENGTH } from "./schema";
import OwnerRemovedNoticeBanner from "./components/list/OwnerRemovedNoticeBanner.vue";
import ListHeader from "./components/list/ListHeader.vue";
import VisitedListsPanel from "./components/list/VisitedListsPanel.vue";
import ListItemRow from "./components/list/ListItemRow.vue";
import UiBackLink from "./components/ui/UiBackLink.vue";
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
  detailDialog,
  detailTitle,
  detailAuthor,
  openListItemDetail,
  onDetailDialogClose,
  closeDetailDialog,
  detailCanEdit,
  canSaveDetail,
  saveDetailTitle,
  isListItemMine,
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
    <UiBackLink v-if="listId" />
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
          <UiTextField
            ref="newTaskField"
            v-model="newTitle"
            placeholder="New task"
            :maxlength="LIST_ITEM_TITLE_MAX_LENGTH"
          />
          <UiButton type="submit" full-width :disabled="!authorName || !myAccountId">
            Add
          </UiButton>
        </form>

        <ul ref="listItemsEl" class="space-y-2">
          <ListItemRow
            v-for="listItem in listItems"
            :key="listItem.$jazz.id"
            :list-item="listItem"
            :is-mine="isListItemMine(listItem)"
            @toggle="toggleListItem"
            @delete-request="requestDeleteListItem"
            @open-detail="openListItemDetail"
          />
        </ul>

        <p v-if="listItems.length === 0" class="py-4 text-center text-gray-500">
          No list items yet. Add one above!
        </p>
      </template>
    </div>

    <UiDialog
      ref="detailDialog"
      aria-labelledby="detail-dialog-title"
      @close="onDetailDialogClose"
    >
      <template #title>
        <h2 id="detail-dialog-title" class="text-lg font-semibold text-white">Task</h2>
      </template>
      <div class="w-full min-w-0 space-y-3 text-sm">
        <label v-if="detailCanEdit" class="sr-only" for="detail-task-text">Task text</label>
        <textarea
          v-if="detailCanEdit"
          id="detail-task-text"
          v-model="detailTitle"
          rows="5"
          autofocus
          :maxlength="LIST_ITEM_TITLE_MAX_LENGTH"
          class="min-h-28 w-full resize-y rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p v-else class="whitespace-pre-wrap wrap-break-word text-gray-200">{{ detailTitle }}</p>
        <p class="text-gray-400">
          <template v-if="detailCanEdit">Added by you</template>
          <template v-else>
            Added by <span class="text-gray-300">{{ detailAuthor }}</span>
          </template>
        </p>
      </div>
      <template #actions>
        <UiDialogActions>
          <UiButton variant="secondary" type="button" :autofocus="!detailCanEdit" @click="closeDetailDialog">
            Close
          </UiButton>
          <UiButton
            v-if="detailCanEdit"
            type="button"
            :disabled="!canSaveDetail"
            @click="saveDetailTitle"
          >
            Save
          </UiButton>
        </UiDialogActions>
      </template>
    </UiDialog>

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
