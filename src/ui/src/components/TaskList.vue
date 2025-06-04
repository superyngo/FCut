<template>
  <div class="task-list" :class="{ 'has-selected': taskStore.hasTasksSelected, 'shiftOn': taskStore.isShiftOn }">
    <ul v-if="taskStore.tasks.length > 0" class="task-item-ul">
      <li v-for="(task, index) in taskStore.tasks" :key="task.id" class="task-item"
        :class="{ shifted: taskStore.shiftHoverRange.includes(index) }" @click="toggleTaskSelection(task, index)">
        <!-- Wrap preview in a container for positioning and hover detection -->
        <div class="preview-container">
          <!-- Checkbox positioned at the top-left -->
          <div class="checkbox-wrapper">
            <input type="checkbox" v-model="task.selected" @change="changeSelected(task, index)" class="select-checkbox"
              :class="{ 'is-selected': task.selected }" :title="$t('taskList.selectTask')" />
          </div>
          <div class="task-preview" :class="{ shifted: taskStore.shiftHoverRange.includes(index) }">
            <!-- Placeholder for video preview -->
            <img v-if="task.previewUrl" :src="task.previewUrl" :alt="$t('taskList.previewAlt')" class="preview-image" />
            <div v-else class="preview-placeholder" :class="getFileTypeClass(task.videoName)">
              {{ getFileExtension(task.videoName).toUpperCase() }}
            </div>
          </div>
        </div>
        <div class="task-details">
          <span class="task-filename" :title="task.videoName">{{ task.videoName }}</span>
          <div class="task-actions">
            <div class="custom-select-wrapper">
              <select v-model="task.renderMethod" class="render-select" @change="change_settings(task as Task)"
                :disabled="[TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(task.status) || taskStore.isShiftOn"
                @click.stop>
                <option value="" disabled selected>{{ $t('taskList.selectRenderMethod') }}</option>
                <option v-for="method of ACTIONS" :key="method" :value="method">
                  {{ $t(method) }}
                </option>
              </select>
              <div class="select-arrow"></div>
            </div>
            <button @click.stop="modalStore.openTaskSettings(task as Task)" class="settings-button"
              :title="$t('taskList.moreSettings')" :disabled="taskStore.isShiftOn">
              <img src="../assets/settings-icon.svg" :alt="$t('taskList.settings')" />
            </button>
          </div>
        </div>
        <div class="task-status">
          <span :class="[
            'status-badge',
            `status-${TASK_STATUS[task.status].toLowerCase()}`,
          ]">{{ $t('taskList.status.' + TASK_STATUS[task.status].toLowerCase()) }}</span>
        </div>
      </li>
    </ul>
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 8V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"></path>
          <path d="M2 12v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8"></path>
          <path d="M2 12h20"></path>
          <path d="M12 22v-5.5"></path>
          <path d="M10 16.5l2 2 2-2"></path>
        </svg>
      </div>
      <p>{{ $t('taskList.emptyHint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { logger } from "../utils/logger";
import { useTasks, useModalStore, useCallBackRedistry, useAppState } from "../stores/stores";
import { TASK_STATUS, ACTIONS } from "../models/tasks";
import { Task } from "../models/tasks";
import { ShortCutKey } from "../utils/eventListner";
import { startMouseEvent } from "../utils/mouseEvents";
import { getFileType, getFileExtension, FileType } from "../utils/types";

const modalStore = useModalStore();
const taskStore = useTasks();
const callbackRegistry = useCallBackRedistry();
const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數
let mouseEvent: any = null

// 根據檔案名稱判斷檔案類型並返回對應的 CSS 類別
const getFileTypeClass = (filename: string): string => {
  const fileType = getFileType(filename);
  switch (fileType) {
    case FileType.AUDIO:
      return 'file-type-audio';
    case FileType.VIDEO:
      return 'file-type-video';
    default:
      return 'file-type-unknown';
  }
};

const change_settings = (task: Task) => {
  if (task.selected) {
    taskStore.selectedTasks.forEach((selectedTask) => {
      if (
        [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
          selectedTask.status
        )
      ) {
        return;
      }
      selectedTask.renderMethod = task.renderMethod as ACTIONS;
      selectedTask.status = TASK_STATUS.Ready;
    });
  } else {
    task.status = TASK_STATUS.Ready;
  }
  taskStore.saveTasks();
};


const changeSelected = (task: Task, index: number) => {
  toggleTaskSelection(task, index, false);
};

const toggleTaskSelection = (
  task: Task,
  index: number,
  toggle: boolean = true
) => {
  // 確認是否有任務被選取或 Shift 鍵是否被按下
  if ((taskStore.hasTasksSelected || taskStore.isShiftOn) && toggle) {
    task.selected = !task.selected;
  }
  // 判斷是否全勾選或取消勾選
  if (
    !task.selected &&
    taskStore.shiftHoverRange.length > 0 &&
    taskStore.onlyOneSelectedInHoverRange
  ) {
    taskStore.shiftHoverRange.forEach((index: number) => {
      taskStore.tasks[index].selected = false;
    });
  } else if (taskStore.shiftHoverRange.length > 0) {
    taskStore.shiftHoverRange.forEach((index: number) => {
      taskStore.tasks[index].selected = true;
    });
  }
  taskStore.lastSelectedIndex = task.selected ? index : -1;
  taskStore.saveTasks();
};


onMounted(() => {
  taskStore.initTasks();
  mouseEvent = startMouseEvent();
  callbackRegistry.shortCutKey = new ShortCutKey(callbackRegistry.eventsProxy.taskListsShortCutKey).add()
});

// 組件卸載時清理事件監聽
onUnmounted(() => {
  // 清理事件監聽
  callbackRegistry.shortCutKey!.remove();
  callbackRegistry.shortCutKey = null;
  mouseEvent()
  mouseEvent = null
});
</script>

<style scoped>
/* 主容器樣式 */
.task-list {
  /* width: 85%; */
  max-width: min(600px, 95vw);
  /* 確保不超出視窗範圍 */
  height: 100%;
  min-height: 250px;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-border-color);
  border-radius: 0 0 8px 8px;
  /* 使用 calc() 和相對單位實現左右間距隨視窗寬度等比例縮小 */
  /* padding: 15px calc(4% + 10px); */
  /* 最小值為10px，最大約為30px，根據容器寬度等比例變化 */
  background-color: var(--app-surface-color);
  color: var(--app-text-color);
  box-shadow: 0 4px 12px var(--app-shadow-color);
  box-sizing: border-box;
  overflow: hidden;
  margin-top: -1px;
}

/* 列表容器樣式 */
.task-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  /* 填充容器剩餘空間 */
  overflow-y: auto;
  /* 只在任務列表內使用滾動條 */
  scrollbar-width: thin;
  scrollbar-color: #444 #222;
  min-height: 0;
  /* 允許flex項目縮小，解決滾動問題 */
}

/* 滾動條樣式 */
.task-list ul::-webkit-scrollbar {
  width: 8px;
}

.task-list ul::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color);
  border-radius: 4px;
}

