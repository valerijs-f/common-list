import { Group } from "jazz-tools";
import { ListDocument } from "../schema";

export function createNewListId(name: string, createdByAccountId: string): string {
  const group = Group.create();
  group.addMember("everyone", "writer");
  const trimmed = name.trim();
  const doc = ListDocument.create(
    {
      name: trimmed.length > 0 ? trimmed : "Untitled list",
      createdByAccountId,
      items: [],
    },
    { owner: group },
  );
  return doc.$jazz.id;
}
