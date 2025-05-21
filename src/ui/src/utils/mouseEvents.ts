import { logger } from "./logger";
import { throttle, debounce } from "lodash-es";

// 模塊概述:
// 本模塊提供滑鼠事件處理的完整解決方案，包含基本事件監聽、複合拖拽功能、效能優化與資源管理機制。
// 2023年重構主要針對回調註冊系統進行了優化，提高了查詢效率並添加了快取層。

// 流程控制說明:
// 1. 提供公共 API：onMousemove, onClick, onMousedown, onMouseup, onWheel 等監聽函數，以及 onDrag, makeDraggable 等複合事件處理函數
// 2. 所有事件監聽都透過 addEventListeners 統一處理，內部創建 WrappedCallbackConfig 並以 ID 為鍵存入 _callbackRegistry.registeredCallbackConfigs，同時標記快取為髒數據
// 3. 對節流/防抖控制：使用 wrapCallback 處理節流（throttle）和防抖（debounce）
// 4. 啟動事件監聽：startListening 向 window 註冊 handleMouseEvent 事件處理器並啟動 startAnimationLoop
// 5. 事件收集處理：handleMouseEvent 接收原始事件，更新滑鼠狀態並將事件存入 _callbackRegistry.pendingEvents
// 6. 動畫幀處理：startAnimationLoop 使用 requestAnimationFrame 建立循環，通過 viewRegisteredCallbackConfigs 獲取回調並呼叫
// 7. 快取管理：viewRegisteredCallbackConfigs 提供按事件類型查詢回調的能力，使用 isDirty 標記確保快取一致性
// 8. 拖曳處理：processDragCallbacks 特殊處理拖曳相關事件，創建 DragInfo 並執行回調
// 9. 資源釋放：removeRegisteredCallbackConfigs, clearCallbacks 或監聽句柄函數移除監聽器和清理資源

// 拖曳處理控制說明：
// 1. 拖曳狀態定義：使用 DRAG_STATE 枚舉定義四種狀態 (Idle, Start, Dragging, End)，用 _dragState 物件追蹤當前狀態
// 2. 事件觸發流程：mousedown 觸發拖曳開始、mousemove 觸發拖曳過程、mouseup 觸發拖曳結束
// 3. 拖曳資料處理：createDragInfo 建立拖曳物件，包含起始座標、當前座標、位移量等資訊傳遞給回調函數
// 4. 高階 API：提供 onDrag 和 makeDraggable 兩個公共函數，前者用於自訂拖曳邏輯，後者直接實現元素拖曳功能
// 5. 拖曳識別機制：使用 id 前綴 "drag_" 標記拖曳相關回調，在 processDragCallbacks 中篩選並處理
// 6. 錯誤處理：確保回調執行錯誤不會影響整體拖曳功能的運作

// 2023重構摘要：
// 1. 數據結構變更：將 registeredCallbackConfigs 從 Map<MOUSE_EVENT_TYPE, WrappedCallbackConfig[]> 改為 Map<string, WrappedCallbackConfig>
// 2. 新增快取系統：添加 configCache 按事件類型組織回調，使用 isDirty 標記管理快取一致性
// 3. 視圖函數：添加 viewRegisteredCallbackConfigs 統一提供按事件類型查詢能力
// 4. 原始資料變更：CallbackConfig 類型添加必要的 type 屬性，維持與 DragCallbackConfig 兼容
// 5. 效能優化：主數據結構提供 O(1) 查詢刪除能力，快取機制減少重複計算

// -------------- 類型定義 --------------

// 鼠標事件類型
export enum MOUSE_EVENT_TYPE {
  Move = "mousemove",
  Down = "mousedown",
  Up = "mouseup",
  Click = "click",
  DoubleClick = "dblclick",
  ContextMenu = "contextmenu",
  Enter = "mouseenter",
  Leave = "mouseleave",
  Over = "mouseover",
  Out = "mouseout",
  Wheel = "wheel",
}

// 拖拽狀態
enum DRAG_STATE {
  Idle = "idle",
  Start = "start",
  Dragging = "dragging",
  End = "end",
}

// 拖拽信息
type DragInfo = {
  state: DRAG_STATE;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  totalDeltaX: number;
  totalDeltaY: number;
  event: MouseEvent;
};

// 拖拽回調函數
export type DragCallbackFunction = (info: DragInfo) => any;

export type DragCallbackConfig = {
  id?: string; // 唯一標識符
  throttle?: number; // 節流間隔(ms)
  debounce?: number; // 防抖間隔(ms)
  target?: HTMLElement | string | null; // 目標元素或選擇器
  preventDefault?: boolean; // 是否阻止默認行為
  callbacks: DragCallbackFunction | DragCallbackFunction[]; // 拖拽回調函數或回調函數數組
};

// 基本鼠標回調函數
export type MouseCallbackFunction = (event: MouseEvent | WheelEvent) => any;

export type CallbackConfig = Omit<DragCallbackConfig, "callbacks"> & {
  type: MOUSE_EVENT_TYPE; // 事件類型（新增）
  passive?: boolean; // 是否為被動監聽器
  capture?: boolean; // 是否在捕獲階段監聽
  once?: boolean; // 是否只觸發一次
  filter?: (event: MouseEvent | WheelEvent) => boolean; // 事件過濾函數
  callbacks: MouseCallbackFunction | MouseCallbackFunction[]; // 鼠標回調函數或回調函數數組
};

// 回調配置
type WrappedCallbackConfig = Omit<CallbackConfig, "id" | "callbakcs"> & {
  id: string; // 回調ID
  type: MOUSE_EVENT_TYPE; // 事件類型（確保從 CallbackConfig 保留）
  callbacks: MouseCallbackFunction[]; // 原始回調函數統一轉數組
  wrappedCallbacks?: MouseCallbackFunction[]; // 包裝後的回調數組
};

// 鼠標事件監聽器句柄
export type MouseListenerHandle = (() => void) & {
  registeredCallbacks: WrappedCallbackConfig[];
};

// -------------- 內部狀態 --------------

