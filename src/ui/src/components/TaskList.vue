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
        v-for="(task, index) in task_store.tasks"
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
            :class="{ shifted: task_store.shift_hover_range.includes(index) }"
            @click="toggleTaskSelection(task, index)"
          >
            <!-- Placeholder for video preview -->
            <img
              v-if="task.previewUrl"
              :src="task.previewUrl"
              alt="Preview"
              class="preview-image"
            />
            <div v-else class="preview-placeholder">No Preview</div>
          </div>
        </div>
        <div class="task-details">
          <span class="task-filename">{{ task.video_name }}</span>
          <div class="task-actions">
            <select
              v-model="task.renderMethod"
              class="render-select"
              @change="change_settings(task)"
              :disabled="
                [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
                  task.status
                )
              "
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
import { Logger } from "../utils/logger";
import { use_tasks_with_shift } from "../stores/stores";
import { init_settings } from "../models/task_setting";
import { TASK_STATUS } from "../models/tasks";
import { ACTIONS } from "../models/task_setting";
const task_store = use_tasks_with_shift();

const change_settings = (task: any) => {
  if (task_store.has_selected_tasks) {
    const method = task.renderMethod;
    task_store.selected_tasks.forEach((task: any) => {
      if ([TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(task.status)) {
        return;
      }
      task.renderMethod = method;
      init_settings(task);
      task.status = TASK_STATUS.Ready;
    });
  } else {
    init_settings(task);
    task.status = TASK_STATUS.Ready;
  }
  task_store.saveTasks();
};

const openSettings = (task: any) => {
  Logger.info(`Opening settings for task: ${task.id}`);
  Logger.info(JSON.stringify(task));
};
// Create tasks using the Task class
const change_selected = (task: any, index: number) => {
  toggleTaskSelection(task, index, false);
};

const toggleTaskSelection = (
  task: any,
  index: number,
  toggle: boolean = true
) => {
  if ((task_store.has_selected_tasks || task_store.shift_on) && toggle) {
    task.selected = !task.selected;
  }
  if (
    !task.selected &&
    task_store.shift_hover_range.length > 0 &&
    task_store.shift_hover_range_handle
  ) {
    task_store.shift_hover_range.forEach((index: number) => {
      task_store.tasks[index].selected = false;
    });
  } else if (task_store.shift_hover_range.length > 0) {
    task_store.shift_hover_range.forEach((index: number) => {
      task_store.tasks[index].selected = true;
    });
  }
  task_store.last_selected_index = task.selected ? index : -1;
  task_store.saveTasks();
};

const clearAllSelections = () => {
  task_store.tasks.forEach((task: any) => {
    task.selected = false;
  });
  task_store.saveTasks();
  task_store.last_selected_index = -1;
  Logger.info("已取消所有任務選取");
};
</script>

<style scoped>
/* 主容器樣式 */
.task-list {
  max-height: 100vh;
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

/* 當 checkbox 被勾選時，preview-placeholder 的 scale 變成 0.9 */
.preview-container:has(.select-checkbox:checked)
  .task-preview
  .preview-placeholder {
  scale: 0.9;
  transition: scale 0.2s ease-in-out;
}

/* 預覽區域懸停效果 */
.preview-container:hover .task-preview {
  box-shadow: 0 0 0 3px #3498db;
  transition: box-shadow 0.2s ease-in-out;
}

.shifted {
  box-shadow: 0 0 0 3px #3498db;
}

/* 當 task-preview 有 shifted 類時，讓同一個 preview-container 中的 checkbox 顯示 hover 狀態 */
.preview-container:has(.task-preview.shifted)
  .checkbox-wrapper
  .select-checkbox {
  background-image: url("../assets/checkbox-hover.svg");
  opacity: 1 !important;
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
