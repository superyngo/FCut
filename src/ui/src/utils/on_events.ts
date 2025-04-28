import { Logger } from "./logger";

type ShiftCallbacks = {
  onPress?: (() => any)[];
  onRelease?: (() => any)[];
};

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

// Define a callable type with extra props
export type on_mousemove = {
  (): void;
  mouseX: number;
  mouseY: number;
  isTracking: boolean;
};

/**
 * 監聽滑鼠移動事件
 * @param callbacks 當滑鼠移動時需要執行的回調函數陣列
 * @returns 一個清理函數，用於移除事件監聽器
 */
export function on_mousemove(
  callbacks: ((event: MouseEvent) => any)[]
): on_mousemove {
  function save_mouse_cordinate(event: MouseEvent) {
    cleaner_with_cordinates.mouseX = event.clientX;
    cleaner_with_cordinates.mouseY = event.clientY;
  }

  const cleaner_with_cordinates = Object.assign(
    () => {
      if (typeof window !== "undefined") {
        cleaner_with_cordinates.isTracking = false;
        window.removeEventListener("mousemove", handleMouseMove);
        Logger.info("滑鼠移動事件監聽器已移除");
      }
    },
    { mouseX: 0, mouseY: 0, isTracking: false }
  );

  // 存儲回調函數的引用
  cleaner_with_cordinates.isTracking = true;
  const callbacksRef = [save_mouse_cordinate, ...callbacks];

  // 滑鼠移動時的處理函數
  const handleMouseMove = (event: MouseEvent) => {
    // 執行所有回調函數
    callbacksRef.forEach((callback) => {
      try {
        callback(event);
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
  return cleaner_with_cordinates;
}

type key_callbacks = {
  [key: string]: {
    onPress?: (() => any)[];
    onRelease?: (() => any)[];
    withControl?: modifier_keys[];
  };
};

export enum modifier_keys {
  Shift = "Shift",
  Control = "Control",
  Alt = "Alt",
}

// 檢查修飾鍵是否匹配
const checkModifiers = (
  event: KeyboardEvent,
  config?: modifier_keys[]
): boolean => {
  if (!config || config.length === 0) return true; // 無需檢查

  const required = {
    [modifier_keys.Shift]: config.includes(modifier_keys.Shift),
    [modifier_keys.Control]: config.includes(modifier_keys.Control),
    [modifier_keys.Alt]: config.includes(modifier_keys.Alt),
  };

  // Meta key (Cmd on Mac, Win on Windows) counts as Control for simplicity here
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  return (
    required[modifier_keys.Shift] === event.shiftKey &&
    required[modifier_keys.Control] === ctrlOrMeta &&
    required[modifier_keys.Alt] === event.altKey
  );
};

export function on_keys(key_callbacks: key_callbacks) {
  // 執行按下回調函數
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!(event.key in key_callbacks) || !key_callbacks[event.key]?.onPress) {
      return;
    }
    let handle = true;
    if (key_callbacks[event.key]?.withControl) {
      let key_mapping = {
        [modifier_keys.Shift]: event.shiftKey,
        [modifier_keys.Control]: event.ctrlKey || event.metaKey,
        [modifier_keys.Alt]: event.altKey,
      };
      handle = Object.entries(key_mapping).every(
        ([key, value]) =>
          value ===
          key_callbacks[event.key].withControl?.includes(key as modifier_keys)
      );
    }
    if (!handle) {
      return;
    }
    if (event.repeat) {
      return;
    }
    // 檢查是否有對應的回調函數
    Logger.info(event.key + " 鍵被按下");
    try {
      key_callbacks[event.key].onPress?.forEach((callback) => {
        callback();
      });
    } catch (error) {
      Logger.error(`執行 ${event.key} 按壓回調時發生錯誤: ${error}`);
    }
  };

  // 釋放時的處理函數
  const handleKeyUp = (event: KeyboardEvent) => {
    if (!(event.key in key_callbacks) || !key_callbacks[event.key]?.onRelease) {
      return;
    }
    let handle = true;
    if (key_callbacks[event.key]?.withControl) {
      let key_mapping = {
        [modifier_keys.Shift]: event.shiftKey,
        [modifier_keys.Control]: event.ctrlKey || event.metaKey,
        [modifier_keys.Alt]: event.altKey,
      };
      handle = Object.entries(key_mapping).every(
        ([key, value]) =>
          value ===
          key_callbacks[event.key].withControl?.includes(key as modifier_keys)
      );
    }
    if (!handle) {
      return;
    }
    if (event.repeat) {
      return;
    }
    Logger.info(event.key + " 鍵被釋放");
    try {
      key_callbacks[event.key].onRelease?.forEach((callback) => {
        callback();
      });
    } catch (error) {
      Logger.error(`執行 ${event.key} 釋放回調時發生錯誤: ${error}`);
    }
  };

  // 添加事件監聽器
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    Logger.info("Key 鍵事件監聽器已設置");
  }

  // 返回清理函數，用於移除事件監聽器
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      Logger.info("Key 鍵事件監聽器已移除");
    }
  };
}