// 模塊級內部狀態 - 按功能分組
const _mousePosition = {
  clientX: 0,
  clientY: 0,
  pageX: 0,
  pageY: 0,
  screenX: 0,
  screenY: 0,
  movementX: 0,
  movementY: 0,
};

const _mouseButtons = {
  left: false,
  right: false,
  middle: false,
};

const _dragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
};

/**
 * 事件回調註冊表 - 中央管理所有註冊的回調
 * 重構說明：
 * 1. 將 registeredCallbackConfigs 從 Map<MOUSE_EVENT_TYPE, WrappedCallbackConfig[]> 改為
 *    Map<string, WrappedCallbackConfig>，以回調ID為鍵，提供 O(1) 查詢速度
 * 2. 添加 configCache 用於快速按事件類型查詢回調，支持傳統按類型查詢方式
 * 3. isDirty 用於標記快取是否需要重建，在添加/移除回調時設置為 true
 */
const _callbackRegistry = {
  registeredCallbackConfigs: new Map<string, WrappedCallbackConfig>(), // 主存儲：以 ID 為鍵的回調配置
  // registeredEventTypes: new Set<MOUSE_EVENT_TYPE>(), // 已註冊事件類型集合
  configCache: new Map<MOUSE_EVENT_TYPE, WrappedCallbackConfig[]>(), // 按事件類型的快取
  pendingEvents: new Map<MOUSE_EVENT_TYPE, (MouseEvent | WheelEvent)[]>(), // 待處理事件隊列
  isDirty: true, // 緩存髒標記
};

const _performance = {
  lowPowerMode: false, // 低功耗模式
  updateFrequency: 0, // 當前更新頻率
  normalFrequency: 0, // 正常頻率(自動檢測)
  lowPowerFrequency: 30, // 低功耗模式下的頻率
  lastFrameTime: 0, // 上一幀時間
  frameCount: 0, // 幀計數
  frameTimeAccumulator: 0, // 幀時間累加器
  animationFrameId: 0, // 動畫幀ID
};

const _hoverState = {
  hoveredElements: new Set<HTMLElement>(),
};

// -------------- 工具函數 --------------

// 更新 4 狀態
// 更新滑鼠位置
const updateMousePosition = (event: MouseEvent): void => {
  _mousePosition.clientX = event.clientX;
  _mousePosition.clientY = event.clientY;
  _mousePosition.pageX = event.pageX;
  _mousePosition.pageY = event.pageY;
  _mousePosition.screenX = event.screenX;
  _mousePosition.screenY = event.screenY;
  _mousePosition.movementX = event.movementX;
  _mousePosition.movementY = event.movementY;
};

// 更新懸停檢測
const updateHoverState = (event: MouseEvent) => {
  // 檢查當前懸停的元素
  const hoveredElements = document.elementsFromPoint(
    event.clientX,
    event.clientY
  ) as HTMLElement[];
  const newHoveredSet = new Set(hoveredElements);

  // 找出新增的懸停元素
  const newHovered = hoveredElements.filter(
    (el) => !_hoverState.hoveredElements.has(el)
  );

  // 找出離開懸停的元素
  const leftHovered = Array.from(_hoverState.hoveredElements).filter(
    (el) => !newHoveredSet.has(el)
  );

  // 更新懸停集合
  _hoverState.hoveredElements = newHoveredSet;

  // 處理懸停元素的進入和離開事件
  // (這裡的具體處理可以根據需求擴展)
};

// 解析鼠標按鍵狀態
const updateMouseButtons = (event: MouseEvent): void => {
  // 記錄先前的狀態以檢測變更
  const prevLeft = _mouseButtons.left;

  // 0: No button, 1: Left, 2: Right, 4: Middle
  _mouseButtons.left = (event.buttons & 1) === 1;
  _mouseButtons.right = (event.buttons & 2) === 2;
  _mouseButtons.middle = (event.buttons & 4) === 4;

  // 當左鍵狀態改變時記錄日誌
  if (prevLeft !== _mouseButtons.left) {
    logger.debug(
      `Left mouse button state changed: ${prevLeft ? "down" : "up"} -> ${
        _mouseButtons.left ? "down" : "up"
      }, buttons=${event.buttons}`
    );
  }
};

// 檢查事件是否符合過濾條件
const checkEventFilter = (
  event: Event,
  config: WrappedCallbackConfig
): boolean => {
  // 檢查目標元素
  if (config.target) {
    const targetElement = getElement(config.target);
    if (!targetElement || !event.target) return false;

    // 檢查目標是否匹配
    if (
      !(
        event.target === targetElement ||
        targetElement.contains(event.target as Node)
      )
    ) {
      return false;
    }
  }

  // 應用自定義過濾器
  if (config.filter && !config.filter(event as MouseEvent | WheelEvent)) {
    return false;
  }

  return true;
};

// 獲取元素 (支持選擇器字符串或元素本身)
const getElement = (
  target: HTMLElement | string | null | undefined
): HTMLElement | null => {
  if (!target) return document.documentElement;
  if (typeof target === "string") return document.querySelector(target);
  return target;
};

// 創建包裝後的回調（處理節流/防抖）
const wrapCallback = (
  callbacks: MouseCallbackFunction[],
  config: Record<"throttle" | "debounce", number | undefined>
): MouseCallbackFunction[] => {
  if (config.throttle && config.throttle > 0) {
    return callbacks.map((callback) =>
      throttle(callback, config.throttle, {
        leading: true,
        trailing: false,
      })
    );
  } else if (config.debounce && config.debounce > 0) {
    return callbacks.map((callback) =>
      debounce(callback, config.debounce, {
        leading: true,
        trailing: false,
      })
    );
  }
  return callbacks;
};

// -------------- 事件處理器 --------------

