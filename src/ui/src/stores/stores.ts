import { waitForPyWebviewApi } from "../services/pywebview";
await waitForPyWebviewApi();

import { defineStore } from "pinia";
import { Task, TASK_STATUS } from "../models/tasks";
import { logger } from "../utils/logger";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

import {
  onMousemove,
  coordinate,
  MouseListenerHandle,
} from "../utils/mouseEvents"; // 引入 on_shift 工具函數
import {
  MODIFIER_KEYS,
  ShortCutKey,
  KeyboardEventType,
} from "../utils/eventListner";
// const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// Cookie 操作工具
function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; expires=" +
    expires +
    "; path=/";
}
function getCookie(name: string) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}

// 使用組合式 API 定義 AppState store
export const useAppState = defineStore(crypto.randomUUID(), () => {
  const storeId = ref("app_constants");
  const error = ref(false);
  const loading = ref(true);
  const constants = ref<null | Record<string, any>>(null);
  const messageQueue = ref<string[]>([]);
  const locale = ref("zh-TW");
  const theme = ref("dark");
  const outputPath = ref("");
  const { locale: i18nLocale, t } = useI18n();

  // 支援的語言列表
  const supportedLocales = ["zh-TW", "zh-CN", "en"];

  // 語言顯示名稱（從語言檔中獲取）
  const localeDisplayNames = computed(() => ({
    "zh-TW": t("settings.language_zh_tw") || "繁體中文",
    "zh-CN": t("settings.language_zh_cn") || "简体中文",
    en: t("settings.language_en") || "English",
  }));

  // Actions
  async function init() {
    loading.value = true;
    try {
      // 從 cookies 還原設定
      const savedLocale = getCookie("locale");
      const savedTheme = getCookie("theme");
      const savedOutputPath = getCookie("outputPath");
      if (savedLocale) setLocale(savedLocale);
      if (savedTheme) setTheme(savedTheme);
      if (savedOutputPath) {
        outputPath.value = savedOutputPath;
      } else {
        // 設置預設輸出路徑為系統 Downloads 資料夾
        await initDefaultOutputPath();
      }

      const isReady = await waitForPyWebviewApi();
      if (!isReady) {
        error.value = true;
        loading.value = false;
        return;
      }

      constants.value = (await window.pywebview?.api?.get_constants?.()) || {};
    } catch (err) {
      console.error("Failed to fetch constants:", err);
      error.value = true;
    } finally {
      loading.value = false;
    }
  }
  function setLocale(newLocale: string) {
    // 確保語言在支援的列表中
    if (!supportedLocales.includes(newLocale)) {
      logger.warn(`Unsupported locale '${newLocale}', falling back to 'zh-TW'`);
      newLocale = "zh-TW";
    }

    locale.value = newLocale;
    setCookie("locale", newLocale);
    i18nLocale.value = newLocale;

    // 添加語言變更的本地化訊息
    const localeName =
      localeDisplayNames.value[
        newLocale as keyof typeof localeDisplayNames.value
      ];
    addMessage(t("settings.languageChanged", { locale: localeName }));
  }
  function setTheme(newTheme: string) {
    theme.value = newTheme;
    setCookie("theme", newTheme);
  }

  // 初始化預設輸出路徑
  async function initDefaultOutputPath() {
    try {
      const defaultPath =
        await window.pywebview?.api?.get_default_downloads_path?.();
      if (defaultPath) {
        outputPath.value = defaultPath;
        setCookie("outputPath", defaultPath);
      }
    } catch (err) {
      console.error("Failed to get default downloads path:", err);
    }
  }

  // 設置輸出路徑
  function setOutputPath(newPath: string) {
    outputPath.value = newPath;
    setCookie("outputPath", newPath);
    addMessage(t("settings.outputPathChanged", { path: newPath }));
  }

  // 選擇輸出資料夾
  async function selectOutputFolder() {
    try {
      const selectedPath = await window.pywebview?.api?.open_folder_dialog?.();
      if (selectedPath) {
        setOutputPath(selectedPath);
        return selectedPath;
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
    return null;
  }

  // 添加訊息到佇列
  function addMessage(message: string) {
    messageQueue.value.push(message);
  }

  // 移除佇列中的第一個訊息
  function removeFirstMessage() {
    if (messageQueue.value.length > 0) {
      messageQueue.value.shift();
    }
  } // 返回所有需要暴露的狀態和方法
  return {
    storeId,
    error,
    loading,
    constants,
    messageQueue,
    locale,
    theme,
    outputPath,
    supportedLocales,
    localeDisplayNames,
    t, // 導出翻譯函數
    init,
    addMessage,
    removeFirstMessage,
    setLocale,
    setTheme,
    initDefaultOutputPath,
    setOutputPath,
    selectOutputFolder,
  };
});

// 使用組合式 API 定義 Tasks store
export const useTasks = defineStore(crypto.randomUUID(), () => {
  // State
  const storeId = ref("app_tasks");
  const tasks = ref<Task[]>([]);
  const tempTask = ref<Task | null>(null);
  const selectedTaskID = ref<string | null>(null);
  const lastSelectedIndex = ref(-1);
  const mouseNearestIndex = ref(-1);
  const isShiftOn = ref(false);

  // Getters
  const selectedTask = computed(() => {
    if (selectedTaskID.value === null) {
      return null;
    }
    const task = tasks.value.find((task) => task.id === selectedTaskID.value);
    if (task) {
      return task;
    } else {
      selectedTaskID.value = null; // Reset if not found
      return null;
    }
  });

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
        tasks.value = parsed.map((taskData: any) => {
          return new Task(taskData);
        });
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

  function clearAllTasks() {
    let _selectedTasks = [...selectedTasks.value];
    _selectedTasks.forEach((task) => {
      removeTask(task);
    });
    selectedTaskID.value = null;
    lastSelectedIndex.value = -1;
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
    tempTask,
    selectedTaskID,
    lastSelectedIndex,
    mouseNearestIndex,
    isShiftOn,
    // getters
    selectedTask,
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
    clearAllTasks,
    modifyTask,
    clearTasksCache,
    select_all_tasks,
    unselect_all_tasks,
  };
});

// callbacks和events的註冊
export const useCallBackRedistry = defineStore(crypto.randomUUID(), () => {
  const taskStore = useTasks();

  // 清理函數，用於移除事件監聽器
  let shortCutKey = ref<ShortCutKey | null>();
  let registeredEvents = ref<MouseListenerHandle[]>([]);

  // 找出滑鼠最近的任務索引
  const findNearestTaskToMouse = ref((event: any) => {
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

    taskStore.mouseNearestIndex = closestTask;
  });

  // 創建 shift 鍵按下和釋放的回調函數
  const onShiftPress = ref(() => {
    taskStore.isShiftOn = true;
    findNearestTaskToMouse.value(null);
    registeredEvents.value.push(
      onMousemove({
        callbacks: findNearestTaskToMouse.value,
      })
    );
  });

  const onShiftRelease = ref(() => {
    taskStore.isShiftOn = false;
    taskStore.mouseNearestIndex = -1;
    if (registeredEvents.value) {
      registeredEvents.value.forEach((event) => event());
      registeredEvents.value = [];
    }
  });

  const eventsProxy = ref({
    taskListsShortCutKey: [
      {
        key: "Shift",
        modifiers: [MODIFIER_KEYS.Shift],
        type: KeyboardEventType.KeyDown,
        callback: onShiftPress.value,
      },
      {
        key: "Shift",
        type: KeyboardEventType.KeyUp,
        callback: onShiftRelease.value,
      },
      {
        key: "a",
        type: KeyboardEventType.KeyDown,
        callback: taskStore.select_all_tasks,
        modifiers: [MODIFIER_KEYS.Control],
      },
      {
        key: "Escape",
        type: KeyboardEventType.KeyDown,
        callback: taskStore.unselect_all_tasks,
      },
      {
        key: "Delete",
        type: KeyboardEventType.KeyDown,
        callback: taskStore.clearAllTasks,
      },
    ],
    modalShortCutKey: {
      key: "Escape",
      type: KeyboardEventType.KeyDown,
      callback: taskStore.unselect_all_tasks,
    },
  });

  return {
    eventsProxy,
    shortCutKey,
    registeredEvents,
    onShiftPress,
    onShiftRelease,
    findNearestTaskToMouse,
  };
});

// 使用組合式 API 定義 Modal store
export const useModalStore = defineStore(crypto.randomUUID(), () => {
  const taskStore = useTasks(); // 假設 useTasks 已經被正確定義和匯出
  // State
  const storeId = ref("app_modals");
  const activeModals = ref({
    menu: { isOpen: false },
    taskSettings: { isOpen: false },
    settingsPage: { isOpen: false },
    aboutPage: { isOpen: false },
    helpPage: { isOpen: false },
  });
  const menuModalStyle = ref<Record<string, string>>({}); // 明確指定類型
  const settingsModalStyle = ref<Record<string, string>>({}); // 明確指定類型

  // Actions
  function openMenu(event?: MouseEvent) {
    if (event && event.currentTarget) {
      // 確保 event 和 currentTarget 存在
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      menuModalStyle.value = {
        position: "absolute",
        top: `${rect.bottom + 5}px`,
        left: `${rect.left}px`,
      };
    }
    activeModals.value.menu.isOpen = true;
  }
  function closeMenu() {
    activeModals.value.menu.isOpen = false;
  }
  function openTaskSettings(task: Task) {
    taskStore.selectedTaskID = task.id;
    taskStore.tempTask = task.clone(); // 使用深度複製避免共享引用
    activeModals.value.taskSettings.isOpen = true;
  }
  function closeTaskSettings() {
    activeModals.value.taskSettings.isOpen = false;
    // 清理 taskStore 的相關狀態可以在 TaskSettingsForm 元件卸載時或這裡處理
    // 例如:
    // const taskStore = useTasks();
    taskStore.selectedTaskID = null;
    taskStore.tempTask = null;
  }

  function openSettingsPage() {
    activeModals.value.settingsPage.isOpen = true;
    closeMenu(); // 通常打開頁面 Modal 時會關閉選單 Modal
  }
  function closeSettingsPage() {
    activeModals.value.settingsPage.isOpen = false;
  }

  function openAboutPage() {
    activeModals.value.aboutPage.isOpen = true;
    closeMenu();
  }
  function closeAboutPage() {
    activeModals.value.aboutPage.isOpen = false;
  }

  function openHelpPage() {
    activeModals.value.helpPage.isOpen = true;
    closeMenu();
  }
  function closeHelpPage() {
    activeModals.value.helpPage.isOpen = false;
  }

  function openMenuAndCloseCurrentPage(event?: MouseEvent) {
    // 關閉所有頁面類型的模態框
    activeModals.value.settingsPage.isOpen = false;
    activeModals.value.aboutPage.isOpen = false;
    activeModals.value.helpPage.isOpen = false;
    // 其他可能存在的頁面模態框也可以在這裡添加關閉邏輯

    // 打開主選單模態框，並傳遞事件以供定位
    openMenu(event);
  }

  // Getters
  const isAnyModalOpen = computed(() =>
    Object.values(activeModals.value).some((modal) => modal.isOpen)
  );

  return {
    storeId,
    activeModals,
    menuModalStyle,
    settingsModalStyle,
    openMenu,
    closeMenu,
    openTaskSettings,
    closeTaskSettings,
    openSettingsPage,
    closeSettingsPage,
    openAboutPage,
    closeAboutPage,
    openHelpPage,
    closeHelpPage,
    openMenuAndCloseCurrentPage, // 導出新方法
    isAnyModalOpen,
  };
});
