<script setup lang="ts">
import { ref, computed, useTemplateRef, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Account, co, Group } from "jazz-tools";
import { useAccount, useCoState } from "community-jazz-vue";
import { useClipboard, useTitle, useFocus } from "@vueuse/core";
import { useSortable, removeNode, insertNodeAt } from "@vueuse/integrations/useSortable";
import { generateKeyBetween } from "fractional-indexing";
import { ListItem, ListItemList } from "./schema";

const route = useRoute();
const router = useRouter();

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

const newTitle = ref("");
const { copy, copied } = useClipboard({ copiedDuring: 2000 });

const listId = ref<string | undefined>(paramListId());

// JazzProvider only renders children once context is ready,
// so we can safely create the list here
if (!listId.value) {
  const group = Group.create();
  group.addMember("everyone", "writer");
  const newList = ListItemList.create([], { owner: group });
  const id = newList.$jazz.id;
  listId.value = id;
  void router.replace({ name: "list", params: { listId: id } });
}

watch(
  () => route.params.listId,
  (id) => {
    const nextId = typeof id === "string" ? id : undefined;
    if (nextId && nextId !== listId.value) listId.value = nextId;
  },
);

const listItemList = useCoState(ListItemList, listId, {
  resolve: { $each: true },
});

const listItems = computed(() => {
  const list = listItemList.value;
  if (!list?.$isLoaded) return [];
  return [...list].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
});

// Page title with incomplete list item count
const pageTitle = useTitle("List");
watchEffect(() => {
  const count = listItems.value.filter((t) => !t.completed).length;
  pageTitle.value = count > 0 ? `(${count}) List` : "List";
});

// Auto-focus input after adding a list item
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const { focused: inputFocused } = useFocus(inputEl);

function addListItem() {
  const list = listItemList.value;
  const title = newTitle.value.trim();
  const author = authorName.value;
  if (!title || !author || !list?.$isLoaded) return;
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
  const list = listItemList.value;
  if (id && list?.$isLoaded) {
    const listIndex = [...list].findIndex((t) => t.$jazz.id === id);
    if (listIndex !== -1) list.$jazz.remove(listIndex);
  }
  deleteConfirmDialog.value?.close();
}

const copyLink = () => copy(window.location.href);

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
  <div class="min-h-screen bg-gray-950 flex items-start justify-center pt-16 px-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center mb-8">
        <div class="flex items-center gap-2">
          <svg class="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <span class="text-white text-xl font-semibold tracking-tight">jazz</span>
        </div>
      </div>

      <!-- Card -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h1 class="text-3xl font-bold text-white mb-6">List</h1>

        <div
          v-if="!listItemList?.$isLoaded"
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
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                </svg>
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
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          </ul>

          <p v-if="listItems.length === 0" class="text-gray-500 text-center py-4">
            No list items yet. Add one above!
          </p>

          <div v-if="listId" class="mt-6 flex items-center gap-2">
            <p class="text-xs text-gray-500 break-all flex-1">
              List ID: {{ listId }}
            </p>
            <button
              @click="copyLink"
              class="shrink-0 px-3 py-1 text-xs rounded-md border transition-colors"
              :class="copied
                ? 'border-green-600 text-green-400'
                : 'border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-500'"
            >
              {{ copied ? "Copied!" : "Copy link" }}
            </button>
          </div>
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
  </div>
</template>
