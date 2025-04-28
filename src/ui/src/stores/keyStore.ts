import { defineStore } from "pinia";
import { onMounted, onUnmounted, ref } from "vue";
import { Logger } from "../utils/logger";
import { modifier_keys } from "../utils/on_events";
import { throttle, debounce } from "lodash-es"; // 引入 lodash-es

// --- Types ---

type CallbackFunction = () => any;

// 擴展的回調配置
interface KeyCallbackConfig {
  callback: CallbackFunction;
  type: "onPress" | "onRelease";
  withControl?: modifier_keys[];
  preventDefault?: boolean;
  throttle?: number; // 節流間隔 (ms)
  debounce?: number; // 防抖間隔 (ms)
  ignoreWhenInputFocused?: boolean; // 是否在輸入框聚焦時忽略
  // 內部使用：存儲包裝後的回調
  _wrappedCallback?: CallbackFunction;
}

// on_keys 函數的輸入類型
type KeyCallbacksInput = {
  [key: string]: {
    onPress?: (
      | CallbackFunction
      | (Omit<KeyCallbackConfig, "type" | "callback"> & {
          callback: CallbackFunction;
        })
    )[];
    onRelease?: (
      | CallbackFunction
      | (Omit<KeyCallbackConfig, "type" | "callback"> & {
          callback: CallbackFunction;
        })
    )[];
    // 可以為整個按鍵設置通用選項
    withControl?: modifier_keys[];
    preventDefault?: boolean;
    throttle?: number;
    debounce?: number;
    ignoreWhenInputFocused?: boolean;
  };
};

// on_keys 返回的清理器類型
interface KeyListenerHandle {
  remove: () => void;
}

// --- Store Definition ---

