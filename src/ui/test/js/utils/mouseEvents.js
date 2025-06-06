import { logger } from "./logger";
import { throttle, debounce } from "lodash-es";
// -------------- 類型定義 --------------
// 鼠標事件類型
export var MOUSE_EVENT_TYPE;
(function (MOUSE_EVENT_TYPE) {
  MOUSE_EVENT_TYPE["Move"] = "mousemove";
  MOUSE_EVENT_TYPE["Down"] = "mousedown";
  MOUSE_EVENT_TYPE["Up"] = "mouseup";
  MOUSE_EVENT_TYPE["Click"] = "click";
  MOUSE_EVENT_TYPE["DoubleClick"] = "dblclick";
  MOUSE_EVENT_TYPE["ContextMenu"] = "contextmenu";
  MOUSE_EVENT_TYPE["Enter"] = "mouseenter";
  MOUSE_EVENT_TYPE["Leave"] = "mouseleave";
  MOUSE_EVENT_TYPE["Over"] = "mouseover";
  MOUSE_EVENT_TYPE["Out"] = "mouseout";
  MOUSE_EVENT_TYPE["Wheel"] = "wheel";
})(MOUSE_EVENT_TYPE || (MOUSE_EVENT_TYPE = {}));
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
/**
 * 事件回調註冊表 - 中央管理所有註冊的回調
 * 重構說明：
 * 1. 將 registeredCallbackConfigs 從 Map<MOUSE_EVENT_TYPE, WrappedCallbackConfig[]> 改為
 *    Map<string, WrappedCallbackConfig>，以回調ID為鍵，提供 O(1) 查詢速度
 * 2. 添加 configCache 用於快速按事件類型查詢回調，支持傳統按類型查詢方式
 * 3. isDirty 用於標記快取是否需要重建，在添加/移除回調時設置為 true
 */
