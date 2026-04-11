import { ref } from "vue";

/** Incremented when the bottom FAB should open “add list item” (on a list page). */
export const fabAddListItemSignal = ref(0);

/** Incremented from the add-list-item dialog to open the existing “new list” flow in the layout. */
export const fabRequestNewListDialogSignal = ref(0);

export function signalFabAddListItem() {
  fabAddListItemSignal.value += 1;
}

export function signalFabRequestNewListDialog() {
  fabRequestNewListDialogSignal.value += 1;
}
