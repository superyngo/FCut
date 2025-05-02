import { logger } from "./logger";
import { throttle, debounce } from "lodash-es"; // 引入 lodash-es

export enum modifier_keys {
  Shift = "Shift",
  Control = "Control",
  Alt = "Alt",
}

// --- 新增類型定義 ---
type CallbackFunction = () => any;

// 擴展的回調配置
type KeyCallbackConfig = {
  id?: string; // 唯一標識符
  type: "onPress" | "onRelease"; // 保留 type 屬性，用於區分事件類型
  callback: CallbackFunction | CallbackFunction[];
  modifiers?: modifier_keys[];
  preventDefault?: boolean;
  throttle?: number; // 節流間隔 (ms)
  debounce?: number; // 防抖間隔 (ms)
  ignoreWhenInputFocused?: boolean; // 是否在輸入框聚焦時忽略
  // 內部使用：存儲包裝後的回調
  _wrappedCallback?: CallbackFunction | CallbackFunction[];
};

// 監聽器操作句柄
type KeyListenerHandle = () => void; // 移除監聽器

// 內部狀態管理
const _keyState = {
  keys: new Map<string, boolean>(), // 按鍵按下狀態
  keyConfigs: new Map<string, KeyCallbackConfig[]>(), // 存儲所有註冊的配置
  isListening: false,
  isInputFocused: false, // 輸入框是否聚焦
};

// 檢查修飾鍵是否匹配
const checkModifiers = (
  event: KeyboardEvent,
  modifiers?: modifier_keys[]
): boolean => {
  if (!modifiers || modifiers.length === 0) return true; // 無需檢查

  const required = {
    [modifier_keys.Shift]: modifiers.includes(modifier_keys.Shift),
    [modifier_keys.Control]: modifiers.includes(modifier_keys.Control),
    [modifier_keys.Alt]: modifiers.includes(modifier_keys.Alt),
  };

  // Meta key (Cmd on Mac, Win on Windows) counts as Control for simplicity here
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  return (
    required[modifier_keys.Shift] === event.shiftKey &&
    required[modifier_keys.Control] === ctrlOrMeta &&
    required[modifier_keys.Alt] === event.altKey
  );
};

// 創建包裝後的回調（處理節流/防抖）
const wrapCallback = (config: KeyCallbackConfig): CallbackFunction[] => {
  // 此時 callback 已經在 on_keys 中被轉換為數組
  return (config.callback as CallbackFunction[]).map((fn) => {
    if (config.throttle && config.throttle > 0) {
      return throttle(fn, config.throttle, {
        leading: true,
        trailing: false,
      });
    } else if (config.debounce && config.debounce > 0) {
      return debounce(fn, config.debounce, {
        leading: true,
        trailing: false,
      });
    }
    return fn;
  });
};

// --- Event Handlers ---
const handleKeyDown = (event: KeyboardEvent) => {
  const key = event.key;

  if (!_keyState.keyConfigs.has(key)) return; // 沒有監聽此按鍵

  // 處理每個註冊的回調配置
  _keyState.keyConfigs.get(key)?.forEach((config) => {
    if (config.type !== "onPress") return; // 只處理 onPress

    // 檢查輸入框焦點
    if (config.ignoreWhenInputFocused && _keyState.isInputFocused) {
      return;
    }

    // 檢查修飾鍵
    if (!checkModifiers(event, config.modifiers)) {
      return;
    }

    // 防止重複觸發 (長按)
    if (event.repeat) return;

    // 更新按鍵狀態
    _keyState.keys.set(key, true);
    logger.debug(`${key} 鍵被按下`);

    // 阻止默認行為
    if (config.preventDefault) {
      event.preventDefault();
      logger.debug(`阻止了 ${key} 的默認行為`);
    }

    // 執行回調 (因為已經統一轉換為數組，所以只需處理數組情況)
    try {
      (config._wrappedCallback as CallbackFunction[]).forEach((callback) => {
        callback();
      });
    } catch (error) {
      logger.error(`執行 ${key} 按壓回調時發生錯誤: ${error}`);
    }
  });
};

const handleKeyUp = (event: KeyboardEvent) => {
  const key = event.key;

  // 更新按鍵狀態 (即使沒有 release 回調也要更新)
  if (_keyState.keys.has(key)) {
    _keyState.keys.set(key, false);
  }

  if (!_keyState.keyConfigs.has(key)) return; // 沒有監聽此按鍵

  // 處理每個註冊的回調配置
  _keyState.keyConfigs.get(key)?.forEach((config) => {
    if (config.type !== "onRelease") return; // 只處理 onRelease

    logger.debug(`${key} 鍵被釋放`);

    // 阻止默認行為 (keyup 時阻止通常意義不大，但保留選項)
    if (config.preventDefault) {
      event.preventDefault();
    }

    // 執行回調 (因為已經統一轉換為數組，所以只需處理數組情況)
    try {
      (config._wrappedCallback as CallbackFunction[]).forEach((callback) => {
        callback();
      });
    } catch (error) {
      logger.error(`執行 ${key} 釋放回調時發生錯誤: ${error}`);
    }
  });
};

const isInputElement = (element: HTMLElement | Element | null): boolean => {
  if (!element) return false;
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
};

// 處理輸入框焦點
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (isInputElement(target)) {
    _keyState.isInputFocused = true;
    logger.debug("輸入框獲得焦點");
  }
};

