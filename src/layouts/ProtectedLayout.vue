<script setup lang="ts">
import type { Component } from "vue";
import { computed, ref, useTemplateRef } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { ListBulletIcon, PlusIcon } from "@heroicons/vue/24/outline";
import { MusicalNoteIcon } from "@heroicons/vue/24/solid";
import { Account } from "jazz-tools";
import { useAccount } from "community-jazz-vue";
import { PASSKEY_APP_NAME } from "../auth/passkeyConfig";
import { createNewListId } from "../lists/createNewList";
import { appNavTabs, type AppNavIcon } from "../navigation/appNav";

const router = useRouter();
const me = useAccount(Account, { resolve: { profile: true } });

const myAccountId = computed(() => {
  const m = me.value;
  if (!m?.$isLoaded) return "";
  return m.$jazz.id;
});

const newListDialog = useTemplateRef<HTMLDialogElement>("newListDialog");
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

    <dialog
      ref="newListDialog"
      class="fixed top-1/2 left-1/2 z-50 w-[min(100%,24rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200 shadow-xl open:flex open:flex-col open:gap-4 backdrop:bg-black/70"
      aria-labelledby="new-list-dialog-title"
      @close="onNewListDialogClose"
    >
      <h2 id="new-list-dialog-title" class="text-lg font-semibold text-white">
        New list
      </h2>
      <form class="flex flex-col gap-3" @submit.prevent="confirmNewList">
        <label class="block text-sm text-gray-400" for="new-list-name">Name</label>
        <input
          id="new-list-name"
          v-model="newListName"
          type="text"
          placeholder="e.g. Groceries"
          autocomplete="off"
          class="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p class="text-xs text-gray-500">
          Leave blank to use “Untitled list”. You can rename it later if you created the list.
        </p>
        <div class="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
            @click="cancelNewListDialog"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!myAccountId"
          >
            Create
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>
