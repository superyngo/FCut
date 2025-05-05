import { logger } from "./logger";
import { throttle, debounce } from "lodash-es";

// 流程控制說明:
// 1. on_mousemove, on_click, on_mousedown, on_mouseup, on_wheel 註冊 addEventListeners 事件監聽器, on_drag 會拆成 on_mousemove, on_mousedown, on_mouseup 分別註冊
// 2. addEventListeners 產生 WrappedCallbackConfig 並存入 _mouseState.allRegisteredCallbacks[eventType].push(callbackConfig);
// 3. addEventListeners 啟動 startListening 並回傳 當下監聽器移除句柄, 且可查詢註冊事件
// 4. startListening 將 handleMouseEvent 註冊到 eventListner 並啟動 startAnimationLoop
// 5. handleMouseEvent 更新滑鼠狀態，將 event 存入 _mouseState.pendingEvents[eventType]

// -------------- 類型定義 --------------

// 鼠標事件類型
export enum MouseEventType {
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
enum DragState {
  Idle = "idle",
  Start = "start",
  Dragging = "dragging",
  End = "end",
}

// 拖拽信息
type DragInfo = {
  state: DragState;
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
  passive?: boolean; // 是否為被動監聽器
  capture?: boolean; // 是否在捕獲階段監聽
  once?: boolean; // 是否只觸發一次
  filter?: (event: MouseEvent | WheelEvent) => boolean; // 事件過濾函數
  callbacks: MouseCallbackFunction | MouseCallbackFunction[]; // 鼠標回調函數或回調函數數組
};

// 回調配置
type WrappedCallbackConfig = Omit<CallbackConfig, "callbakcs"> & {
  id: string; // 回調ID
  callbacks: MouseCallbackFunction[]; // 原始回調函數統一轉數組
  wrappedCallbacks?: MouseCallbackFunction[]; // 包裝後的回調數組
};

type RegisteredCallback = Map<MouseEventType, WrappedCallbackConfig>;

// 鼠標事件監聽器句柄
type MouseListenerHandle = (() => void) & {
  registeredCallbacks: RegisteredCallback;
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

const _callbackRegistry = {
  allRegisteredCallbacks: new Map<MouseEventType, WrappedCallbackConfig[]>(),
  registeredEvents: new Set<MouseEventType>(),
  pendingEvents: new Map<MouseEventType, (MouseEvent | WheelEvent)[]>(),
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
  // 0: No button, 1: Left, 2: Right, 4: Middle
  _mouseButtons.left = (event.buttons & 1) === 1;
  _mouseButtons.right = (event.buttons & 2) === 2;
  _mouseButtons.middle = (event.buttons & 4) === 4;
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
    // 更新滑鼠按鍵狀態
    if (event.type === MouseEventType.Click) {
      updateMouseButtons(event);
    }

    // 處理拖拽狀態
    updateDragState(event);
  }

  // 獲取事件類型並確保事件隊列初始化
  const eventType = event.type as MouseEventType;
  if (!_callbackRegistry.pendingEvents.has(eventType)) {
    _callbackRegistry.pendingEvents.set(eventType, []);
  }

  // 添加到待處理事件隊列
  _callbackRegistry.pendingEvents.get(eventType)!.push(event);
};

// 更新拖拽狀態
const updateDragState = (event: MouseEvent) => {
  const drag = _dragState;

  // 處理拖拽開始
  if (
    event.type === MouseEventType.Down &&
    _mouseButtons.left &&
    !drag.isDragging
  ) {
    drag.isDragging = true;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    // 處理所有拖拽回調 - 開始狀態
    processDragCallbacks(event, DragState.Start);
    return;
  }

  // 如果未在拖拽中，直接返回
  if (!drag.isDragging) return;

  // 處理拖拽移動
  if (event.type === MouseEventType.Move) {
    // 處理所有拖拽回調 - 拖拽狀態
    processDragCallbacks(event, DragState.Dragging);

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    return;
  }

  // 處理拖拽結束
  if (event.type === MouseEventType.Up) {
    // 處理所有拖拽回調 - 結束狀態
    processDragCallbacks(event, DragState.End);

    // 重置狀態
    drag.isDragging = false;
    drag.startX = 0;
    drag.startY = 0;
    drag.lastX = 0;
    drag.lastY = 0;
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

// 使用 requestAnimationFrame 的處理循環 最核心執行所有註冊事件的地方
const startAnimationLoop = () => {
  const processFrame = (timestamp: number) => {
    // 更新幀速率統計
    updateFrameStats(timestamp);

    // 處理所有類型的待處理事件
    _callbackRegistry.pendingEvents.forEach((events, eventType) => {
      // 檢查是否有註冊的回調
      const callbacks = _callbackRegistry.allRegisteredCallbacks.get(eventType);
      if (!callbacks || callbacks.length === 0) {
        events.length = 0;
        return;
      }

      // 優化移動事件處理：只處理最後一個移動事件
      if (eventType === MouseEventType.Move && events.length > 1) {
        const lastEvent = events[events.length - 1];
        events.length = 0;
        events.push(lastEvent);
      }

      // 處理此事件類型的所有事件
      processEventsForType(events, eventType);

      // 清空處理過的事件
      events.length = 0;
    });

    // 安排下一幀
    scheduleNextFrame(processFrame);
  };

  _performance.animationFrameId = requestAnimationFrame(processFrame);
};

// 處理特定類型的事件
const processEventsForType = (
  events: (MouseEvent | WheelEvent)[],
  eventType: MouseEventType
) => {
  const callbacks = _callbackRegistry.allRegisteredCallbacks.get(eventType);
  if (!callbacks) return;

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
          removeOneTimeCallback(eventType, registeredCallback);
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
const removeOneTimeCallback = (
  eventType: MouseEventType,
  callbackToRemove: WrappedCallbackConfig
) => {
  const callbacks = _callbackRegistry.allRegisteredCallbacks.get(eventType);
  if (!callbacks) return;

  _callbackRegistry.allRegisteredCallbacks.set(
    eventType,
    callbacks.filter((c) => c !== callbackToRemove)
  );
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

// 開始全局事件監聽
const startListening = (eventType: MouseEventType) => {
  if (typeof window === "undefined") return;
  if (_callbackRegistry.registeredEvents.has(eventType)) return;

  // 註冊特定事件類型的監聽器
  window.addEventListener(eventType, handleMouseEvent as EventListener, {
    passive: false,
  });

  // 將該事件類型添加到註冊集合中
  _callbackRegistry.registeredEvents.add(eventType);
  logger.debug(`已為 ${eventType} 事件添加全局監聽器`);

  // 啟動動畫循環 (如果未啟動)
  if (!_performance.animationFrameId) {
    startAnimationLoop();
  }
};

// 停止全局事件監聽
const stopListening = (eventType?: MouseEventType) => {
  if (typeof window === "undefined") return;

  // 如果提供了特定事件類型，只移除該類型
  if (eventType) {
    if (!_callbackRegistry.registeredEvents.has(eventType)) return;

    window.removeEventListener(eventType, handleMouseEvent as EventListener);
    _callbackRegistry.registeredEvents.delete(eventType);
    logger.debug(`已移除 ${eventType} 的全局事件監聽器`);

    // 如果還有其他事件註冊，提前返回
    if (_callbackRegistry.registeredEvents.size > 0) return;
  } else {
    // 如果沒有註冊的監聽器，直接返回
    if (_callbackRegistry.registeredEvents.size === 0) return;

    // 移除所有已註冊的事件監聽器
    _callbackRegistry.registeredEvents.forEach((eventType) => {
      window.removeEventListener(eventType, handleMouseEvent as EventListener);
    });

    _callbackRegistry.registeredEvents.clear();
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
// 處理拖拽回調
const processDragCallbacks = (event: MouseEvent, state: DragState) => {
  if (!_callbackRegistry.allRegisteredCallbacks.get(MouseEventType.Move))
    return;

  const dragInfo = createDragInfo(state, event);

  // 找出專門用於拖拽的回調
  _callbackRegistry.allRegisteredCallbacks
    .get(MouseEventType.Move)
    ?.forEach((registeredCallback) => {
      if (
        !checkEventFilter(event, registeredCallback) ||
        !registeredCallback.id.includes("drag_")
      )
        return;

      // 使用 executeDragCallbacks 執行回調，確保錯誤處理一致性
      if (registeredCallback.wrappedCallbacks) {
        // 將原始回調包裝成拖拽回調，並傳遞 dragInfo
        const dragCallbacks = registeredCallback.wrappedCallbacks.map(
          (wrappedCallback) => (dragInfo: DragInfo) => wrappedCallback(event)
        );
        executeDragCallbacks(dragInfo, dragCallbacks);
      }
    });
};

/**
 * 創建拖拽信息對象
 * @param state 拖拽狀態
 * @param event 鼠標事件
 * @returns DragInfo 拖拽信息對象
 */
const createDragInfo = (state: DragState, event: MouseEvent): DragInfo => {
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
const executeDragCallbacks = (
  dragInfo: DragInfo,
  callbacks: DragCallbackFunction[]
) => {
  callbacks.forEach((callback) => {
    try {
      callback(dragInfo);
    } catch (error) {
      logger.error(`執行拖拽回調時發生錯誤: ${error}`);
    }
  });
};

// -------------- 公共 API -------------- 註冊事件

/**
 * 監聽滑鼠移動事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function on_mousemove(
  callbackConfig: CallbackConfig
): MouseListenerHandle {
  // 添加監聽器
  return addEventListeners({
    [MouseEventType.Move]: callbackConfig,
  });
}

/**
 * 監聽鼠標點擊事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function on_click(callbackConfig: CallbackConfig): MouseListenerHandle {
  // 添加監聽器
  return addEventListeners({
    [MouseEventType.Click]: callbackConfig,
  });
}

/**
 * 監聽鼠標按下事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function on_mousedown(
  callbackConfig: CallbackConfig
): MouseListenerHandle {
  // 添加監聽器
  return addEventListeners({
    [MouseEventType.Down]: callbackConfig,
  });
}

/**
 * 監聽鼠標釋放事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function on_mouseup(
  callbackConfig: CallbackConfig
): MouseListenerHandle {
  // 添加監聽器
  return addEventListeners({
    [MouseEventType.Up]: callbackConfig,
  });
}

/**
 * 監聽滾輪事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function on_wheel(callbackConfig: CallbackConfig): MouseListenerHandle {
  // 添加監聽器
  return addEventListeners({
    [MouseEventType.Wheel]: callbackConfig,
  });
}

/**
 * 實現拖拽功能
 * @param dragCallbackConfig 拖拽配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function on_drag(
  dragCallbackConfig: DragCallbackConfig
): MouseListenerHandle {
  // 獲取回調函數並統一轉換為數組
  let { callbacks: dragCallbacks, ...restConfig } = dragCallbackConfig;
  dragCallbacks = Array.isArray(dragCallbacks)
    ? dragCallbacks
    : [dragCallbacks];

  // 為拖拽創建一個唯一ID
  const callbackConfig = {
    ...restConfig,
    id: `drag_${crypto.randomUUID()}`,
  };

  // 鼠標按下處理 - 拖拽開始信號由通用拖拽處理器處理
  const downHandle = on_mousedown({
    ...callbackConfig,
    callbacks: () => {},
  });

  // 鼠標移動處理
  const moveHandle = on_mousemove({
    ...callbackConfig,
    callbacks: (event) => {
      if (!_dragState.isDragging) return;

      // 創建拖拽信息並執行回調
      const dragInfo = createDragInfo(DragState.Dragging, event);
      executeDragCallbacks(dragInfo, dragCallbacks);

      // 更新最後位置
      _dragState.lastX = event.clientX;
      _dragState.lastY = event.clientY;
    },
  });

  // 鼠標釋放處理
  const upHandle = on_mouseup({
    ...callbackConfig,
    callbacks: (event) => {
      if (!_dragState.isDragging) return;

      // 創建拖拽信息並執行回調
      const dragInfo = createDragInfo(DragState.End, event);
      executeDragCallbacks(dragInfo, dragCallbacks);
    },
  });

  // 合併所有監聽器的回調
  const registeredCallbacks: RegisteredCallback = new Map([
    ...downHandle.registeredCallbacks,
    ...moveHandle.registeredCallbacks,
    ...upHandle.registeredCallbacks,
  ]);

  // 返回複合事件處理器
  return Object.assign(
    (): void => {
      // 移除所有註冊的回調
      removeRegisteredCallbacks(registeredCallbacks);
      registeredCallbacks.clear();
    },
    { registeredCallbacks }
  );
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
export function hovered_elements(): HTMLElement[] {
  return Array.from(_hoverState.hoveredElements);
}

/**
 * 檢測滑鼠是否懸停在指定元素上
 * @param element 要檢查的元素
 * @returns 是否懸停
 */
export function is_hovering(element: HTMLElement | string): boolean {
  const targetElement = getElement(element);
  if (!targetElement) return false;

  return Array.from(_hoverState.hoveredElements).some(
    (el) => el === targetElement || targetElement.contains(el)
  );
}

/**
 * 獲取所有註冊的回調
 * @returns 所有註冊回調的唯讀副本 Map<MouseEventType, WrappedCallbackConfig[]>
 */
export function allCallbacks(): Readonly<
  Map<MouseEventType, readonly WrappedCallbackConfig[]>
> {
  const result = new Map<MouseEventType, readonly WrappedCallbackConfig[]>();

  // 遍歷所有事件類型
  Object.values(MouseEventType).forEach((eventType) => {
    if (!_callbackRegistry.allRegisteredCallbacks.has(eventType)) return;

    // 為每個事件類型創建回調數組的深拷貝
    const callbacks = _callbackRegistry.allRegisteredCallbacks.get(eventType);
    if (callbacks && callbacks.length > 0) {
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

// 添加事件監聽器（所有監聽函數的共享實現）
function addEventListeners(
  eventType_callbacks_config: Partial<Record<MouseEventType, CallbackConfig>>
): MouseListenerHandle {
  const registeredCallbacks: RegisteredCallback = new Map();

  // 遍歷所有提供的事件類型和回調配置
  Object.entries(eventType_callbacks_config).forEach(
    ([eventTypeStr, callbackConfig]) => {
      // 設定事件類型
      const eventType = eventTypeStr as MouseEventType;

      // 確保配置中包含必要的字段
      if (!callbackConfig.callbacks) {
        logger.error(`為 ${eventType} 註冊的配置缺少 callback 屬性`);
        return;
      }

      // 設定 id
      callbackConfig.id = callbackConfig.id || crypto.randomUUID();

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
        wrappedCallbacks,
      } as WrappedCallbackConfig;

      // 添加到本次配置中
      registeredCallbacks.set(eventType, wrappedCallbackConfig);

      // 初始化並添加到全局配置中
      if (!_callbackRegistry.allRegisteredCallbacks.has(eventType)) {
        _callbackRegistry.allRegisteredCallbacks.set(eventType, []);
      }
      _callbackRegistry.allRegisteredCallbacks
        .get(eventType)
        ?.push(wrappedCallbackConfig);

      // 為該特定事件類型啟動監聽器（如果尚未啟動）
      if (!_callbackRegistry.registeredEvents.has(eventType)) {
        startListening(eventType);
      }

      logger.debug(
        `已註冊 ${eventType} 事件監聽器 (ID: ${wrappedCallbackConfig.id})`
      );
    }
  );

  // 返回清理函數
  return Object.assign(
    (): void => {
      // 移除所有註冊的回調
      removeRegisteredCallbacks(registeredCallbacks);
      registeredCallbacks.clear();
    },
    {
      registeredCallbacks: registeredCallbacks,
    }
  );
}

/**
 * 移除特定事件類型的特定回調
 * @param obj 事件類型和對應回調ID的映射
 * @returns 是否成功移除至少一個回調
 */
export function removeRegisteredCallbacks(
  registeredCallbacks: Map<
    MouseEventType,
    WrappedCallbackConfig | WrappedCallbackConfig[]
  >
): boolean {
  let removed = false;
  if (!registeredCallbacks || !_callbackRegistry.allRegisteredCallbacks)
    return removed;

  // 遍歷所有指定的事件類型
  registeredCallbacks.forEach((WrappedCallbackConfig, eventTypeStr) => {
    const eventType = eventTypeStr as MouseEventType;
    if (!_callbackRegistry.allRegisteredCallbacks.has(eventType)) return;

    const WrappedCallbackConfigs = Array.isArray(WrappedCallbackConfig)
      ? WrappedCallbackConfig
      : [WrappedCallbackConfig];

    const initialLength =
      _callbackRegistry.allRegisteredCallbacks.get(eventType)!.length;

    const updatedRegisteredCallbacks = _callbackRegistry.allRegisteredCallbacks
      .get(eventType)!
      .filter(
        (registeredCallback) =>
          !WrappedCallbackConfigs.includes(registeredCallback)
      );

    _callbackRegistry.allRegisteredCallbacks.set(
      eventType,
      updatedRegisteredCallbacks
    );

    if (updatedRegisteredCallbacks.length < initialLength) {
      removed = true;
      logger.debug(
        `已移除事件類型 ${eventType} 中ID為 ${WrappedCallbackConfigs.map(
          (registeredCallback) => registeredCallback.id
        ).join(", ")} 的鼠標事件回調`
      );

      // 標記此事件類型需要檢查是否還有其他回調
    }

    // 如果此事件類型的所有回調都被移除，清理事件監聽器
    if (updatedRegisteredCallbacks.length === 0) {
      _callbackRegistry.allRegisteredCallbacks.delete(eventType);

      // 移除該事件類型的監聽器
      if (_callbackRegistry.registeredEvents.has(eventType)) {
        stopListening(eventType);
      }
    }
  });

  // 如果沒有任何回調，停止所有監聽
  if (_callbackRegistry.allRegisteredCallbacks.size === 0) {
    stopListening();
  }

  return removed;
}

/**
 * 清空所有回調並停止監聽
 */
export function clearCallbacks(): void {
  // 清空所有事件配置
  _callbackRegistry.allRegisteredCallbacks.clear();

  // 停止所有事件監聽
  stopListening();
  logger.debug("已清除所有鼠標事件回調");
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
  type: MouseEventType,
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
  // 註冊特定事件類型的監聽器
  logger.debug("初始化鼠標事件監聽器");
  window.addEventListener(
    MouseEventType.Move,
    (event) => {
      updateMousePosition(event);
      updateHoverState(event);
    },
    {
      passive: false,
    }
  );
}
