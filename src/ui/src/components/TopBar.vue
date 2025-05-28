<template>
  <div class="top-bar">
    <!-- 左側菜單 -->
    <div class="left-section">
      <button @click="toggleMenu" class="icon-button" title="菜單">
        <img src="../assets/menu-hamburger.svg" alt="菜單" />
      </button>
    </div>

    <!-- 右側操作區 -->
    <div class="right-section">
      <button @click="addTask" class="icon-button" title="新增檔案">
        <img src="../assets/add-icon.svg" alt="新增" />
        <span>新增</span>
      </button>

      <button @click="startRender" class="icon-button render-button"
        :disabled="taskStore.queuedTasks.length + taskStore.renderingTasks.length != 0"
        :title="taskStore.hasTasksSelected ? '開始處理選取的檔案' : '開始處理所有檔案'">
        <img src="../assets/render-icon.svg" alt="處理" />
        <span>{{ taskStore.hasTasksSelected ? "Render" : "Render All" }}</span>
      </button>

      <button @click="taskStore.hasTasksSelected ? deleteTask() : clearDoneTasks()" class="icon-button remove-button"
        :title="taskStore.hasTasksSelected ? '刪除選取' : '刪除所有'">
        <img src="../assets/trash-icon.svg" alt="刪除" />
        <span>{{ taskStore.hasTasksSelected ? "Remove" : "Clear Done" }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logger } from "../utils/logger";
import { useTasks, useModalStore, useAppState } from "../stores/stores";
import { pywebview } from "../services/pywebview";
import { TASK_STATUS } from "../models/tasks";
import { getFileType, FileType } from "../utils/types";
import { createFileTypeWarningMessage } from "../utils/messageHelpers";

const taskStore = useTasks();
const modalStore = useModalStore();
const appState = useAppState();

const toggleMenu = () => {
  logger.debug("Menu toggled");
  modalStore.openMenu();
};

const addTask = async () => {
  const video_paths = await pywebview.api.open_file_dialog();
  if (!video_paths) {
    logger.debug("No video paths selected");
    return;
  } for (const videoPath of video_paths) {
    // 檢查檔案類型
    const fileType = getFileType(videoPath);
    if (fileType === FileType.UNKNOWN) {
      const message = createFileTypeWarningMessage(videoPath, 70); // 限制長度為70字符
      appState.addMessage(message);
      logger.warning(message);
      continue; // 跳過這個檔案，繼續處理下一個
    }

    logger.debug(`Adding video: ${videoPath}`);
    taskStore.addTask(videoPath);
  }
};

const deleteTask = () => {
  const selectedTasks = [...taskStore.selectedTasks];
  for (const task of selectedTasks) {
    if ([TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(task.status)) {
      return;
    }
    logger.debug(`Deleting task: ${task.id}`);
    taskStore.removeTask(task);
  }
};

const clearDoneTasks = () => {
  const doneTasks = [...taskStore.doneTasks]
  doneTasks.forEach((task) => {
    taskStore.removeTask(task);
    logger.debug(`Clearing done task: ${task.id}`);
  });
  taskStore.selectedTaskID = null
  taskStore.lastSelectedIndex = -1
};

const startRender = async () => {
  const readyTasks = taskStore.hasTasksSelected ? [...taskStore.selectedReadyTasks] : [...taskStore.readyTasks];
  for (const task of readyTasks) {
    logger.debug(`Queue task: ${task.id}`);
    task.status = TASK_STATUS.Queued;
  }

  const queuedTasks = [...taskStore.queuedTasks];
  for (const task of queuedTasks) {
    logger.debug(`Rendering task: ${task.id}`);
    task.status = TASK_STATUS.Rendering;
    // Add a delay to simulate the rendering process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    task.status = TASK_STATUS.Done;
  }
};

// // Use a Map for buttonsData
// const buttonsData = new Map<string, Button>([
//   [
//     "Menu",
//     new Button({
//       label: "Menu",
//       icon: "fas fa-bars",
//       action: toggleMenu
//     }),
//   ],
//   [
//     "Add",
//     new Button({
//       label: "➕",
//       icon: "fas fa-plus",
//       action: addTask
//     }),
//   ],
//   [
//     "Render",
//     new Button({
//       label: "Render",
//       icon: "fas fa-trash",
//       action: startRender,
//       disabled: function renderButtonDisableHandle() { return taskStore.queuedTasks.length + taskStore.renderingTasks.length != 0 }
//     }),
//   ],
//   [
//     "Remove",
//     new Button({
//       label: function hasTasksSelectedToLabel() { return (taskStore.hasTasksSelected ? "Remove" : "Clean") },
//       icon: "fas fa-trash",
//       action: function hasTasksSelectedToAction() {
//         return taskStore.hasTasksSelected ? deleteTask() : clearDoneTasks()
//       }
//     }),
//   ],
// ]);

// // Update the type of the buttons ref
// const buttons = ref<Map<string, Button>>(buttonsData);


</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #171717;
  border-bottom: 1px solid #333;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
  box-sizing: border-box;
  max-width: 100vw;
  /* 確保不會超出視窗寬度 */
  overflow: hidden;
  /* 防止內容溢出 */
}

.left-section {
  display: flex;
  align-items: center;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 12px 12px;
  /* 增加上下間距 */
  cursor: pointer;
  color: #ffffff;
  font-size: 12px;
  transition: all 0.2s ease;
  height: 60px;
  /* 統一寬度 */
  width: 90px;
}

.icon-button img {
  width: 20px;
  height: 20px;
  margin-bottom: 5px;
  filter: invert(1);
  /* 將 SVG 轉為白色 */
  transition: transform 0.2s;
}

.icon-button:hover {
  background-color: #3a3a3a;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.icon-button:hover img {
  transform: scale(1.1);
}

.icon-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 
.menu-button {
  width: 85px;
  background: none;
  border: none;
  min-width: auto;
  width: auto;
}

.menu-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
} */

.render-button {
  background-color: #2c5282;
  border-color: #2a4365;
  font-weight: 500;
}

.render-button:hover {
  background-color: #3182ce;
}

.remove-button {
  background-color: #9b2c2c;
  border-color: #822727;
  font-weight: 500;
}

.remove-button:hover {
  background-color: #e53e3e;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #333333 !important;
  transform: none;
  box-shadow: none;
}

.hidden {
  display: none;
}
</style>
