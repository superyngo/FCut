import { defineStore } from "pinia";
import { onMounted, onUnmounted, ref } from "vue";
import { logger } from "../../utils/logger";
import { throttle, debounce } from "lodash-es"; // 引入 lodash-es

// --- Types ---
// 定義回調函數類型，接收滑鼠位置作為參數
export type MouseCallbackFunction = (x: number, y: number) => any;

// 回調配置接口
export interface MouseCallbackConfig {
  callback: MouseCallbackFunction | MouseCallbackFunction[];
  throttle?: number; // 節流間隔 (ms)
  debounce?: number; // 防抖間隔 (ms)
  // 內部使用：存儲包裝後的回調
  _wrappedCallback?: MouseCallbackFunction | MouseCallbackFunction[];
}

// 監聽器操作句柄
export type MouseListenerHandle = () => void; // 移除監聽器

export const useMouseXY = defineStore("mouseXY", {
  state: () => ({
    isTracking: false,
    callbacks: {} as Record<string, MouseCallbackConfig>, // 添加 callbacks 狀態
    animationFrameId: 0 as number, // 用於 requestAnimationFrame
    lastEventTime: 0 as number, // 最後一次事件時間
    pendingMouseEvent: null as MouseEvent | null, // 待處理的滑鼠事件
  }),

  getters: {
    // 獲取事件對象
    event: (state) => state.pendingMouseEvent,

    // 獲取滑鼠 X 坐標
    mouseX: (state) => state.pendingMouseEvent?.clientX ?? 0,

    // 獲取滑鼠 Y 坐標
    mouseY: (state) => state.pendingMouseEvent?.clientY ?? 0,
  },

  actions: {
    startTracking() {
      if (this.isTracking) return;
      logger.debug("開始追蹤滑鼠位置");

      // 確保只在客戶端環境執行
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        window.addEventListener("mousemove", this.handleMouseMove);
        this.isTracking = true;

        // 開始動畫幀處理
        this.startAnimationLoop();
      }
    },

    stopTracking() {
      if (!this.isTracking) return;
      logger.debug("停止追蹤滑鼠位置");

      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", this.handleMouseMove);
        this.isTracking = false;

        // 停止動畫幀處理
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = 0;
        }
      }
    },

    handleMouseMove(event: MouseEvent) {
      // 直接儲存事件對象以便在下一個動畫幀處理
      this.pendingMouseEvent = event;
    },

    // 使用 requestAnimationFrame 的處理循環
    startAnimationLoop() {
      const processFrame = () => {
        // 處理待處理的滑鼠事件
        if (this.pendingMouseEvent) {
          // 執行所有註冊的回調
          this.executeCallbacks();
        }

        // 繼續下一幀
        this.animationFrameId = requestAnimationFrame(processFrame);
      };

      this.animationFrameId = requestAnimationFrame(processFrame);
    },

    // 執行所有註冊的回調
    executeCallbacks() {
      // 提前獲取座標，避免在循環中重複計算
      const x = this.mouseX;
      const y = this.mouseY;

      Object.entries(this.callbacks).forEach(([id, config]) => {
        try {
          // 確保 _wrappedCallback 已經初始化為數組
          const callbacks = config._wrappedCallback as MouseCallbackFunction[];
          if (callbacks && callbacks.length > 0) {
            callbacks.forEach((callback) => {
              callback(x, y);
            });
          }
        } catch (error) {
          logger.error(`執行滑鼠移動回調 ID:${id} 時發生錯誤: ${error}`);
        }
      });
    },

    // 創建包裝後的回調（處理節流/防抖）
    wrapCallback(config: MouseCallbackConfig): MouseCallbackFunction[] {
      // 統一將 callback 轉換成數組形式
      const callbackArray = Array.isArray(config.callback)
        ? config.callback
        : [config.callback];

      return callbackArray.map((fn) => {
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
    },

    // 註冊滑鼠移動回調函數
    onMousemove(
      callback: MouseCallbackFunction | MouseCallbackFunction[],
      options: { throttle?: number; debounce?: number } = {}
    ): MouseListenerHandle {
      // 創建配置對象
      const config: MouseCallbackConfig = {
        callback,
        ...options,
      };

      // 生成唯一ID
      const id = crypto.randomUUID();

      // 包裝回調函數（應用節流/防抖）
      config._wrappedCallback = this.wrapCallback(config);

      // 註冊到回調列表
      this.callbacks[id] = config;

      logger.debug(`已註冊滑鼠移動監聽器 (ID: ${id})`);

      // 返回包含移除方法的句柄
      return () => this.remove_callback(id);
    },

    // 移除滑鼠移動回調函數
    remove_callback(id: string): boolean {
      if (!this.callbacks[id]) return false;

      delete this.callbacks[id];
      logger.debug(`已移除滑鼠移動監聽器 (ID: ${id})`);

      // 如果所有回調都被移除且沒有其他組件在使用，可以考慮停止追蹤
      if (Object.keys(this.callbacks).length === 0) {
        logger.debug("所有滑鼠移動監聽器已移除");
      }

      return true;
    },
  },
});

// 建立一個 composable 來自動啟動追蹤
const started = ref(false);
export function useMouseTracking() {
  const mouse_coordinate = useMouseXY();
  // 使用 ref 確保只在客戶端 onMounted 中執行
  onMounted(() => {
    if (!started.value) {
      mouse_coordinate.startTracking();
      started.value = true;
    }
  });

  onUnmounted(() => {
    started.value = false;
    mouse_coordinate.stopTracking();
  });

  return mouse_coordinate;
}
