import { co, z } from "jazz-tools";

export const ListItem = co.map({
  title: z.string(),
  completed: z.boolean(),
  order: z.string(),
  author: z.string(),
});
export const ListItemList = co.list(ListItem);