// 通用滑鼠事件處理程序
const handleMouseEvent = (event: MouseEvent | WheelEvent) => {
  // 更新滑鼠狀態 (僅針對 MouseEvent)
  if (event instanceof MouseEvent) {
    // 更新滑鼠位置，確保位置資訊是最新的
    updateMousePosition(event);

    // 更新滑鼠按鍵狀態
    if (event.type === MOUSE_EVENT_TYPE.Down) {
      updateMouseButtons(event);
      logger.debug(
        `Mouse down: buttons=${event.buttons}, left=${_mouseButtons.left}`
      );
    } else if (event.type === MOUSE_EVENT_TYPE.Click) {
      updateMouseButtons(event);
    } else if (event.type === MOUSE_EVENT_TYPE.Up) {
      updateMouseButtons(event);
      logger.debug(
        `Mouse up: buttons=${event.buttons}, left=${_mouseButtons.left}`
      );
    }

    // 處理拖拽狀態
    updateDragState(event);
  }

  // 獲取事件類型並確保事件隊列初始化
  const eventType = event.type as MOUSE_EVENT_TYPE;
  if (!_callbackRegistry.pendingEvents.has(eventType)) {
    _callbackRegistry.pendingEvents.set(eventType, []);
  }

  // 添加到待處理事件隊列
  _callbackRegistry.pendingEvents.get(eventType)!.push(event);
};

// 更新拖拽狀態
const updateDragState = (event: MouseEvent) => {
  // 處理拖拽開始
  if (event.type === MOUSE_EVENT_TYPE.Down && !_dragState.isDragging) {
    logger.debug(
      `Mouse down event at (${event.clientX}, ${event.clientY}), buttons=${event.buttons}`
    );

    // 更新按鍵狀態，確保 _mouseButtons.left 是正確的
    updateMouseButtons(event);

    if (_mouseButtons.left) {
      logger.debug(
        `Left button pressed - Starting drag at (${event.clientX}, ${event.clientY})`
      );
      _dragState.isDragging = true;
      _dragState.startX = event.clientX;
      _dragState.startY = event.clientY;
      _dragState.lastX = event.clientX;
      _dragState.lastY = event.clientY;

      // 處理所有拖拽回調 - 開始狀態
      processDragCallbacks(event, DRAG_STATE.Start);
      return;
    } else {
      logger.debug(
        `Left mouse button not detected (buttons=${event.buttons}), drag not started`
      );
    }
  }

  // 如果未在拖拽中，直接返回
  if (!_dragState.isDragging) return;

  // 處理拖拽移動
  if (event.type === MOUSE_EVENT_TYPE.Move) {
    // 處理所有拖拽回調 - 拖拽狀態
    processDragCallbacks(event, DRAG_STATE.Dragging);

    _dragState.lastX = event.clientX;
    _dragState.lastY = event.clientY;
    return;
  }

  // 處理拖拽結束
  if (event.type === MOUSE_EVENT_TYPE.Up) {
    // 處理所有拖拽回調 - 結束狀態
    processDragCallbacks(event, DRAG_STATE.End);

    // 重置狀態
    _dragState.isDragging = false;
    _dragState.startX = 0;
    _dragState.startY = 0;
    _dragState.lastX = 0;
    _dragState.lastY = 0;
  }
};

// -------------- 核心功能 --------------

// 更新幀速率計算
const updateFrameStats = (timestamp: number): void => {
  const perf = _performance;

  // 初始化時間戳
  if (perf.lastFrameTime === 0) {
    perf.lastFrameTime = timestamp;
    return;
  }

  // 計算幀間隔
  const deltaTime = timestamp - perf.lastFrameTime;
  perf.lastFrameTime = timestamp;

  // 累積時間和幀數以計算平均頻率
  perf.frameTimeAccumulator += deltaTime;
  perf.frameCount++;

  // 每秒更新一次計算的幀率
  if (perf.frameTimeAccumulator < 1000) return;

  // 更新頻率計算
  perf.normalFrequency = perf.frameCount;
  perf.frameCount = 0;
  perf.frameTimeAccumulator = 0;

  // 更新實際使用頻率
  perf.updateFrequency = perf.lowPowerMode
    ? Math.min(perf.lowPowerFrequency, perf.normalFrequency)
    : perf.normalFrequency;
};

/**
 * 使用 requestAnimationFrame 的處理循環 - 最核心執行所有註冊事件的地方
 *
 * 此函數創建動畫循環，在每個幀中處理所有待處理的事件，是整個模塊的核心調度中心。
 * 重構後該函數通過 viewRegisteredCallbackConfigs 視圖函數獲取每種事件類型的回調，
 * 而非直接訪問原始數據結構，這使得數據結構變更對事件處理邏輯的影響最小化。
 */
const startAnimationLoop = () => {
  const processFrame = (timestamp: number) => {
    // 更新幀速率統計
    updateFrameStats(timestamp);

    // 處理所有類型的待處理事件
    _callbackRegistry.pendingEvents.forEach((events, eventType) => {
      // 檢查是否有註冊的回調，使用視圖函數獲取按事件類型組織的回調
      // 重構關鍵點：通過視圖函數隱藏內部存儲結構變更
      const callbacks = viewRegisteredCallbackConfigs(eventType);
      if (!callbacks || callbacks.length === 0) {
        events.length = 0;
        return;
      }

      // 優化移動事件處理：只處理最後一個移動事件
      if (eventType === MOUSE_EVENT_TYPE.Move && events.length > 1) {
        const lastEvent = events[events.length - 1];
        events.length = 0;
        events.push(lastEvent);
      }

      // 處理註冊事件類型的所有事件
      processEventsForType(events, eventType);

      // 清空處理過的事件
      events.length = 0;
    });

    // 安排下一幀
    scheduleNextFrame(processFrame);
  };

  _performance.animationFrameId = requestAnimationFrame(processFrame);
};

// 安排下一幀
const scheduleNextFrame = (processFrame: (timestamp: number) => void) => {
  if (_performance.lowPowerMode && _performance.updateFrequency > 0) {
    // 低功耗模式下，使用 setTimeout 控制頻率
    setTimeout(() => {
      _performance.animationFrameId = requestAnimationFrame(processFrame);
    }, 1000 / _performance.lowPowerFrequency);
  } else {
    // 正常模式下，直接請求下一幀
    _performance.animationFrameId = requestAnimationFrame(processFrame);
  }
};

