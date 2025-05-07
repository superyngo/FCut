<template>
  <div class="task-settings-form">
    <h4>設定 "{{ tempTask.videoName }}" 的轉檔參數</h4>
    <div class="form-group">
      <label for="renderMethod">渲染方式</label>
      <select
        id="renderMethod"
        v-model="tempTask.renderMethod"
        :disabled="isTaskInProgress"
        @change="change_settings(tempTask)"
      >
        <option value="" disabled>請選擇</option>
        <option v-for="method of ACTIONS" :key="method" :value="method">
          {{ method }}
        </option>
      </select>
    </div>

    <!-- 根據選擇的渲染方式顯示不同的設定選項
    <div v-if="tempTask.renderMethod" class="settings-fields">
      <div class="form-group">
        <label for="outputFormat">輸出格式</label>
        <select id="outputFormat" v-model="tempTask.settings!">
          <option value="mp4">MP4</option>
          <option value="mov">MOV</option>
          <option value="webm">WebM</option>
        </select>
      </div>

      <div class="form-group">
        <label for="quality">品質</label>
        <input
          type="range"
          id="quality"
          v-model.number="tempTask.settings.quality"
          min="1"
          max="100"
          step="1"
        />
        <span>{{ tempTask.settings.quality }}%</span>
      </div> -->

    <!-- 更多設定選項可以根據需求添加 -->
    <!-- </div> -->

    <div class="form-actions">
      <button @click="saveSettings" class="save-button">儲存</button>
      <button @click="$emit('close')" class="cancel-button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTasksBoundEvents } from "../stores/stores";
import { Task, TASK_STATUS } from "../models/tasks";
import {
  ACTIONS,
  initTaskSettings,
  TaskSettingType,
} from "../models/taskSetting";
import { logger } from "../utils/logger";
const { task } = defineProps<{
  task: Task;
}>();
const emit = defineEmits(["close", "save"]);

const taskStore = useTasksBoundEvents();

// 創建本地數據的副本，以便在保存之前進行修改
const tempTask = ref<Task>(new Task({ ...task }));
// 檢查任務是否在進行中（排隊或正在渲染）
const isTaskInProgress = computed(() => {
  return [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
    task.status as TASK_STATUS
  );
});
// 建立task settings的快取
const taskSettingsCache = ref<Record<ACTIONS, TaskSettingType> | {}>({});

const change_settings = (task: Task) => {
  if (taskStore.hasTasksSelected) {
    const method = task.renderMethod;
    taskStore.selectedTasks.forEach((selectedTask) => {
      if (
        [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
          selectedTask.status
        )
      ) {
        return;
      }
      selectedTask.renderMethod = method;
      initTaskSettings(selectedTask as Task);
      selectedTask.status = TASK_STATUS.Ready;
    });
  } else {
    initTaskSettings(task);
    task.status = TASK_STATUS.Ready;
  }
  taskStore.saveTasks();
};

// 當組件掛載時，確保設置已初始化
onMounted(() => {
  if (task.renderMethod && !task.settings) {
    initTaskSettings(task);
  }
});

// 保存設置並更新原始任務
const saveSettings = () => {
  // 將更改應用到原始任務
  task.renderMethod = tempTask.value.renderMethod;
  task.settings = tempTask.value.settings?.clone();

  // 如果任務尚未準備好，將其標記為就緒
  if (task.status === TASK_STATUS.Preparing) {
    task.status = TASK_STATUS.Ready;
  }

  // 如果還有其他選中的任務，詢問是否將相同的設置應用於它們
  // if (taskStore.hasTasksSelected && taskStore.selectedTasks.length > 1) {
  //   const applyToAll = confirm("是否要將相同的設置應用於所有選中的任務？");
  //   if (applyToAll) {
  //     taskStore.selectedTasks.forEach((selectedTask) => {
  //       if (
  //         selectedTask.id !== props.task.id &&
  //         ![TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
  //           selectedTask.status
  //         )
  //       ) {
  //         selectedTask.renderMethod = tempTask.value.renderMethod;
  //         selectedTask.settings = tempTask.value.settings as TaskSettingType;
  //         selectedTask.status = TASK_STATUS.Ready;
  //       }
  //     });
  //   }
  // }

  // 保存更改到本地存儲
  taskStore.saveTasks();

  logger.debug(`Settings saved for task: ${props.task.id}`);
  emit("save");
  emit("close");
};
</script>

<style scoped>
.task-settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #333; /* 添加深色文字顏色 */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.form-group select,
.form-group input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.settings-fields {
  margin-top: 8px;
  border-top: 1px solid #eee;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.save-button,
.cancel-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.save-button {
  background-color: #4caf50;
  color: white;
}

.save-button:hover {
  background-color: #45a049;
}

.cancel-button {
  background-color: #f1f1f1;
  color: #333;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}
</style>
