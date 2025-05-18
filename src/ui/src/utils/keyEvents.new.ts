import { logger } from "./logger";
import { throttle, debounce } from "lodash-es"; // 引入 lodash-es

export enum MODIFIER_KEYS {
  Shift = "Shift",
  Control = "Control",
  Alt = "Alt",
}

// --- 類型定義 ---
type CallbackFunction = () => any;

// 修改後的回調配置
type KeyCallbackConfig = {
  key: string; // 監聽觸發的按鍵
  type: "onPress" | "onRelease"; // 事件類型
  callback: CallbackFunction | CallbackFunction[];
  modifiers?: MODIFIER_KEYS[];
  preventDefault?: boolean;
  throttle?: number; // 節流間隔 (ms)
  debounce?: number; // 防抖間隔 (ms)
  ignoreWhenInputFocused?: boolean; // 是否在輸入框聚焦時忽略
  // 內部使用：存儲包裝後的回調
  _wrappedCallback?: CallbackFunction | CallbackFunction[];
};

// 監聽器操作句柄
type KeyListenerHandle = () => void; // 移除監聽器

// 視圖緩存
interface KeyConfigCache {
  keyTypeQueries: Map<
    string,
    Map<"onPress" | "onRelease", KeyCallbackConfig[]>
  >;
  isDirty: boolean;
}

// 內部狀態管理
const _keyEventsState = {
  keys: new Map<string, boolean>(), // 按鍵按下狀態
  keyConfigs: new Map<string, KeyCallbackConfig>(), // 存儲所有註冊的配置，以配置ID為鍵
  isListening: false,
  isInputFocused: false, // 輸入框是否聚焦
  configCache: {
    keyTypeQueries: new Map<
      string,
      Map<"onPress" | "onRelease", KeyCallbackConfig[]>
    >(),
    isDirty: true,
  } as KeyConfigCache, // 查詢緩存
};

// 生成唯一 ID
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// 檢查修飾鍵是否匹配
const checkModifiers = (
  event: KeyboardEvent,
  modifiers?: MODIFIER_KEYS[]
): boolean => {
  if (!modifiers || modifiers.length === 0) return true; // 無需檢查

  const required = {
    [MODIFIER_KEYS.Shift]: modifiers.includes(MODIFIER_KEYS.Shift),
    [MODIFIER_KEYS.Control]: modifiers.includes(MODIFIER_KEYS.Control),
    [MODIFIER_KEYS.Alt]: modifiers.includes(MODIFIER_KEYS.Alt),
  };

  // Meta key (Cmd on Mac, Win on Windows) counts as Control for simplicity here
  const ctrlOrMeta = event.ctrlKey || event.metaKey;

  return (
    required[MODIFIER_KEYS.Shift] === event.shiftKey &&
    required[MODIFIER_KEYS.Control] === ctrlOrMeta &&
    required[MODIFIER_KEYS.Alt] === event.altKey
  );
};

