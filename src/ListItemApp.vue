<script setup lang="ts">
import { ref, computed, useTemplateRef, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Bars3Icon, PencilSquareIcon, ShareIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { CoValueLoadingState, co, deleteCoValues } from "jazz-tools";
import { useAccount, useAgent, useCoState } from "community-jazz-vue";
import { useClipboard, useTitle } from "@vueuse/core";
import { useSortable, removeNode, insertNodeAt } from "@vueuse/integrations/useSortable";
import { generateKeyBetween } from "fractional-indexing";
import { AppAccount } from "./appAccount";
import VisitedListRow from "./components/VisitedListRow.vue";
import UiButton from "./components/ui/UiButton.vue";
import UiDialog from "./components/ui/UiDialog.vue";
import UiDialogActions from "./components/ui/UiDialogActions.vue";
import UiTextField from "./components/ui/UiTextField.vue";
import { ListDocument, ListItem } from "./schema";

const route = useRoute();
const router = useRouter();
const agent = useAgent();

function paramListId(): string | undefined {
  const raw = route.params.listId;
  return typeof raw === "string" ? raw : undefined;
}

const me = useAccount(AppAccount, {
  resolve: { profile: true, root: { visitedListIds: true } },
});
const authorName = computed(() => {
  const m = me.value;
  if (!m?.$isLoaded) return "";
  const profile = m.profile;
  if (!profile?.$isLoaded) return "";
  const name = profile.name;
  return typeof name === "string" ? name.trim() : "";
});

const myAccountId = computed(() => {
  const m = me.value;
  if (!m?.$isLoaded) return "";
  return m.$jazz.id;
});

const newTitle = ref("");
const { copy } = useClipboard({ copiedDuring: 2000 });

const listId = ref<string | undefined>(paramListId());

watch(
  () => route.params.listId,
  (id) => {
    listId.value = typeof id === "string" ? id : undefined;
  },
);

const listDocument = useCoState(ListDocument, listId, {
  resolve: { items: { $each: true } },
});

const itemsCoList = computed(() => {
  const doc = listDocument.value;
  if (doc?.$isLoaded && doc.items?.$isLoaded) return doc.items;
  return null;
});

const listItems = computed(() => {
  const list = itemsCoList.value;
  if (!list) return [];
  return [...list].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
});

const displayListName = computed(() => {
  const doc = listDocument.value;
  if (doc?.$isLoaded) return doc.name.trim().length > 0 ? doc.name : "Untitled list";
  return "List";
});

const canEditListName = computed(() => {
  const doc = listDocument.value;
  if (!doc?.$isLoaded) return false;
  const id = myAccountId.value;
  if (!id) return false;
  return doc.createdByAccountId === id;
});

const listReady = computed(() => listDocument.value?.$isLoaded === true);

const visitedIdsReady = computed(() => {
  const m = me.value;
  if (!m || !m.$isLoaded) return false;
  if (!m.root.$isLoaded) return false;
  const ids = m.root.visitedListIds;
  return ids.$isLoaded === true;
});

const visitedListIds = computed(() => {
  const m = me.value;
  if (!m || !m.$isLoaded || !m.root.$isLoaded) return [] as string[];
  const ids = m.root.visitedListIds;
  if (!ids.$isLoaded) return [];
  return [...ids];
});

watch(
  () => [listId.value, listReady.value, visitedIdsReady.value] as const,
  ([id, ready, vReady]) => {
    if (!id || !ready || !vReady) return;
    const m = me.value;
    if (!m || !m.$isLoaded || !m.root.$isLoaded) return;
    const ids = m.root.visitedListIds;
    if (!ids.$isLoaded) return;
    ids.$jazz.remove((x) => x === id);
    ids.$jazz.unshift(id);
  },
);

function removeIdFromVisited(id: string) {
  const m = me.value;
  if (!m || !m.$isLoaded || !m.root.$isLoaded) return;
  const ids = m.root.visitedListIds;
  if (!ids.$isLoaded) return;
  ids.$jazz.remove((x) => x === id);
}

/** When we delete a list locally, a DELETED subscription update may still fire — don’t show the “owner removed” toast for that. */
const suppressOwnerDeletedNoticeFor = new Set<string>();

async function permanentlyDeleteList(id: string) {
  suppressOwnerDeletedNoticeFor.add(id);
  try {
    await deleteCoValues(ListDocument, id, {
      resolve: { items: { $each: true } },
      loadAs: agent,
    });
  } finally {
    setTimeout(() => suppressOwnerDeletedNoticeFor.delete(id), 30_000);
  }
  removeIdFromVisited(id);
  if (listId.value === id) await router.replace({ name: "list" });
}

const ownerRemovedListNotice = ref<string | null>(null);
let ownerNoticeClear: ReturnType<typeof setTimeout> | undefined;

function dismissOwnerNotice() {
  if (ownerNoticeClear) {
    clearTimeout(ownerNoticeClear);
    ownerNoticeClear = undefined;
  }
  ownerRemovedListNotice.value = null;
}

function notifyOwnerDeletedList() {
  ownerRemovedListNotice.value =
    "The list owner deleted this list. It has been removed from your lists.";
  if (ownerNoticeClear) clearTimeout(ownerNoticeClear);
  ownerNoticeClear = setTimeout(dismissOwnerNotice, 8000);
}

function handleListDeletedByOwner(id: string) {
  removeIdFromVisited(id);
  if (!suppressOwnerDeletedNoticeFor.has(id)) notifyOwnerDeletedList();
  if (listId.value === id) void router.replace({ name: "list" });
}

watch(
  () => {
    const id = listId.value;
    const doc = listDocument.value;
    if (!id || !doc || doc.$isLoaded) return null;
    if (doc.$jazz.loadingState === CoValueLoadingState.DELETED) return id;
    return null;
  },
  (deletedId) => {
    if (deletedId) handleListDeletedByOwner(deletedId);
  },
);

const editingListName = ref(false);
const listNameDraft = ref("");

watch(listId, () => {
  editingListName.value = false;
});

function startEditListName() {
  const doc = listDocument.value;
  if (!doc?.$isLoaded) return;
  listNameDraft.value = doc.name;
  editingListName.value = true;
}

function cancelEditListName() {
  editingListName.value = false;
}

function saveListName() {
  const doc = listDocument.value;
  if (!doc?.$isLoaded || !canEditListName.value) return;
  const next =
    listNameDraft.value.trim().length > 0 ? listNameDraft.value.trim() : "Untitled list";
  doc.$jazz.set("name", next);
  editingListName.value = false;
}

// Page title with incomplete list item count
const pageTitle = useTitle("List");
watchEffect(() => {
  if (!listId.value) {
    pageTitle.value = "Lists";
    return;
  }
  const count = listItems.value.filter((t) => !t.completed).length;
  const label = displayListName.value;
  pageTitle.value = count > 0 ? `(${count}) ${label}` : label;
});

// Refocus task input after adding an item
const newTaskField = useTemplateRef<{ focus: () => void }>("newTaskField");

function addListItem() {
  const list = itemsCoList.value;
  const title = newTitle.value.trim();
  const author = authorName.value;
  if (!title || !author || !list) return;
  const sorted = listItems.value;
  const lastOrder = sorted.length > 0 ? sorted[sorted.length - 1]!.order : null;
  const order = generateKeyBetween(lastOrder, null);
  list.$jazz.push({ title, completed: false, order, author });
  newTitle.value = "";
  newTaskField.value?.focus();
}

function toggleListItem(listItem: co.loaded<typeof ListItem>) {
  listItem.$jazz.set("completed", !listItem.completed);
}

const deleteConfirmDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
  "deleteConfirmDialog",
);
const pendingDeleteId = ref<string | null>(null);
const pendingDeleteTitle = ref("");

