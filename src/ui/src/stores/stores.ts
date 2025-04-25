import { defineStore } from "pinia";
import { waitForPyWebviewApi } from "../services/pywebview";
import { Task } from "../models/tasks";
import { Logger } from "../utils/logger";
import { TASK_STATUS } from "../models/tasks";
import { onMounted, onUnmounted } from "vue";
import { useMouseTracking } from "../stores/mouseXY";
import { on_shift, on_mousemove, on_ctrl_a } from "../utils/on_events"; // 引入 on_shift 工具函數

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
    shift_on: false as boolean,
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
    shift_hover_range_handle(state) {
      const start = Math.min(
        state.last_selected_index,
        state.mouse_nearest_index
      );
      const end = Math.max(
        state.last_selected_index,
        state.mouse_nearest_index
      );

      // 如果任一索引為 -1，返回null
      if (
        state.last_selected_index === -1 ||
        state.mouse_nearest_index === -1
      ) {
        return null;
      }

      // 創建包含範圍內所有數字的數組
      const shift_hover_range: number[] = [];
      for (let i = start; i <= end; i++) {
        shift_hover_range.push(i);
      }

      // If no selection range exists, return null
      if (shift_hover_range.length === 0) {
        return null;
      }

      // Check if all tasks in the range are selected
      const unselected_count = shift_hover_range.reduce((count, index) => {
        if (!state.tasks[index].selected) {
          return count + 1;
        }
        return count;
      }, 0);

      // Return whether all tasks are selected or not
      return unselected_count === 1;
    },
    indexed_tasks: (state) => {
      return Object.fromEntries(state.tasks.entries());
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

export function use_tasks_with_shift() {
  const mouseStore = useMouseTracking();
  const tasks_state = useTASKS();
  // 找出滑鼠最近的任務索引
  const findNearestTaskToMouse = () => {
    const taskItems = document.querySelectorAll(".task-item");
    let closestTask = -1;
    let minDistance = Infinity;

    taskItems.forEach((taskItem, index) => {
      const rect = taskItem.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 計算滑鼠與任務中心點的距離
      const distX = centerX - mouseStore.mouseX;
      const distY = centerY - mouseStore.mouseY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < minDistance) {
        minDistance = distance;
        closestTask = index;
      }
    });

    tasks_state.mouse_nearest_index = closestTask;
  };

  // 存儲清理函數
  let mousemove_cleanup: (() => void) | null = null;

  // 創建 shift 鍵按下和釋放的回調函數
  const onShiftPress = () => {
    tasks_state.shift_on = true;
    findNearestTaskToMouse();
    mousemove_cleanup = on_mousemove([findNearestTaskToMouse]);
  };

  const onShiftRelease = () => {
    tasks_state.shift_on = false;
    if (mousemove_cleanup) {
      mousemove_cleanup();
    }
    mousemove_cleanup = null;
    tasks_state.mouse_nearest_index = -1;
  };

  // 清理函數，用於移除事件監聽器
  let cleaner: (() => void)[] = [];
  let cleanupShiftListener: (() => void) | null = null;
  let cleanupCtlA: (() => void) | null = null;

  // 組件掛載時設置事件監聽
  onMounted(() => {
    // 使用新的 on_shift 工具函數
    cleaner.push(
      on_shift({
        onPress: [onShiftPress],
        onRelease: [onShiftRelease],
      })
    );
    cleaner.push(
      on_ctrl_a([
        () => {
          tasks_state.tasks.forEach((task, index) => {
            task.selected = true;
          });
        },
      ])
    );
  });

  // 組件卸載時清理事件監聽
  onUnmounted(() => {
    // 清理事件監聽
    cleaner.forEach((cleanup) => cleanup());
    cleaner = [];
  });

  return tasks_state;
}
