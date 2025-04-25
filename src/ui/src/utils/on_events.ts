import { Logger } from "./logger";

interface ShiftCallbacks {
  onPress?: (() => any)[];
  onRelease?: (() => any)[];
}

/**
 * 監聽 shift 按鍵事件
 * @param callbacks 包含按下和釋放時需執行的回調函數陣列
 * @returns 一個清理函數，用於移除事件監聽器
 */
export function on_shift(callbacks: ShiftCallbacks) {
  // 存儲回調函數的引用
  const pressCallbacks = callbacks.onPress ? [...callbacks.onPress] : [];
  const releaseCallbacks = callbacks.onRelease ? [...callbacks.onRelease] : [];

  // Shift 按下時的處理函數
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Shift" && !event.repeat) {
      Logger.info("Shift 鍵被按下");
      // 執行所有按下回調函數
      pressCallbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          Logger.error(`執行 Shift 按下回調時發生錯誤: ${error}`);
        }
      });
    }
  };

  // Shift 釋放時的處理函數
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Shift") {
      Logger.info("Shift 鍵被釋放");
      // 執行所有釋放回調函數
      releaseCallbacks.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          Logger.error(`執行 Shift 釋放回調時發生錯誤: ${error}`);
        }
      });
    }
  };

  // 添加事件監聽器
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    Logger.info("Shift 鍵事件監聽器已設置");
  }

  // 返回清理函數，用於移除事件監聽器
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      Logger.info("Shift 鍵事件監聽器已移除");
    }
  };
}

/**
 * 監聽 Ctrl+A 組合鍵事件
 * @param callbacks 當 Ctrl+A 被按下時需要執行的回調函數陣列
 * @returns 一個清理函數，用於移除事件監聽器
 */
export function on_ctrl_a(callbacks: (() => any)[]) {
  // 存儲回調函數的引用
  const callbacksRef = [...callbacks];

  // Ctrl+A 按下時的處理函數
  const handleKeyDown = (event: KeyboardEvent) => {
    // 檢測 Ctrl+A 組合鍵 (A 的 keyCode 是 65)
    if ((event.ctrlKey || event.metaKey) && event.key === "a") {
      Logger.info("Ctrl+A 組合鍵被按下");

      // 執行所有回調函數
      callbacksRef.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          Logger.error(`執行 Ctrl+A 回調時發生錯誤: ${error}`);
        }
      });

      // 防止瀏覽器的默認行為（全選）
      event.preventDefault();
    }
  };

  // 添加事件監聽器
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
    Logger.info("Ctrl+A 組合鍵事件監聽器已設置");
  }

  // 返回清理函數，用於移除事件監聽器
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
      Logger.info("Ctrl+A 組合鍵事件監聽器已移除");
    }
  };
}

/**
 * 兼容舊版 API 的 on_shift 函數
 * @param callbacks 當 shift 按下時需要執行的回調函數陣列
 * @returns 清理函數
 */
export function on_shift_legacy(callbacks: (() => any)[]) {
  return on_shift({ onPress: callbacks });
}

/**
 * 監聽滑鼠移動事件
 * @param callbacks 當滑鼠移動時需要執行的回調函數陣列
 * @returns 一個清理函數，用於移除事件監聽器
 */
export function on_mousemove(callbacks: (() => any)[]) {
  // 存儲回調函數的引用
  const callbacksRef = [...callbacks];

  // 滑鼠移動時的處理函數
  const handleMouseMove = (event: MouseEvent) => {
    // 執行所有回調函數
    callbacksRef.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        Logger.error(`執行滑鼠移動回調時發生錯誤: ${error}`);
      }
    });
  };

  // 添加事件監聽器
  if (typeof window !== "undefined") {
    window.addEventListener("mousemove", handleMouseMove);
    Logger.info("滑鼠移動事件監聽器已設置");
  }

  // 返回清理函數，用於移除事件監聽器
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("mousemove", handleMouseMove);
      Logger.info("滑鼠移動事件監聽器已移除");
    }
  };
}
