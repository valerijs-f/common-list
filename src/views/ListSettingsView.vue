<script setup lang="ts">
import { useListSettings } from "../composables/useListSettings";
import { LIST_DOCUMENT_NAME_MAX_LENGTH } from "../schema";
import UiBackLink from "../components/ui/UiBackLink.vue";
import UiButton from "../components/ui/UiButton.vue";
import UiDialog from "../components/ui/UiDialog.vue";
import UiDialogActions from "../components/ui/UiDialogActions.vue";
import UiTextField from "../components/ui/UiTextField.vue";

const {
  listReady,
  displayListName,
  isCreator,
  listNameDraft,
  canSaveListName,
  saveListName,
  addImportantItemsToTheTop,
  setaddImportantItemsToTheTop,
  moveCompletedItemsToTheBottom,
  setMoveCompletedItemsToTheBottom,
  openDeleteDialog,
  closeDeleteDialog,
  onDeleteDialogClose,
  confirmDeleteList,
  deleteBusy,
  deleteError,
  deleteDialog,
} = useListSettings();
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col pb-4">
    <UiBackLink />

    <div class="rounded-xl border border-gray-700 bg-gray-900 p-6">
      <h1 class="text-xl font-semibold text-white">List settings</h1>
      <p v-if="listReady" class="mt-1 truncate text-sm text-gray-500" :title="displayListName">
        {{ displayListName }}
      </p>

      <div v-if="!listReady" class="py-10 text-center text-gray-400">Loading…</div>

      <template v-else-if="isCreator">
        <section class="mt-6 space-y-4">
          <form class="space-y-3" @submit.prevent="saveListName">
            <UiTextField
              id="settings-list-name"
              v-model="listNameDraft"
              label="List name"
              type="text"
              placeholder="List name"
              autocomplete="off"
              :maxlength="LIST_DOCUMENT_NAME_MAX_LENGTH"
            />
            <UiButton type="submit" full-width :disabled="!canSaveListName">Save name</UiButton>
          </form>
          <div class="min-w-0">
            <span class="mb-1 block text-sm text-gray-400">List behavior</span>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <input
                  id="settings-important-items-at-top"
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                  :checked="addImportantItemsToTheTop"
                  @change="setaddImportantItemsToTheTop(($event.target as HTMLInputElement).checked)"
                />
                <div class="text-sm leading-relaxed text-gray-300">
                  Add important items to top of the list
                  <p class="mt-0.5 text-gray-500">
                    When enabled, newly added items marked as important are added at the top of the list.
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <input
                  id="settings-move-completed-items-to-bottom"
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                  :checked="moveCompletedItemsToTheBottom"
                  @change="setMoveCompletedItemsToTheBottom(($event.target as HTMLInputElement).checked)"
                />
                <div class="text-sm leading-relaxed text-gray-300">
                  Move completed items to the bottom
                  <p class="mt-0.5 text-gray-500">
                    When enabled, checking an item complete moves it to the end of the list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-8 space-y-2 border-t border-gray-800 pt-6">
          <h2 class="text-sm font-medium text-gray-300">Privacy</h2>
          <p class="text-sm leading-relaxed text-gray-400">
            Every list is available to anyone who has the link. They can view and edit their own items.
            There is no permission management - if a link is leaked or you need to delete this list
            and create a new one, and share a fresh link with collaborators.
          </p>
          <p class="text-sm leading-relaxed text-gray-500">
            This screen is only for you as the creator to manage the list; it does not change who
            can access the data on the network.
          </p>
        </section>

        <section class="mt-8 space-y-3 border-t border-red-900/40 pt-6">
          <h2 class="text-sm font-medium text-red-400">Danger zone</h2>
          <p class="text-sm text-gray-400">
            Permanently delete this list and all list items for everyone. This cannot be undone.
          </p>
          <UiButton variant="danger" type="button" full-width @click="openDeleteDialog">
            Delete list
          </UiButton>
        </section>
      </template>
    </div>

    <UiDialog
      ref="deleteDialog"
      aria-labelledby="settings-delete-dialog-title"
      @close="onDeleteDialogClose"
    >
      <template #title>
        <h2 id="settings-delete-dialog-title" class="text-lg font-semibold text-white">
          Delete this list for everyone?
        </h2>
      </template>
      <div class="w-full min-w-0 space-y-2 text-sm text-gray-400">
        <p class="min-w-0 truncate text-gray-200" :title="displayListName">
          “{{ displayListName }}”
        </p>
        <p>This permanently deletes the list and all list items. Anyone you shared it with will lose access.</p>
        <p v-if="deleteError" class="text-red-400">{{ deleteError }}</p>
      </div>
      <template #actions>
        <UiDialogActions>
          <UiButton
            variant="secondary"
            type="button"
            autofocus
            :disabled="deleteBusy"
            @click="closeDeleteDialog"
          >
            Cancel
          </UiButton>
          <UiButton variant="danger" type="button" :disabled="deleteBusy" @click="confirmDeleteList">
            Delete forever
          </UiButton>
        </UiDialogActions>
      </template>
    </UiDialog>
  </div>
</template>