.task-list ul::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-color);
  border-radius: 4px;
}

.task-list ul::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-color);
}

/* 任務項目基本布局 */
.task-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  /* 調整上下 padding，左右 padding 由父元素控制 */
  border: 2px solid transparent;
  border-bottom: 2px solid var(--app-border-color);
  gap: calc(1.5% + 8px);
  /* 動態調整元素間間距，隨視窗寬度變化 */
  transition: all 0.2s ease;
  height: 100px;
  /* 增加任務行高度 */
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  /* 防止內容溢出 */
  width: 100%;
  /* 確保任務項目寬度填滿父容器 */
  padding: 15px calc(4% + 10px);
}

.task-item:has(.select-checkbox:checked) {
  border: 2px solid var(--app-accent-color);
  border-bottom-color: transparent;
  background-color: var(--app-hover-color);
  /* margin-bottom: 0; */
}

/* 如果下一個兄弟元素也被選中，則當前元素不需要頂部邊框 */
.task-item:has(.select-checkbox:checked)+.task-item:has(.select-checkbox:checked) {
  border-top-color: transparent;
}

/* 最後一個被選中的項目需要底部邊框 */
.task-item:has(.select-checkbox:checked)+.task-item:has(.select-checkbox:not(:checked)) {
  border-top: 2px solid var(--app-accent-color);
}

