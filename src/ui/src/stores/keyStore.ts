import { defineStore } from "pinia";
import { onMounted, onUnmounted, ref } from "vue";
import { logger } from "../utils/logger";
import { modifier_keys } from "../utils/key_events";
import { throttle, debounce } from "lodash-es"; // 引入 lodash-es

// --- Types ---

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

// --- Store Definition ---

const useKey = defineStore("key", () => {
  // --- State ---
  const keys = ref<Record<string, boolean>>({}); // 按鍵按下狀態
  const keyConfigs = ref<Record<string, KeyCallbackConfig[]>>({}); // 存儲所有註冊的配置
  const isListening = ref(false);
  const isInputFocused = ref(false); // 輸入框是否聚焦

  // --- Getters ---
  const keys_on = () => keys.value; // 返回當前所有被監聽按鍵的狀態

  // --- Private Helpers ---

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

    if (!keyConfigs.value[key]) return; // 沒有監聽此按鍵

    // 處理每個註冊的回調配置
    keyConfigs.value[key].forEach((config) => {
      if (config.type !== "onPress") return; // 只處理 onPress

      // 檢查輸入框焦點
      if (config.ignoreWhenInputFocused && isInputFocused.value) {
        return;
      }

      // 檢查修飾鍵
      if (!checkModifiers(event, config.modifiers)) {
        return;
      }

      // 防止重複觸發 (長按)
      if (event.repeat) return;

      // 更新按鍵狀態
      keys.value[key] = true;
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
    if (key in keys.value) {
      keys.value[key] = false;
    }

    if (!keyConfigs.value[key]) return; // 沒有監聽此按鍵

    // 處理每個註冊的回調配置
    keyConfigs.value[key].forEach((config) => {
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
      isInputFocused.value = true;
      logger.debug("輸入框獲得焦點"); // Changed from debug to info
    }
  };

  const handleFocusOut = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (isInputElement(target)) {
      // 稍微延遲，以處理焦點在輸入元素之間切換的情況
      setTimeout(() => {
        // 再次檢查當前焦點元素是否還是輸入元素
        if (!isInputElement(document.activeElement)) {
          isInputFocused.value = false;
          logger.debug("輸入框失去焦點"); // Changed from debug to info
        }
      }, 0);
    }
  };

  // 窗口失焦時重置按鍵狀態
  const handleBlur = () => {
    logger.debug("窗口失去焦點，重置按鍵狀態"); // Changed from debug to info
    // 添加完整的按鍵重置，保持一致性
    Object.keys(keys.value).forEach((key) => (keys.value[key] = false));
  };

  // --- Actions ---

  // 使用 Record<string, KeyCallbackConfig | KeyCallbackConfig[]> 作為輸入
  const on_keys = (
    key_config: Record<string, KeyCallbackConfig | KeyCallbackConfig[]>
  ): KeyListenerHandle => {
    const allAddedConfigs: Record<string, KeyCallbackConfig[]> = {};

    // 處理每個鍵的配置
    Object.entries(key_config).forEach(([key, config]) => {
      // 初始化按鍵狀態
      if (!(key in keys.value)) {
        keys.value[key] = false;
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

        // 為每個配置設定唯一 ID
        inputConfig.id = crypto.randomUUID();

        // 統一將 callback 轉換成數組形式，簡化後續邏輯
        inputConfig.callback = Array.isArray(inputConfig.callback)
          ? inputConfig.callback
          : [inputConfig.callback];

        // 創建包裝後的回調
        inputConfig._wrappedCallback = wrapCallback(inputConfig);

        // 添加到 store
        if (!keyConfigs.value[key]) {
          keyConfigs.value[key] = [];
        }

        keyConfigs.value[key].push(inputConfig);
        allAddedConfigs[key].push(inputConfig);

        logger.debug(
          `已為 ${key} 添加 ${inputConfig.type} 監聽器 (ID: ${inputConfig.id})`
        );
      });
    });

    // 如果尚未監聽，則啟動
    if (!isListening.value) {
      startListening();
    }

    // 返回用於移除所有添加的監聽器的句柄
    return () => {
      // 移除為每個按鍵添加的所有回調
      Object.entries(allAddedConfigs).forEach(([key, configs]) => {
        configs.forEach((config) => {
          remove_key_callback(key, config);
        });
      });
    };
  };

  // 精確移除回調
  const remove_key_callback = (key: string, config: KeyCallbackConfig) => {
    if (!keyConfigs.value[key]) return;

    const initialLength = keyConfigs.value[key].length;

    keyConfigs.value[key] = keyConfigs.value[key].filter(
      (_config) => config !== config
    );
    if (keyConfigs.value[key].length < initialLength) {
      logger.debug(
        `已從 ${key} 移除 ID 為 ${config.id} 的 ${config.type} 監聽器`
      );
    }

    // 如果一個鍵的所有監聽器都被移除了，則從 keys 中移除狀態
    if (keyConfigs.value[key].length === 0) {
      delete keyConfigs.value[key];
      delete keys.value[key]; // 移除狀態
      logger.debug(`已移除 ${key} 的所有監聽器和狀態`);
    }

    // 如果所有監聽器都沒了，可選擇停止全局監聽
    if (Object.keys(keyConfigs.value).length === 0) {
      stopListening();
      logger.debug("所有按鍵監聽器已移除，停止全局監聽");
    }
  };

  const startListening = () => {
    if (isListening.value || typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    window.addEventListener("blur", handleBlur); // 監聽窗口失焦

    isListening.value = true;
    logger.debug("全局按鍵事件監聽器已啟動");
  };

  const stopListening = () => {
    if (!isListening.value || typeof window === "undefined") return;

    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("focusin", handleFocusIn);
    window.removeEventListener("focusout", handleFocusOut);
    window.removeEventListener("blur", handleBlur);

    isListening.value = false;
    isInputFocused.value = false; // 重置焦點狀態
    logger.debug("全局按鍵事件監聽器已停止");
  };

  // --- Return Store API ---
  return {
    // State (Refs - 可直接讀取和修改，但不推薦直接修改)
    // keys, // 避免直接暴露內部狀態細節
    // keyConfigs, // 避免直接暴露內部狀態細節
    isListening,
    isInputFocused,

    // Getters (作為函數返回，確保響應性)
    keys_on,

    // Actions
    on_keys,
    remove_key_callback, // 提供精確移除方法
    startListening,
    stopListening,
  };
});

// --- Composable for automatic lifecycle management ---
const started = ref(false);
export function useKeyListener() {
  const keyStore = useKey();

  // 使用 ref 確保只在客戶端 onMounted 中執行 startListening

  onMounted(() => {
    // 確保只啟動一次，即使組件多次掛載
    if (!started.value) {
      keyStore.startListening();
      started.value = true;
    }
  });

  // onUnmounted 不再停止監聽，讓 store 持續存在
  // 如果需要組件卸載時停止，需要更複雜的引用計數邏輯
  // onUnmounted(() => {
  //   // 考慮引用計數或全局管理，避免一個組件卸載導致所有監聽停止
  //   // keyStore.stopListening();
  // });

  return keyStore;
}
