import { ref } from "vue";

/** Incremented when the bottom FAB should open “add task” (on a list page). */
export const fabAddTaskSignal = ref(0);

/** Incremented from the add-task dialog to open the existing “new list” flow in the layout. */
export const fabRequestNewListDialogSignal = ref(0);

export function signalFabAddTask() {
  fabAddTaskSignal.value += 1;
}

export function signalFabRequestNewListDialog() {
  fabRequestNewListDialogSignal.value += 1;
}