// 創建包裝後的回調（處理節流/防抖）
const wrapCallback = (config: KeyCallbackConfig): CallbackFunction[] => {
  // 統一轉換為數組處理
  const callbacks = Array.isArray(config.callback)
    ? config.callback
    : [config.callback];

  return callbacks.map((fn) => {
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

// 視圖輔助函數 - 獲取特定按鍵和事件類型的配置
export function viewKeyCallbackConfig(
  key: string,
  type: "onPress" | "onRelease"
): KeyCallbackConfig[] {
  // 檢查是否需要重建緩存
  if (_keyEventsState.configCache.isDirty) {
    rebuildCache();
  }

  // 從緩存獲取結果
  const keyCache = _keyEventsState.configCache.keyTypeQueries.get(key);
  if (!keyCache) {
    return [];
  }

  return keyCache.get(type) || [];
}

// 重建緩存
function rebuildCache(): void {
  // 清空現有緩存
  _keyEventsState.configCache.keyTypeQueries.clear();

  // 按鍵和類型分組
  for (const config of _keyEventsState.keyConfigs.values()) {
    const { key, type } = config;

    // 初始化鍵緩存
    if (!_keyEventsState.configCache.keyTypeQueries.has(key)) {
      _keyEventsState.configCache.keyTypeQueries.set(key, new Map());
    }

    // 初始化類型緩存
    const keyCache = _keyEventsState.configCache.keyTypeQueries.get(key)!;
    if (!keyCache.has(type)) {
      keyCache.set(type, []);
    }

    // 添加配置到緩存
    keyCache.get(type)!.push(config);
  }

  // 標記緩存為最新
  _keyEventsState.configCache.isDirty = false;
}

// --- 基礎輔助函數 ---

// 新增配置到內部存儲
function addConfig(config: KeyCallbackConfig): string {
  // 生成唯一 ID
  const id = generateUniqueId();

  // 確保按鍵狀態初始化
  if (!_keyEventsState.keys.has(config.key)) {
    _keyEventsState.keys.set(config.key, false);
  }

  // 添加到存儲
  _keyEventsState.keyConfigs.set(id, config);

  // 標記緩存需要更新
  _keyEventsState.configCache.isDirty = true;

  logger.debug(`已為 ${config.key} 添加 ${config.type} 監聽器 (ID: ${id})`);

  return id;
}

// 移除配置
function removeConfig(id: string): boolean {
  // 檢查配置是否存在
  if (!_keyEventsState.keyConfigs.has(id)) {
    return false;
  }

  // 獲取配置信息用於日誌
  const config = _keyEventsState.keyConfigs.get(id)!;

  // 從存儲中移除
  _keyEventsState.keyConfigs.delete(id);

  // 標記緩存需要更新
  _keyEventsState.configCache.isDirty = true;

  logger.debug(`已移除 ${config.key} 的 ${config.type} 監聽器 (ID: ${id})`);

  // 檢查是否還有此按鍵的其他配置
  const hasOtherConfigs = Array.from(_keyEventsState.keyConfigs.values()).some(
    (otherConfig) => otherConfig.key === config.key
  );

  // 如果沒有其他配置使用此按鍵，則移除按鍵狀態
  if (!hasOtherConfigs) {
    _keyEventsState.keys.delete(config.key);
    logger.debug(`已移除 ${config.key} 的所有監聽器和狀態`);
  }

  return true;
}

// --- Event Handlers ---
const handleKeyDown = (event: KeyboardEvent) => {
  const key = event.key;

  // 檢查按鍵是否有配置
  const configs = viewKeyCallbackConfig(key, "onPress");
  if (configs.length === 0) return;

  // 更新按鍵狀態
  _keyEventsState.keys.set(key, true);

  // 處理所有匹配的配置
  configs.forEach((config) => {
    // 檢查輸入框焦點
    if (config.ignoreWhenInputFocused && _keyEventsState.isInputFocused) {
      return;
    }

    // 檢查修飾鍵
    if (!checkModifiers(event, config.modifiers)) {
      return;
    }

    // 防止重複觸發 (長按)
    if (event.repeat) return;

    logger.debug(`${key} 鍵被按下`);

    // 阻止默認行為
    if (config.preventDefault) {
      event.preventDefault();
      logger.debug(`阻止了 ${key} 的默認行為`);
    }

    // 執行回調
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

  // 更新按鍵狀態
  if (_keyEventsState.keys.has(key)) {
    _keyEventsState.keys.set(key, false);
  }

  // 檢查按鍵是否有配置
  const configs = viewKeyCallbackConfig(key, "onRelease");
  if (configs.length === 0) return;

  // 處理所有匹配的配置
  configs.forEach((config) => {
    logger.debug(`${key} 鍵被釋放`);

    // 阻止默認行為
    if (config.preventDefault) {
      event.preventDefault();
    }

    // 執行回調
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
    _keyEventsState.isInputFocused = true;
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
        _keyEventsState.isInputFocused = false;
        logger.debug("輸入框失去焦點");
      }
    }, 0);
  }
};

// 窗口失焦時重置按鍵狀態
const handleBlur = () => {
  logger.debug("窗口失去焦點，重置按鍵狀態");
  // 添加完整的按鍵重置，保持一致性
  _keyEventsState.keys.forEach((_, key) =>
    _keyEventsState.keys.set(key, false)
  );
};

// 啟動監聽
const startListening = () => {
  if (_keyEventsState.isListening || typeof window === "undefined") return;

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("focusin", handleFocusIn);
  window.addEventListener("focusout", handleFocusOut);
  window.addEventListener("blur", handleBlur); // 監聽窗口失焦

  _keyEventsState.isListening = true;
  logger.debug("全局按鍵事件監聽器已啟動");
};

// 停止監聽
const stopListening = () => {
  if (!_keyEventsState.isListening || typeof window === "undefined") return;

  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("focusin", handleFocusIn);
  window.removeEventListener("focusout", handleFocusOut);
  window.removeEventListener("blur", handleBlur);

  _keyEventsState.isListening = false;
  _keyEventsState.isInputFocused = false; // 重置焦點狀態
  logger.debug("全局按鍵事件監聽器已停止");
};

// -------------- 公共 API --------------

// 獲取當前按鍵狀態
export function keysState(): Record<string, boolean> {
  const keys: Record<string, boolean> = {};
  _keyEventsState.keys.forEach((value, key) => {
    keys[key] = value;
  });
  return keys; // 返回一個副本以防止外部修改
}

// 移除按鍵回調
export function removeKeyCallbacks(ids: string | string[]): void {
  const idsArray = Array.isArray(ids) ? ids : [ids];
  let removedCount = 0;

  idsArray.forEach((id) => {
    if (removeConfig(id)) {
      removedCount++;
    }
  });

  // 如果所有監聽器都沒了，停止全局監聽
  if (_keyEventsState.keyConfigs.size === 0) {
    stopListening();
    logger.debug("所有按鍵監聽器已移除，停止全局監聽");
  }

  if (removedCount > 0) {
    logger.debug(`共移除了 ${removedCount} 個監聽器`);
  }
}

// 新版 onKeys 函數
export function onKeys(configs: KeyCallbackConfig[]): KeyListenerHandle {
  // 存儲添加的配置ID
  const addedIds: string[] = [];

  // 處理每個配置
  configs.forEach((inputConfig) => {
    // 深拷貝以避免修改原始對象
    const config = { ...inputConfig };

    // 確保 type 屬性存在
    if (!config.type) {
      logger.error(`註冊的配置缺少 type 屬性，key: ${config.key}`);
      return;
    }

    // 統一將 callback 轉換成數組形式，簡化後續邏輯
    config.callback = Array.isArray(config.callback)
      ? config.callback
      : [config.callback];

    // 創建包裝後的回調
    config._wrappedCallback = wrapCallback(config);

    // 添加配置並記錄 ID
    const id = addConfig(config);
    addedIds.push(id);
  });

  // 如果尚未監聽，則啟動
  if (!_keyEventsState.isListening && addedIds.length > 0) {
    startListening();
  }

  // 返回用於移除所有添加的監聽器的句柄
  return () => {
    removeKeyCallbacks(addedIds);
  };
}

export type { KeyCallbackConfig, CallbackFunction };
