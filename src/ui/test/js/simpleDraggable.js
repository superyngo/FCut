// 簡化版的拖曳函數，移除了所有TypeScript類型和複雜的依賴
// 基於mouseEvents.ts中的makeDraggable函數

/**
 * 使HTML元素可拖曳
 * @param {HTMLElement} target 要被拖曳的目標元素
 * @param {HTMLElement} [dragPoint=target] 觸發拖曳的元素（可選，預設為target）
 * @returns {Function} 可調用以移除拖曳功能的函數
 */
function makeDraggable(target, dragPoint = target) {
  // 早期返回：參數檢查
  if (!target) {
    console.warn("makeDraggable: 目標元素不存在");
    // 返回一個空的函數，避免調用者需要檢查null
    return function () {};
  }

  // 如果未提供拖曳點，使用目標元素作為拖曳點
  dragPoint = dragPoint || target;

  // 初始化位置變數
  let origX, origY;
  let isDragging = false;
  let startX, startY;

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
    console.debug("已將元素定位方式設為 'relative'");
  }

  // 滑鼠按下事件處理
  function onMouseDown(e) {
    isDragging = true;

    // 保存初始位置
    const rect = target.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    // 防止選取文字等默認行為
    e.preventDefault();

    // 添加移動和釋放事件監聽
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    console.debug(`開始拖曳元素: 初始位置 (${origX}, ${origY})`);
  }

  // 滑鼠移動事件處理
  function onMouseMove(e) {
    if (!isDragging) return;

    // 計算位移
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // 計算新位置並應用
    const newLeft = origX + deltaX;
    const newTop = origY + deltaY;
    target.style.left = newLeft + "px";
    target.style.top = newTop + "px";
  }

  // 滑鼠釋放事件處理
  function onMouseUp(e) {
    if (!isDragging) return;

    // 計算最終位移
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // 更新最終位置
    origX = origX + deltaX;
    origY = origY + deltaY;

    // 重置拖曳狀態
    isDragging = false;

    // 移除事件監聽
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    console.debug(`結束拖曳: 最終位置 (${origX}, ${origY})`);
  }

  // 註冊拖曳事件
  dragPoint.addEventListener("mousedown", onMouseDown);

  // 返回一個清理函數，用於移除拖曳功能
  return function cleanup() {
    dragPoint.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    console.debug("已移除拖曳功能");
  };
}