/**
 * 處理特定類型的事件
 *
 * 此函數負責執行特定事件類型的所有回調函數。重構後，它不再直接從
 * _callbackRegistry.registeredCallbackConfigs 獲取回調，而是通過
 * viewRegisteredCallbackConfigs 視圖函數按事件類型獲取適用的回調。
 *
 * @param events 待處理的事件數組
 * @param eventType 事件類型
 */
const processEventsForType = (
  events: (MouseEvent | WheelEvent)[],
  eventType: MOUSE_EVENT_TYPE
) => {
  // 使用視圖函數獲取回調，隱藏內部存儲結構的變更
  const callbacks = viewRegisteredCallbackConfigs(eventType);
  if (!callbacks || callbacks.length === 0) return;

  events.forEach((event) => {
    callbacks.forEach((registeredCallback) => {
      // 檢查過濾條件
      if (!checkEventFilter(event, registeredCallback)) return;

      try {
        // 阻止默認行為
        if (registeredCallback.preventDefault) {
          event.preventDefault();
        }

        // 執行回調
        registeredCallback.wrappedCallbacks?.forEach((wrappedCallback) =>
          wrappedCallback(event)
        );

        // 處理一次性回調
        if (registeredCallback.once) {
          removeOneTimeCallback(registeredCallback.id);
        }
      } catch (error) {
        logger.error(
          `執行鼠標事件回調 ID:${registeredCallback.id} 時發生錯誤: ${error}`
        );
      }
    });
  });
};

// 移除一次性回調
const removeOneTimeCallback = (callbackId: string) => {
  if (_callbackRegistry.registeredCallbackConfigs.has(callbackId)) {
    // 直接根據 ID 刪除回調
    _callbackRegistry.registeredCallbackConfigs.delete(callbackId);

    // 標記緩存為髒數據
    _callbackRegistry.isDirty = true;
  }
};

// 開始全局各類Mouse Events事件監聽
const startListening = (eventType: MOUSE_EVENT_TYPE) => {
  if (typeof window === "undefined") return;
  if (_callbackRegistry.configCache.has(eventType)) return;

  // 註冊特定事件類型的監聽器
  window.addEventListener(eventType, handleMouseEvent as EventListener, {
    passive: false,
  });

  logger.debug(`已為 ${eventType} 事件添加全局監聽器`);

  // 啟動動畫循環 (如果未啟動)
  if (!_performance.animationFrameId) {
    startAnimationLoop();
  }
};

// 停止全局事件監聽
const stopListening = (eventType?: MOUSE_EVENT_TYPE) => {
  if (typeof window === "undefined") return;

  // 如果提供了特定事件類型，只移除該類型
  if (eventType) {
    if (!_callbackRegistry.configCache.has(eventType)) return;

    removeRegisteredCallbackConfigs(
      _callbackRegistry.configCache.get(eventType)!
    );

    window.removeEventListener(eventType, handleMouseEvent as EventListener);
    logger.debug(`已移除 ${eventType} 的全局事件監聽器`);

    // 如果還有其他事件註冊，提前返回
    if (_callbackRegistry.configCache.size > 0) return;
  } else {
    // 如果沒有註冊的監聽器，直接返回
    if (_callbackRegistry.configCache.size === 0) return;

    // 沒有特定事件類型則移除所有已註冊的事件監聽器
    _callbackRegistry.configCache.forEach(
      (wrappedCallbackConfigs, eventType) => {
        window.removeEventListener(
          eventType,
          handleMouseEvent as EventListener
        );
      }
    );

    _callbackRegistry.registeredCallbackConfigs.clear();
    logger.debug("全局鼠標事件監聽器已停止");
  }

  // 停止動畫循環（此時已確認沒有任何註冊事件）
  if (_performance.animationFrameId) {
    cancelAnimationFrame(_performance.animationFrameId);
    _performance.animationFrameId = 0;
  }

  // 清理狀態
  _callbackRegistry.pendingEvents.clear();
  _hoverState.hoveredElements.clear();
};

// -------------- 拖拽輔助函數 --------------

/**
 * 處理拖拽回調
 *
 * 此函數負責根據當前拖拽狀態，執行所有註冊的拖拽相關回調。
 * 重構後，它使用 viewRegisteredCallbackConfigs 視圖函數獲取按事件類型組織的回調，
 * 然後過濾出拖拽相關的回調（ID 以 drag_ 開頭）並執行它們。
 *
 * 工作流程：
 * 1. 透過視圖函數獲取所有 Move 事件相關回調
 * 2. 創建包含完整拖拽狀態信息的 DragInfo 對象
 * 3. 過濾出以 "drag_" 開頭的回調，這些是由 onDrag 函數註冊的
 * 4. 執行符合條件的回調，傳遞 event 參數
 * 5. onDrag 函數內部會將 event 轉換為 dragInfo 後傳給使用者註冊的回調
 *
 * @param event 觸發拖拽的鼠標事件
 * @param state 當前拖拽狀態（開始、拖拽中、結束）
 */
const processDragCallbacks = (event: MouseEvent, state: DRAG_STATE) => {
  // 使用視圖函數獲取移動事件相關的回調 - 重構關鍵點
  const moveCallbacks = viewRegisteredCallbackConfigs(MOUSE_EVENT_TYPE.Move);
  if (!moveCallbacks || moveCallbacks.length === 0) return;

  const dragInfo = createDragInfo(state, event); // 建立拖拽信息對象
  logger.debug(
    `Processing drag callbacks: ${state}, pos: (${event.clientX}, ${event.clientY})`
  );

  // 過濾出拖拽相關回調 (ID 以 drag_ 開頭)
  const dragCallbacks = moveCallbacks.filter((callback) =>
    callback.id.includes("drag_")
  );

  dragCallbacks.forEach((registeredCallback) => {
    if (!checkEventFilter(event, registeredCallback)) return;

    // 只處理包裝後的回調
    if (registeredCallback.wrappedCallbacks) {
      try {
        // 注意：這裡我們不再嘗試直接傳遞 dragInfo，因為它與回調函數預期的 MouseEvent | WheelEvent 不匹配
        // 而是在 onDrag 函數內部直接處理了拖拽信息
        registeredCallback.wrappedCallbacks.forEach((callback) => {
          callback(event);
        });
      } catch (error) {
        logger.error(
          `執行拖拽回調 ID:${registeredCallback.id} 時發生錯誤: ${error}`
        );
      }
    }
  });
};

