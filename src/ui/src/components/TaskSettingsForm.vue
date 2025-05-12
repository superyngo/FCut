<template>
  <div class="task-settings-form" v-if="taskStore.selectedTask?.videoName">
    <h4>設定 "{{ taskStore.selectedTask!.videoName }}" 的轉檔參數</h4>
    <div class="form-group">
      <label for="renderMethod">渲染方式</label>
      <select
        id="renderMethod"
        v-model="tempRenderMethod"
        :disabled="isTaskInProgress"
      >
        <option value="" disabled>請選擇</option>
        <option v-for="method of ACTIONS" :key="method" :value="method">
          {{ method }}
        </option>
      </select>
    </div>
    <!-- 根據選擇的渲染方式顯示不同的設定選項 -->
    <div v-if="tempRenderMethod" class="settings-fields">
      <div></div>
      <div
        v-for="setting in tempSettings![tempRenderMethod]"
        :key="setting.id"
        class="form-group"
      >
        <!-- 針對 InputRange 類型 -->
        <template v-if="setting.type === 'InputRange'">
          <label :for="setting.id">{{ setting.label }}</label>
          <div class="range-container">
            <input
              type="range"
              :id="setting.id"
              v-model.number="setting.value"
              :min="(setting as InputRange).min"
              :max="(setting as InputRange).max"
              :step="(setting as InputRange).step"
            />
            <span>{{ setting.value }}</span>
          </div>
        </template>

        <!-- 針對 InputText 類型 -->
        <template v-else-if="setting.type === 'InputText'">
          <label :for="setting.id">{{ setting.label }}</label>
          <input
            type="text"
            :id="setting.id"
            v-model="setting.value"
            :placeholder="setting.label"
          />
        </template>
      </div>
    </div>

    <div class="form-actions">
      <button @click="saveSettings" class="save-button">儲存</button>
      <button @click="$emit('close')" class="cancel-button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useTasksBoundEvents } from "../stores/stores";
import { TASK_STATUS, ACTIONS } from "../models/tasks";
import { logger } from "../utils/logger";
import { InputRange } from "../models/elements";
import { TaskSettings } from "../models/tasks";

const taskStore = useTasksBoundEvents();
let tempRenderMethod = ref<ACTIONS | "">(taskStore.selectedTask?.renderMethod!);
let tempSettings: TaskSettings | null = reactive(
  taskStore.selectedTask!.settings!.clone()
);
const emit = defineEmits(["close"]);

// 創建本地數據的副本，以便在保存之前進行修改

// 檢查任務是否在進行中（排隊或正在渲染）
const isTaskInProgress = computed(() => {
  return [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
    taskStore.selectedTask!.status
  );
});

// 當組件掛載時，確保設置已初始化
onMounted(() => {});

// 保存設置並更新原始任務
const saveSettings = () => {
  if (
    taskStore.hasTasksSelected &&
    taskStore.selectedTasks.length > 1 &&
    confirm("是否要將相同的設置應用於所有選中的任務？")
  ) {
    taskStore.selectedTasks.forEach((selectedTask) => {
      // 將更改應用到原始任務
      selectedTask!.renderMethod = tempRenderMethod.value as ACTIONS;
      selectedTask!.settings![tempRenderMethod.value as ACTIONS] =
        tempSettings!.clone()[tempRenderMethod.value as ACTIONS];

      // 如果任務尚未準備好，將其標記為就緒
      if (selectedTask!.status === TASK_STATUS.Preparing) {
        selectedTask!.status = TASK_STATUS.Ready;
      }
    });
    logger.debug(`Settings saved for task: ${taskStore.selectedTask!.id}`);
  } else {
    taskStore.selectedTask!.renderMethod = tempRenderMethod.value as ACTIONS;
    taskStore.selectedTask!.settings![tempRenderMethod.value as ACTIONS] =
      tempSettings!.clone()[tempRenderMethod.value as ACTIONS];
    tempSettings = null;

    // 如果任務尚未準備好，將其標記為就緒
    if (taskStore.selectedTask!.status === TASK_STATUS.Preparing) {
      taskStore.selectedTask!.status = TASK_STATUS.Ready;
    }
  }

  // 保存更改到本地存儲
  taskStore.saveTasks();
  logger.debug(`Settings saved for task: ${taskStore.selectedTask!.id}`);
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
