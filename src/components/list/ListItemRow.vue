<script setup lang="ts">
import { Bars3Icon } from "@heroicons/vue/24/outline";
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from "vue";
import { co } from "jazz-tools";
import { ListItem } from "../../schema";
import UiOverflowMenu from "../ui/UiOverflowMenu.vue";

const props = defineProps<{
  listItem: co.loaded<typeof ListItem>;
  isMine: boolean;
}>();

const emit = defineEmits<{
  toggle: [item: co.loaded<typeof ListItem>];
  deleteRequest: [item: co.loaded<typeof ListItem>];
  openDetail: [item: co.loaded<typeof ListItem>];
}>();

const isImportant = computed(() => props.listItem.isImportant === true);

const titleEl = useTemplateRef<HTMLElement>("titleEl");
const isOverflowing = ref(false);
const expanded = ref(false);

const isTitleInteractive = computed(() => isOverflowing.value || expanded.value);

function checkOverflow() {
  const el = titleEl.value;
  if (!el || expanded.value) return;
  isOverflowing.value = el.scrollWidth > el.clientWidth;
}

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  checkOverflow();
  const el = titleEl.value;
  if (!el) return;
  resizeObserver = new ResizeObserver(() => checkOverflow());
  resizeObserver.observe(el);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

watch(
  () => props.listItem.title,
  () => {
    expanded.value = false;
    void nextTick(checkOverflow);
  },
);

watch(expanded, (isExpanded) => {
  if (!isExpanded) void nextTick(checkOverflow);
});

function onTitleClick() {
  if (expanded.value) {
    expanded.value = false;
    return;
  }
  if (isOverflowing.value) expanded.value = true;
}

function onTitleKeydown(e: KeyboardEvent) {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  onTitleClick();
}

const menuItemClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800";

const menuItemDangerClass =
  "block w-full border-0 bg-transparent px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800";
</script>

<template>
  <li
    class="group flex items-start gap-3 rounded-lg border p-2 hover:bg-gray-800"
    :class="
      isImportant
        ? listItem.completed
          ? 'border-blue-400/30 bg-blue-950/15'
          : 'border-blue-400/60 bg-blue-950/25'
        : 'border-transparent'
    "
  >
    <div class="flex h-9 w-4 shrink-0 items-center justify-center">
      <span
        class="drag-handle cursor-grab active:cursor-grabbing text-gray-600 group-hover:text-gray-400 transition-colors select-none"
        title="Drag to reorder"
      >
        <Bars3Icon class="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
    <div class="flex h-9 shrink-0 items-center">
      <input
        type="checkbox"
        :checked="listItem.completed"
        class="h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
        @change="emit('toggle', listItem)"
      />
    </div>
    <span
      ref="titleEl"
      class="min-w-0 flex-1 text-left text-sm"
      :class="[
        listItem.completed ? 'line-through text-gray-500' : 'text-gray-200',
        expanded
          ? 'whitespace-pre-wrap wrap-break-word py-0.5'
          : ['flex h-9 items-center truncate', isOverflowing ? 'cursor-pointer' : ''],
      ]"
      :role="isTitleInteractive ? 'button' : undefined"
      :tabindex="isTitleInteractive ? 0 : undefined"
      :aria-expanded="isTitleInteractive ? expanded : undefined"
      @click.stop="onTitleClick"
      @keydown="onTitleKeydown"
    >
      {{ listItem.title }}
    </span>
    <div class="flex h-9 shrink-0 items-center">
      <UiOverflowMenu class="list-item-menu" menu-aria-label="Actions" align="end">
        <button
          type="button"
          role="menuitem"
          :class="menuItemClass"
          @click="emit('openDetail', listItem)"
        >
          {{ isMine ? "Edit" : "View" }}
        </button>
        <button
          type="button"
          role="menuitem"
          :class="menuItemDangerClass"
          @click="emit('deleteRequest', listItem)"
        >
          Delete
        </button>
      </UiOverflowMenu>
    </div>
  </li>
</template>
