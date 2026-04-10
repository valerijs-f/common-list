import { Group } from "jazz-tools";
import { ListDocument, LIST_DOCUMENT_NAME_MAX_LENGTH } from "../schema";

export function createNewListId(name: string, createdByAccountId: string): string {
  const trimmed = name.trim().slice(0, LIST_DOCUMENT_NAME_MAX_LENGTH);
  if (!trimmed) {
    throw new Error("List name is required");
  }
  const group = Group.create();
  group.addMember("everyone", "writer");
  const doc = ListDocument.create(
    {
      name: trimmed,
      createdByAccountId,
      items: [],
    },
    { owner: group },
  );
  return doc.$jazz.id;
}
