<script setup lang="ts">
import { ref, computed, useTemplateRef, watch, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { Bars3Icon, PencilSquareIcon, ShareIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { Account, co } from "jazz-tools";
import { useAccount, useCoState } from "community-jazz-vue";
import { useClipboard, useTitle, useFocus } from "@vueuse/core";
import { useSortable, removeNode, insertNodeAt } from "@vueuse/integrations/useSortable";
import { generateKeyBetween } from "fractional-indexing";
import { ListDocument, ListItem } from "./schema";

const route = useRoute();

function paramListId(): string | undefined {
  const raw = route.params.listId;
  return typeof raw === "string" ? raw : undefined;
}

const me = useAccount(Account, { resolve: { profile: true } });
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
    pageTitle.value = "Items";
    return;
  }
  const count = listItems.value.filter((t) => !t.completed).length;
  const label = displayListName.value;
  pageTitle.value = count > 0 ? `(${count}) ${label}` : label;
});

// Auto-focus input after adding a list item
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const { focused: inputFocused } = useFocus(inputEl);

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
  inputFocused.value = true;
}

function toggleListItem(listItem: co.loaded<typeof ListItem>) {
  listItem.$jazz.set("completed", !listItem.completed);
}

const deleteConfirmDialog = useTemplateRef<HTMLDialogElement>("deleteConfirmDialog");
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
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div v-if="listId" class="mb-6 space-y-3">
          <div v-if="listDocument?.$isLoaded && canEditListName && editingListName" class="space-y-2">
            <div class="flex justify-end">
              <button
                type="button"
                class="shrink-0 rounded-lg border border-gray-600 p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                aria-label="Share list"
                title="Share list"
                @click="shareOrCopy"
              >
                <ShareIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <label class="sr-only" for="list-name-edit">List name</label>
            <input
              id="list-name-edit"
              v-model="listNameDraft"
              type="text"
              class="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-2xl font-bold text-white placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="List name"
            />
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                @click="saveListName"
              >
                Save name
              </button>
              <button
                type="button"
                class="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
                @click="cancelEditListName"
              >
                Cancel
              </button>
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
              <button
                type="button"
                class="rounded-lg border border-gray-600 p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                aria-label="Share list"
                title="Share list"
                @click="shareOrCopy"
              >
                <ShareIcon class="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                v-if="canEditListName"
                type="button"
                class="rounded-lg border border-gray-600 p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                aria-label="Rename list"
                title="Rename list"
                @click="startEditListName"
              >
                <PencilSquareIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="!listId" class="space-y-4 py-4 text-center">
          <p class="text-gray-400 text-sm leading-relaxed">
            No list is open. Open a shared link, or use
            <span class="font-medium text-gray-300">New list</span>
            in the bar below.
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
            <input
              ref="inputEl"
              v-model="newTitle"
              placeholder="New task"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              :disabled="!authorName"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
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
              <button
                type="button"
                class="list-item-delete shrink-0 text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                title="Delete"
                @click.stop="requestDeleteListItem(listItem)"
              >
                <XMarkIcon class="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          </ul>

          <p v-if="listItems.length === 0" class="text-gray-500 text-center py-4">
            No list items yet. Add one above!
          </p>

        </template>
      </div>
    </div>

    <dialog
      ref="deleteConfirmDialog"
      class="fixed left-1/2 top-1/2 z-50 w-[min(100%,24rem)] max-h-[min(90vh,calc(100vh-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200 shadow-xl open:flex open:flex-col open:gap-4 [&::backdrop]:bg-black/70"
      aria-labelledby="delete-dialog-title"
      @close="onDeleteDialogClose"
    >
      <h2 id="delete-dialog-title" class="text-lg font-semibold text-white">
        Delete this task?
      </h2>
      <div class="w-full min-w-0 space-y-2 text-sm text-gray-400">
        <p
          class="min-w-0 truncate text-gray-200"
          :title="pendingDeleteTitle"
        >
          “{{ pendingDeleteTitle }}”
        </p>
        <p>Will be removed from the list. This can’t be undone.</p>
      </div>
      <div class="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
          autofocus
          @click="cancelDeleteDialog"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="confirmDeleteListItem"
        >
          Delete
        </button>
      </div>
    </dialog>
</template>
