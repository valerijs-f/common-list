<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { RouterLink } from "vue-router";
import { TrashIcon, XMarkIcon, BookmarkSlashIcon } from "@heroicons/vue/24/outline";
import { CoValueLoadingState } from "jazz-tools";
import { useCoState } from "community-jazz-vue";
import { ListDocument } from "../schema";
import UiButton from "./ui/UiButton.vue";
import UiDialog from "./ui/UiDialog.vue";
import UiDialogActions from "./ui/UiDialogActions.vue";

const props = defineProps<{
  docId: string;
  myAccountId: string;
  onRemoveFromVisited: (id: string) => void;
  onDeleteListPermanently: (id: string) => Promise<void>;
  onListDeletedByOwner: (id: string) => void;
}>();

const doc = useCoState(ListDocument, () => props.docId, { resolve: {} });

/** One-shot per `docId`: when sync reports a tombstone, drop bookmark and notify (see parent). */
const handledDeletedForDocId = ref<string | null>(null);

watch(
  () => props.docId,
  () => {
    handledDeletedForDocId.value = null;
  },
);

watch(
  () => [props.docId, doc.value] as const,
  ([id, v]) => {
    if (!v || v.$isLoaded) return;
    if (v.$jazz.loadingState !== CoValueLoadingState.DELETED) return;
    if (handledDeletedForDocId.value === id) return;
    handledDeletedForDocId.value = id;
    props.onListDeletedByOwner(id);
  },
  { immediate: true },
);

const actionDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
  "actionDialog",
);
const actionKind = ref<"remove" | "deleteForever">("remove");
const actionBusy = ref(false);
const actionError = ref<string | null>(null);

const titleForDialog = computed(() => {
  const d = doc.value;
  if (d?.$isLoaded) {
    const n = d.name.trim();
    return n.length > 0 ? n : "Untitled list";
  }
  return "This list";
});

const displayName = computed(() => {
  const v = doc.value;
  if (!v) return "Loading…";
  if (v.$isLoaded) {
    const n = v.name.trim();
    return n.length > 0 ? n : "Untitled list";
  }
  const s = v.$jazz.loadingState;
  if (
    s === CoValueLoadingState.UNAVAILABLE ||
    s === CoValueLoadingState.DELETED ||
    s === CoValueLoadingState.UNAUTHORIZED
  ) {
    return "List unavailable";
  }
  return "Loading…";
});

const badgeLabel = computed(() => {
  const v = doc.value;
  if (!v?.$isLoaded) return "";
  if (!props.myAccountId) return "";
  return v.createdByAccountId === props.myAccountId ? "Yours" : "Shared with you";
});

const isOwner = computed(() => {
  const v = doc.value;
  if (!v?.$isLoaded || !props.myAccountId) return false;
  return v.createdByAccountId === props.myAccountId;
});

function openRemoveDialog() {
  actionKind.value = "remove";
  actionError.value = null;
  actionDialog.value?.showModal();
}

function openDeleteForeverDialog() {
  actionKind.value = "deleteForever";
  actionError.value = null;
  actionDialog.value?.showModal();
}

function closeActionDialog() {
  actionDialog.value?.close();
}

function onActionDialogClose() {
  actionBusy.value = false;
  actionError.value = null;
}

async function confirmAction() {
  if (actionBusy.value) return;
  actionBusy.value = true;
  actionError.value = null;
  try {
    if (actionKind.value === "remove") {
      props.onRemoveFromVisited(props.docId);
    } else {
      await props.onDeleteListPermanently(props.docId);
    }
    actionDialog.value?.close();
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : "Something went wrong";
  } finally {
    actionBusy.value = false;
  }
}

const dialogTitle = computed(() =>
  actionKind.value === "remove"
    ? "Remove from your lists?"
    : "Delete this list for everyone?",
);

const dialogBody = computed(() =>
  actionKind.value === "remove"
    ? "The list will stay available to others. You can open it again from a shared link."
    : "This permanently deletes the list and all tasks. Anyone you shared it with will lose access.",
);

const confirmLabel = computed(() =>
  actionKind.value === "remove" ? "Remove" : "Delete forever",
);

const confirmVariant = computed(() =>
  actionKind.value === "remove" ? "muted" : "danger",
);
</script>

<template>
  <div
    class="flex items-stretch gap-1 rounded-lg border border-gray-700 bg-gray-800/40 hover:bg-gray-800/70 transition-colors"
  >
    <RouterLink
      :to="{ name: 'list', params: { listId: docId } }"
      class="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-3 text-left no-underline"
    >
      <span class="truncate font-medium text-white" :title="displayName">{{
        displayName
      }}</span>
      <span v-if="badgeLabel" class="text-xs text-gray-500">{{ badgeLabel }}</span>
    </RouterLink>
    <div class="flex shrink-0 flex-col justify-center gap-1 border-l border-gray-700 p-1">
      <UiButton
        variant="iconGhost"
        type="button"
        title="Remove from my lists"
        aria-label="Remove from my lists"
        @click="openRemoveDialog"
      >
        <BookmarkSlashIcon class="h-5 w-5" aria-hidden="true" />
      </UiButton>
      <UiButton
        v-if="isOwner"
        variant="iconGhost"
        class="hover:text-red-400"
        type="button"
        title="Delete list for everyone"
        aria-label="Delete list for everyone"
        @click="openDeleteForeverDialog"
      >
        <TrashIcon class="h-5 w-5" aria-hidden="true" />
      </UiButton>
    </div>
  </div>

  <UiDialog
    ref="actionDialog"
    aria-labelledby="visit-action-dialog-title"
    @close="onActionDialogClose"
  >
    <template #title>
      <h2 id="visit-action-dialog-title" class="text-lg font-semibold text-white">
        {{ dialogTitle }}
      </h2>
    </template>
    <div class="w-full min-w-0 space-y-2 text-sm text-gray-400">
      <p class="min-w-0 truncate text-gray-200" :title="titleForDialog">
        “{{ titleForDialog }}”
      </p>
      <p>{{ dialogBody }}</p>
      <p v-if="actionError" class="text-red-400">{{ actionError }}</p>
    </div>
    <template #actions>
      <UiDialogActions>
        <UiButton
          variant="secondary"
          type="button"
          :disabled="actionBusy"
          @click="closeActionDialog"
        >
          Cancel
        </UiButton>
        <UiButton
          :variant="confirmVariant"
          type="button"
          :disabled="actionBusy"
          @click="confirmAction"
        >
          {{ confirmLabel }}
        </UiButton>
      </UiDialogActions>
    </template>
  </UiDialog>
</template>