/**
 * 創建拖拽信息對象
 *
 * 此函數負責根據當前鼠標事件和模塊內部追蹤的拖拽狀態，創建包含完整拖拽信息的 DragInfo 對象。
 * DragInfo 包含了拖拽的所有相關信息，包括起始位置、當前位置、移動距離等，這些信息對實現
 * 拖拽功能至關重要，比原始的鼠標事件更易於使用。
 *
 * 計算的關鍵屬性包括：
 * - deltaX/deltaY: 相對於上一次移動的位移
 * - totalDeltaX/totalDeltaY: 相對於起始位置的總位移
 *
 * 重構對此函數無影響，因為它只依賴模塊級別的 _dragState，不涉及回調註冊系統。
 *
 * @param state 拖拽狀態（開始、拖拽中、結束）
 * @param event 鼠標事件
 * @returns DragInfo 拖拽信息對象
 */
const createDragInfo = (state: DRAG_STATE, event: MouseEvent): DragInfo => {
  const drag = _dragState;
  return {
    state,
    startX: drag.startX,
    startY: drag.startY,
    currentX: event.clientX,
    currentY: event.clientY,
    deltaX: event.clientX - drag.lastX,
    deltaY: event.clientY - drag.lastY,
    totalDeltaX: event.clientX - drag.startX,
    totalDeltaY: event.clientY - drag.startY,
    event,
  };
};

/**
 * 執行拖拽回調
 * @param dragInfo 拖拽信息
 * @param callbacks 拖拽回調函數數組
 */

// -------------- 公共 API -------------- 註冊事件

/**
 * 監聽滑鼠移動事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onMousemove(
  callbackConfig: Omit<CallbackConfig, "type">
): MouseListenerHandle {
  // 添加類型屬性
  const configWithType = {
    ...callbackConfig,
    type: MOUSE_EVENT_TYPE.Move,
  } as CallbackConfig;

  // 添加監聽器
  return addEventListeners(configWithType);
}

/**
 * 監聽鼠標點擊事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onClick(
  callbackConfig: Omit<CallbackConfig, "type">
): MouseListenerHandle {
  // 添加類型屬性
  const configWithType = {
    ...callbackConfig,
    type: MOUSE_EVENT_TYPE.Click,
  } as CallbackConfig;

  // 添加監聽器
  return addEventListeners(configWithType);
}

/**
 * 監聽鼠標按下事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onMousedown(
  callbackConfig: Omit<CallbackConfig, "type">
): MouseListenerHandle {
  // 添加類型屬性
  const configWithType = {
    ...callbackConfig,
    type: MOUSE_EVENT_TYPE.Down,
  } as CallbackConfig;

  // 添加監聽器
  return addEventListeners(configWithType);
}

/**
 * 監聽鼠標釋放事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onMouseup(
  callbackConfig: Omit<CallbackConfig, "type">
): MouseListenerHandle {
  // 添加類型屬性
  const configWithType = {
    ...callbackConfig,
    type: MOUSE_EVENT_TYPE.Up,
  } as CallbackConfig;

  // 添加監聽器
  return addEventListeners(configWithType);
}

/**
 * 監聽滾輪事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onWheel(
  callbackConfig: Omit<CallbackConfig, "type">
): MouseListenerHandle {
  // 添加類型屬性
  const configWithType = {
    ...callbackConfig,
    type: MOUSE_EVENT_TYPE.Wheel,
  } as CallbackConfig;

  // 添加監聽器
  return addEventListeners(configWithType);
}

/**
 * 實現拖拽功能
 *
 * 此函數是一個高階 API，用於輕鬆實現拖拽行為。它結合了 mousedown、mousemove 和 mouseup 三個事件，
 * 創建了一個統一的拖拽體驗，並為回調提供豐富的拖拽信息（如起始位置、當前位置、位移量等）。
 *
 * 重構後的變更：
 * - 保持了與原始 API 的兼容性，DragCallbackConfig 不需要添加 type 屬性
 * - 內部使用特殊前綴 "drag_" 標記拖拽回調，使 processDragCallbacks 能識別它們
 * - 在內部使用重構後的視圖函數獲取回調，但對外部 API 無影響
 *
 * 使用例子：
 * ```
 * onDrag({
 *   target: myElement,
 *   preventDefault: true,
 *   callbacks: (dragInfo) => {
 *     if (dragInfo.state === DRAG_STATE.Dragging) {
 *       myElement.style.left = `${dragInfo.currentX}px`;
 *     }
 *   }
 * });
 * ```
 *
 * @param dragCallbackConfig 拖拽配置參數，包含回調函數
 * @returns 監聽器句柄，用於移除拖拽功能
 */
