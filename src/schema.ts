import { co, z } from "jazz-tools";

/** Same limit as `ListItem` title schema; enforced in UI on create/edit. */
export const LIST_ITEM_TITLE_MAX_LENGTH = 200;

export const ListItem = co.map({
  title: z.string().max(LIST_ITEM_TITLE_MAX_LENGTH),
  completed: z.boolean(),
  order: z.string(),
  author: z.string(),
  authorAccountId: z.string(),
});

export const ListDocument = co.map({
  name: z.string(),
  createdByAccountId: z.string(),
  items: co.list(ListItem),
});
