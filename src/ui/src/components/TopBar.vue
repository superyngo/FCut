<template>
  <div class="top-bar">
    <!-- Iterate over Map values -->
    <button
      v-for="button in buttons.values()"
      :key="button.id"
      :class="{ hidden: !button.visible() }"
      @click="button.action"
      class="icon-button"
    >
      <i :class="button.icon"></i>
      <span>{{ button.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "../models/elements";
import { Logger } from "../utils/logger";
import { useTASKS, useAPP_STATE } from "../stores/stores";
import { pywebview } from "../services/pywebview";

const tasks_store = useTASKS();
const app_state = useAPP_STATE();

// Use a Map for buttons_data
const buttons_data = new Map<string, Button>([
  [
    "Menu",
    new Button({
      label: "Menu",
      icon: "fas fa-bars",
      action: () => toggleMenu(),
    }),
  ],
  [
    "Add",
    new Button({
      label: "➕",
      icon: "fas fa-plus",
      action: () => addTask(),
    }),
  ],
  [
    "Delete",
    new Button({
      label: "➖",
      icon: "fas fa-minus",
      action: () => deleteTask(),
      visible: () => tasks_store.has_selected_tasks, // Keep initial visibility state
    }),
  ],
  [
    "Start",
    new Button({
      label: "Start",
      icon: "fas fa-trash",
      action: () => startRender(),
    }),
  ],
  [
    "Clear",
    new Button({
      label: "Clear",
      icon: "fas fa-trash",
      action: () => clearCompletedTasks(),
    }),
  ],
]);

// Update the type of the buttons ref
const buttons = ref<Map<string, Button>>(buttons_data);

const toggleMenu = () => {
  Logger.info("Menu toggled");
  app_state.isMenuVisible = !app_state.isMenuVisible;
};

const addTask = async () => {
  const video_paths = await pywebview.api.open_file_dialog();
  for (const video_path of video_paths) {
    Logger.info(`Adding video: ${video_path}`);
    tasks_store.addTask(video_path);
  }
  Logger.info("Task added");
};

const deleteTask = () => {
  const selected_tasks = [...tasks_store.selected_tasks];
  for (const task of selected_tasks) {
    Logger.info(`Deleting task: ${task.id}`);
    tasks_store.removeTask(task);
  }
};

const clearCompletedTasks = () => {
  Logger.info("Completed tasks cleared");
  // Logic to clear all completed tasks
  // Hide delete button after clearing
};

const startRender = () => {
  console.log("Render started");
  // Logic to start rendering tasks
};
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #5f6368;
  font-size: 14px;
}

.icon-button i {
  font-size: 20px;
  margin-bottom: 5px;
}

.icon-button:hover {
  color: #1a73e8;
}

.hidden {
  display: none;
}
</style>
