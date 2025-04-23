import { defineStore } from "pinia";
import { waitForPyWebviewApi } from "../services/pywebview";
import { ref } from "vue";
import { Task, TASK_STATUS } from "../models/tasks";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export const useCONSTANTS = defineStore(crypto.randomUUID(), {
  state: () => ({
    store_id: "app_constants",
    constants: null as null | Record<string, any>,
    error: false,
    loading: true,
    // isSettingsPanelOpen: false, // State for settings panel visibility
    // currentTaskForSettings: null as Task | null, // State for the task being edited
  }),
  actions: {
    async initFromPython() {
      this.loading = true;

      const cached = localStorage.getItem(this.store_id);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (parsed.expiresAt > now) {
            this.constants = parsed.data;
            this.loading = false;
            return;
          } else {
            localStorage.removeItem(this.store_id);
          }
        } catch {
          localStorage.removeItem(this.store_id);
        }
      }

      const isReady = await waitForPyWebviewApi();
      if (!isReady) {
        this.error = true;
        this.loading = false;
        return;
      }

      try {
        const data = await window.pywebview.api.get_constants();
        this.constants = data;
        localStorage.setItem(
          this.store_id,
          JSON.stringify({
            data,
            expiresAt: Date.now() + CACHE_TTL_MS,
          })
        );
      } catch {
        this.error = true;
      } finally {
        this.loading = false;
      }
    },

    clearConstantsCache() {
      localStorage.removeItem(this.store_id);
      this.constants = null;
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
    tasks: ref<Task[]>([
      // Keep ref here for reactivity within the store state
      new Task({
        video_path: "video1.mp4",
        status: TASK_STATUS.Ready, // Use enum value
      }),
      new Task({
        video_path: "another_clip.mov",
        status: TASK_STATUS.Preparing, // Use enum value
      }),
      new Task({
        video_path: "final_render.avi",
        status: TASK_STATUS.Done, // Use enum value
      }),
      // Add more tasks as needed
    ]),
  }),
  actions: {
    // Add actions to manage tasks if needed, e.g., addTask, removeTask
    addTask(video_path: string) {
      this.tasks.push(
        new Task({
          video_path,
        })
      );
    },
    removeTask(taskData: Task) {
      const index = this.tasks.findIndex((task) => task === taskData);
      if (index !== -1) {
        this.tasks.splice(index, 1);
      }
    },
    updateTASK_STATUS(taskData: Task, status: TASK_STATUS) {
      const task = this.tasks.find((task) => task === taskData);
      if (task) {
        task.status = status;
      }
    },
    // Add other actions like updateTASK_STATUS, etc.
  },
});