const _callbackRegistry = {
  registeredCallbackConfigs: new Map(), // 主存儲：以 ID 為鍵的回調配置
  // registeredEventTypes: new Set<MOUSE_EVENT_TYPE>(), // 已註冊事件類型集合
  configCache: new Map(), // 按事件類型的快取
  pendingEvents: new Map(), // 待處理事件隊列
  isDirty: false, // 緩存髒標記
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
  hoveredElements: new Set(),
};
// -------------- 工具函數 --------------
// 更新 4 狀態
// 更新滑鼠位置
const updateMousePosition = (event) => {
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
const updateHoverState = (event) => {
  // 檢查當前懸停的元素
  const hoveredElements = document.elementsFromPoint(
    event.clientX,
    event.clientY
  );
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
const updateMouseButtons = (event) => {
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
const checkEventFilter = (event, config) => {
  // 檢查目標元素
  if (config.target) {
    const targetElement = getElement(config.target);
    if (!targetElement || !event.target) return false;
    // 檢查目標是否匹配
    if (
      !(event.target === targetElement || targetElement.contains(event.target))
    ) {
      return false;
    }
  }
  // 應用自定義過濾器
  if (config.filter && !config.filter(event)) {
    return false;
  }
  return true;
};
// 獲取元素 (支持選擇器字符串或元素本身)
const getElement = (target) => {
  if (!target) return null; // 修改這裡，返回 null 而不是 document.documentElement
  if (typeof target === "string") return document.querySelector(target);
  return target;
};
// 創建包裝後的回調（處理節流/防抖）
const wrapCallback = (callbacks, config) => {
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
// -------------- Events處理器 --------------
/**
 * event流
 * 所有event的入口(不分event type)
 * 不實際調用callback
 * 而是將event依照type註冊到_callbackRegistry.pendingEvents
 * 讓AniamtionLoop去匹配調用
 * 更新事件狀態
 *
 * */
const handleMouseEvent = (event) => {
  // 更新滑鼠狀態 (僅針對 MouseEvent)
  if (event instanceof MouseEvent) {
    // 更新滑鼠位置，確保位置資訊是最新的
    updateMousePosition(event);
    updateHoverState(event);
    // 更新滑鼠按鍵狀態
    if (event.type === MOUSE_EVENT_TYPE.Down) {
      updateMouseButtons(event);
      logger.debug(
        `Mouse ${event.type}: buttons=${event.buttons}, left=${_mouseButtons.left}`
      );
    }
  }
  // 獲取事件類型並確保事件隊列初始化
  const eventType = event.type;
  if (!_callbackRegistry.pendingEvents.has(eventType)) {
    _callbackRegistry.pendingEvents.set(eventType, []);
  }
  // 添加到待處理事件隊列
  _callbackRegistry.pendingEvents.get(eventType).push(event);
};
// -------------- 處理核心 --------------
// 更新幀速率計算
const updateFrameStats = (timestamp) => {
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
// 定義適合批處理的事件類型集合
const BATCH_PROCESSING_EVENTS = new Set([
  MOUSE_EVENT_TYPE.Move,
  MOUSE_EVENT_TYPE.Wheel,
  // 未來可能的觸控事件如 TouchMove
]);
/**
 * 處理流(將events投射到callbacks上)
 * 使用 requestAnimationFrame 的處理循環 - 最核心執行所有註冊事件的地方
 *
 * 此函數創建動畫循環，在每個幀中處理所有待處理的事件，是整個模塊的核心調度中心。
 * 重構後該函數通過 viewRegisteredCallbackConfigs 視圖函數獲取每種事件類型的回調，
 * 而非直接訪問原始數據結構，這使得數據結構變更對事件處理邏輯的影響最小化。
 */
const startAnimationLoop = () => {
  const processFrame = (timestamp) => {
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
      if (BATCH_PROCESSING_EVENTS.has(eventType) && events.length > 1) {
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
const scheduleNextFrame = (processFrame) => {
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
const processEventsForType = (events, eventType) => {
  // 使用視圖函數獲取回調，隱藏內部存儲結構的變更
  const callbacks = viewRegisteredCallbackConfigs(eventType);
  if (!callbacks || callbacks.length === 0) return;
  events.forEach((event) => {
    callbacks.forEach((registeredCallback) => {
      var _a;
      // 檢查過濾條件
      if (!checkEventFilter(event, registeredCallback)) return;
      try {
        // 阻止默認行為
        if (registeredCallback.preventDefault) {
          event.preventDefault();
        }
        // 執行回調
        (_a = registeredCallback.wrappedCallbacks) === null || _a === void 0
          ? void 0
          : _a.forEach((wrappedCallback) => wrappedCallback(event));
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
const removeOneTimeCallback = (callbackId) => {
  if (_callbackRegistry.registeredCallbackConfigs.has(callbackId)) {
    // 直接根據 ID 刪除回調
    _callbackRegistry.registeredCallbackConfigs.delete(callbackId);
    // 標記緩存為髒數據
    _callbackRegistry.isDirty = true;
  }
};
/**
 * 追蹤已註冊的事件監聽類型
 * 用於分別管理 passive 和 non-passive 的事件監聽器
 */
const _eventListenerRegistry = {
  passiveListeners: new Set(), // 追蹤已註冊的被動監聽器
  nonPassiveListeners: new Set(), // 追蹤已註冊的非被動監聽器
};
/**
 * events流
 * 按照eventType註冊listner到handleMouseEvent
 * 根據 isPassive 參數決定是否使用被動監聽器
 * 啟動startAnimationLoop
 *
 * @param eventType 事件類型
 * @param isPassive 是否使用被動監聽器
 * @returns
 */
const startListening = (eventType, isPassive = false) => {
  if (typeof window === "undefined") return;
  // 檢查該事件類型與passive設置的組合是否已經註冊
  const registry = isPassive
    ? _eventListenerRegistry.passiveListeners
    : _eventListenerRegistry.nonPassiveListeners;
  if (registry.has(eventType)) {
    // 如果已經註冊過相同類型和passive設置的監聽器，則不重複註冊
    return;
  }
  // 註冊特定事件類型的監聽器，根據 isPassive 參數決定 passive 設置
  window.addEventListener(eventType, handleMouseEvent, {
    passive: isPassive,
  });
  // 記錄已註冊的監聽器類型
  registry.add(eventType);
  logger.debug(
    `已為 ${eventType} 事件添加滑鼠全局監聽器 (passive: ${isPassive})`
  );
  // 啟動動畫循環 (如果未啟動)
  if (!_performance.animationFrameId) {
    startAnimationLoop();
  }
};
/**
 * 停止全局事件監聽
 *
 * 此函數負責移除事件監聽器，包含全局和局部，但不負責清除回調
 * 若全局滑鼠監聽器已移除，則一併停止動畫循環。
 *
 * @param eventType? MOUSE_EVENT_TYPE
 */
const stopListening = (eventType) => {
  if (typeof window === "undefined") return;
  // 如果提供了特定事件類型，只移除該類型的全局事件監聽器
  if (eventType) {
    // 移除所有類型的監聽器（被動和非被動）
    if (_eventListenerRegistry.passiveListeners.has(eventType)) {
      window.removeEventListener(eventType, handleMouseEvent);
      _eventListenerRegistry.passiveListeners.delete(eventType);
      logger.debug(`已移除 ${eventType} 的被動(passive)全局事件監聽器`);
    }
    if (_eventListenerRegistry.nonPassiveListeners.has(eventType)) {
      window.removeEventListener(eventType, handleMouseEvent);
      _eventListenerRegistry.nonPassiveListeners.delete(eventType);
      logger.debug(`已移除 ${eventType} 的非被動(non-passive)全局事件監聽器`);
    }
    _callbackRegistry.pendingEvents.delete(eventType);
    // 如果還有其他事件註冊，提前返回
    if (_callbackRegistry.registeredCallbackConfigs.size > 0) return;
  } else {
    // 沒有特定事件類型則移除所有已註冊的事件監聽器
    // 移除所有被動(passive)監聽器
    _eventListenerRegistry.passiveListeners.forEach((eventType) => {
      window.removeEventListener(eventType, handleMouseEvent);
      logger.debug(`已移除 ${eventType} 的被動(passive)全局事件監聽器`);
    });
    _eventListenerRegistry.passiveListeners.clear();
    // 移除所有非被動(non-passive)監聽器
    _eventListenerRegistry.nonPassiveListeners.forEach((eventType) => {
      window.removeEventListener(eventType, handleMouseEvent);
      logger.debug(`已移除 ${eventType} 的非被動(non-passive)全局事件監聽器`);
    });
    _eventListenerRegistry.nonPassiveListeners.clear();
  }
  logger.debug("全局鼠標事件監聽器已停止");
  // 停止動畫循環（此時已確認沒有任何註冊事件）
  if (_performance.animationFrameId) {
    cancelAnimationFrame(_performance.animationFrameId);
    _performance.animationFrameId = 0;
  }
  // 清理狀態
  _callbackRegistry.pendingEvents.clear();
  _hoverState.hoveredElements.clear();
};
// -------------- 公共 API -------------- 註冊事件
/**
 * 監聽滑鼠移動事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onMousemove(callbackConfig) {
  // 添加類型屬性
  const configWithType = Object.assign(Object.assign({}, callbackConfig), {
    type: MOUSE_EVENT_TYPE.Move,
  });
  // 添加監聽器
  return addEventListeners(configWithType);
}
/**
 * 監聽鼠標點擊事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onClick(callbackConfig) {
  // 添加類型屬性
  const configWithType = Object.assign(Object.assign({}, callbackConfig), {
    type: MOUSE_EVENT_TYPE.Click,
  });
  // 添加監聽器
  return addEventListeners(configWithType);
}
/**
 * 監聽鼠標按下事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onMousedown(callbackConfig) {
  // 添加類型屬性
  const configWithType = Object.assign(Object.assign({}, callbackConfig), {
    type: MOUSE_EVENT_TYPE.Down,
  });
  // 添加監聽器
  return addEventListeners(configWithType);
}
/**
 * 監聽鼠標釋放事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onMouseup(callbackConfig) {
  // 添加類型屬性
  const configWithType = Object.assign(Object.assign({}, callbackConfig), {
    type: MOUSE_EVENT_TYPE.Up,
  });
  // 添加監聽器
  return addEventListeners(configWithType);
}
/**
 * 監聽滾輪事件
 * @param callbackConfig 配置參數，包含回調函數
 * @returns 監聽器句柄
 */
export function onWheel(callbackConfig) {
  // 添加類型屬性
  const configWithType = Object.assign(Object.assign({}, callbackConfig), {
    type: MOUSE_EVENT_TYPE.Wheel,
  });
  // 添加監聽器
  return addEventListeners(configWithType);
}
/**
 * 實現拖拽功能
 *
 * @param dragCallbackConfig 拖拽配置參數，包含回調函數
 * @returns 監聽器句柄，用於移除拖拽功能
 */
export function onDrag(dragCallbackConfig) {
  // 獲取回調函數並統一轉換為數組
  let { mousedown, mousemove, mouseup } = dragCallbackConfig.callbacks;
  const dragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    get deltaX() {
      return this.currentX - this.startX;
    },
    get deltaY() {
      return this.currentY - this.startY;
    },
  };
  // 鼠標按下處理 - 拖拽開始信號由通用拖拽處理器處理
  const downHandle = onMousedown(
    Object.assign(Object.assign({}, dragCallbackConfig), {
      id: `drag_mousedown_${crypto.randomUUID()}`,
      callbacks: (event) => {
        dragState.isDragging = true;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        mousedown &&
          mousedown(Object.assign(Object.assign({}, event), { dragState }));
      },
    })
  );
  // 鼠標移動處理
  const moveHandle = onMousemove(
    Object.assign(Object.assign({}, dragCallbackConfig), {
      target: null,
      id: `drag_mousemove_${crypto.randomUUID()}`,
      callbacks: (event) => {
        if (!dragState.isDragging) return;
        dragState.currentX = event.clientX;
        dragState.currentY = event.clientY;
        logger.debug(
          `Drag moving: ${event.clientX}, ${event.clientY}, delta: (${dragState.deltaX}, ${dragState.deltaY})`
        );
        mousemove(Object.assign(Object.assign({}, event), { dragState }));
      },
    })
  );
  // 鼠標釋放處理
  const upHandle = onMouseup(
    Object.assign(Object.assign({}, dragCallbackConfig), {
      target: null,
      id: `drag_mouseup_${crypto.randomUUID()}`,
      callbacks: (event) => {
        if (!dragState.isDragging) return;
        mouseup &&
          mouseup(Object.assign(Object.assign({}, event), { dragState }));
        dragState.startX = 0;
        dragState.startY = 0;
        dragState.currentX = event.clientX;
        dragState.currentY = event.clientY;
        dragState.isDragging = false;
        logger.debug(
          `Drag ended: total movement (${dragState.deltaX}, ${dragState.deltaY})`
        );
      },
    })
  );
  // 合併所有監聽器的回調
  const registeredCallbacks = [
    ...downHandle.registeredCallbacks,
    ...moveHandle.registeredCallbacks,
    ...upHandle.registeredCallbacks,
  ];
  // 返回複合事件處理器
  return Object.assign(
    () => {
      // 移除所有註冊的回調
      removeRegisteredCallbackConfigs(registeredCallbacks);
    },
    { registeredCallbacks, dragState }
  );
}
/**
 * 使HTML元素可拖移
 * @param target 要被拖移的目標元素
 * @param dragPoint 觸發拖移的元素（可選，預設為target）
 * @returns 監聽器句柄，可用於移除拖移功能
 */
export function makeDraggable(target, dragPoint = target) {
  // 早期返回：參數檢查
  if (!target) {
    logger.warn("makeDraggable: 目標元素不存在");
    // 返回一個空的監聽器句柄，避免調用者需要檢查null
    return Object.assign(() => {}, { registeredCallbacks: [] });
  }
  // 如果未提供拖曳點，使用目標元素作為拖曳點
  dragPoint = dragPoint || target;
  // 初始化位置變數
  let origX;
  let origY;
  // 確保目標元素可以被定位
  const computedStyle = window.getComputedStyle(target);
  const position = computedStyle.position;
  if (
    position !== "absolute" &&
    position !== "relative" &&
    position !== "fixed"
  ) {
    // 設置為可定位的元素
    target.style.position = "relative";
    logger.debug(`已將元素定位方式設為 'relative'`);
  }
  // 註冊拖拽事件
  return onDrag({
    preventDefault: true,
    target: dragPoint,
    callbacks: {
      mousedown: (dragEvent) => {
        // 保存初始位置
        const rect = target.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        logger.debug(`開始拖曳元素: 初始位置 (${origX}, ${origY})`);
      },
      mousemove: (dragEvent) => {
        // 計算新位置並應用
        const newLeft = origX + dragEvent.dragState.deltaX;
        const newTop = origY + dragEvent.dragState.deltaY;
        target.style.left = newLeft + "px";
        target.style.top = newTop + "px";
      },
      mouseup: (dragEvent) => {
        // 更新最終位置
        origX = origX + dragEvent.dragState.deltaX;
        origY = origY + dragEvent.dragState.deltaY;
        logger.debug(`結束拖曳: 最終位置 (${origX}, ${origY})`);
      },
    },
  });
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
export function clearAllCallbacks() {
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
export function setLowPowerMode(enable, frequency = 30) {
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
export function createVirtualMouseEvent(type, x, y, options = {}) {
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
export function startMouseEvent() {
  logger.debug("開始監聽滑鼠事件");
  return onMousemove({ callbacks: (event) => {} });
}
// -------------- 公共 API -------------- 回傳滑鼠狀態
/**
 * 獲取當前鼠標座標
 */
export function coordinate() {
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
export function hoveredElements() {
  return Array.from(_hoverState.hoveredElements);
}
/**
 * 檢測滑鼠是否懸停在指定元素上
 * @param element 要檢查的元素
 * @returns 是否懸停
 */
export function isHovering(element) {
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
export function allCallbacks() {
  const result = [];
  // 直接從緩存中獲取按事件類型組織的數據
  viewRegisteredCallbackConfigs().forEach((wrappedCallbackConfig) => {
    // 創建每個回調的淺拷貝並凍結數組
    const frozenCallbackConfig = Object.freeze(
      Object.assign({}, wrappedCallbackConfig)
    );
    result.push(frozenCallbackConfig);
  });
  return result;
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
 * 6. 根據 preventDefault 和 passive 設置決定使用哪種類型的監聽器
 *
 * @param callbackConfig 回調配置，必須包含 type 屬性指定事件類型
 * @returns 監聽器句柄，包含用於移除監聽的函數
 */
function addEventListeners(callbackConfig) {
  const registeredCallbacks = [];
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
  const wrappedCallbackConfig = Object.assign(
    Object.assign({}, callbackConfig),
    { id: callbackId, type: eventType, wrappedCallbacks }
  );
  // 添加到本次配置中
  registeredCallbacks.push(wrappedCallbackConfig);
  // 添加到全局配置中 - 現在以 ID 為鍵
  _callbackRegistry.registeredCallbackConfigs.set(
    callbackId,
    wrappedCallbackConfig
  );
  // 確定是否可以使用被動監聽器
  // 當 passive 選項明確設為 true 或者不需要 preventDefault 且 passive 未明確設為 false 時，使用被動監聽器
  const usePassiveListener =
    callbackConfig.passive === true ||
    (!callbackConfig.preventDefault && callbackConfig.passive !== false);
  // 為該特定事件類型啟動監聽器（如果尚未啟動）
  // 使用修改後的 startListening 函數，傳入 isPassive 參數
  if (
    viewRegisteredCallbackConfigs(eventType).length === 0 ||
    (usePassiveListener &&
      !_eventListenerRegistry.passiveListeners.has(eventType)) ||
    (!usePassiveListener &&
      !_eventListenerRegistry.nonPassiveListeners.has(eventType))
  ) {
    startListening(eventType, usePassiveListener);
  }
  logger.debug(
    `已註冊 ${eventType} 事件監聽器 (ID: ${callbackId}, passive: ${usePassiveListener})`
  );
  rebuildCache();
  // 返回清理函數
  return Object.assign(
    () => {
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
function removeRegisteredCallbackConfigs(registeredCallbacks) {
  let removed = false;
  if (!registeredCallbacks) {
    return removed;
  }
  // 需要清理的事件類型
  const eventTypesToCheck = new Set();
  // 遍歷所有指定的事件類型
  registeredCallbacks.forEach((registeredCallback) => {
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
    // 重建緩存以便檢查每種事件類型是否還有回調
    // 如果沒有任何回調，停止所有監聽
    if (_callbackRegistry.registeredCallbackConfigs.size === 0) {
      stopListening();
      _callbackRegistry.isDirty = true;
    } else {
      // 檢查每個事件類型是否還有回調
      _callbackRegistry.isDirty = true;
      eventTypesToCheck.forEach((eventType) => {
        if (viewRegisteredCallbackConfigs(eventType).length === 0) {
          stopListening(eventType);
        }
      });
    }
  }
  return removed;
}
function viewRegisteredCallbackConfigs(types) {
  // 檢查快取是否需要重建
  if (_callbackRegistry.isDirty) {
    rebuildCache();
  }
  if (types === undefined) {
    return _callbackRegistry.configCache;
  }
  const typesArray = Array.isArray(types) ? types : [types];
  // 合併多種類型的結果
  let result = [];
  typesArray.forEach((type) => {
    if (_callbackRegistry.configCache.has(type)) {
      result = [...result, ..._callbackRegistry.configCache.get(type)];
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
function rebuildCache() {
  // 清空現有快取
  _callbackRegistry.configCache.clear();
  // 遍歷所有註冊的回調配置
  _callbackRegistry.registeredCallbackConfigs.forEach((config) => {
    // 初始化該類型的快取數組
    if (!_callbackRegistry.configCache.has(config.type)) {
      _callbackRegistry.configCache.set(config.type, []);
    }
    // 添加到對應類型的快取數組
    _callbackRegistry.configCache.get(config.type).push(config);
  });
  // 重置髒標記
  _callbackRegistry.isDirty = false;
}
