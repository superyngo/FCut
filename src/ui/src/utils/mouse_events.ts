import { logger } from "./logger";
import { throttle, debounce } from "lodash-es";

// 定義回調函數類型，接收滑鼠事件作為參數
type MouseCallbackFunction = (event: MouseEvent) => any;

// 回調配置接口
type MouseCallbackConfig = {
  wrappedCallback?: MouseCallbackFunction; // 包裝後的回調函數
  throttle?: number; // 節流間隔 (ms)
  debounce?: number; // 防抖間隔 (ms)
};

// Define a callable type with extra props
export type MouseMoveTrackerHandle = {
  (): void; // 清理函數
  mouseX: number;
  mouseY: number;
  isTracking: boolean;
  callbacks: Map<string, MouseCallbackConfig>; // 用於存儲回調 ID 的集合
  addCallback: (
    callback: MouseCallbackFunction,
    options?: { throttle?: number; debounce?: number }
  ) => string;
  removeCallback: (id: string) => boolean;
};

/**
 * 監聽滑鼠移動事件，使用 requestAnimationFrame 優化性能
 * @param initialCallbacks 初始的回調函數陣列
 * @param options 配置選項，包括節流和防抖
 * @returns 一個可調用對象，包含清理函數和額外的方法
 */
export function on_mousemove(
  initialCallbacks: MouseCallbackFunction | MouseCallbackFunction[] = [],
  options: { throttle?: number; debounce?: number } = {}
): MouseMoveTrackerHandle {
  // 設定流程：addCallback>startTracking>return trackerHandle
  // 監聽執行流程：startTracking>handleMouseMove+startAnimationLoop
  // 監聽清理流程：trackerHandle>stopTracking>stop handleMouseMove startAnimationLoop

  // 內部狀態
  let isTracking = false;
  let callbacks: Map<string, MouseCallbackConfig> = new Map();
  let animationFrameId = 0;
  let pendingMouseEvent: MouseEvent | null = null;
  let mouseX = 0;
  let mouseY = 0;

  // 確保 initialCallbacks 是陣列
  if (!Array.isArray(initialCallbacks)) {
    initialCallbacks = [initialCallbacks];
  }

  // 創建包裝後的回調（處理節流/防抖）
  const wrapCallback = (
    callback: MouseCallbackFunction,
    options: { throttle?: number; debounce?: number }
  ): MouseCallbackFunction => {
    if (options.throttle && options.throttle > 0) {
      return throttle(callback, options.throttle, {
        leading: true,
        trailing: false,
      });
    } else if (options.debounce && options.debounce > 0) {
      return debounce(callback, options.debounce, {
        leading: true,
        trailing: false,
      });
    }
    return callback;
  };

  // 添加回調函數
  const addCallback = (
    callback: MouseCallbackFunction,
    callbackOptions: { throttle?: number; debounce?: number } = {}
  ): string => {
    const id = crypto.randomUUID();
    const wrappedCallback = wrapCallback(callback, callbackOptions);

    callbacks.set(id, {
      wrappedCallback,
      ...callbackOptions,
    });

    logger.debug(`已註冊滑鼠移動監聽器 (ID: ${id})`);
    return id;
  };

  // 移除回調函數
  const removeCallback = (id: string): boolean => {
    if (callbacks.has(id)) return false;
    callbacks.delete(id);
    logger.debug(`已移除滑鼠移動監聽器 (ID: ${id})`);
    return true;
  };

  // 滑鼠事件處理函數
  const handleMouseMove = (event: MouseEvent) => {
    pendingMouseEvent = event;
  };

  // 使用 requestAnimationFrame 的處理循環
  const startAnimationLoop = () => {
    const processFrame = () => {
      if (pendingMouseEvent) {
        // 更新座標
        mouseX = pendingMouseEvent.clientX;
        mouseY = pendingMouseEvent.clientY;

        // 執行所有註冊的回調
        callbacks.forEach((config, id) => {
          try {
            if (config.wrappedCallback) {
              config.wrappedCallback(pendingMouseEvent!);
            }
          } catch (error) {
            logger.error(`執行滑鼠移動回調 ID:${id} 時發生錯誤: ${error}`);
          }
        });

        // 清除待處理事件
        pendingMouseEvent = null;
      }

      // 繼續下一幀
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
  };

  // 開始追蹤
  const startTracking = () => {
    if (isTracking) return;

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
      isTracking = true;
      startAnimationLoop();
      logger.debug("開始追蹤滑鼠位置");
    }
  };

  // 全局停止追蹤
  const stopTracking = () => {
    if (!isTracking) return;

    if (typeof window !== "undefined") {
      // 清除 listner
      window.removeEventListener("mousemove", handleMouseMove);
      isTracking = false;

      // 停止 animationLoop
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }

      logger.debug("停止追蹤滑鼠位置");
    }

    callbacks.clear();
  };

  // 註冊初始回調函數
  initialCallbacks.forEach((callback) => {
    addCallback(callback, options);
  });

  // 開始追蹤
  startTracking();

  // 創建清理函數並添加額外屬性
  const trackerHandle = Object.assign(
    // 清理函數
    () => {
      stopTracking();
    },
    {
      addCallback,
      removeCallback,
    }
  ) as MouseMoveTrackerHandle;

  // 定義動態屬性，使其始終返回最新值
  Object.defineProperties(trackerHandle, {
    isTracking: { get: () => isTracking },
    mouseX: { get: () => mouseX },
    mouseY: { get: () => mouseY },
    callbacks: {
      get: () => {
        return new Map(
          [...callbacks].map(([key, config]): [string, string | undefined] => [
            key,
            config.wrappedCallback?.toString(),
          ])
        );
      },
    },
  });

  return trackerHandle;
}
