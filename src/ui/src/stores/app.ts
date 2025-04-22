import { defineStore } from "pinia";
import { waitForPyWebviewApi } from "../services/pywebview";
// import type { Task } from "../components/TaskList.vue"; // Import Task type if needed, adjust path as necessary

const CACHE_KEY = "app_constants";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export const useAPP_STORE = defineStore("app", {
  state: () => ({
    constants: null as null | Record<string, any>,
    error: false,
    loading: true,
    // isSettingsPanelOpen: false, // State for settings panel visibility
    // currentTaskForSettings: null as Task | null, // State for the task being edited
  }),
  actions: {
    async initFromPython() {
      this.loading = true;

      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (parsed.expiresAt > now) {
            this.constants = parsed.data;
            this.loading = false;
            return;
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        } catch {
          localStorage.removeItem(CACHE_KEY);
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
          CACHE_KEY,
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
      localStorage.removeItem(CACHE_KEY);
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
