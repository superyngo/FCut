import { logger } from "./logger";
import { throttle, debounce } from "lodash-es";

// 流程控制說明:
// 1. on_mousemove, on_click, on_mousedown, on_mouseup, on_wheel 註冊 addEventListeners 事件監聽器, on_drag 會拆成 on_mousemove, on_mousedown, on_mouseup 分別註冊
// 2. addEventListeners 產生 WrappedCallbackConfig 並存入 _mouseState.registeredCallbacks[eventType].push(callbackConfig);
// 3. addEventListeners 啟動 startListening 並回傳 當下監聽器移除句柄, 且可查詢註冊事件
// 4. startListening 將 handleMouseEvent 註冊到所有類型的 event listner 並啟動 startAnimationLoop
// 5. handleMouseEvent 更新滑鼠狀態 (updateMousePosition, parseMouseButtons, updateDragState, updateHoverState)

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
export enum DragState {
  Idle = "idle",
  Start = "start",
  Dragging = "dragging",
  End = "end",
}

// 基本鼠標回調函數
export type MouseCallbackFunction = (event: MouseEvent | WheelEvent) => any;

// 拖拽回調函數
export type DragCallbackFunction = (info: DragInfo) => any;

// 拖拽信息
export interface DragInfo {
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
}

export type CallbackConfig = {
  id?: string; // 唯一標識符
  throttle?: number; // 節流間隔(ms)
  debounce?: number; // 防抖間隔(ms)
  target?: HTMLElement | string | null; // 目標元素或選擇器
  passive?: boolean; // 是否為被動監聽器
  capture?: boolean; // 是否在捕獲階段監聽
  preventDefault?: boolean; // 是否阻止默認行為
  once?: boolean; // 是否只觸發一次
  filter?: (event: MouseEvent | WheelEvent) => boolean; // 事件過濾函數
};

// 回調配置
export type WrappedCallbackConfig = {
  id: string; // 回調ID
  type: MouseEventType; // 事件類型
  callback: MouseCallbackFunction; // 原始回調
  wrappedCallback?: MouseCallbackFunction; // 包裝後的回調
} & CallbackConfig; // 擴展的回調配置

// 鼠標事件監聽器句柄
export type MouseListenerHandle = (() => void) & {
  registeredCallbacks: Map<string, WrappedCallbackConfig>;
};

// -------------- 內部狀態 --------------

// 模塊級內部狀態
const _mouseState = {
  // 鼠標位置
  position: {
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    movementX: 0,
    movementY: 0,
  },

  // 按鍵狀態
  buttons: {
    left: false,
    right: false,
    middle: false,
  },

  // 拖拽狀態
  drag: {
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  },

  // 事件回調管理
  registeredCallbacks: {} as Record<MouseEventType, WrappedCallbackConfig[]>,

  // 已註冊且有已啟動監聽的事件類型集合
  registeredEvents: new Set<MouseEventType>(),

  // 性能控制
  performance: {
    lowPowerMode: false, // 低功耗模式
    updateFrequency: 0, // 當前更新頻率
    normalFrequency: 0, // 正常頻率(自動檢測)
    lowPowerFrequency: 30, // 低功耗模式下的頻率
    lastFrameTime: 0, // 上一幀時間
    frameCount: 0, // 幀計數
    frameTimeAccumulator: 0, // 幀時間累加器
  },

  // 動畫幀
  animationFrameId: 0,

  // 事件存儲
  pendingEvents: new Map<MouseEventType, (MouseEvent | WheelEvent)[]>(),

  // 懸停檢測
  hoveredElements: new Set<HTMLElement>(),
};

// -------------- 工具函數 --------------

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

// 更新 4 狀態
// 解析鼠標按鍵狀態
const parseMouseButtons = (event: MouseEvent): void => {
  // 0: No button, 1: Left, 2: Right, 4: Middle
  _mouseState.buttons.left = (event.buttons & 1) === 1;
  _mouseState.buttons.right = (event.buttons & 2) === 2;
  _mouseState.buttons.middle = (event.buttons & 4) === 4;
};