export const useKey = defineStore("key", () => {
  // --- State ---
  const keys = ref<Record<string, boolean>>({}); // 按鍵按下狀態
  const keyConfigs = ref<Record<string, KeyCallbackConfig[]>>({}); // 存儲所有註冊的配置
  const isListening = ref(false);
  const isInputFocused = ref(false); // 輸入框是否聚焦

  // 修飾鍵狀態
  const isShiftPressed = ref(false);
  const isCtrlPressed = ref(false);
  const isAltPressed = ref(false);
  const isMetaPressed = ref(false); // Command key on Mac

  // --- Getters ---
  const keys_on = () => keys.value; // 返回當前所有被監聽按鍵的狀態
  const shiftPressed = () => isShiftPressed.value;
  const ctrlPressed = () => isCtrlPressed.value;
  const altPressed = () => isAltPressed.value;
  const metaPressed = () => isMetaPressed.value;

  // --- Private Helpers ---

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

  // 創建包裝後的回調（處理節流/防抖）
  const wrapCallback = (config: KeyCallbackConfig): CallbackFunction => {
    let wrapped = config.callback;
    if (config.throttle && config.throttle > 0) {
      wrapped = throttle(wrapped, config.throttle, {
        leading: true,
        trailing: false,
      });
    } else if (config.debounce && config.debounce > 0) {
      wrapped = debounce(wrapped, config.debounce, {
        leading: true,
        trailing: false,
      });
    }
    return wrapped;
  };

  // --- Event Handlers ---

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key;

    // 更新修飾鍵狀態
    if (key === "Shift") isShiftPressed.value = true;
    if (key === "Control") isCtrlPressed.value = true;
    if (key === "Alt") isAltPressed.value = true;
    if (key === "Meta") isMetaPressed.value = true;

    if (!keyConfigs.value[key]) return; // 沒有監聽此按鍵

    // 處理每個註冊的回調配置
    keyConfigs.value[key].forEach((config) => {
      if (config.type !== "onPress") return; // 只處理 onPress

      // 檢查輸入框焦點
      if (config.ignoreWhenInputFocused && isInputFocused.value) {
        return;
      }

      // 檢查修飾鍵
      if (!checkModifiers(event, config.withControl)) {
        return;
      }

      // 防止重複觸發 (長按)
      if (event.repeat) return;

      // 更新按鍵狀態
      keys.value[key] = true;
      Logger.info(`${key} 鍵被按下`);

      // 阻止默認行為
      if (config.preventDefault) {
        event.preventDefault();
        Logger.info(`阻止了 ${key} 的默認行為`);
      }

      // 執行回調 (可能是包裝過的)
      try {
        config._wrappedCallback?.(); // 使用包裝後的回調
      } catch (error) {
        Logger.error(`執行 ${key} 按壓回調時發生錯誤: ${error}`);
      }
    });
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key;

    // 更新修飾鍵狀態
    if (key === "Shift") isShiftPressed.value = false;
    if (key === "Control") isCtrlPressed.value = false;
    if (key === "Alt") isAltPressed.value = false;
    if (key === "Meta") isMetaPressed.value = false;

    // 更新按鍵狀態 (即使沒有 release 回調也要更新)
    if (key in keys.value) {
      keys.value[key] = false;
    }

    if (!keyConfigs.value[key]) return; // 沒有監聽此按鍵

    // 處理每個註冊的回調配置
    keyConfigs.value[key].forEach((config) => {
      if (config.type !== "onRelease") return; // 只處理 onRelease

      // 檢查輸入框焦點 (通常釋放時不需要檢查，但保留以防特殊需求)
      // if (config.ignoreWhenInputFocused && isInputFocused.value) {
      //   return;
      // }

      // 檢查修飾鍵 (釋放時檢查可能不符合直覺，但保留邏輯)
      // 注意：釋放時，剛釋放的那個修飾鍵 event.xxxKey 會是 false
      // if (!checkModifiers(event, config.withControl)) {
      //    return;
      // }

      Logger.info(`${key} 鍵被釋放`);

      // 阻止默認行為 (keyup 時阻止通常意義不大，但保留選項)
      if (config.preventDefault) {
        event.preventDefault();
      }

      // 執行回調 (可能是包裝過的)
      try {
        config._wrappedCallback?.(); // 使用包裝後的回調
      } catch (error) {
        Logger.error(`執行 ${key} 釋放回調時發生錯誤: ${error}`);
      }
    });
  };

  // 處理輸入框焦點
  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      isInputFocused.value = true;
      Logger.info("輸入框獲得焦點"); // Changed from debug to info
    }
  };

  const handleFocusOut = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      // 稍微延遲，以處理焦點在輸入元素之間切換的情況
      setTimeout(() => {
        // 再次檢查當前焦點元素是否還是輸入元素
        if (
          !(
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement ||
            document.activeElement instanceof HTMLSelectElement ||
            (document.activeElement instanceof HTMLElement &&
              document.activeElement.isContentEditable)
          )
        ) {
          isInputFocused.value = false;
          Logger.info("輸入框失去焦點"); // Changed from debug to info
        }
      }, 0);
    }
  };

  // 窗口失焦時重置修飾鍵狀態
  const handleBlur = () => {
    Logger.info("窗口失去焦點，重置修飾鍵狀態"); // Changed from debug to info
    isShiftPressed.value = false;
    isCtrlPressed.value = false;
    isAltPressed.value = false;
    isMetaPressed.value = false;
    // 可以選擇是否重置 keys 狀態
    // Object.keys(keys.value).forEach(key => keys.value[key] = false);
  };

  // --- Actions ---

  const on_keys = (callbacksInput: KeyCallbacksInput): KeyListenerHandle[] => {
    const addedConfigs: { key: string; config: KeyCallbackConfig }[] = [];

    Object.entries(callbacksInput).forEach(([key, config]) => {
      // 初始化按鍵狀態
      if (!(key in keys.value)) {
        keys.value[key] = false;
      }

      const processCallbacks = (
        callbackList:
          | (
              | CallbackFunction
              | (Omit<KeyCallbackConfig, "type" | "callback"> & {
                  callback: CallbackFunction;
                })
            )[]
          | undefined,
        type: "onPress" | "onRelease"
      ) => {
        if (!callbackList) return;

        callbackList.forEach((cbOrConfig) => {
          let fullConfig: KeyCallbackConfig;
          if (typeof cbOrConfig === "function") {
            // 基礎回調函數
            fullConfig = {
              callback: cbOrConfig,
              type: type,
              // 繼承按鍵級別的設置
              withControl: config.withControl,
              preventDefault: config.preventDefault,
              throttle: config.throttle,
              debounce: config.debounce,
              ignoreWhenInputFocused: config.ignoreWhenInputFocused ?? true, // 默認忽略輸入框
            };
          } else {
            // 詳細配置對象
            fullConfig = {
              ...cbOrConfig, // 包含 callback 和其他選項
              type: type,
              // 繼承或覆蓋按鍵級別的設置
              withControl: cbOrConfig.withControl ?? config.withControl,
              preventDefault:
                cbOrConfig.preventDefault ?? config.preventDefault,
              throttle: cbOrConfig.throttle ?? config.throttle,
              debounce: cbOrConfig.debounce ?? config.debounce,
              ignoreWhenInputFocused:
                cbOrConfig.ignoreWhenInputFocused ??
                config.ignoreWhenInputFocused ??
                true, // 默認忽略輸入框
            };
          }

          // 創建包裝後的回調
          fullConfig._wrappedCallback = wrapCallback(fullConfig);

          // 添加到 store
          if (!keyConfigs.value[key]) {
            keyConfigs.value[key] = [];
          }
          keyConfigs.value[key].push(fullConfig);
          addedConfigs.push({ key, config: fullConfig });
          Logger.info(`已為 ${key} 添加 ${type} 監聽器`); // Changed from debug to info
        });
      };

      processCallbacks(config.onPress, "onPress");
      processCallbacks(config.onRelease, "onRelease");
    });

    // 如果尚未監聽，則啟動
    if (!isListening.value) {
      startListening();
    }

    // 為每個添加的回調創建精確的移除句柄
    const handles: KeyListenerHandle[] = addedConfigs.map(
      ({ key, config }) => ({
        remove: () => remove_key_callback(key, config.type, config.callback),
      })
    );

    // 返回句柄數組
    return handles;
  };

  // 精確移除回調
  const remove_key_callback = (
    key: string,
    type: "onPress" | "onRelease",
    callbackToRemove: CallbackFunction
  ) => {
    if (!keyConfigs.value[key]) return;

    const initialLength = keyConfigs.value[key].length;
    keyConfigs.value[key] = keyConfigs.value[key].filter(
      (config) =>
        !(config.type === type && config.callback === callbackToRemove)
    );

    if (keyConfigs.value[key].length < initialLength) {
      Logger.info(`已從 ${key} 移除 ${type} 監聽器`); // Changed from debug to info
    }

    // 如果一個鍵的所有監聽器都被移除了，可以考慮從 keys 中移除狀態
    if (keyConfigs.value[key].length === 0) {
      delete keyConfigs.value[key];
      delete keys.value[key]; // 移除狀態
      Logger.info(`已移除 ${key} 的所有監聽器和狀態`); // Changed from debug to info
    }

    // 可選：如果所有監聽器都沒了，停止全局監聽
    // if (Object.keys(keyConfigs.value).length === 0) {
    //   stopListening();
    // }
  };

  const startListening = () => {
    if (isListening.value || typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    window.addEventListener("blur", handleBlur); // 監聽窗口失焦

    isListening.value = true;
    Logger.info("全局按鍵事件監聽器已啟動");
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
    // 重置修飾鍵狀態
    isShiftPressed.value = false;
    isCtrlPressed.value = false;
    isAltPressed.value = false;
    isMetaPressed.value = false;
    Logger.info("全局按鍵事件監聽器已停止");
  };

  // --- Return Store API ---
  return {
    // State (Refs - 可直接讀取和修改，但不推薦直接修改)
    // keys, // 避免直接暴露內部狀態細節
    // keyConfigs, // 避免直接暴露內部狀態細節
    isListening,
    isInputFocused,
    isShiftPressed,
    isCtrlPressed,
    isAltPressed,
    isMetaPressed,

    // Getters (作為函數返回，確保響應性)
    keys_on,
    shiftPressed,
    ctrlPressed,
    altPressed,
    metaPressed,

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
