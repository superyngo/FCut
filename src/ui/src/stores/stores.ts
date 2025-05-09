import { defineStore } from "pinia";
import { waitForPyWebviewApi } from "../services/pywebview";
import { Task, TASK_STATUS } from "../models/tasks";
import { logger } from "../utils/logger";
import { onMounted, onUnmounted, ref, computed } from "vue";
import { onKeys, MODIFIER_KEYS } from "../utils/keyEvents"; // 引入 on_shift 工具函數
import { onMousemove, coordinate } from "../utils/mouseEvents"; // 引入 on_shift 工具函數
// const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// 使用組合式 API 定義 AppState store
const useAppState = defineStore(crypto.randomUUID(), () => {
  const storeId = ref("app_constants");
  const error = ref(false);
  const loading = ref(true);
  const constants = ref<null | Record<string, any>>(null);

  // Actions
  async function initFromPython() {
    loading.value = true;
    try {
      const isReady = await waitForPyWebviewApi();
      if (!isReady) {
        error.value = true;
        loading.value = false;
        return;
      }

      constants.value = await window.pywebview.api.get_constants();
    } catch (err) {
      console.error("Failed to fetch constants:", err);
      error.value = true;
    } finally {
      loading.value = false;
    }
  }

  // 返回所有需要暴露的狀態和方法
  return {
    storeId,
    error,
    loading,
    constants,
    initFromPython,
  };
});
const isUseAppStateStarted = ref(false);
export function useAppStateInit() {
  const appState = useAppState();
  // 使用 ref 確保只在客戶端 onMounted 中執行

  // 組件掛載時設置事件監聽
  onMounted(async () => {
    if (!isUseAppStateStarted.value) {
      await appState.initFromPython();
      isUseAppStateStarted.value = true;
    }
  });

  // 組件卸載時清理事件監聽
  onUnmounted(() => {
    isUseAppStateStarted.value = false;
  });

  return appState;
}

