<template>
  <div class="top-bar">
    <!-- Iterate over Map values -->
    <button
      v-for="button in buttons.values()"
      :key="button.id"
      :class="{
        hidden:
          typeof button.visible === 'boolean'
            ? !button.visible
            : !button.visible(),
      }"
      @click="button.action"
      class="icon-button"
      :disabled="
        typeof button.disabled === 'boolean'
          ? button.disabled
          : button.disabled()
      "
    >
      <i :class="button.icon"></i>
      <span>{{
        typeof button.label === "string" ? button.label : button.label()
      }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "../models/elements";
import { logger } from "../utils/logger";
import {
  useAPP_STATE_inited,
  use_tasks_with_shift,
  useModalStore,
} from "../stores/stores";
import { pywebview } from "../services/pywebview";
import { TASK_STATUS } from "../models/tasks";

const tasks_store = use_tasks_with_shift();
const app_state = useAPP_STATE_inited();
const modalStore = useModalStore();

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
    "Render",
    new Button({
      label: "Render",
      icon: "fas fa-trash",
      action: () => startRender(),
      disabled: () =>
        tasks_store.queued_tasks.length + tasks_store.rendering_tasks.length !=
        0,
    }),
  ],
  [
    "Remove",
    new Button({
      label: () => (tasks_store.has_selected_tasks ? "Remove" : "Clean"),
      icon: "fas fa-trash",
      action: () =>
        tasks_store.has_selected_tasks ? deleteTask() : clearCompletedTasks(),
    }),
  ],
]);

// Update the type of the buttons ref
const buttons = ref<Map<string, Button>>(buttons_data);

const toggleMenu = () => {
  logger.debug("Menu toggled");
  modalStore.openMenu();
};

const addTask = async () => {
  const video_paths = await pywebview.api.open_file_dialog();
  for (const video_path of video_paths) {
    logger.debug(`Adding video: ${video_path}`);
    tasks_store.addTask(video_path);
  }
};

const deleteTask = () => {
  const selected_tasks = [...tasks_store.selected_tasks];
  for (const task of selected_tasks) {
    if ([TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(task.status)) {
      return;
    }
    logger.debug(`Deleting task: ${task.id}`);
    tasks_store.removeTask(task);
  }
};

const clearCompletedTasks = () => {
  const done_tasks = [...tasks_store.done_tasks];
  for (const task of done_tasks) {
    logger.debug(`Deleting done task: ${task.id}`);
    tasks_store.removeTask(task);
  }
};

const startRender = async () => {
  const ready_tasks = [...tasks_store.ready_tasks];
  for (const task of ready_tasks) {
    logger.debug(`Queue task: ${task.id}`);
    task.status = TASK_STATUS.Queued;
  }

  const queued_tasks = [...tasks_store.queued_tasks];
  for (const task of queued_tasks) {
    logger.debug(`Rendering task: ${task.id}`);
    task.status = TASK_STATUS.Rendering;
    // Add a delay to simulate the rendering process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    task.status = TASK_STATUS.Done;
  }
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

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #9aa0a6;
}

.icon-button:disabled:hover {
  color: #9aa0a6;
}

.hidden {
  display: none;
}
</style>
