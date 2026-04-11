<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { until } from "@vueuse/core";
import {
  ArrowLeftStartOnRectangleIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  PlusIcon,
} from "@heroicons/vue/24/outline";
import { useAccount, useLogOut } from "community-jazz-vue";
import { AppAccount } from "../appAccount";
import { passkeySignedIn } from "../auth/passkeyAuthState";
import { PASSKEY_APP_NAME } from "../auth/passkeyConfig";
import { createNewListId } from "../lists/createNewList";
import { LIST_DOCUMENT_NAME_MAX_LENGTH } from "../schema";
import {
  fabRequestNewListDialogSignal,
  signalFabAddListItem,
} from "../lib/fabBridge";
import UiButton from "../components/ui/UiButton.vue";
import UiDialog from "../components/ui/UiDialog.vue";
import UiDialogActions from "../components/ui/UiDialogActions.vue";
import UiTextField from "../components/ui/UiTextField.vue";

const router = useRouter();
const route = useRoute();
const logOut = useLogOut();
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

const canCreateNewList = computed(() => {
  return myAccountId.value !== "" && newListName.value.trim().length > 0;
});

function openNewListDialog() {
  newListName.value = "";
  newListDialog.value?.showModal();
}

function cancelNewListDialog() {
  newListDialog.value?.close();
}

function confirmNewList() {
  const accountId = myAccountId.value;
  if (!accountId || !newListName.value.trim()) return;
  let id: string;
  try {
    id = createNewListId(newListName.value, accountId);
  } catch {
    return;
  }
  newListDialog.value?.close();
  void router.push({ name: "list", params: { listId: id } });
}

function onNewListDialogClose() {
  newListName.value = "";
}

watch(fabRequestNewListDialogSignal, () => {
  openNewListDialog();
});

const fabOpensAddListItem = computed(() => {
  if (route.name !== "list") return false;
  const id = route.params.listId;
  return typeof id === "string" && id.length > 0;
});

function onCenterFabClick() {
  if (fabOpensAddListItem.value) {
    signalFabAddListItem();
    return;
  }
  openNewListDialog();
}

const logoutDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
  "logoutDialog",
);

function openLogOutDialog() {
  logoutDialog.value?.showModal();
}

function cancelLogOutDialog() {
  logoutDialog.value?.close();
}

async function confirmLogOut() {
  logoutDialog.value?.close();
  try {
    await Promise.resolve(logOut());
    await until(passkeySignedIn).toBe(false, { timeout: 5000 });
    await router.replace({ name: "login" });
  } catch {
    /* logOut failed or session did not clear in time */
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-gray-950">
    <header
      class="sticky top-0 z-40 shrink-0 border-b border-gray-800 bg-gray-950/95 backdrop-blur-md supports-backdrop-filter:bg-gray-950/80 pt-[env(safe-area-inset-top,0px)]"
    >
      <div class="flex h-14 items-center gap-2 px-4">
        <ClipboardDocumentListIcon
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
      <div
        class="grid grid-cols-3 items-center justify-items-center gap-y-1 py-2 touch-manipulation"
      >
        <RouterLink
          :to="{ name: 'list' }"
          class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors -outline-offset-2"
        >
          <HomeIcon class="h-6 w-6 shrink-0" aria-hidden="true" />
        </RouterLink>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:text-gray-300 active:text-blue-400 -outline-offset-2"
          :aria-label="fabOpensAddListItem ? 'Add list item' : 'Create new list'"
          @click="onCenterFabClick"
        >
          <PlusIcon class="h-6 w-6 shrink-0" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:text-gray-300 active:text-red-400 -outline-offset-2"
          aria-label="Log out"
          @click="openLogOutDialog"
        >
          <ArrowLeftStartOnRectangleIcon class="h-6 w-6 shrink-0 rotate-180" aria-hidden="true" />
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
          hint="You can change it later in list settings."
          type="text"
          placeholder="e.g. Groceries"
          autocomplete="off"
          required
          :maxlength="LIST_DOCUMENT_NAME_MAX_LENGTH"
        />
        <UiDialogActions>
          <UiButton variant="secondary" type="button" @click="cancelNewListDialog">
            Cancel
          </UiButton>
          <UiButton type="submit" :disabled="!canCreateNewList">Create</UiButton>
        </UiDialogActions>
      </form>
    </UiDialog>

    <UiDialog
      ref="logoutDialog"
      aria-labelledby="logout-dialog-title"
    >
      <template #title>
        <h2 id="logout-dialog-title" class="text-lg font-semibold text-white">
          Log out?
        </h2>
      </template>
      <p class="text-sm text-gray-400">
        You’ll need to sign in again to sync your lists.
      </p>
      <UiDialogActions>
        <UiButton variant="secondary" type="button" @click="cancelLogOutDialog">
          Cancel
        </UiButton>
        <UiButton type="button" @click="confirmLogOut">Log out</UiButton>
      </UiDialogActions>
    </UiDialog>
  </div>
</template>
