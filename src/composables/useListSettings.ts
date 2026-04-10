import { computed, ref, useTemplateRef, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";
import { deleteCoValues } from "jazz-tools";
import { useAccount, useAgent, useCoState } from "community-jazz-vue";
import { useTitle } from "@vueuse/core";
import { AppAccount } from "../appAccount";
import { markListDeleteAsSelfInitiated } from "../lists/selfInitiatedListDelete";
import { ListDocument } from "../schema";

export function useListSettings() {
  const route = useRoute();
  const router = useRouter();
  const agent = useAgent();
  const listIdRef = ref<string | undefined>(undefined);
  watch(
    () => route.params.listId,
    (id) => {
      listIdRef.value = typeof id === "string" ? id : undefined;
    },
    { immediate: true },
  );

  watch(
    listIdRef,
    (id) => {
      if (!id) void router.replace({ name: "list" });
    },
    { immediate: true },
  );

  const me = useAccount(AppAccount, {
    resolve: { root: { visitedListIds: true } },
  });

  const myAccountId = computed(() => {
    const m = me.value;
    if (!m?.$isLoaded) return "";
    return m.$jazz.id;
  });

  const listDocument = useCoState(ListDocument, listIdRef, {
    resolve: { items: { $each: true } },
  });

  const listReady = computed(() => listDocument.value?.$isLoaded === true);

  const displayListName = computed(() => {
    const doc = listDocument.value;
    if (doc?.$isLoaded) return doc.name.trim().length > 0 ? doc.name : "Untitled list";
    return "List";
  });

  const isCreator = computed(() => {
    const doc = listDocument.value;
    const id = myAccountId.value;
    if (!doc?.$isLoaded || !id) return false;
    return doc.createdByAccountId === id;
  });

  watch(
    () =>
      [listReady.value, isCreator.value, myAccountId.value, listIdRef.value] as const,
    () => {
      const id = listIdRef.value;
      if (!id || !myAccountId.value || !listReady.value) return;
      if (!isCreator.value) void router.replace({ name: "list", params: { listId: id } });
    },
  );

  function removeIdFromVisited(id: string) {
    const m = me.value;
    if (!m || !m.$isLoaded || !m.root.$isLoaded) return;
    const ids = m.root.visitedListIds;
    if (!ids.$isLoaded) return;
    ids.$jazz.remove((x) => x === id);
  }

  const listNameDraft = ref("");
  watch(
    () => listDocument.value,
    (doc) => {
      if (doc?.$isLoaded) listNameDraft.value = doc.name;
    },
    { immediate: true },
  );

  function saveListName() {
    const doc = listDocument.value;
    if (!doc?.$isLoaded || !isCreator.value) return;
    const next =
      listNameDraft.value.trim().length > 0 ? listNameDraft.value.trim() : "Untitled list";
    doc.$jazz.set("name", next);
  }

  const pageTitle = useTitle("List settings");
  watchEffect(() => {
    if (!listReady.value) {
      pageTitle.value = "List settings";
      return;
    }
    pageTitle.value = `${displayListName.value} · List settings`;
  });

  const deleteDialog = useTemplateRef<{ showModal: () => void; close: () => void }>(
    "deleteDialog",
  );
  const deleteBusy = ref(false);
  const deleteError = ref<string | null>(null);

  function openDeleteDialog() {
    deleteError.value = null;
    deleteDialog.value?.showModal();
  }

  function closeDeleteDialog() {
    deleteDialog.value?.close();
  }

  function onDeleteDialogClose() {
    deleteBusy.value = false;
    deleteError.value = null;
  }

  async function confirmDeleteList() {
    const id = listIdRef.value;
    if (id === undefined || id === "" || deleteBusy.value) return;
    deleteBusy.value = true;
    deleteError.value = null;
    try {
      markListDeleteAsSelfInitiated(id);
      await deleteCoValues(ListDocument, id, {
        resolve: { items: { $each: true } },
        loadAs: agent,
      });
      removeIdFromVisited(id);
      deleteDialog.value?.close();
      await router.replace({ name: "list" });
    } catch (e) {
      deleteError.value = e instanceof Error ? e.message : "Something went wrong";
    } finally {
      deleteBusy.value = false;
    }
  }

  return {
    listId: listIdRef,
    listReady,
    displayListName,
    isCreator,
    listNameDraft,
    saveListName,
    openDeleteDialog,
    closeDeleteDialog,
    onDeleteDialogClose,
    confirmDeleteList,
    deleteBusy,
    deleteError,
    deleteDialog,
  };
}
