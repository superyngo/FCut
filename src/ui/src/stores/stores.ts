import { defineStore } from "pinia";
import { waitForPyWebviewApi } from "../services/pywebview";
import { Task } from "../models/tasks";
import { Logger } from "../utils/logger";
import { TASK_STATUS } from "../models/tasks";

// const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export const useAPP_STATE = defineStore(crypto.randomUUID(), {
  state: () => ({
    store_id: "app_constants" as string,
    error: false as boolean,
    loading: true as boolean,
    isMenuVisible: false as boolean,
    constants: null as null | Record<string, any>,
    // isSettingsPanelOpen: false, // State for settings panel visibility
    // currentTaskForSettings: null as Task | null, // State for the task being edited
  }),
  actions: {
    async initFromPython() {
      this.loading = true;
      try {
        const isReady = await waitForPyWebviewApi();
        if (!isReady) {
          this.error = true;
          this.loading = false;
          return;
        }

        this.constants = await window.pywebview.api.get_constants();
      } catch (error) {
        console.error("Failed to fetch constants:", error);
        this.error = true;
      } finally {
        this.loading = false;
      }
    },

    // openSettingsPanel(task: Task) {
    //   this.currentTaskForSettings = task;
    //   this.isSettingsPanelOpen = true;
    // },

    // closeSettingsPanel() {
    //   this.isSettingsPanelOpen = false;
    //   this.currentTaskForSettings = null;
    // },
  },
});

// Define the new store for tasks
export const useTASKS = defineStore(crypto.randomUUID(), {
  state: () => ({
    store_id: "app_tasks",
    tasks: [] as Task[],
    last_selected_index: -1 as number,
    mouse_nearest_index: -1 as number,
  }),

  getters: {
    selected_tasks: (state) =>
      state.tasks.filter((task) => task.selected === true),
    ready_tasks: (state) =>
      state.tasks.filter((task) => task.status === TASK_STATUS.Ready),
    selected_and_ready_tasks: (state) =>
      state.tasks.filter(
        (task) => task.selected === true && task.status === TASK_STATUS.Ready
      ),
    queued_tasks: (state) =>
      state.tasks.filter((task) => task.status === TASK_STATUS.Queued),
    rendering_tasks: (state) =>
      state.tasks.filter((task) => task.status === TASK_STATUS.Rendering),
    done_tasks: (state) =>
      state.tasks.filter((task) => task.status === TASK_STATUS.Done),
    has_selected_tasks: (state) =>
      state.tasks.some((task) => task.selected === true),
    shift_hover_range: (state) => {
      const start = Math.min(
        state.last_selected_index,
        state.mouse_nearest_index
      );
      const end = Math.max(
        state.last_selected_index,
        state.mouse_nearest_index
      );

      // 如果任一索引為 -1，返回空數組
      if (
        state.last_selected_index === -1 ||
        state.mouse_nearest_index === -1
      ) {
        return [];
      }

      // 創建包含範圍內所有數字的數組
      const range: number[] = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      return range;
    },
    indexed_tasks: (state) => {
      const taskObj: Record<number, Task> = {};
      state.tasks.forEach((task, index) => {
        taskObj[index] = task;
      });
      return taskObj;
    },
  },

  actions: {
    initTasks() {
      const cached = localStorage.getItem(this.store_id);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Convert plain objects back to Task instances
          this.tasks = parsed.map((taskData: any) => new Task(taskData));
        } catch (error) {
          console.error("Failed to load tasks from cache:", error);
          localStorage.removeItem(this.store_id);
        }
      }
    },

    saveTasks() {
      localStorage.setItem(this.store_id, JSON.stringify(this.tasks));
    },

    addTask(video_path: string) {
      this.tasks.push(
        new Task({
          video_path,
        })
      );
      this.saveTasks();
    },

    removeTask(taskData: Task) {
      const index = this.tasks.findIndex((task) => task === taskData);
      if (index !== -1) {
        this.tasks.splice(index, 1);
        this.saveTasks();
      }
    },

    clearTasksCache() {
      localStorage.removeItem(this.store_id);
      this.tasks = [];
    },
  },
});