// 使用組合式 API 定義 Tasks store
const useTasks = defineStore(crypto.randomUUID(), () => {
  // State
  const storeId = ref("app_tasks");
  const tasks = ref<Task[]>([]);
  const lastSelectedIndex = ref(-1);
  const mouseNearestIndex = ref(-1);
  const isShiftOn = ref(false);

  // Getters
  const selectedTasks = computed(() =>
    tasks.value.filter((task) => task.selected === true)
  );

  const readyTasks = computed(() =>
    tasks.value.filter((task) => task.status === TASK_STATUS.Ready)
  );

  const selectedReadyTasks = computed(() =>
    tasks.value.filter(
      (task) => task.selected === true && task.status === TASK_STATUS.Ready
    )
  );

  const queuedTasks = computed(() =>
    tasks.value.filter((task) => task.status === TASK_STATUS.Queued)
  );

  const renderingTasks = computed(() =>
    tasks.value.filter((task) => task.status === TASK_STATUS.Rendering)
  );

  const doneTasks = computed(() =>
    tasks.value.filter((task) => task.status === TASK_STATUS.Done)
  );

  const hasTasksSelected = computed(() =>
    tasks.value.some((task) => task.selected === true)
  );

  const shiftHoverRange = computed(() => {
    const start = Math.min(lastSelectedIndex.value, mouseNearestIndex.value);
    const end = Math.max(lastSelectedIndex.value, mouseNearestIndex.value);

    // 如果任一索引為 -1，返回空數組
    if (lastSelectedIndex.value === -1 || mouseNearestIndex.value === -1) {
      return [];
    }

    // 創建包含範圍內所有數字的數組
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return range;
  });

  const onlyOneSelectedInHoverRange = computed(() => {
    // If no selection range exists, return null
    if (shiftHoverRange.value.length === 0) {
      return null;
    }

    // Check if all tasks in the range are selected
    const unselected_count = shiftHoverRange.value.reduce((count, index) => {
      if (!tasks.value[index].selected) {
        return count + 1;
      }
      return count;
    }, 0);

    // Return whether all tasks are selected or not
    return unselected_count === 1;
  });

  // Actions
  function initTasks() {
    const cached = localStorage.getItem(storeId.value);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Convert plain objects back to Task instances
        tasks.value = parsed.map((taskData: any) => new Task(taskData));
      } catch (error) {
        console.error("Failed to load tasks from cache:", error);
        localStorage.removeItem(storeId.value);
      }
    }
  }

  function saveTasks() {
    localStorage.setItem(storeId.value, JSON.stringify(tasks.value));
  }

  function addTask(videoPath: string) {
    tasks.value.push(
      new Task({
        videoPath,
      })
    );
    saveTasks();
  }

  function removeTask(taskData: Task) {
    const index = tasks.value.findIndex((task) => task === taskData);
    if (index !== -1) {
      tasks.value.splice(index, 1);
      saveTasks();
    }
  }

  function modifyTask(id: string, taskData: Omit<Task, "id" | "videoPath">) {
    const index = tasks.value.findIndex((task) => task.id === id);
    if (index !== -1) {
      // 保留原始 id 和 videoPath，更新其他屬性
      const updatedTask = {
        ...tasks.value[index],
        ...taskData,
        id: tasks.value[index].id,
        videoPath: tasks.value[index].videoPath,
      };

      // 直接替換任務物件
      tasks.value[index] = updatedTask;
      saveTasks();
      return true;
    }
    return false;
  }

  function clearTasksCache() {
    localStorage.removeItem(storeId.value);
    tasks.value = [];
  }

  function select_all_tasks() {
    tasks.value.forEach((task) => {
      task.selected = true;
    });
    saveTasks();
  }

  function unselect_all_tasks() {
    tasks.value.forEach((task) => {
      task.selected = false;
    });
    lastSelectedIndex.value = -1;
    saveTasks();
  }

  return {
    storeId,
    tasks,
    lastSelectedIndex,
    mouseNearestIndex,
    isShiftOn,
    // getters
    selectedTasks,
    readyTasks,
    selectedReadyTasks,
    queuedTasks,
    renderingTasks,
    doneTasks,
    hasTasksSelected,
    shiftHoverRange,
    onlyOneSelectedInHoverRange,
    // actions
    initTasks,
    saveTasks,
    addTask,
    removeTask,
    modifyTask,
    clearTasksCache,
    select_all_tasks,
    unselect_all_tasks,
  };
});
const isUseTasksStarted = ref(false);
export function useTasksBoundEvents() {
  const tasks_state = useTasks();
  // 清理函數，用於移除事件監聽器
  let cleaner: (() => void)[] = [];
  let mouse_events: (() => void)[] = [];

  // 找出滑鼠最近的任務索引
  const findNearestTaskToMouse = (event: any) => {
    const taskItems = document.querySelectorAll(".task-item");
    let closestTask = -1;
    let minDistance = Infinity;

    taskItems.forEach((taskItem, index) => {
      const rect = taskItem.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 計算滑鼠與任務中心點的距離
      const distX = centerX - (event || coordinate()).clientX;
      const distY = centerY - (event || coordinate()).clientY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < minDistance) {
        minDistance = distance;
        closestTask = index;
      }
    });

    tasks_state.mouseNearestIndex = closestTask;
  };

  // 創建 shift 鍵按下和釋放的回調函數
  const onShiftPress = () => {
    tasks_state.isShiftOn = true;
    findNearestTaskToMouse(null);
    mouse_events.push(
      onMousemove({
        callbacks: [(event: any) => findNearestTaskToMouse(event)],
      })
    );
  };

  const onShiftRelease = () => {
    tasks_state.isShiftOn = false;
    tasks_state.mouseNearestIndex = -1;
    if (mouse_events) {
      mouse_events.forEach((event) => event());
      mouse_events = [];
    }
  };

  // 組件掛載時設置事件監聽
  onMounted(() => {
    if (!isUseTasksStarted.value) {
      tasks_state.initTasks();
      cleaner.push(
        onKeys({
          Shift: [
            { type: "onPress", callback: onShiftPress },
            { type: "onRelease", callback: onShiftRelease },
          ],
          a: {
            type: "onPress",
            callback: () => {
              tasks_state.select_all_tasks();
            },
            modifiers: [MODIFIER_KEYS.Control],
          },
          Escape: {
            type: "onPress",
            callback: () => {
              tasks_state.unselect_all_tasks();
            },
          },
        })
      );
      isUseTasksStarted.value = true;
    }
  });

  // 組件卸載時清理事件監聽
  onUnmounted(() => {
    isUseTasksStarted.value = false;

    // 清理事件監聽
    cleaner.forEach((cleanup) => cleanup());
    cleaner = [];
  });

  return tasks_state;
}

// 使用組合式 API 定義 Modal store
export const useModalStore = defineStore("modalStore", () => {
  // State
  const activeModals = ref({
    taskSettings: {
      isOpen: false,
      taskData: null as Task | null,
    },
    menu: {
      isOpen: false,
    },
    // 可以在此添加其他模態框的狀態
  });

  // Actions
  // Task Settings Modal
  function openTaskSettings(task: Task) {
    activeModals.value.taskSettings.taskData = task;
    activeModals.value.taskSettings.isOpen = true;
    logger.debug(`Opening settings modal for task: ${task.id}`);
  }

  function closeTaskSettings() {
    activeModals.value.taskSettings.isOpen = false;
    activeModals.value.taskSettings.taskData = null;
  }

  // Menu Modal
  function openMenu() {
    activeModals.value.menu.isOpen = true;
    logger.debug("Opening menu modal");
  }

  function closeMenu() {
    activeModals.value.menu.isOpen = false;
  }

  // 通用關閉所有模態框的方法
  function closeAllModals() {
    Object.keys(activeModals.value).forEach((key) => {
      const modalKey = key as keyof typeof activeModals.value;
      if (typeof activeModals.value[modalKey].isOpen === "boolean") {
        activeModals.value[modalKey].isOpen = false;
      }
    });
  }

  return {
    activeModals,
    openTaskSettings,
    closeTaskSettings,
    openMenu,
    closeMenu,
    closeAllModals,
  };
});
