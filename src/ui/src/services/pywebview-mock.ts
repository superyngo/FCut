// 開發模式下的 pywebview API 模擬器
// 這個文件在生產環境中不會被使用

export interface MockPyWebviewApi {
  get_constants(): Promise<any>;
  logger_debug(message: string): void;
  logger_error(message: string): void;
  logger_warn(message: string): void;
  logger_info(message: string): void;
  open_folder_dialog(): Promise<string | null>;
  get_default_downloads_path(): Promise<string>;
}

class MockPyWebviewApiImpl implements MockPyWebviewApi {
  async get_constants(): Promise<any> {
    // 模擬後端常數數據
    return {
      ACTIONS: {
        CUT: "CUT",
        SPEEDUP: "SPEEDUP",
        JUMPCUT: "JUMPCUT",
        CUT_SILENCE: "CUT_SILENCE",
        CUT_MOTIONLESS: "CUT_MOTIONLESS",
        COMPRESS_VIDEO: "COMPRESS_VIDEO",
        CONVERT_TO_AUDIO: "CONVERT_TO_AUDIO",
      },
      TASK_STATUS: {
        Preparing: 0,
        Ready: 1,
        Queued: 2,
        Rendering: 3,
        Done: 4,
      },
      // 其他可能需要的常數
    };
  }

  logger_debug(message: string): void {
    console.log(`[MOCK DEBUG] ${message}`);
  }

  logger_error(message: string): void {
    console.error(`[MOCK ERROR] ${message}`);
  }

  logger_warn(message: string): void {
    console.warn(`[MOCK WARNING] ${message}`);
  }
  logger_info(message: string): void {
    console.info(`[MOCK INFO] ${message}`);
  }

  async open_folder_dialog(): Promise<string | null> {
    // 模擬資料夾選擇對話框
    const mockPath = "C:\\Users\\user\\Downloads";
    console.log(`[MOCK] 模擬選擇資料夾: ${mockPath}`);
    return mockPath;
  }

  async get_default_downloads_path(): Promise<string> {
    // 模擬獲取預設 Downloads 路徑
    const defaultPath = "C:\\Users\\user\\Downloads";
    console.log(`[MOCK] 模擬預設 Downloads 路徑: ${defaultPath}`);
    return defaultPath;
  }
}

// 創建模擬的 pywebview 對象
export const mockPywebview = {
  api: new MockPyWebviewApiImpl(),
};

// 在開發模式下注入模擬的 pywebview
export function injectMockPywebview(): void {
  if (typeof window !== "undefined" && !window.pywebview) {
    console.log("[DEV] 注入模擬的 pywebview API");
    (window as any).pywebview = mockPywebview;

    // 添加開發測試助手到全域
    (window as any).devHelpers = {
      // 添加測試任務
      addTestTask: async () => {
        const { useTasks } = await import("../stores/stores");
        const taskStore = useTasks();
        taskStore.addTask("test-video.mp4");
        console.log("[DEV] 測試任務已添加");
      },
      // 測試 CUT 設定保存
      testCutSettings: async () => {
        const { useTasks, useModalStore } = await import("../stores/stores");
        const taskStore = useTasks();
        if (taskStore.tasks.length === 0) {
          console.log("[DEV] 請先添加一個任務: await devHelpers.addTestTask()");
          return;
        }

        // 選擇第一個任務並打開設定
        const modalStore = useModalStore();
        modalStore.openTaskSettings(taskStore.tasks[0]);
        console.log("[DEV] 任務設定已打開，請測試 CUT 設定");
      },
    };
    console.log("[DEV] 開發助手已注入到 window.devHelpers");
    console.log(
      "[DEV] 可用命令: await devHelpers.addTestTask(), await devHelpers.testCutSettings()"
    );
  }
}
