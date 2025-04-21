import { defineStore } from "pinia";
// Check if pywebview is available and initialize it if needed
import { pywebview } from "../services/api";

export const useTaskStore = defineStore("task", {
  state: () => ({
    tasks: [] as { id: number; title: string; completed: boolean }[],
  }),
  actions: {
    addTask(title: string) {
      const newTask = {
        id: Date.now(),
        title,
        completed: false,
      };
      this.tasks.push(newTask);
    },
    removeTask(id: number) {
      this.tasks = this.tasks.filter((task) => task.id !== id);
    },
    toggleTaskCompletion(id: number) {
      const task = this.tasks.find((task) => task.id === id);
      if (task) {
        task.completed = !task.completed;
      }
    },
  },
});

const constants = await pywebview.api.get_constants();

export const useConstantsStore = defineStore("constants", {
  state: () => ({
    constants: constants,
  }),
});
