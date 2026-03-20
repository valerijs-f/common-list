import { co, z } from "jazz-tools";

export const ListItem = co.map({
  title: z.string(),
  completed: z.boolean(),
  order: z.string(),
  author: z.string(),
});

export const ListDocument = co.map({
  name: z.string(),
  /** Account id of whoever created the list; used to allow renaming only for them */
  createdByAccountId: z.string(),
  items: co.list(ListItem),
});