export function onDrag(
  dragCallbackConfig: DragCallbackConfig
): MouseListenerHandle {
  // 獲取回調函數並統一轉換為數組
  let { callbacks: dragCallbacks, ...restConfig } = dragCallbackConfig;
  dragCallbacks = Array.isArray(dragCallbacks)
    ? dragCallbacks
    : [dragCallbacks];

  // 為拖拽創建一個唯一ID
  const dragId = `drag_${crypto.randomUUID()}`;
  const callbackConfig = {
    id: dragId,
    ...restConfig,
  };

  // 鼠標按下處理 - 拖拽開始信號由通用拖拽處理器處理
  const downHandle = onMousedown({
    ...callbackConfig,
    callbacks: () => {},
  });

  // 鼠標移動處理
  const moveHandle = onMousemove({
    ...callbackConfig,
    callbacks: (event) => {
      if (!_dragState.isDragging) return;

      // 創建拖拽信息並執行回調 - 確保直接傳遞拖拽信息對象給回調函數
      const dragInfo = createDragInfo(DRAG_STATE.Dragging, event);

      // 直接在這裡執行回調，確保參數正確
      dragCallbacks.forEach((callback) => {
        try {
          // 明確傳遞 dragInfo 而非 event
          callback(dragInfo);
        } catch (error) {
          logger.error(`執行拖拽回調時發生錯誤: ${error}`);
        }
      });

      // 輸出日誌用於調試
      logger.debug(
        `Drag moving: ${event.clientX}, ${event.clientY}, delta: (${dragInfo.deltaX}, ${dragInfo.deltaY})`
      );

      // 更新最後位置
      _dragState.lastX = event.clientX;
      _dragState.lastY = event.clientY;
    },
  });

  // 鼠標釋放處理
  const upHandle = onMouseup({
    ...callbackConfig,
    callbacks: (event) => {
      if (!_dragState.isDragging) return;

      // 創建拖拽信息並直接執行回調
      const dragInfo = createDragInfo(DRAG_STATE.End, event);

      // 直接在這裡執行回調，確保參數正確
      dragCallbacks.forEach((callback) => {
        try {
          // 明確傳遞 dragInfo 而非 event
          callback(dragInfo);
        } catch (error) {
          logger.error(`執行拖拽結束回調時發生錯誤: ${error}`);
        }
      });

      logger.debug(
        `Drag ended: total movement (${dragInfo.totalDeltaX}, ${dragInfo.totalDeltaY})`
      );
    },
  });

  // 合併所有監聽器的回調
  const registeredCallbacks: WrappedCallbackConfig[] = [
    ...downHandle.registeredCallbacks,
    ...moveHandle.registeredCallbacks,
    ...upHandle.registeredCallbacks,
  ];

  // 返回複合事件處理器
  return Object.assign(
    (): void => {
      // 移除所有註冊的回調
      removeRegisteredCallbackConfigs(registeredCallbacks);
      registeredCallbacks.length = 0;
    },
    { registeredCallbacks }
  );
}

/**
 * 使HTML元素可拖移
 * @param target 要被拖移的目標元素
 * @param dragPoint 觸發拖移的元素（可選，預設為target）
 * @returns 監聽器句柄，可用於移除拖移功能
 */
export function makeDraggable(
  target: HTMLElement,
  dragPoint: HTMLElement = target
): MouseListenerHandle {
  // 記錄初始位置和樣式
  let initialX: number = 0;
  let initialY: number = 0;
  let targetInitialLeft: number = 0;
  let targetInitialTop: number = 0;

  // 確保目標元素可以被定位
  const computedStyle = window.getComputedStyle(target);
  const position = computedStyle.position;
  if (
    position !== "absolute" &&
    position !== "relative" &&
    position !== "fixed"
  ) {
    target.style.position = "relative";
  }

  // 註冊拖拽事件
  return onDrag({
    target: dragPoint,
    preventDefault: true,
    callbacks: (dragInfo: DragInfo) => {
      logger.info("dragging");
      // 拖拽開始時保存初始位置
      if (dragInfo.state === DRAG_STATE.Start) {
        initialX = dragInfo.startX;
        initialY = dragInfo.startY;

        // 獲取目標元素當前位置
        targetInitialLeft = parseInt(target.style.left || "0", 10);
        targetInitialTop = parseInt(target.style.top || "0", 10);
      }

      // 拖拽過程中更新位置
      if (
        dragInfo.state === DRAG_STATE.Dragging ||
        dragInfo.state === DRAG_STATE.End
      ) {
        // 計算新位置
        const newLeft = targetInitialLeft + (dragInfo.currentX - initialX);
        const newTop = targetInitialTop + (dragInfo.currentY - initialY);

        // 更新目標元素樣式
        target.style.left = `${newLeft}px`;
        target.style.top = `${newTop}px`;
      }
    },
  });
}

// -------------- 公共 API -------------- 回傳滑鼠狀態

/**
 * 獲取當前鼠標座標
 */
export function coordinate(): {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
} {
  return {
    clientX: _mousePosition.clientX,
    clientY: _mousePosition.clientY,
    pageX: _mousePosition.pageX,
    pageY: _mousePosition.pageY,
  };
}

/**
 * 獲取當前滑鼠懸停到的所有元素
 * @returns 一個包含當前懸停元素的陣列
 */
export function hoveredElements(): HTMLElement[] {
  return Array.from(_hoverState.hoveredElements);
}

/**
 * 檢測滑鼠是否懸停在指定元素上
 * @param element 要檢查的元素
 * @returns 是否懸停
 */
export function isHovering(element: HTMLElement | string): boolean {
  const targetElement = getElement(element);
  if (!targetElement) return false;

  return Array.from(_hoverState.hoveredElements).some(
    (el) => el === targetElement || targetElement.contains(el)
  );
}

/**
 * 獲取所有註冊的回調，按事件類型組織
 *
 * 此函數是公開的 API，提供外部訪問所有註冊回調的能力，但以只讀方式返回以防止外部修改。
 * 它利用緩存系統優化性能，同時保持與舊版 API 的兼容性，即使內部存儲結構已更改為按 ID 索引。
 *
 * 重構相關說明：
 * 1. 檢查緩存狀態，必要時自動重建緩存
 * 2. 從緩存中按事件類型獲取回調，而非直接從主存儲遍歷
 * 3. 使用 Object.freeze 確保返回的數據是不可變的
 *
 * 注意：此函數維持了與重構前完全一致的返回類型，即使內部實現已改變
 *
 * @returns 所有註冊回調的唯讀副本，按事件類型組織 Map<MOUSE_EVENT_TYPE, readonly WrappedCallbackConfig[]>
 */
export function allCallbacks(): Readonly<
  Map<MOUSE_EVENT_TYPE, readonly WrappedCallbackConfig[]>
> {
  // 確保緩存是最新的
  if (_callbackRegistry.isDirty) {
    rebuildCache();
  }

  const result = new Map<MOUSE_EVENT_TYPE, readonly WrappedCallbackConfig[]>();

  // 直接從緩存中獲取按事件類型組織的數據
  _callbackRegistry.configCache.forEach((callbacks, eventType) => {
    if (callbacks.length > 0) {
      // 創建每個回調的淺拷貝並凍結數組
      const frozenCallbacks = Object.freeze(
        callbacks.map((callback) => Object.freeze({ ...callback }))
      );
      result.set(eventType, frozenCallbacks);
    }
  });

  // 使用 Object.freeze 確保結果 Map 是唯讀的
  return Object.freeze(result);
}

