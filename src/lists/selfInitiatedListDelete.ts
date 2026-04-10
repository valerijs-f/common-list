/** When the current user deletes their list (e.g. from settings), skip the “owner deleted” banner on sync. */
const ids = new Set<string>();

export function markListDeleteAsSelfInitiated(id: string) {
  ids.add(id);
  setTimeout(() => ids.delete(id), 30_000);
}

/** @returns true if `id` was marked and clears that mark. */
export function takeSelfInitiatedListDelete(id: string): boolean {
  return ids.delete(id);
}
