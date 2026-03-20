<script setup lang="ts">
import type { Component } from "vue";
import { computed, ref, useTemplateRef } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ListBulletIcon, PlusIcon } from "@heroicons/vue/24/outline";
import { MusicalNoteIcon } from "@heroicons/vue/24/solid";
import { useAccount } from "community-jazz-vue";
import { AppAccount } from "../appAccount";
import { PASSKEY_APP_NAME } from "../auth/passkeyConfig";
import { createNewListId } from "../lists/createNewList";
import { appNavTabs, type AppNavIcon } from "../navigation/appNav";
import UiButton from "../components/ui/UiButton.vue";
import UiDialog from "../components/ui/UiDialog.vue";
import UiDialogActions from "../components/ui/UiDialogActions.vue";
import UiTextField from "../components/ui/UiTextField.vue";

const router = useRouter();
const me = useAccount(AppAccount, { resolve: { profile: true } });

const myAccountId = computed(() => {
  const m = me.value;
  if (!m?.$isLoaded) return "";
  return m.$jazz.id;
});

const newListDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
  "newListDialog",
);
const newListName = ref("");

function openNewListDialog() {
  newListName.value = "";
  newListDialog.value?.showModal();
}

function cancelNewListDialog() {
  newListDialog.value?.close();
}

function confirmNewList() {
  const accountId = myAccountId.value;
  if (!accountId) return;
  const id = createNewListId(newListName.value, accountId);
  newListDialog.value?.close();
  void router.push({ name: "list", params: { listId: id } });
}

function onNewListDialogClose() {
  newListName.value = "";
}

const navTabIcons: Record<AppNavIcon, Component> = {
  list: ListBulletIcon,
};
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-gray-950">
    <header
      class="sticky top-0 z-40 shrink-0 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md supports-backdrop-filter:bg-gray-950/80 pt-[env(safe-area-inset-top,0px)]"
    >
      <div class="flex h-14 items-center gap-2 px-4">
        <MusicalNoteIcon
          class="h-7 w-7 shrink-0 text-blue-500"
          aria-hidden="true"
        />
        <span class="truncate text-lg font-semibold tracking-tight text-white">
          {{ PASSKEY_APP_NAME }}
        </span>
      </div>
    </header>

    <main
      class="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]"
    >
      <router-view />
    </main>

    <nav
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur-md supports-backdrop-filter:bg-gray-950/80 pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Main"
    >
      <div class="flex">
        <RouterLink
          v-for="tab in appNavTabs"
          :key="tab.label"
          :to="tab.to"
          class="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-gray-500 transition-colors"
          active-class="text-blue-400"
        >
          <component
            :is="navTabIcons[tab.icon]"
            class="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span class="truncate px-1">{{ tab.label }}</span>
        </RouterLink>
        <button
          type="button"
          class="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-gray-300 active:text-blue-400"
          aria-label="Create new list"
          @click="openNewListDialog"
        >
          <PlusIcon class="h-6 w-6 shrink-0" aria-hidden="true" />
          <span class="truncate px-1">New list</span>
        </button>
      </div>
    </nav>

    <UiDialog
      ref="newListDialog"
      aria-labelledby="new-list-dialog-title"
      @close="onNewListDialogClose"
    >
      <template #title>
        <h2 id="new-list-dialog-title" class="text-lg font-semibold text-white">
          New list
        </h2>
      </template>
      <form class="flex flex-col gap-3" @submit.prevent="confirmNewList">
        <UiTextField
          id="new-list-name"
          v-model="newListName"
          label="Name"
          hint="Leave blank to use “Untitled list”. You can rename it later."
          type="text"
          placeholder="e.g. Groceries"
          autocomplete="off"
        />
        <UiDialogActions>
          <UiButton variant="secondary" type="button" @click="cancelNewListDialog">
            Cancel
          </UiButton>
          <UiButton type="submit" :disabled="!myAccountId">Create</UiButton>
        </UiDialogActions>
      </form>
    </UiDialog>
  </div>
</template>