// 更新滑鼠位置
const updateMousePosition = (event: MouseEvent): void => {
  _mouseState.position.clientX = event.clientX;
  _mouseState.position.clientY = event.clientY;
  _mouseState.position.pageX = event.pageX;
  _mouseState.position.pageY = event.pageY;
  _mouseState.position.screenX = event.screenX;
  _mouseState.position.screenY = event.screenY;
  _mouseState.position.movementX = event.movementX;
  _mouseState.position.movementY = event.movementY;
};

// 處理拖拽回調
const processDragCallbacks = (event: MouseEvent, state: DragState) => {
  if (!_mouseState.registeredCallbacks[MouseEventType.Move]) return;

  const drag = _mouseState.drag;
  const dragInfo: DragInfo = {
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

  // 找出專門用於拖拽的回調
  _mouseState.registeredCallbacks[MouseEventType.Move].forEach(
    (registeredCallback) => {
      if (
        !checkEventFilter(event, registeredCallback) ||
        !registeredCallback.id.includes("drag_")
      )
        return;

      try {
        registeredCallback.wrappedCallback!(event); // 拖拽處理在自定義回調中
      } catch (error) {
        logger.error(`執行拖拽回調時發生錯誤: ${error}`);
      }
    }
  );
};

// 更新拖拽狀態
const updateDragState = (event: MouseEvent) => {
  const drag = _mouseState.drag;

  // 鼠標按下開始拖拽
  if (
    event.type === MouseEventType.Down &&
    _mouseState.buttons.left &&
    !drag.isDragging
  ) {
    drag.isDragging = true;
    drag.startX = event.clientX;
    drag.startY = event.clientY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    // 處理所有拖拽回調 - 開始狀態
    processDragCallbacks(event, DragState.Start);
  }
  // 鼠標移動過程中的拖拽
  else if (event.type === MouseEventType.Move && drag.isDragging) {
    // 處理所有拖拽回調 - 拖拽狀態
    processDragCallbacks(event, DragState.Dragging);

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  }
  // 鼠標釋放結束拖拽
  else if (event.type === MouseEventType.Up && drag.isDragging) {
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

// 更新懸停檢測
const updateHoverState = (event: MouseEvent) => {
  if (event.type !== MouseEventType.Move) return;

  // 檢查當前懸停的元素
  const hoveredElements = document.elementsFromPoint(
    event.clientX,
    event.clientY
  ) as HTMLElement[];
  const newHoveredSet = new Set(hoveredElements);

  // 找出新增的懸停元素
  const newHovered = hoveredElements.filter(
    (el) => !_mouseState.hoveredElements.has(el)
  );

  // 找出離開懸停的元素
  const leftHovered = Array.from(_mouseState.hoveredElements).filter(
    (el) => !newHoveredSet.has(el)
  );

  // 更新懸停集合
  _mouseState.hoveredElements = newHoveredSet;

  // 處理懸停元素的進入和離開事件
  // (這裡的具體處理可以根據需求擴展)
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

// -------------- 事件處理器 --------------

// 通用滑鼠事件處理程序
const handleMouseEvent = (event: MouseEvent | WheelEvent) => {
  // 更新按鍵和位置狀態
  if (event instanceof MouseEvent) {
    updateMousePosition(event);
    parseMouseButtons(event);
  }

  // 獲取事件類型
  const eventType = event.type as MouseEventType;

  // 初始化並添加到待處理事件隊列
  if (!_mouseState.pendingEvents.has(eventType)) {
    _mouseState.pendingEvents.set(eventType, []);
  }
  _mouseState.pendingEvents.get(eventType)!.push(event);

  // 更新拖拽狀態
  updateDragState(event as MouseEvent);

  // 更新懸停檢測
  updateHoverState(event as MouseEvent);
};

// -------------- 核心功能 --------------

// 更新幀速率計算
const updateFrameStats = (timestamp: number): void => {
  const perf = _mouseState.performance;

  if (perf.lastFrameTime === 0) {
    perf.lastFrameTime = timestamp;
    return;
  }

  const deltaTime = timestamp - perf.lastFrameTime;
  perf.lastFrameTime = timestamp;

  // 累積時間和幀數以計算平均頻率
  perf.frameTimeAccumulator += deltaTime;
  perf.frameCount++;

  // 每秒更新一次計算的幀率
  if (perf.frameTimeAccumulator < 1000) return;

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
    _mouseState.pendingEvents.forEach((events, eventType) => {
      // 跳過沒有回調的事件類型
      if (
        !_mouseState.registeredCallbacks[eventType] ||
        _mouseState.registeredCallbacks[eventType].length === 0
      ) {
        events.length = 0;
        return;
      }

      // 取出最後一個事件進行處理（優化性能）
      if (eventType === MouseEventType.Move && events.length > 1) {
        const lastEvent = events[events.length - 1];
        events.length = 0;
        events.push(lastEvent);
      }

      // 處理所有待處理事件
      events.forEach((event) => {
        _mouseState.registeredCallbacks[eventType].forEach(
          (registeredCallback) => {
            // 檢查事件是否符合過濾條件
            if (checkEventFilter(event, registeredCallback)) {
              try {
                // 應用事件設置
                if (registeredCallback.preventDefault) {
                  event.preventDefault();
                }

                // 執行回調
                if (registeredCallback.wrappedCallback) {
                  registeredCallback.wrappedCallback(event);
                }

                // 如果是一次性回調，在稍後移除
                if (registeredCallback.once) {
                  // 從配置列表中移除
                  _mouseState.registeredCallbacks[eventType] =
                    _mouseState.registeredCallbacks[eventType].filter(
                      (c) => c !== registeredCallback
                    );
                }
              } catch (error) {
                logger.error(
                  `執行鼠標事件回調 ID:${registeredCallback.id} 時發生錯誤: ${error}`
                );
              }
            }
          }
        );
      });

      // 清空處理過的事件
      events.length = 0;
    });

    // 繼續下一幀 (根據性能模式決定頻率)
    if (
      _mouseState.performance.lowPowerMode &&
      _mouseState.performance.updateFrequency > 0
    ) {
      // 在低功耗模式下，使用 setTimeout 代替每一幀的 requestAnimationFrame
      setTimeout(() => {
        _mouseState.animationFrameId = requestAnimationFrame(processFrame);
      }, 1000 / _mouseState.performance.lowPowerFrequency);
    } else {
      _mouseState.animationFrameId = requestAnimationFrame(processFrame);
    }
  };

  _mouseState.animationFrameId = requestAnimationFrame(processFrame);
};

// 開始全局事件監聽
const startListening = (eventType: MouseEventType) => {
  if (typeof window === "undefined") return;
  if (_mouseState.registeredEvents.has(eventType)) return;

  // 註冊特定事件類型的監聽器
  window.addEventListener(eventType, handleMouseEvent as EventListener, {
    passive: false,
  });

  // 將該事件類型添加到註冊集合中
  _mouseState.registeredEvents.add(eventType);
  logger.debug(`已為 ${eventType} 事件添加全局監聽器`);

  // 啟動動畫循環 (如果未啟動)
  if (!_mouseState.animationFrameId) {
    startAnimationLoop();
  }
};

// 停止全局事件監聽
const stopListening = (eventType?: MouseEventType) => {
  if (typeof window === "undefined") return;

  // 如果提供了特定事件類型，只移除該類型
  if (eventType) {
    if (!_mouseState.registeredEvents.has(eventType)) return;

    window.removeEventListener(eventType, handleMouseEvent as EventListener);
    _mouseState.registeredEvents.delete(eventType);
    logger.debug(`已移除 ${eventType} 的全局事件監聽器`);

    // 如果還有其他事件註冊，提前返回
    if (_mouseState.registeredEvents.size > 0) return;
  } else {
    // 如果沒有註冊的監聽器，直接返回
    if (_mouseState.registeredEvents.size === 0) return;

    // 移除所有已註冊的事件監聽器
    _mouseState.registeredEvents.forEach((type) => {
      window.removeEventListener(type, handleMouseEvent as EventListener);
    });

    _mouseState.registeredEvents.clear();
    logger.debug("全局鼠標事件監聽器已停止");
  }

  // 停止動畫循環（此時已確認沒有任何註冊事件）
  if (_mouseState.animationFrameId) {
    cancelAnimationFrame(_mouseState.animationFrameId);
    _mouseState.animationFrameId = 0;
  }

  // 清理狀態
  _mouseState.pendingEvents.clear();
  _mouseState.hoveredElements.clear();
};

// -------------- 公共 API --------------

/**
 * 監聽滑鼠移動事件
 * @param callback 回調函數或回調函數數組
 * @param options 配置選項
 * @returns 監聽器句柄
 */
export function on_mousemove(
  callback: MouseCallbackFunction | MouseCallbackFunction[] = [],
  options: CallbackConfig = {}
): MouseListenerHandle {
  // 初始化此類型事件的存儲
  if (!_mouseState.registeredCallbacks[MouseEventType.Move]) {
    _mouseState.registeredCallbacks[MouseEventType.Move] = [];
  }

  // 添加監聽器
  return addEventListeners(MouseEventType.Move, callback, options);
}

/**
 * 監聽鼠標點擊事件
 */
export function on_click(
  callback: MouseCallbackFunction | MouseCallbackFunction[] = [],
  options: CallbackConfig = {}
): MouseListenerHandle {
  // 初始化此類型事件的存儲
  if (!_mouseState.registeredCallbacks[MouseEventType.Click]) {
    _mouseState.registeredCallbacks[MouseEventType.Click] = [];
  }

  // 添加監聽器
  return addEventListeners(MouseEventType.Click, callback, options);
}

/**
 * 監聽鼠標按下事件
 */
export function on_mousedown(
  callback: MouseCallbackFunction | MouseCallbackFunction[] = [],
  options: CallbackConfig = {}
): MouseListenerHandle {
  // 初始化此類型事件的存儲
  if (!_mouseState.registeredCallbacks[MouseEventType.Down]) {
    _mouseState.registeredCallbacks[MouseEventType.Down] = [];
  }

  // 添加監聽器
  return addEventListeners(MouseEventType.Down, callback, options);
}

/**
 * 監聽鼠標釋放事件
 */
export function on_mouseup(
  callback: MouseCallbackFunction | MouseCallbackFunction[] = [],
  options: CallbackConfig = {}
): MouseListenerHandle {
  // 初始化此類型事件的存儲
  if (!_mouseState.registeredCallbacks[MouseEventType.Up]) {
    _mouseState.registeredCallbacks[MouseEventType.Up] = [];
  }

  // 添加監聽器
  return addEventListeners(MouseEventType.Up, callback, options);
}

/**
 * 監聽滾輪事件
 */
export function on_wheel(
  callback: MouseCallbackFunction | MouseCallbackFunction[] = [],
  options: CallbackConfig = {}
): MouseListenerHandle {
  // 初始化此類型事件的存儲
  if (!_mouseState.registeredCallbacks[MouseEventType.Wheel]) {
    _mouseState.registeredCallbacks[MouseEventType.Wheel] = [];
  }

  // 添加監聽器
  return addEventListeners(MouseEventType.Wheel, callback, options);
}

/**
 * 實現拖拽功能
 */
export function on_drag(
  callback: DragCallbackFunction,
  options: {
    target?: HTMLElement | string;
    throttle?: number;
    debounce?: number;
    preventDefault?: boolean;
  } = {}
): MouseListenerHandle {
  // 創建三個事件監聽器來處理拖拽的不同階段
  const callbacks = new Map<string, WrappedCallbackConfig>();

  // 為拖拽創建一個唯一ID
  const dragId = `drag_${crypto.randomUUID()}`;

  // 鼠標按下處理
  const downHandle = on_mousedown(
    (event) => {
      if (options.preventDefault) event.preventDefault();
      // 拖拽開始信號由通用拖拽處理器處理
    },
    { id: dragId, target: options.target }
  );

  // 鼠標移動處理
  const moveHandle = on_mousemove(
    (event) => {
      // 只有當拖拽狀態為真時才處理
      if (!_mouseState.drag.isDragging) return;

      // 轉換為拖拽信息
      const dragInfo: DragInfo = {
        state: DragState.Dragging,
        startX: _mouseState.drag.startX,
        startY: _mouseState.drag.startY,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX: event.clientX - _mouseState.drag.lastX,
        deltaY: event.clientY - _mouseState.drag.lastY,
        totalDeltaX: event.clientX - _mouseState.drag.startX,
        totalDeltaY: event.clientY - _mouseState.drag.startY,
        event,
      };

      // 調用拖拽回調
      callback(dragInfo);

      // 更新最後位置
      _mouseState.drag.lastX = event.clientX;
      _mouseState.drag.lastY = event.clientY;
    },
    { id: dragId, throttle: options.throttle, debounce: options.debounce }
  );

  // 鼠標釋放處理
  const upHandle = on_mouseup(
    (event) => {
      if (!_mouseState.drag.isDragging) return;

      // 轉換為拖拽信息
      const dragInfo: DragInfo = {
        state: DragState.End,
        startX: _mouseState.drag.startX,
        startY: _mouseState.drag.startY,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX: event.clientX - _mouseState.drag.lastX,
        deltaY: event.clientY - _mouseState.drag.lastY,
        totalDeltaX: event.clientX - _mouseState.drag.startX,
        totalDeltaY: event.clientY - _mouseState.drag.startY,
        event,
      };

      // 調用拖拽回調
      callback(dragInfo);
    },
    { id: dragId }
  );

  // 合併所有監聽器的回調
  const registeredCallbacks = new Map([
    ...downHandle.registeredCallbacks,
    ...moveHandle.registeredCallbacks,
    ...upHandle.registeredCallbacks,
  ]);

  // 返回複合事件處理器
  return Object.assign(
    (): void => {
      downHandle();
      moveHandle();
      upHandle();
    },
    // 返回所有註冊的回調
    { registeredCallbacks }
  );
}

/**
 * 檢測滑鼠是否懸停在指定元素上
 * @param element 要檢查的元素
 * @returns 是否懸停
 */
export function is_hovering(element: HTMLElement | string): boolean {
  const targetElement = getElement(element);
  if (!targetElement) return false;

  return Array.from(_mouseState.hoveredElements).some(
    (el) => el === targetElement || targetElement.contains(el)
  );
}

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
    clientX: _mouseState.position.clientX,
    clientY: _mouseState.position.clientY,
    pageX: _mouseState.position.pageX,
    pageY: _mouseState.position.pageY,
  };
}

/**
 * 移除特定事件類型的特定回調
 * @param obj 事件類型和對應回調ID的映射
 * @returns 是否成功移除至少一個回調
 */
export function remove_eventType_callbakcs(
  obj: Record<MouseEventType, string | string[]>
): boolean {
  let removed = false;

  // 遍歷所有指定的事件類型
  Object.entries(obj).forEach(([eventTypeStr, id]) => {
    const eventType = eventTypeStr as MouseEventType;
    if (!_mouseState.registeredCallbacks[eventType]) return;

    const ids = Array.isArray(id) ? id : [id];
    const initialLength = _mouseState.registeredCallbacks[eventType].length;
    _mouseState.registeredCallbacks[eventType] =
      _mouseState.registeredCallbacks[eventType].filter(
        (registeredCallback) => !ids.includes(registeredCallback.id)
      );

    if (_mouseState.registeredCallbacks[eventType].length < initialLength) {
      removed = true;
      logger.debug(
        `已移除事件類型 ${eventType} 中ID為 ${ids.join(", ")} 的鼠標事件回調`
      );

      // 標記此事件類型需要檢查是否還有其他回調
    }

    // 如果此事件類型的所有回調都被移除，清理事件監聽器
    if (_mouseState.registeredCallbacks[eventType].length === 0) {
      delete _mouseState.registeredCallbacks[eventType];

      // 移除該事件類型的監聽器
      if (_mouseState.registeredEvents.has(eventType)) {
        stopListening(eventType);
      }
    }
  });

  // 如果沒有任何回調，停止所有監聽
  if (Object.keys(_mouseState.registeredCallbacks).length === 0) {
    stopListening();
  }

  return removed;
}

/**
 * 移除單個或多個回調
 * @param id 回調ID或回調ID陣列
 * @returns 是否成功移除至少一個回調
 */
export function removeCallback(options: {
  eventType?: MouseEventType;
  id: string | string[];
}): boolean {
  let removed = false;
  const ids = Array.isArray(options.id) ? options.id : [options.id];
  const eventTypesToCheck = new Set<MouseEventType>();

  // 遍歷所有需要檢查的事件類型
  const eventTypesToSearch = options.eventType
    ? [options.eventType]
    : Object.values(MouseEventType);

  // 遍歷所有需要檢查的事件類型
  eventTypesToSearch.forEach((eventType) => {
    if (!_mouseState.registeredCallbacks[eventType]) return;

    const initialLength = _mouseState.registeredCallbacks[eventType].length;
    _mouseState.registeredCallbacks[eventType] =
      _mouseState.registeredCallbacks[eventType].filter(
        (registeredCallback) => !ids.includes(registeredCallback.id)
      );

    if (_mouseState.registeredCallbacks[eventType].length < initialLength) {
      removed = true;
      logger.debug(`已移除ID為 ${ids.join(", ")} 的鼠標事件回調`);

      // 標記此事件類型需要檢查是否還有其他回調
      eventTypesToCheck.add(eventType);
    }

    // 如果此事件類型的所有回調都被移除，清理事件監聽器
    if (_mouseState.registeredCallbacks[eventType].length === 0) {
      delete _mouseState.registeredCallbacks[eventType];

      // 移除該事件類型的監聽器
      if (_mouseState.registeredEvents.has(eventType)) {
        stopListening(eventType);
      }
    }
  });

  // 如果沒有任何回調，停止所有監聽
  if (Object.keys(_mouseState.registeredCallbacks).length === 0) {
    stopListening();
  }

  return removed;
}

/**
 * 清空所有回調並停止監聽
 */
export function clearCallbacks(): void {
  // 清空所有事件配置
  Object.values(MouseEventType).forEach((eventType) => {
    if (_mouseState.registeredCallbacks[eventType]) {
      _mouseState.registeredCallbacks[eventType] = [];
      delete _mouseState.registeredCallbacks[eventType];
    }
  });

  // 停止所有事件監聽
  stopListening();
  logger.debug("已清除所有鼠標事件回調");
}

/**
 * 獲取所有註冊的回調
 */
export function allCallbacks(): Map<string, WrappedCallbackConfig> {
  const allCallbacks = new Map<string, WrappedCallbackConfig>();

  Object.values(MouseEventType).forEach((eventType) => {
    if (!_mouseState.registeredCallbacks[eventType]) return;

    _mouseState.registeredCallbacks[eventType].forEach((registeredCallback) => {
      allCallbacks.set(registeredCallback.id, { ...registeredCallback });
    });
  });

  return allCallbacks;
}

/**
 * 設置低功耗模式
 * @param enable 是否啟用
 * @param frequency 低功耗模式下的更新頻率 (默認 30fps)
 */
export function setLowPowerMode(enable: boolean, frequency: number = 30): void {
  _mouseState.performance.lowPowerMode = enable;
  if (frequency > 0) {
    _mouseState.performance.lowPowerFrequency = frequency;
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

// -------------- 輔助函數 --------------

// 添加事件監聽器（所有監聽函數的共享實現）
function addEventListeners(
  eventType: MouseEventType,
  callbacks: MouseCallbackFunction | MouseCallbackFunction[],
  options: CallbackConfig = {}
): MouseListenerHandle {
  // 確保回調是陣列
  const callbackArray = Array.isArray(callbacks) ? callbacks : [callbacks];
  const registeredCallbacks = new Map<string, WrappedCallbackConfig>();

  // 為每個回調創建配置並註冊
  callbackArray.forEach((callback) => {
    // 創建包裝後的回調
    const wrappedCallback = wrapCallback(callback, {
      throttle: options.throttle,
      debounce: options.debounce,
    });

    // 配置項
    const callbackConfig: WrappedCallbackConfig = {
      ...{
        id: crypto.randomUUID(),
        type: eventType,
        target: options.target,
        callback,
        wrappedCallback,
      },
      ...options,
    };

    // 添加到全局配置中
    if (!_mouseState.registeredCallbacks[eventType]) {
      _mouseState.registeredCallbacks[eventType] = [];
    }
    _mouseState.registeredCallbacks[eventType].push(callbackConfig);
    registeredCallbacks.set(callbackConfig.id, callbackConfig);

    logger.debug(`已註冊 ${eventType} 事件監聽器 (ID: ${callbackConfig.id})`);
  });

  // 為該特定事件類型啟動監聽器（如果尚未啟動）
  if (!_mouseState.registeredEvents.has(eventType)) {
    startListening(eventType);
  }

  // 返回清理函數
  return Object.assign(
    () => {
      // 移除所有註冊的回調
      registeredCallbacks.forEach((_, id) => {
        removeCallback({ id });
      });
      registeredCallbacks.clear();
    },
    {
      registeredCallbacks: registeredCallbacks,
    }
  );
}