// -------------- 輔助函數 --------------

/**
 * 添加事件監聽器 - 所有監聽函數的共享實現核心
 *
 * 該函數是所有公開註冊函數（如onMousemove、onClick等）的底層實現。
 * 重構後，它直接接受 CallbackConfig 類型，從中獲取事件類型。
 *
 * 重構變更：
 * 1. 函數參數從 Partial<Record<MOUSE_EVENT_TYPE, CallbackConfig>> 改為直接接受 CallbackConfig
 * 2. 不再使用事件類型作為中間映射鍵，直接從 callbackConfig.type 獲取事件類型
 * 3. 使用唯一ID作為回調在 registeredCallbackConfigs 中的鍵
 * 4. 添加回調後立即標記緩存為髒數據，以便下次訪問時重建
 * 5. 返回的 MouseListenerHandle 包含註冊的回調信息，便於後續移除
 *
 * @param callbackConfig 回調配置，必須包含 type 屬性指定事件類型
 * @returns 監聽器句柄，包含用於移除監聽的函數
 */
function addEventListeners(
  callbackConfig: CallbackConfig
): MouseListenerHandle {
  const registeredCallbacks: WrappedCallbackConfig[] = [];

  // 直接從配置中獲取事件類型
  const eventType = callbackConfig.type;

  // 確保配置中包含必要的字段
  if (!callbackConfig.callbacks) {
    logger.error(`為 ${eventType} 註冊的配置缺少 callback 屬性`);
    return Object.assign(() => {}, { registeredCallbacks });
  }

  // 設定 id
  const callbackId = callbackConfig.id || crypto.randomUUID();

  // 將 callbacks 統一轉為數組
  callbackConfig.callbacks = Array.isArray(callbackConfig.callbacks)
    ? callbackConfig.callbacks
    : [callbackConfig.callbacks];

  // 包裝回調函數以支持節流/防抖
  const wrappedCallbacks = wrapCallback(callbackConfig.callbacks, {
    throttle: callbackConfig.throttle,
    debounce: callbackConfig.debounce,
  });

  const wrappedCallbackConfig = {
    ...callbackConfig,
    id: callbackId,
    type: eventType,
    wrappedCallbacks,
  } as WrappedCallbackConfig;

  // 添加到本次配置中
  registeredCallbacks.push(wrappedCallbackConfig);

  // 添加到全局配置中 - 現在以 ID 為鍵
  _callbackRegistry.registeredCallbackConfigs.set(
    callbackId,
    wrappedCallbackConfig
  );

  // 標記緩存為髒數據
  _callbackRegistry.isDirty = true;
  rebuildCache();

  // 為該特定事件類型啟動監聽器（如果尚未啟動）
  if (!_callbackRegistry.configCache.has(eventType)) {
    startListening(eventType);
  }

  logger.debug(`已註冊 ${eventType} 事件監聽器 (ID: ${callbackId})`);

  // 返回清理函數
  return Object.assign(
    (): void => {
      // 移除所有註冊的回調
      removeRegisteredCallbackConfigs(registeredCallbacks);
      registeredCallbacks.length = 0;
    },
    {
      registeredCallbacks: registeredCallbacks,
    }
  );
}

/**
 * 移除特定事件類型的特定回調
 *
 * 此函數是重構後的回調刪除機制，支持直接從以 ID 為鍵的數據結構中刪除回調。
 * 該函數接受與舊 API 相同的參數格式（按事件類型索引的 Map），但內部實現已完全改變。
 *
 * 重構後的工作流程：
 * 1. 接收按事件類型組織的回調配置 Map
 * 2. 遍歷每個回調，根據 ID 直接從 registeredCallbackConfigs 中刪除
 * 3. 跟踪已更改的事件類型，檢查是否需要停止監聽
 * 4. 標記緩存為髒數據，確保下次訪問時重建
 *
 * 優化考量：
 * - 通過 ID 直接刪除操作是 O(1) 時間複雜度
 * - 利用髒標記機制避免不必要的緩存重建
 * - 僅在必要時停止事件監聽，減少性能開銷
 *
 * @param registeredCallbacks 事件類型和對應回調的映射
 * @returns 是否成功移除至少一個回調
 */
export function removeRegisteredCallbackConfigs(
  registeredCallbacks: WrappedCallbackConfig[]
): boolean {
  let removed = false;
  if (!registeredCallbacks) {
    return removed;
  }

  // 需要清理的事件類型
  const eventTypesToCheck = new Set<MOUSE_EVENT_TYPE>();

  // 遍歷所有指定的事件類型
  registeredCallbacks.forEach((registeredCallback) => {
    const eventType = _callbackRegistry.registeredCallbackConfigs.get(
      registeredCallback.id
    )!.type;

    // 遍歷並刪除每個回調
    if (
      _callbackRegistry.registeredCallbackConfigs.has(registeredCallback.id)
    ) {
      _callbackRegistry.registeredCallbackConfigs.delete(registeredCallback.id);
      removed = true;

      // 記錄需要檢查的事件類型
      eventTypesToCheck.add(registeredCallback.type);

      logger.debug(`已移除 ID 為 ${registeredCallback.id} 的鼠標事件回調`);
    }
  });

  // 標記緩存為髒數據
  if (removed) {
    _callbackRegistry.isDirty = true;

    // 重建緩存以便檢查每種事件類型是否還有回調
    rebuildCache();

    // 如果沒有任何回調，停止所有監聽
    if (_callbackRegistry.registeredCallbackConfigs.size === 0) {
      stopListening();
    }
  }

  return removed;
}

/**
 * 清空所有回調並停止監聽
 *
 * 清除操作包括：
 * 1. 清空 registeredCallbackConfigs 中所有註冊的回調
 * 2. 重置快取狀態標記
 * 3. 清空 configCache 快取
 * 4. 停止所有事件監聽
 */
