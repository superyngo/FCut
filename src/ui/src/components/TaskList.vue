<template>
  <div
    class="task-list"
    :class="{ 'has-selected': task_store.has_selected_tasks }"
  >
    <!-- 新增取消選取按鈕 -->
    <div v-if="task_store.has_selected_tasks" class="clear-selection-wrapper">
      <button
        @click="clearAllSelections"
        class="clear-selection-button"
        title="取消所有選取"
      >
        <span>X</span>
      </button>
    </div>
    <ul>
      <li
        v-for="(task, index) in task_store.indexed_tasks"
        :key="task.id"
        class="task-item"
      >
        <!-- Wrap preview in a container for positioning and hover detection -->
        <div class="preview-container">
          <!-- Checkbox positioned at the top-left -->
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              v-model="task.selected"
              @change="change_selected(task, index)"
              class="select-checkbox"
              :class="{ 'is-selected': task.selected }"
              title="Select Task"
            />
          </div>
          <div
            class="task-preview"
            :class="{ shifted: index in task_store.shift_hover_range }"
            @click="toggleTaskSelection(task)"
          >
            <!-- Placeholder for video preview -->
            <img
              v-if="task.previewUrl"
              :src="task.previewUrl"
              alt="Preview"
              class="preview-image"
            />
            <div v-else class="preview-placeholder">
              {{ index }}
              {{ task_store.shift_hover_range }}
              {{ index in task_store.shift_hover_range }}
            </div>
          </div>
        </div>
        <div class="task-details">
          <span class="task-filename">{{ task.video_name }}</span>
          <div class="task-actions">
            <select
              v-model="task.renderMethod"
              class="render-select"
              @change="change_settings(task)"
              :disabled="false"
            >
              <option value="" disabled selected>Please select</option>
              <option v-for="method of ACTIONS" :key="method" :value="method">
                {{ method }}
              </option>
            </select>
            <button @click="openSettings(task)" class="settings-button">
              ...
            </button>
          </div>
        </div>
        <div class="task-status">
          <span
            :class="[
              'status-badge',
              `status-${TASK_STATUS[task.status].toLowerCase()}`,
            ]"
            >{{ TASK_STATUS[task.status] }}</span
          >
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Logger } from "../utils/logger";
import { useTASKS } from "../stores/stores";
import { init_settings } from "../models/task_setting"; // Import the init_settings function
import { TASK_STATUS } from "../models/tasks"; // Import the TASK_STATUS enum
import { ACTIONS } from "../models/task_setting";
const task_store = useTASKS();

// Create tasks using the Task class
// const tasks = storeToRefs(task_store.tasks);
const change_selected = (task: any, index: number) => {
  task_store.saveTasks();
  task_store.last_selected_index = task.selected ? index : -1;
  Logger.info(task_store.last_selected_index.toString());
  Logger.info("mouse " + task_store.mouse_nearest_index.toString());
};

const change_settings = (task: any) => {
  init_settings(task);
  task.status = TASK_STATUS.Ready;
  task_store.saveTasks();
};

const openSettings = (task: any) => {
  Logger.info(`Opening settings for task: ${task.id}`);
  Logger.info(JSON.stringify(task));
  // Assuming APP_STORE has an action/mutation to open the panel and set the current task
  // APP_STORE.openSettingsPanel(task);
};

const toggleTaskSelection = (task: any) => {
  if (task_store.has_selected_tasks) {
    task.selected = !task.selected;
  }
};

const clearAllSelections = () => {
  task_store.tasks.forEach((task: any) => {
    task.selected = false;
  });
  task_store.saveTasks(); // 保存狀態
  Logger.info("已取消所有任務選取");
};

// 添加 Shift 鍵事件處理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Shift") {
    // 當 Shift 鍵按下時，找出滑鼠最近的任務索引
    findNearestTaskToMouse();
    Logger.info(`Last index: ${task_store.last_selected_index}`);
    Logger.info(`最近的任務索引: ${task_store.mouse_nearest_index}`);
    Logger.info(task_store.shift_hover_range.toString());
  }
};

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.key === "Shift") {
    // 當 Shift 鍵釋放時，重置 mouse_nearest_index
    task_store.mouse_nearest_index = -1;
    Logger.info(`Last index: ${task_store.last_selected_index}`);
    Logger.info(`最近的任務索引: ${task_store.mouse_nearest_index}`);
    Logger.info(task_store.shift_hover_range.toString());
  }
};

