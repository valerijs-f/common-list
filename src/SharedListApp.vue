<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useListItemApp } from "./composables/useListItemApp";
import { LIST_ITEM_TITLE_MAX_LENGTH } from "./schema";
import { fabAddTaskSignal, signalFabRequestNewListDialog } from "./lib/fabBridge";
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
  authorName,
  addListItemWithTitle,
  listItemsEl,
  listItems,
  toggleListItem,
  requestDeleteListItem,
  deleteConfirmDialog,
  pendingDeleteTitle,
  onDeleteDialogClose,
  cancelDeleteDialog,
  confirmDeleteListItem,
  completedTaskCount,
  completedRemovalDialog,
  pendingCompletedRemovalIds,
  requestRemoveAllCompleted,
  onCompletedRemovalDialogClose,
  cancelCompletedRemovalDialog,
  confirmRemoveAllCompleted,
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

const fabNewTaskTitle = ref("");
const fabAddTaskDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
  "fabAddTaskDialog",
);
const pendingOpenAddTaskFromFab = ref(false);

const canSubmitFabTask = computed(
  () =>
    fabNewTaskTitle.value.trim().length > 0 &&
    authorName.value !== "" &&
    myAccountId.value !== "",
);

function openFabAddTaskDialog() {
  fabNewTaskTitle.value = "";
  fabAddTaskDialog.value?.showModal();
}

watch(fabAddTaskSignal, () => {
  if (!listId.value) return;
  if (listReady.value) {
    openFabAddTaskDialog();
  } else {
    pendingOpenAddTaskFromFab.value = true;
  }
});

watch([listId, listReady], () => {
  if (!listId.value) {
    pendingOpenAddTaskFromFab.value = false;
    return;
  }
  if (pendingOpenAddTaskFromFab.value && listReady.value) {
    pendingOpenAddTaskFromFab.value = false;
    openFabAddTaskDialog();
  }
});

function onFabAddTaskDialogClose() {
  fabNewTaskTitle.value = "";
}

function submitFabAddTask() {
  if (addListItemWithTitle(fabNewTaskTitle.value)) {
    fabAddTaskDialog.value?.close();
    fabNewTaskTitle.value = "";
  }
}

function chooseCreateListInstead() {
  fabAddTaskDialog.value?.close();
  fabNewTaskTitle.value = "";
  signalFabRequestNewListDialog();
}

function cancelFabAddTaskDialog() {
  fabAddTaskDialog.value?.close();
}
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
      <template v-if="listId">
        <div class="space-y-3">
          <ListHeader
            :display-list-name="displayListName"
            :settings-list-id="isListCreator && listId ? listId : null"
            :completed-task-count="completedTaskCount"
            :task-progress="
              listReady ? { completed: completedTaskCount, total: listItems.length } : null
            "
            @share="shareOrCopy"
            @remove-completed="requestRemoveAllCompleted"
          />
        </div>

        <div v-if="!listReady" class="py-8 text-center text-gray-400">Loading...</div>

        <div v-else class="mt-4 border-t border-gray-700 pt-4">
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
            No list items yet. Tap the + button below to add one.
          </p>
        </div>
      </template>

      <VisitedListsPanel
        v-else
        :visited-ids-ready="visitedIdsReady"
        :visited-list-ids="visitedListIds"
        :my-account-id="myAccountId"
        :on-remove-from-visited="removeIdFromVisited"
        :on-list-deleted-by-owner="handleListDeletedByOwner"
      />
    </div>

    <UiDialog
      ref="fabAddTaskDialog"
      aria-labelledby="fab-add-task-title"
      @close="onFabAddTaskDialogClose"
    >
      <template #title>
        <h2 id="fab-add-task-title" class="text-lg font-semibold text-white">New item</h2>
      </template>
      <form class="flex flex-col gap-3" @submit.prevent="submitFabAddTask">
        <UiTextField
          id="fab-new-task"
          v-model="fabNewTaskTitle"
          label="Title"
          type="text"
          placeholder="What should be added?"
          autocomplete="off"
          :maxlength="LIST_ITEM_TITLE_MAX_LENGTH"
        />
        <p class="text-left">
          <button
            type="button"
            class="text-sm text-gray-400 underline decoration-gray-600 underline-offset-2 hover:text-gray-300"
            @click="chooseCreateListInstead"
          >
            Create new list instead
          </button>
        </p>
        <UiDialogActions>
          <UiButton variant="secondary" type="button" @click="cancelFabAddTaskDialog">
            Cancel
          </UiButton>
          <UiButton type="submit" :disabled="!canSubmitFabTask">Add</UiButton>
        </UiDialogActions>
      </form>
    </UiDialog>

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
        <p>It will be removed from the list. This can’t be undone.</p>
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

    <UiDialog
      ref="completedRemovalDialog"
      aria-labelledby="completed-removal-title"
      @close="onCompletedRemovalDialogClose"
    >
      <template #title>
        <h2 id="completed-removal-title" class="text-lg font-semibold text-white">
          Remove {{ pendingCompletedRemovalIds?.length ?? 0 }} completed
          {{ (pendingCompletedRemovalIds?.length ?? 0) === 1 ? "task" : "tasks" }}?
        </h2>
      </template>
      <div class="w-full min-w-0 space-y-2 text-sm text-gray-400">
        <p>
          This can’t be undone.
        </p>
      </div>
      <template #actions>
        <UiDialogActions>
          <UiButton variant="secondary" type="button" autofocus @click="cancelCompletedRemovalDialog">
            Cancel
          </UiButton>
          <UiButton variant="danger" type="button" @click="confirmRemoveAllCompleted">
            Remove
          </UiButton>
        </UiDialogActions>
      </template>
    </UiDialog>
  </div>
</template>