function requestDeleteListItem(listItem: co.loaded<typeof ListItem>) {
  pendingDeleteId.value = listItem.$jazz.id;
  pendingDeleteTitle.value = listItem.title;
  deleteConfirmDialog.value?.showModal();
}

function clearPendingDelete() {
  pendingDeleteId.value = null;
  pendingDeleteTitle.value = "";
}

function onDeleteDialogClose() {
  clearPendingDelete();
}

function cancelDeleteDialog() {
  deleteConfirmDialog.value?.close();
}

function confirmDeleteListItem() {
  const id = pendingDeleteId.value;
  const list = itemsCoList.value;
  if (id && list) {
    const listIndex = [...list].findIndex((t) => t.$jazz.id === id);
    if (listIndex !== -1) list.$jazz.remove(listIndex);
  }
  deleteConfirmDialog.value?.close();
}

async function shareOrCopy() {
  const url = window.location.href;
  const title = displayListName.value;
  const text = `${title}\n${url}`;

  if (typeof navigator !== "undefined" && "share" in navigator) {
    const data: ShareData = { title, text, url };
    if (navigator.canShare && !navigator.canShare(data)) {
      copy(url);
      return;
    }
    try {
      await navigator.share(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      copy(url);
    }
    return;
  }
  copy(url);
}

const listItemsEl = useTemplateRef<HTMLElement>("listItemsEl");

useSortable(listItemsEl, listItems, {
  // List mount is delayed until `listItemList` loads; without this, Sortable never inits (ref was null on mount).
  watchElement: true,
  handle: ".drag-handle",
  /** Let delete / other controls receive clicks without Sortable interfering */
  filter: "button, .list-item-delete",
  preventOnFilter: true,
  animation: 150,
  onUpdate: (e) => {
    // Revert SortableJS DOM manipulation — let Vue re-render from sorted order
    removeNode(e.item);
    insertNodeAt(e.from, e.item, e.oldIndex!);

    if (e.oldIndex == null || e.newIndex == null) return;
    const sorted = listItems.value;
    const moved = sorted[e.oldIndex];
    if (!moved) return;

    // Calculate the new fractional index between the new neighbors
    const before = e.newIndex > 0 ? sorted[e.newIndex - (e.newIndex > e.oldIndex ? 0 : 1)]?.order ?? null : null;
    const after = e.newIndex < sorted.length - 1 ? sorted[e.newIndex + (e.newIndex < e.oldIndex ? 0 : 1)]?.order ?? null : null;
    moved.$jazz.set("order", generateKeyBetween(before, after));
  },
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col pb-4">
    <div
      v-if="ownerRemovedListNotice"
      role="status"
      class="mb-3 flex gap-2 rounded-lg border border-amber-500/35 bg-amber-950/50 px-3 py-2 text-sm text-amber-100"
    >
      <p class="min-w-0 flex-1 leading-snug">{{ ownerRemovedListNotice }}</p>
      <UiButton
        variant="bare"
        type="button"
        class="shrink-0 text-amber-200/90 underline-offset-2 hover:text-white hover:underline"
        @click="dismissOwnerNotice"
      >
        Dismiss
      </UiButton>
    </div>
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div v-if="listId" class="mb-6 space-y-3">
          <div v-if="listDocument?.$isLoaded && canEditListName && editingListName" class="space-y-2">
            <div class="flex justify-end">
              <UiButton
                variant="icon"
                type="button"
                class="shrink-0"
                aria-label="Share list"
                title="Share list"
                @click="shareOrCopy"
              >
                <ShareIcon class="h-5 w-5" aria-hidden="true" />
              </UiButton>
            </div>
            <UiTextField
              id="list-name-edit"
              v-model="listNameDraft"
              label="List name"
              label-class="sr-only"
              input-class="text-2xl font-bold"
              type="text"
              placeholder="List name"
            />
            <div class="flex flex-wrap gap-2">
              <UiButton type="button" @click="saveListName">Save name</UiButton>
              <UiButton variant="secondary" type="button" @click="cancelEditListName">
                Cancel
              </UiButton>
            </div>
          </div>
          <div v-else class="flex items-start justify-between gap-3">
            <h1
              class="min-w-0 flex-1 truncate text-3xl font-bold text-white"
              :title="displayListName"
            >
              {{ displayListName }}
            </h1>
            <div class="flex shrink-0 items-start gap-2">
              <UiButton
                variant="icon"
                type="button"
                aria-label="Share list"
                title="Share list"
                @click="shareOrCopy"
              >
                <ShareIcon class="h-5 w-5" aria-hidden="true" />
              </UiButton>
              <UiButton
                v-if="canEditListName"
                variant="icon"
                type="button"
                aria-label="Rename list"
                title="Rename list"
                @click="startEditListName"
              >
                <PencilSquareIcon class="h-5 w-5" aria-hidden="true" />
              </UiButton>
            </div>
          </div>
        </div>

        <div v-if="!listId" class="space-y-4 py-2 text-left">
          <h2 class="text-xl font-semibold text-white">Your lists</h2>
          <p class="text-gray-400 text-sm leading-relaxed">
            Lists you opened or created. Use
            <span class="font-medium text-gray-300">New list</span>
            below or open a shared link.
          </p>
          <p v-if="!visitedIdsReady" class="text-gray-500 text-sm py-4 text-center">Loading…</p>
          <ul
            v-else-if="visitedListIds.length > 0"
            class="space-y-2"
          >
            <li v-for="vid in visitedListIds" :key="vid">
              <VisitedListRow
                :doc-id="vid"
                :my-account-id="myAccountId"
                :on-remove-from-visited="removeIdFromVisited"
                :on-delete-list-permanently="permanentlyDeleteList"
                :on-list-deleted-by-owner="handleListDeletedByOwner"
              />
            </li>
          </ul>
          <p v-else class="text-gray-500 text-sm text-center py-6">
            No lists here yet.
          </p>
        </div>

        <div
          v-else-if="!listReady"
          class="text-gray-400 text-center py-8"
        >
          Loading...
        </div>

        <template v-else>
          <form @submit.prevent="addListItem" class="mb-6 space-y-3">
            <UiTextField ref="newTaskField" v-model="newTitle" placeholder="New task" />
            <UiButton type="submit" full-width :disabled="!authorName">
              Add
            </UiButton>
          </form>

          <ul ref="listItemsEl" class="space-y-2">
            <li
              v-for="listItem in listItems"
              :key="listItem.$jazz.id"
              class="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800"
            >
              <span
                class="drag-handle cursor-grab active:cursor-grabbing text-gray-600 group-hover:text-gray-400 transition-colors select-none"
                title="Drag to reorder"
              >
                <Bars3Icon class="w-4 h-4" aria-hidden="true" />
              </span>
              <input
                type="checkbox"
                :checked="listItem.completed"
                @change="toggleListItem(listItem)"
                class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span class="flex-1 min-w-0">
                <span
                  class="block min-w-0 truncate"
                  :title="listItem.title"
                  :class="
                    listItem.completed
                      ? 'line-through text-gray-500'
                      : 'text-gray-200'
                  "
                >
                  {{ listItem.title }}
                </span>
                <span class="block text-xs text-gray-500 mt-0.5 truncate">
                  Added by {{ listItem.author }}
                </span>
              </span>
              <UiButton
                variant="bare"
                type="button"
                class="list-item-delete shrink-0 p-1 text-gray-500 transition-colors hover:text-red-400"
                title="Delete"
                @click.stop="requestDeleteListItem(listItem)"
              >
                <XMarkIcon class="w-4 h-4" aria-hidden="true" />
              </UiButton>
            </li>
          </ul>

          <p v-if="listItems.length === 0" class="text-gray-500 text-center py-4">
            No list items yet. Add one above!
          </p>

        </template>
      </div>
    </div>

    <UiDialog
      ref="deleteConfirmDialog"
      aria-labelledby="delete-dialog-title"
      @close="onDeleteDialogClose"
    >
      <template #title>
        <h2 id="delete-dialog-title" class="text-lg font-semibold text-white">
          Delete this task?
        </h2>
      </template>
      <div class="w-full min-w-0 space-y-2 text-sm text-gray-400">
        <p
          class="min-w-0 truncate text-gray-200"
          :title="pendingDeleteTitle"
        >
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
</template>