// 找出滑鼠最近的任務索引
const findNearestTaskToMouse = () => {
  const taskItems = document.querySelectorAll(".task-item");
  let closestTask = -1;
  let minDistance = Infinity;

  taskItems.forEach((taskItem, index) => {
    const rect = taskItem.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 計算滑鼠與任務中心點的距離
    const distX = centerX - mouseX;
    const distY = centerY - mouseY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance < minDistance) {
      minDistance = distance;
      closestTask = index;
    }
  });

  task_store.mouse_nearest_index = closestTask;
};

// 追蹤滑鼠位置
let mouseX = 0;
let mouseY = 0;

const handleMouseMove = (event: MouseEvent) => {
  mouseX = event.clientX;
  mouseY = event.clientY;

  // 如果 Shift 鍵被按下，更新最近的任務索引
  if (event.shiftKey) {
    findNearestTaskToMouse();
  }
};

// 組件掛載時添加事件監聽器
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  document.addEventListener("mousemove", handleMouseMove);
});

// 組件卸載時移除事件監聽器
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  document.removeEventListener("mousemove", handleMouseMove);
});
</script>

<style scoped>
/* 主容器樣式 */
.task-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}

/* 任務項目基本布局 */
.task-item {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px solid #eee;
  gap: 10px;
}

.task-item:last-child {
  border-bottom: none;
}

/* 預覽區域相關樣式 */
.preview-container {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 50px;
}

.task-preview {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  transition: box-shadow 0.2s ease-in-out;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}
.shifted {
  background-color: #e74c3c;
  box-shadow: 0 0 0 3px #3498db;
}

.preview-placeholder {
  font-size: 12px;
  color: #fff;
  background-color: lightslategray;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

/* 預覽區域懸停效果 */
.preview-container:hover .task-preview {
  box-shadow: 0 0 0 3px #3498db;
  transition: box-shadow 0.2s ease-in-out;
}

/* 選擇框相關樣式 */
.checkbox-wrapper {
  position: absolute;
  top: 2px;
  left: 2px;
  z-index: 10;
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

/* hover 狀態下顯示白色圓圈帶簍空勾選 */
.select-checkbox:hover {
  background-image: url("../assets/checkbox-hover.svg");
  opacity: 1 !important;
  scale: 1.2;
  transition: scale 0.2s ease-in-out;
}

/* 選中狀態顯示藍色圓圈帶白色勾選 */
.select-checkbox:checked {
  background-image: url("../assets/checkbox-checked.svg") !important;
  background-color: transparent !important;
  opacity: 1 !important;
}

/* 當有任何任務被選中時，所有的 checkbox 都會顯示 */
.task-list.has-selected .select-checkbox {
  opacity: 1 !important;
}

/* 選擇框狀態與交互效果 */
.select-checkbox:hover,
.task-list.has-selected .preview-container:hover .select-checkbox {
  background-image: url("../assets/checkbox-hover.svg");
  opacity: 1 !important;
}

.preview-container:hover .select-checkbox {
  opacity: 1 !important;
}

/* 選中項目高亮效果 */
.preview-container:has(.select-checkbox:checked) .task-preview {
  box-shadow: 0 0 0 3px #3498db;
  transition: box-shadow 0.2s ease-in-out;
}

/* 任務詳情與操作區域 */
.task-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.task-filename {
  font-weight: bold;
  font-size: 14px;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.render-select {
  padding: 3px 5px;
  font-size: 12px;
  max-width: 100px;
}

.settings-button {
  padding: 2px 8px;
  font-size: 14px;
  cursor: pointer;
}

/* 任務狀態樣式 */
.task-status {
  flex-shrink: 0;
  margin-left: auto;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  min-width: 70px;
  text-align: center;
}

/* 不同狀態的顏色 */
.status-preparing {
  background-color: #f0ad4e; /* 橙色 */
}

.status-ready {
  background-color: #5bc0de; /* 藍色 */
}

.status-queued {
  background-color: #9370db; /* 紫色 */
}

.status-rendering {
  background-color: #ff6347; /* 番茄紅 */
}

.status-done {
  background-color: #5cb85c; /* 綠色 */
}

/* 取消選取按鈕樣式 */
.clear-selection-wrapper {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 100;
}

.clear-selection-button {
  background-color: #ff6347;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.clear-selection-button:hover {
  background-color: #e74c3c;
  transform: scale(1.1);
}

.clear-selection-button:active {
  transform: scale(0.95);
}
</style>
