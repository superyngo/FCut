import { logger } from "./logger";
import { throttle, debounce } from "lodash-es";

// 定義回調函數類型，接收滑鼠事件作為參數
export type MouseCallbackFunction = (event: MouseEvent) => any;

// 回調配置接口
export type MouseCallbackConfig = {
  callback: MouseCallbackFunction;
  throttle?: number; // 節流間隔 (ms)
  debounce?: number; // 防抖間隔 (ms)
  id: string; // 回調函數ID
  wrappedCallback?: MouseCallbackFunction; // 包裝後的回調函數
};

// Define a callable type with extra props
export type MouseMoveTrackerHandle = {
  (): void; // 清理函數
  mouseX: number;
  mouseY: number;
  isTracking: boolean;
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
  initialCallbacks: MouseCallbackFunction[] = [],
  options: { throttle?: number; debounce?: number } = {}
): MouseMoveTrackerHandle {
  // 內部狀態
  let isTracking = false;
  let callbacks: Record<string, MouseCallbackConfig> = {};
  let animationFrameId = 0;
  let pendingMouseEvent: MouseEvent | null = null;
  let mouseX = 0;
  let mouseY = 0;

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

    callbacks[id] = {
      callback,
      id,
      wrappedCallback,
      ...callbackOptions,
    };

    logger.debug(`已註冊滑鼠移動監聽器 (ID: ${id})`);
    return id;
  };

  // 移除回調函數
  const removeCallback = (id: string): boolean => {
    if (!callbacks[id]) return false;
    delete callbacks[id];
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
        Object.values(callbacks).forEach((config) => {
          try {
            if (config.wrappedCallback) {
              config.wrappedCallback(pendingMouseEvent!);
            }
          } catch (error) {
            logger.error(
              `執行滑鼠移動回調 ID:${config.id} 時發生錯誤: ${error}`
            );
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

  // 停止追蹤
  const stopTracking = () => {
    if (!isTracking) return;

    if (typeof window !== "undefined") {
      window.removeEventListener("mousemove", handleMouseMove);
      isTracking = false;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }

      logger.debug("停止追蹤滑鼠位置");
    }
  };

  // 創建清理函數並添加額外屬性
  const trackerHandle = Object.assign(
    // 清理函數
    () => {
      stopTracking();
      callbacks = {};
    },
    {
      mouseX: 0,
      mouseY: 0,
      isTracking: false,
      addCallback,
      removeCallback,
    }
  ) as MouseMoveTrackerHandle;

  // 定義動態屬性，使其始終返回最新值
  Object.defineProperties(trackerHandle, {
    mouseX: { get: () => mouseX },
    mouseY: { get: () => mouseY },
    isTracking: { get: () => isTracking },
  });

  // 註冊初始回調函數
  initialCallbacks.forEach((callback) => {
    addCallback(callback, options);
  });

  // 開始追蹤
  startTracking();

  return trackerHandle;
}