.task-item-ul>.task-item:last-child:has(.select-checkbox:checked) {
  border-bottom-color: var(--app-accent-color);

}


.task-item:hover,
.shifted {
  background-color: var(--app-hover-color);
  box-shadow: 0 2px 5px var(--app-shadow-color);
  /* 懸停時增加陰影 */
}


.task-item:last-child {
  border-bottom: none;
}

/* 預覽區域相關樣式 */
.preview-container {
  position: relative;
  flex-shrink: 0;
  width: 90px;
  /* 增加寬度 */
  height: 56px;
  /* 16:9比例更加適合視頻預覽 */
  border-radius: 6px;
  overflow: hidden;
  /* 確保內容不溢出 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.task-preview {
  width: 100%;
  height: 100%;
  background-color: var(--app-surface-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  font-size: 12px;
  color: var(--app-text-color);
  background-color: var(--app-surface-color);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid var(--app-border-color);
  text-shadow: 0 1px 2px var(--app-shadow-color);
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}

/* 不同檔案類型的顏色樣式 */
.preview-placeholder.file-type-audio {
  color: #e91e63;
  background-color: rgba(233, 30, 99, 0.1);
}

.preview-placeholder.file-type-video {
  color: #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
}

.preview-placeholder.file-type-unknown {
  color: #757575;
  background-color: rgba(117, 117, 117, 0.1);
}

/* 當 checkbox 被勾選時，preview-placeholder 的 scale 變成 0.9 */
.preview-container:has(.select-checkbox:checked) .task-preview .preview-placeholder {
  scale: 0.9;
  transition: scale 0.2s ease-in-out;
}

/* 選擇框相關樣式 */
.checkbox-wrapper {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.3);
  /* 半透明背景增加可見度 */
  border-radius: 50%;
  padding: 2px;
  display: flex;
  /* Added for centering content */
  align-items: center;
  /* Added for centering content */
  justify-content: center;
  /* Added for centering content */
}

.select-checkbox {
  position: relative;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;
  appearance: none !important;
  -webkit-appearance: none !important;
  width: 16px !important;
  height: 16px !important;
  display: inline-block !important;
  border: none !important;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;

  /* 默認狀態下透明不可見 */
  background-image: url("../assets/checkbox-default.svg");
  opacity: 0;
}


/* 選中狀態顯示藍色圓圈帶白色勾選 */
.select-checkbox:checked {
  background-image: url("../assets/checkbox-checked.svg") !important;
  background-color: transparent !important;
  opacity: 1 !important;
}

/* 當有任何任務被選中時，所有的 checkbox 都會顯示 */
.task-item:hover .select-checkbox,
.task-list.has-selected .select-checkbox {
  opacity: 1 !important;
}

/* 當 task-item 有 shifted 類時，checkbox 顯示 hover 狀態 */
.task-item.shifted .checkbox-wrapper .select-checkbox {
  background-image: url("../assets/checkbox-hover.svg");
  opacity: 1 !important;
}

/* Checkbox狀態與交互效果 */
.select-checkbox:hover,
.task-list.has-selected .task-item:hover .select-checkbox,
.task-list.shiftOn .task-item:hover .select-checkbox {
  background-image: url("../assets/checkbox-hover.svg");
  opacity: 1 !important;
  scale: 1.2;
  transition: scale 0.2s ease-in-out;
}

.preview-container:hover .select-checkbox {
  opacity: 1 !important;
}

/* 任務詳情與操作區域 */
.task-details {
  flex-grow: 1;
  flex-shrink: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  /* 調整為 space-around 使檔名和操作上下分布更均勻 */
  min-width: 0;
  max-width: calc(100% - 220px);
  /* 調整最大寬度以容納預覽和狀態 */
  height: 100%;
  gap: 4px;
  /* 減少 gap */
  padding: 5px 0;
  /* 增加上下 padding */
  overflow: hidden;
  /* margin-right: -10px; */
  /* 移除負邊距 */
}