const handleFocusOut = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (isInputElement(target)) {
    // 稍微延遲，以處理焦點在輸入元素之間切換的情況
    setTimeout(() => {
      // 再次檢查當前焦點元素是否還是輸入元素
      if (!isInputElement(document.activeElement)) {
        _keyState.isInputFocused = false;
        logger.debug("輸入框失去焦點");
      }
    }, 0);
  }
};

// 窗口失焦時重置按鍵狀態
const handleBlur = () => {
  logger.debug("窗口失去焦點，重置按鍵狀態");
  // 添加完整的按鍵重置，保持一致性
  _keyState.keys.forEach((_, key) => _keyState.keys.set(key, false));
};

// 啟動監聽
const startListening = () => {
  if (_keyState.isListening || typeof window === "undefined") return;

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("focusin", handleFocusIn);
  window.addEventListener("focusout", handleFocusOut);
  window.addEventListener("blur", handleBlur); // 監聽窗口失焦

  _keyState.isListening = true;
  logger.debug("全局按鍵事件監聽器已啟動");
};

// 停止監聽
const stopListening = () => {
  if (!_keyState.isListening || typeof window === "undefined") return;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("focusin", handleFocusIn);
  window.removeEventListener("focusout", handleFocusOut);
  window.removeEventListener("blur", handleBlur);

  _keyState.isListening = false;
  _keyState.isInputFocused = false; // 重置焦點狀態
  logger.debug("全局按鍵事件監聽器已停止");
};

// -------------- 公共 API --------------

// 獲取當前按鍵狀態
export function keys_on(): Record<string, boolean> {
  const keys: Record<string, boolean> = {};
  _keyState.keys.forEach((value, key) => {
    keys[key] = value;
  });
  return keys; // 返回一個副本以防止外部修改
}

// 精確移除回調
export function remove_key_callbacks(obj: Record<string, string | string[]>) {
  Object.entries(obj).forEach(([key, id]) => {
    if (!_keyState.keyConfigs.has(key)) return;

    const ids = Array.isArray(id) ? id : [id];
    const initialLength = _keyState.keyConfigs.get(key)?.length || 0;

    const updatedConfigs = (_keyState.keyConfigs.get(key) || []).filter(
      (config) => !ids.includes(config.id || "")
    );

    if (updatedConfigs.length < initialLength) {
      const removedCount = initialLength - updatedConfigs.length;
      logger.debug(
        `已從 ${key} 移除 ${removedCount} 個監聽器 (ID: ${ids.join(", ")})`
      );
    }

    if (updatedConfigs.length === 0) {
      _keyState.keyConfigs.delete(key);
      _keyState.keys.delete(key); // 移除狀態
      logger.debug(`已移除 ${key} 的所有監聽器和狀態`);
    } else {
      _keyState.keyConfigs.set(key, updatedConfigs);
    }
  });

  // 如果所有監聽器都沒了，可選擇停止全局監聽
  if (_keyState.keyConfigs.size === 0) {
    stopListening();
    logger.debug("所有按鍵監聽器已移除，停止全局監聽");
  }
}

// 重新實現 on_keys 函數，保持相同的輸入結構
export function on_keys(
  key_config: Record<string, KeyCallbackConfig | KeyCallbackConfig[]>
): KeyListenerHandle {
  const allAddedConfigs: Record<string, KeyCallbackConfig[]> = {};

  // 處理每個鍵的配置
  Object.entries(key_config).forEach(([key, config]) => {
    // 初始化按鍵狀態
    if (!_keyState.keys.has(key)) {
      _keyState.keys.set(key, false);
    }

    // 初始化這個按鍵的已添加配置數組
    if (!allAddedConfigs[key]) {
      allAddedConfigs[key] = [];
    }

    // 統一轉為數組處理
    const configArray = Array.isArray(config) ? config : [config];

    configArray.forEach((inputConfig) => {
      // 確保 type 屬性存在
      if (!inputConfig.type) {
        logger.error(`為 ${key} 註冊的配置缺少 type 屬性`);
        return;
      }

      // 為每個配置設定唯一 ID (使用簡單的隨機ID生成)
      inputConfig.id = Math.random().toString(36).substring(2, 15);

      // 統一將 callback 轉換成數組形式，簡化後續邏輯
      inputConfig.callback = Array.isArray(inputConfig.callback)
        ? inputConfig.callback
        : [inputConfig.callback];

      // 創建包裝後的回調
      inputConfig._wrappedCallback = wrapCallback(inputConfig);

      // 添加到 store
      if (!_keyState.keyConfigs.has(key)) {
        _keyState.keyConfigs.set(key, []);
      }

      _keyState.keyConfigs.get(key)?.push(inputConfig);
      allAddedConfigs[key].push(inputConfig);

      logger.debug(
        `已為 ${key} 添加 ${inputConfig.type} 監聽器 (ID: ${inputConfig.id})`
      );
    });
  });

  // 如果尚未監聽，則啟動
  if (!_keyState.isListening) {
    startListening();
  }

  // 返回用於移除所有添加的監聽器的句柄
  return Object.assign(() => {
    remove_key_callbacks(
      Object.fromEntries(
        // 移除為每個按鍵添加的所有回調
        Object.entries(allAddedConfigs).map(([key, configs]) => {
          return [key, configs.map((config) => config.id) as string[]];
        })
      )
    );
  }, Object.fromEntries(Object.entries(allAddedConfigs).map(([key, configs]) => [key, configs.map((config) => config.id)])));
}
