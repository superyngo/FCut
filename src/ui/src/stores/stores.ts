import { defineStore, Store } from "pinia";
import { waitForPyWebviewApi } from "../services/pywebview";
import { Task } from "../models/tasks";
import { Logger } from "../utils/logger";
import { TASK_STATUS } from "../models/tasks";
import { onMounted, onUnmounted } from "vue";
import { on_mousemove, on_keys, modifier_keys } from "../utils/on_events"; // 引入 on_shift 工具函數

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
      const range = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
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
      const shift_hover_range = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );

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
    select_all_tasks() {
      this.tasks.forEach((task) => {
        task.selected = true;
      });
      this.saveTasks();
    },
    unselect_all_tasks() {
      this.tasks.forEach((task) => {
        task.selected = false;
      });
      this.saveTasks();
    },
  },
});

export function use_tasks_with_shift() {
  const tasks_state = useTASKS();

  // 存儲清理函數  // 存儲滑鼠位置的對象
  let mouse_cleaner_with_coordinate: on_mousemove | null = null;

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
      const distX =
        centerX - (mouse_cleaner_with_coordinate as on_mousemove).mouseX;
      const distY =
        centerY - (mouse_cleaner_with_coordinate as on_mousemove).mouseY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < minDistance) {
        minDistance = distance;
        closestTask = index;
      }
    });

    tasks_state.mouse_nearest_index = closestTask;
  };

  // 創建 shift 鍵按下和釋放的回調函數
  const onShiftPress = () => {
    tasks_state.shift_on = true;
    // mouse_coordinate.startTracking(); // 開始追蹤滑鼠位置
    mouse_cleaner_with_coordinate = on_mousemove([findNearestTaskToMouse]);
    findNearestTaskToMouse();
  };

  const onShiftRelease = () => {
    tasks_state.shift_on = false;
    if (mouse_cleaner_with_coordinate) {
      mouse_cleaner_with_coordinate();
    }
    mouse_cleaner_with_coordinate = null;
    tasks_state.mouse_nearest_index = -1;
  };

  // 清理函數，用於移除事件監聽器
  let cleaner: (() => void)[] = [];

  // 組件掛載時設置事件監聽
  onMounted(() => {
    cleaner.push(
      on_keys({
        Shift: {
          onPress: [onShiftPress],
          onRelease: [onShiftRelease],
        },
        // use Ctrl+A 鍵全選任務
        a: {
          onPress: [
            () => {
              tasks_state.select_all_tasks();
            },
          ],
          withControl: [modifier_keys.Control],
        },
        Escape: {
          onPress: [
            () => {
              tasks_state.unselect_all_tasks();
            },
          ],
        },
      })
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
