import { co, z } from "jazz-tools";

/** Same limit as `ListItem` title schema; enforced in UI on create/edit. */
export const LIST_ITEM_TITLE_MAX_LENGTH = 200;

/** Same limit as `ListDocument` name schema; enforced in UI on create/edit. */
export const LIST_DOCUMENT_NAME_MAX_LENGTH = 50;

export const ListItem = co.map({
  title: z.string().max(LIST_ITEM_TITLE_MAX_LENGTH),
  completed: z.boolean(),
  order: z.string(),
  author: z.string(),
  authorAccountId: z.string(),
});

export const ListDocument = co.map({
  name: z.string().max(LIST_DOCUMENT_NAME_MAX_LENGTH),
  createdByAccountId: z.string(),
  items: co.list(ListItem),
});
