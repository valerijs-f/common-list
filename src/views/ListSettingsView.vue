<script setup lang="ts">
import { useListSettings } from "../composables/useListSettings";
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
  saveListName,
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
        <form class="mt-6 space-y-3" @submit.prevent="saveListName">
          <UiTextField
            id="settings-list-name"
            v-model="listNameDraft"
            label="List name"
            type="text"
            placeholder="List name"
            autocomplete="off"
          />
          <UiButton type="submit" full-width>Save name</UiButton>
        </form>

        <section class="mt-8 space-y-2 border-t border-gray-800 pt-6">
          <h2 class="text-sm font-medium text-gray-300">Privacy</h2>
          <p class="text-sm leading-relaxed text-gray-400">
            Every list is available to anyone who has the link. They can view and edit tasks.
            There is no permission management - if a link is leaked or you need to revoke access,
            delete this list and create a new one so collaborators get a fresh link.
          </p>
          <p class="text-sm leading-relaxed text-gray-500">
            This screen is only for you as the creator to manage the list; it does not change who
            can access the data on the network.
          </p>
        </section>

        <section class="mt-8 space-y-3 border-t border-red-900/40 pt-6">
          <h2 class="text-sm font-medium text-red-400">Danger zone</h2>
          <p class="text-sm text-gray-400">
            Permanently delete this list and all tasks for everyone. This cannot be undone.
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
        <p>This permanently deletes the list and all tasks. Anyone you shared it with will lose access.</p>
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