export function clearCallbacks(): void {
  // 清空所有事件配置
  _callbackRegistry.registeredCallbackConfigs.clear();

  // 清空快取
  _callbackRegistry.configCache.clear();

  // 重置髒標記 (不需要重建快取，因為已經清空了)
  _callbackRegistry.isDirty = false;

  // 停止所有事件監聽
  stopListening();
  logger.debug("已清除所有鼠標事件回調與快取");
}

/**
 * 設置低功耗模式
 * @param enable 是否啟用
 * @param frequency 低功耗模式下的更新頻率 (默認 30fps)
 */
export function setLowPowerMode(enable: boolean, frequency: number = 30): void {
  _performance.lowPowerMode = enable;
  if (frequency > 0) {
    _performance.lowPowerFrequency = frequency;
  }
  logger.debug(
    `低功耗模式已${enable ? "啟用" : "停用"}，頻率: ${frequency}fps`
  );
}

/**
 * 創建虛擬鼠標事件 (用於測試)
 * @param type 事件類型
 * @param x X座標
 * @param y Y座標
 * @param options 其他選項
 */
export function createVirtualMouseEvent(
  type: MOUSE_EVENT_TYPE,
  x: number,
  y: number,
  options: {
    buttons?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    target?: HTMLElement | null;
  } = {}
): void {
  // 預設目標為文檔
  const target = options.target || document.documentElement;

  // 創建事件
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    detail: 1,
    screenX: x,
    screenY: y,
    clientX: x,
    clientY: y,
    ctrlKey: options.ctrlKey || false,
    altKey: options.altKey || false,
    shiftKey: options.shiftKey || false,
    button: 0,
    buttons: options.buttons || 0,
    relatedTarget: null,
  });

  // 派發事件
  target.dispatchEvent(event);
  logger.debug(`已創建虛擬鼠標事件 ${type} 在座標 (${x}, ${y})`);
}

// -------------- 初始化 --------------

if (window && !(typeof window === "undefined")) {
  // 註冊特定事件類型的監聽器更新滑鼠位置和Hover資訊
  logger.debug("初始化鼠標事件監聽器");
  window.addEventListener(
    MOUSE_EVENT_TYPE.Move,
    (event) => {
      updateMousePosition(event);
      updateHoverState(event);
    },
    {
      passive: false,
    }
  );
}

/**
 * 根據事件類型獲取註冊的回調配置 - 提供向後兼容的視圖函數
 *
 * 這個視圖函數是重構的核心部分，作為適配層將新的以ID為索引的數據結構轉換為
 * 傳統按事件類型組織的視圖。所有需要按事件類型取回調的內部函數（如processEventsForType）
 * 均透過此函數存取數據，使重構過程對現有代碼影響最小化。
 *
 * 工作原理：
 * 1. 接收一個或多個事件類型
 * 2. 檢查緩存狀態，若髒標記為true則自動觸發重建
 * 3. 從緩存中獲取對應事件類型的所有回調配置
 * 4. 合併多個類型的結果並返回
 *
 * 優化機制：
 * - 使用 configCache 快取按類型索引的結果，避免每次查詢都要遍歷全部回調
 * - 使用 isDirty 標記避免不必要的重建操作
 * - 支持批量查詢多種事件類型，優化多類型場景的性能
 *
 * 與舊數據結構的差異：
 * - 舊：Map<MOUSE_EVENT_TYPE, WrappedCallbackConfig[]> 直接按事件類型存儲
 * - 新：Map<string, WrappedCallbackConfig> 按ID存儲 + 透過此函數提供視圖層
 *
 * @param types 事件類型或類型數組
 * @returns 符合指定事件類型的回調配置數組
 */
function viewRegisteredCallbackConfigs(
  types: MOUSE_EVENT_TYPE | MOUSE_EVENT_TYPE[]
): WrappedCallbackConfig[] {
  const typesArray = Array.isArray(types) ? types : [types];

  // 檢查快取是否需要重建
  if (_callbackRegistry.isDirty) {
    rebuildCache();
  }

  // 合併多種類型的結果
  let result: WrappedCallbackConfig[] = [];
  typesArray.forEach((type) => {
    if (_callbackRegistry.configCache.has(type)) {
      result = [...result, ..._callbackRegistry.configCache.get(type)!];
    }
  });

  return result;
}

/**
 * 重建事件類型到回調配置的快取映射
 *
 * 此函數將主數據結構（以ID為鍵的Map）轉換為按事件類型組織的快取結構，
 * 是重構後實現傳統按事件類型查詢的關鍵機制。
 *
 * 工作原理：
 * 1. 清空現有的類型快取映射
 * 2. 遍歷主存儲 registeredCallbackConfigs (Map<string, WrappedCallbackConfig>)
 * 3. 根據每個回調的 type 屬性組織到 configCache (Map<MOUSE_EVENT_TYPE, WrappedCallbackConfig[]>)
 * 4. 當完成後，重置 isDirty 標記為 false
 *
 * 效能考量：
 * - 重建過程是 O(n) 的時間複雜度，n 為註冊的回調數量
 * - 通過快取與髒標記機制，僅在必要時執行重建，降低頻繁訪問的性能開銷
 * - 使用延遲重建策略，只有在實際需要查詢時才執行重建
 *
 * 觸發重建的情況：
 * 1. 添加新回調時 (通過 addEventListeners 設置 isDirty = true)
 * 2. 刪除回調時 (通過 removeRegisteredCallbackConfigs 設置 isDirty = true)
 * 3. 首次訪問特定事件類型的回調時 (viewRegisteredCallbackConfigs 檢查並觸發)
 * 4. 讀取 allCallbacks() 時
 */
function rebuildCache(): void {
  // 清空現有快取
  _callbackRegistry.configCache.clear();

  // 遍歷所有註冊的回調配置
  _callbackRegistry.registeredCallbackConfigs.forEach((config) => {
    if (config.type) {
      // 初始化該類型的快取數組
      if (!_callbackRegistry.configCache.has(config.type)) {
        _callbackRegistry.configCache.set(config.type, []);
      }

      // 添加到對應類型的快取數組
      _callbackRegistry.configCache.get(config.type)!.push(config);
    }
  });

  // 重置髒標記
  _callbackRegistry.isDirty = false;
}
