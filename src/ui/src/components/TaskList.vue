<template>
  <div class="task-list">
    <ul>
      <li v-for="task in tasks" :key="task.id" class="task-item">
        <div class="task-preview">
          <!-- Placeholder for video preview -->
          <img
            v-if="task.previewUrl"
            :src="task.previewUrl"
            alt="Preview"
            class="preview-image"
          />
          <div v-else class="preview-placeholder">No Preview</div>
        </div>
        <div class="task-details">
          <span class="task-filename">{{ task.name }}</span>
          <div class="task-actions">
            <select
              v-model="task.renderMethod"
              class="render-select"
              @change="init_settings(task)"
            >
              <option value="" disabled selected>Please select</option>
              <option v-for="method in ACTIONS" :key="method" :value="method">
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
import { useCONSTANTS, useTASKS } from "../stores/app";
import { init_settings } from "../models/task_setting"; // Import the init_settings function
import { TASK_STATUS } from "../models/tasks"; // Import the TASK_STATUS enum

const APP_STORE = useCONSTANTS();
const ACTIONS = APP_STORE?.constants?.ACTIONS;
const TASKS_STORE = useTASKS();

// Create tasks using the Task class
let tasks = TASKS_STORE.tasks;

const openSettings = (task: any) => {
  Logger.info(`Opening settings for task: ${task.id}`);
  Logger.info(JSON.stringify(task));
  // Assuming APP_STORE has an action/mutation to open the panel and set the current task
  // APP_STORE.openSettingsPanel(task);
};
</script>

<style scoped>
.task-list {
  max-height: 400px; /* Adjust height as needed */
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 10px 5px; /* Adjusted padding */
  border-bottom: 1px solid #eee;
  gap: 10px; /* Add space between elements */
}

.task-item:last-child {
  border-bottom: none;
}

.task-preview {
  flex-shrink: 0;
  width: 80px; /* Adjust size as needed */
  height: 50px; /* Adjust size as needed */
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  font-size: 12px;
  color: #888;
}

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
  max-width: 100px; /* Limit width */
}

.settings-button {
  padding: 2px 8px;
  font-size: 14px;
  cursor: pointer;
}

.task-status {
  flex-shrink: 0;
  margin-left: auto; /* Push status to the right */
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  min-width: 70px; /* Ensure consistent width */
  text-align: center;
}

.status-preparing {
  background-color: #f0ad4e; /* Orange */
}

.status-ready {
  background-color: #5bc0de; /* Blue */
}

.status-done {
  background-color: #5cb85c; /* Green */
}
</style>
