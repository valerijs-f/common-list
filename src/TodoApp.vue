<script setup lang="ts">
import { ref, computed, useTemplateRef, watchEffect } from "vue";
import { Account, co, Group } from "jazz-tools";
import { useAccount, useCoState } from "community-jazz-vue";
import { useClipboard, useUrlSearchParams, useTitle, useFocus } from "@vueuse/core";
import { useSortable, removeNode, insertNodeAt } from "@vueuse/integrations/useSortable";
import { generateKeyBetween } from "fractional-indexing";
import { ToDo, ToDoList } from "./schema";

const isOnline = defineModel<boolean>("isOnline", { required: true });

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

const params = useUrlSearchParams("history");
const listId = ref<string | undefined>(params.id as string | undefined);

// JazzProvider only renders children once context is ready,
// so we can safely create the list here
if (!listId.value) {
  const group = Group.create();
  group.addMember("everyone", "writer");
  const newList = ToDoList.create([], { owner: group });
  listId.value = newList.$jazz.id;
  params.id = newList.$jazz.id;
}

const todoList = useCoState(ToDoList, listId, {
  resolve: { $each: true },
});

const todos = computed(() => {
  const list = todoList.value;
  if (!list?.$isLoaded) return [];
  return [...list].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
});

// Page title with todo count
const pageTitle = useTitle("To Do");
watchEffect(() => {
  const count = todos.value.filter((t) => !t.completed).length;
  pageTitle.value = count > 0 ? `(${count}) To Do` : "To Do";
});

// Auto-focus input after adding a todo
const inputEl = useTemplateRef<HTMLInputElement>("inputEl");
const { focused: inputFocused } = useFocus(inputEl);

function addTodo() {
  const list = todoList.value;
  const title = newTitle.value.trim();
  const author = authorName.value;
  if (!title || !author || !list?.$isLoaded) return;
  const sorted = todos.value;
  const lastOrder = sorted.length > 0 ? sorted[sorted.length - 1]!.order : null;
  const order = generateKeyBetween(lastOrder, null);
  list.$jazz.push({ title, completed: false, order, author });
  newTitle.value = "";
  inputFocused.value = true;
}

function toggleTodo(todo: co.loaded<typeof ToDo>) {
  todo.$jazz.set("completed", !todo.completed);
}

function deleteTodo(todo: co.loaded<typeof ToDo>) {
  const list = todoList.value;
  if (!list?.$isLoaded) return;
  const listIndex = [...list].findIndex((t) => t.$jazz.id === todo.$jazz.id);
  if (listIndex !== -1) list.$jazz.remove(listIndex);
}

const copyLink = () => copy(window.location.href);

const todoListEl = useTemplateRef<HTMLElement>("todoListEl");

useSortable(todoListEl, todos, {
  // List mount is delayed until `todoList` loads; without this, Sortable never inits (ref was null on mount).
  watchElement: true,
  handle: ".drag-handle",
  animation: 150,
  onUpdate: (e) => {
    // Revert SortableJS DOM manipulation — let Vue re-render from sorted order
    removeNode(e.item);
    insertNodeAt(e.from, e.item, e.oldIndex!);

    if (e.oldIndex == null || e.newIndex == null) return;
    const sorted = todos.value;
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
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-2">
          <svg class="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <span class="text-white text-xl font-semibold tracking-tight">jazz</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-300 text-sm">Online</span>
          <button
            @click="isOnline = !isOnline"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isOnline ? 'bg-blue-600' : 'bg-gray-600',
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                isOnline ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Card -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h1 class="text-3xl font-bold text-white mb-6">To Do</h1>

        <div
          v-if="!todoList?.$isLoaded"
          class="text-gray-400 text-center py-8"
        >
          Loading...
        </div>

        <template v-else>
          <form @submit.prevent="addTodo" class="mb-6 space-y-3">
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

          <ul ref="todoListEl" class="space-y-2">
            <li
              v-for="todo in todos"
              :key="todo.$jazz.id"
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
                :checked="todo.completed"
                @change="toggleTodo(todo)"
                class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <span class="flex-1 min-w-0">
                <span
                  class="block"
                  :class="
                    todo.completed
                      ? 'line-through text-gray-500'
                      : 'text-gray-200'
                  "
                >
                  {{ todo.title }}
                </span>
                <span class="block text-xs text-gray-500 mt-0.5 truncate">
                  Added by {{ todo.author }}
                </span>
              </span>
              <button
                @click="deleteTodo(todo)"
                class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1"
                title="Delete"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          </ul>

          <p v-if="todos.length === 0" class="text-gray-500 text-center py-4">
            No todos yet. Add one above!
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
  </div>
</template>
