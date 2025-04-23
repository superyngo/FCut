<template>
  <div class="task-list">
    <ul>
      <li v-for="task in task_store.tasks" :key="task.id" class="task-item">
        <!-- Wrap preview in a container for positioning and hover detection -->
        <div class="preview-container">
          <!-- Checkbox positioned at the top-left -->
          <input
            type="checkbox"
            v-model="task.selected"
            @change=""
            class="select-checkbox"
            :class="{ 'is-selected': task.selected }"
            title="Select Task"
          />
          <div class="task-preview" @click="toggleTaskSelection(task)">
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
              @change="chage_settings(task)"
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
import { useTASKS } from "../stores/stores";
import { init_settings } from "../models/task_setting"; // Import the init_settings function
import { TASK_STATUS } from "../models/tasks"; // Import the TASK_STATUS enum
import { ACTIONS } from "../models/task_setting";
const task_store = useTASKS();

// Create tasks using the Task class
// const tasks = storeToRefs(task_store.tasks);

const chage_settings = (task: any) => {
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
  task.selected = !task.selected;
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

/* New container for preview and checkbox */
.preview-container {
  position: relative; /* Needed for absolute positioning of the checkbox */
  flex-shrink: 0;
  width: 80px; /* Match task-preview width */
  height: 50px; /* Match task-preview height */
}

/* Style for the checkbox */
.select-checkbox {
  position: absolute;
  top: 2px;
  left: 2px;
  z-index: 10; /* Ensure checkbox is above the preview */
  opacity: 0; /* Hidden by default */
  cursor: pointer;
  transition: opacity 0.2s ease-in-out; /* Smooth transition */
}

/* Show checkbox on container hover OR if it's selected */
.preview-container:hover .select-checkbox,
.select-checkbox.is-selected {
  opacity: 1;
}

/* Add hover effect to task-preview */
.preview-container:hover .task-preview {
  box-shadow: 0 0 0 3px #3498db;
  transition: box-shadow 0.2s ease-in-out;
}

/* Add persistent highlight effect for selected tasks */
.select-checkbox:checked ~ .task-preview {
  box-shadow: 0 0 0 3px #3498db; /* Green highlight for selected items */
  transition: box-shadow 0.2s ease-in-out;
}

.task-preview {
  width: 100%; /* Take full width of container */
  height: 100%; /* Take full height of container */
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px; /* Rounded corners */
  transition: box-shadow 0.2s ease-in-out; /* Smooth transition for hover effect */
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

.status-queued {
  background-color: #9370db; /* Medium Purple */
}

.status-rendering {
  background-color: #ff6347; /* Tomato Red */
}

.status-done {
  background-color: #5cb85c; /* Green */
}
</style>