.task-filename {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  /* 防止檔名換行 */
  overflow: hidden;
  /* 隱藏超出部分 */
  text-overflow: ellipsis;
  /* 超出部分以省略號顯示 */
  display: block;
  width: 100%;
  max-width: 100%;
  line-height: 1.3;
  /* 調整行高 */
  color: var(--app-text-color);
  text-shadow: 0 1px 1px var(--app-shadow-color);
  padding-right: 5px;
  /* 減少右側 padding */
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  /* 防止按鈕換行 */
  min-width: 0;
  /* 允許收縮但保持內容不超出 */
}

.custom-select-wrapper {
  position: relative;
  width: 160px;
  /* 調整下拉選單寬度 */
  min-width: 110px;
  flex-shrink: 1;
  margin-right: 5px;
  /* 添加右側間距 */
}

.render-select {
  width: 100%;
  padding: 8px 30px 8px 10px;
  font-size: 12px;
  border: 1px solid var(--app-border-color);
  background-color: var(--app-surface-color);
  color: var(--app-text-color);
  border-radius: 4px;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: center;
  /* 添加文字置中對齊 */
}

.render-select:hover {
  border-color: var(--app-accent-color);
  background-color: var(--app-hover-color);
}

.render-select:focus {
  outline: none;
  border-color: var(--app-accent-color);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.25);
}

.render-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  pointer-events: none;
  background-image: url("../assets/arrow-down.svg");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: var(--app-icon-filter);
}

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.settings-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.settings-button img {
  width: 16px;
  height: 16px;
  filter: var(--app-icon-filter);
}

.settings-button:hover {
  background-color: var(--app-hover-color);
  border-radius: 4px;
}

/* 任務狀態樣式 */
.task-status {
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* 狀態 badge 靠右對齊 */
  height: 100%;
  /* margin-right: 10px; */
  /* 移除固定右邊距，由父容器 padding 控制 */
  align-self: center;
  position: relative;
  width: 100px;
  /* 給狀態一個固定寬度 */
  /* 使用 calc() 和百分比單位使 padding-right 隨視窗寬度等比例調整 */
  padding-right: calc(1% + 5px);
  box-sizing: border-box;
  /* 確保 padding 不會增加總寬度 */
}

.status-badge {
  padding: 6px 10px;
  /* 調整 padding */
  border-radius: 12px;
  font-size: 11px;
  color: white;
  min-width: 80px;
  /* 調整最小寬度 */
  max-width: 100%;
  /* badge 最大寬度為其容器寬度 */
  height: 26px;
  /* 調整高度 */
  text-align: center;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  white-space: nowrap;
  box-sizing: border-box;
}

/* 不同狀態的顏色 */
.status-preparing {
  background-color: #f39c12;
  /* 增強橙色 */
}

.status-ready {
  background-color: #3498db;
  /* 增強藍色 */
}

.status-queued {
  background-color: #9b59b6;
  /* 增強紫色 */
}

.status-rendering {
  background-color: #e74c3c;
  /* 增強紅色 */
}

.status-done {
  background-color: #2ecc71;
  /* 增強綠色 */
}

/* 取消選取按鈕已移至 MainView.vue 中的訊息欄 */

/* 空狀態樣式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  width: 500px;
  color: var(--app-text-color);
  opacity: 0.6;
  text-align: center;
  flex: 1;
  /* 確保空狀態填充整個容器 */
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.6;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }

  50% {
    opacity: 0.8;
  }

  100% {
    opacity: 0.4;
  }
}

.empty-icon svg {
  width: 80px;
  height: 80px;
  stroke: var(--app-text-color);
  opacity: 0.4;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #999;
  letter-spacing: 0.5px;
}

/* 當Shift鍵按下時，調整滑鼠游標樣式，表示整個任務項是可選擇的 */
.task-list.shiftOn .task-item {
  cursor: pointer;
}

.task-list.shiftOn .task-details {
  pointer-events: none;
}
</style>
