import { ref, computed, useTemplateRef, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CoValueLoadingState, co } from "jazz-tools";
import { useAccount, useCoState } from "community-jazz-vue";
import { useClipboard, useTitle } from "@vueuse/core";
import { useSortable, removeNode, insertNodeAt } from "@vueuse/integrations/useSortable";
import { generateKeyBetween } from "fractional-indexing";
import { AppAccount } from "../appAccount";
import { takeSelfInitiatedListDelete } from "../lists/selfInitiatedListDelete";
import { ListDocument, ListItem, LIST_ITEM_TITLE_MAX_LENGTH } from "../schema";

export function useListItemApp() {
  const route = useRoute();
  const router = useRouter();

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

  const isListCreator = computed(() => {
    const doc = listDocument.value;
    if (!doc?.$isLoaded) return false;
    const id = myAccountId.value;
    if (!id) return false;
    return doc.createdByAccountId === id;
  });

  const listReady = computed(() => listDocument.value?.$isLoaded === true);

  const listDocumentLoaded = computed(() => listDocument.value?.$isLoaded === true);

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

  const ownerRemovedListNotice = ref<string | null>(null);
  let ownerNoticeClear: ReturnType<typeof setTimeout> | undefined;

  function dismissOwnerNotice() {
    if (ownerNoticeClear) {
      clearTimeout(ownerNoticeClear);
      ownerNoticeClear = undefined;
    }
    ownerRemovedListNotice.value = null;
  }

  const inaccessibleListNotice = ref<string | null>(null);
  let inaccessibleNoticeClear: ReturnType<typeof setTimeout> | undefined;

  function dismissInaccessibleListNotice() {
    if (inaccessibleNoticeClear) {
      clearTimeout(inaccessibleNoticeClear);
      inaccessibleNoticeClear = undefined;
    }
    inaccessibleListNotice.value = null;
  }

  function showInaccessibleListNotice(message: string) {
    inaccessibleListNotice.value = message;
    if (inaccessibleNoticeClear) clearTimeout(inaccessibleNoticeClear);
    inaccessibleNoticeClear = setTimeout(dismissInaccessibleListNotice, 8000);
  }

  function notifyOwnerDeletedList() {
    ownerRemovedListNotice.value =
      "The list owner deleted this list. It has been removed from your lists.";
    if (ownerNoticeClear) clearTimeout(ownerNoticeClear);
    ownerNoticeClear = setTimeout(dismissOwnerNotice, 8000);
  }

  function handleListDeletedByOwner(id: string) {
    removeIdFromVisited(id);
    if (!takeSelfInitiatedListDelete(id)) notifyOwnerDeletedList();
    if (listId.value === id) void router.replace({ name: "list" });
  }

  watch(
    () => {
      const id = listId.value;
      const doc = listDocument.value;
      if (!id || !doc || doc.$isLoaded) return null;
      // `listId` can update before useCoState drops the previous doc — never pair a new id with an old doc's loadingState.
      if (doc.$jazz.id !== id) return null;
      const state = doc.$jazz.loadingState;
      if (state === CoValueLoadingState.DELETED) return { id, kind: "deleted" } as const;
      if (state === CoValueLoadingState.UNAVAILABLE) return { id, kind: "unavailable" } as const;
      if (state === CoValueLoadingState.UNAUTHORIZED) return { id, kind: "unauthorized" } as const;
      return null;
    },
    (payload) => {
      if (!payload) return;
      if (payload.kind === "deleted") {
        handleListDeletedByOwner(payload.id);
        return;
      }
      removeIdFromVisited(payload.id);
      showInaccessibleListNotice(
        payload.kind === "unavailable"
          ? "This list could not be loaded. The link may be wrong or the list may no longer exist."
          : "You do not have access to this list.",
      );
      if (listId.value === payload.id) void router.replace({ name: "list" });
    },
  );

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

  function addListItemWithTitle(rawTitle: string): boolean {
    const list = itemsCoList.value;
    const title = rawTitle.trim().slice(0, LIST_ITEM_TITLE_MAX_LENGTH);
    const author = authorName.value;
    const authorAccountId = myAccountId.value;
    if (!title || !author || !authorAccountId || !list) return false;
    const sorted = listItems.value;
    const lastOrder = sorted.length > 0 ? sorted[sorted.length - 1]!.order : null;
    const order = generateKeyBetween(lastOrder, null);
    list.$jazz.push({ title, completed: false, order, author, authorAccountId });
    return true;
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

  const completedTaskCount = computed(
    () => listItems.value.filter((t) => t.completed).length,
  );

  const completedRemovalDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
    "completedRemovalDialog",
  );
  /** Snapshot of task IDs to clear; count for the modal is this array’s length (fixed at open). */
  const pendingCompletedRemovalIds = ref<string[] | null>(null);

  function requestRemoveAllCompleted() {
    const ids = listItems.value.filter((t) => t.completed).map((t) => t.$jazz.id);
    if (ids.length === 0) return;
    pendingCompletedRemovalIds.value = ids;
    completedRemovalDialog.value?.showModal();
  }

  function clearPendingCompletedRemoval() {
    pendingCompletedRemovalIds.value = null;
  }

  function onCompletedRemovalDialogClose() {
    clearPendingCompletedRemoval();
  }

  function cancelCompletedRemovalDialog() {
    completedRemovalDialog.value?.close();
  }

  function confirmRemoveAllCompleted() {
    const ids = pendingCompletedRemovalIds.value;
    const list = itemsCoList.value;
    if (!ids?.length || !list) {
      completedRemovalDialog.value?.close();
      clearPendingCompletedRemoval();
      return;
    }
    const idSet = new Set(ids);
    const arr = [...list];
    const indices: number[] = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]!;
      if (idSet.has(item.$jazz.id) && item.completed) indices.push(i);
    }
    indices.sort((a, b) => b - a);
    for (const idx of indices) {
      list.$jazz.remove(idx);
    }
    completedRemovalDialog.value?.close();
    clearPendingCompletedRemoval();
  }

  const detailDialog = useTemplateRef<{ showModal: () => void; close: () => void }>("detailDialog");
  const detailListItemId = ref<string | null>(null);
  const detailTitle = ref("");
  const detailTitleOriginal = ref("");
  const detailAuthor = ref("");

  function openListItemDetail(listItem: co.loaded<typeof ListItem>) {
    detailListItemId.value = listItem.$jazz.id;
    detailTitleOriginal.value = listItem.title;
    detailTitle.value = listItem.title;
    detailAuthor.value = listItem.author;
    detailDialog.value?.showModal();
  }

  function onDetailDialogClose() {
    detailListItemId.value = null;
    detailTitleOriginal.value = "";
    detailTitle.value = "";
    detailAuthor.value = "";
  }

  function closeDetailDialog() {
    detailDialog.value?.close();
  }

  function listItemIsEditableByMe(
    item: co.loaded<typeof ListItem>,
    accountId: string,
    profileName: string,
  ): boolean {
    const storedId = item.authorAccountId;
    if (typeof storedId === "string" && storedId.length > 0) {
      return accountId !== "" && storedId === accountId;
    }
    return (
      accountId !== "" &&
      profileName !== "" &&
      item.author.trim() === profileName
    );
  }

  function isListItemMine(item: co.loaded<typeof ListItem>): boolean {
    return listItemIsEditableByMe(item, myAccountId.value, authorName.value);
  }

  const detailCanEdit = computed(() => {
    const id = detailListItemId.value;
    const accountId = myAccountId.value;
    const name = authorName.value;
    if (!id) return false;
    const item = listItems.value.find((i) => i.$jazz.id === id);
    if (!item) return false;
    return listItemIsEditableByMe(item, accountId, name);
  });

  function normalizedListItemTitle(s: string): string {
    return s.trim().slice(0, LIST_ITEM_TITLE_MAX_LENGTH);
  }

  const canSaveDetail = computed(() => {
    if (!detailCanEdit.value) return false;
    const next = normalizedListItemTitle(detailTitle.value);
    if (!next) return false;
    const origTrimmed = detailTitleOriginal.value.trim();
    if (origTrimmed.length > LIST_ITEM_TITLE_MAX_LENGTH) return true;
    return next !== normalizedListItemTitle(detailTitleOriginal.value);
  });

  function saveDetailTitle() {
    if (!canSaveDetail.value) return;
    const id = detailListItemId.value;
    const accountId = myAccountId.value;
    const name = authorName.value;
    const text = normalizedListItemTitle(detailTitle.value);
    if (!id || !text) return;
    const item = listItems.value.find((i) => i.$jazz.id === id);
    if (!item || !listItemIsEditableByMe(item, accountId, name)) return;
    item.$jazz.set("title", text);
    if (!item.authorAccountId && accountId) {
      item.$jazz.set("authorAccountId", accountId);
    }
    closeDetailDialog();
  }

  function listShareUrl(): string | null {
    const id = listId.value;
    if (!id) return null;
    const path = router.resolve({ name: "list", params: { listId: id } }).href;
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).href;
  }

  async function shareOrCopy() {
    const url = listShareUrl();
    if (!url) return;
    const title = displayListName.value;
    // Only pass title + url. Including text with the URL again makes many share targets
    // concatenate fields and produce duplicated or glued links (title stuck to URL, etc.).
    const data: ShareData = { title, url };

    if (typeof navigator !== "undefined" && "share" in navigator) {
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
    // List mount is delayed until items load; without this, Sortable never inits (ref was null on mount).
    watchElement: true,
    handle: ".drag-handle",
    /** Let delete / overflow menu receive clicks without Sortable interfering */
    filter: "button, .list-item-delete, .list-item-menu",
    preventOnFilter: true,
    animation: 150,
    onUpdate: (e) => {
      removeNode(e.item);
      insertNodeAt(e.from, e.item, e.oldIndex!);

      if (e.oldIndex == null || e.newIndex == null) return;
      const sorted = listItems.value;
      const moved = sorted[e.oldIndex];
      if (!moved) return;

      const before =
        e.newIndex > 0
          ? (sorted[e.newIndex - (e.newIndex > e.oldIndex ? 0 : 1)]?.order ?? null)
          : null;
      const after =
        e.newIndex < sorted.length - 1
          ? (sorted[e.newIndex + (e.newIndex < e.oldIndex ? 0 : 1)]?.order ?? null)
          : null;
      moved.$jazz.set("order", generateKeyBetween(before, after));
    },
  });

  return {
    listId,
    listDocumentLoaded,
    listReady,
    displayListName,
    isListCreator,
    shareOrCopy,
    visitedIdsReady,
    visitedListIds,
    myAccountId,
    removeIdFromVisited,
    handleListDeletedByOwner,
    ownerRemovedListNotice,
    dismissOwnerNotice,
    inaccessibleListNotice,
    dismissInaccessibleListNotice,
    authorName,
    addListItemWithTitle,
    listItemsEl,
    listItems,
    toggleListItem,
    requestDeleteListItem,
    deleteConfirmDialog,
    pendingDeleteTitle,
    onDeleteDialogClose,
    cancelDeleteDialog,
    confirmDeleteListItem,
    completedTaskCount,
    completedRemovalDialog,
    pendingCompletedRemovalIds,
    requestRemoveAllCompleted,
    onCompletedRemovalDialogClose,
    cancelCompletedRemovalDialog,
    confirmRemoveAllCompleted,
    detailDialog,
    detailTitle,
    detailAuthor,
    openListItemDetail,
    onDetailDialogClose,
    closeDetailDialog,
    detailCanEdit,
    canSaveDetail,
    saveDetailTitle,
    isListItemMine,
  };
}
