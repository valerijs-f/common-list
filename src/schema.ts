import { co, z } from "jazz-tools";

export const ToDo = co.map({ title: z.string(), completed: z.boolean(), order: z.string() });
export const ToDoList = co.list(ToDo);
