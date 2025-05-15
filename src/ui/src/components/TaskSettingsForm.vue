<template>
  <div class="task-settings-form" v-if="tempTask!.videoName">
    <h4>設定 "{{ tempTask!.videoName }}" 的轉檔參數</h4>
    <div class="form-group">
      <label for="renderMethod">渲染方式</label>
      <select id="renderMethod" v-model="tempTask!.renderMethod" :disabled="isTaskInProgress">
        <option value="" disabled selected>選擇處理模式</option>
        <option v-for="method of ACTIONS" :key="method" :value="method">
          {{ method }}
        </option>
      </select>
    </div>
    <!-- 根據選擇的渲染方式顯示不同的設定選項 -->
    <div v-if="tempTask!.renderMethod" class="settings-fields">
      <div></div>
      <div v-for="(setting, index) in tempTask!.settings![tempTask!.renderMethod]" :key="setting.id" class="form-group">
        <!-- container 類型 -->
        <template v-if="setting.type === 'Container'">
          <div class="form-group container-group">
            <div class="container-title" v-if="setting.label">{{ typeof setting.label === 'function' ? setting.label() :
              setting.label }}</div>
            <div class="container-children">
              <div v-for="(child, index) in (setting as Container).children" :key="child.id" class="form-group">
                <SettingControl v-model="(setting as Container).children[index]" />
              </div>
            </div>
          </div>
        </template>

        <!-- 其他 類型 -->
        <SettingControl v-else v-model="tempTask!.settings![tempTask!.renderMethod][index]" />
      </div>
    </div>

    <div class="form-actions">
      <button @click="saveSettings" class="save-button">儲存</button>
      <button @click="$emit('close')" class="cancel-button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTasksBoundEvents } from "../stores/stores";
import { TASK_STATUS, ACTIONS } from "../models/tasks";
import { logger } from "../utils/logger";
import { InputRange, InputText, Selection, Button, Container } from "../models/elements";
import SettingControl from "./SettingControl.vue";

const taskStore = useTasksBoundEvents();
const { tempTask } = storeToRefs(taskStore);

const emit = defineEmits(["close"]);

// 創建本地數據的副本，以便在保存之前進行修改

// 檢查任務是否在進行中（排隊或正在渲染）
const isTaskInProgress = computed(() => {
  return [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
    taskStore.selectedTask!.status
  );
});

// 當組件掛載時，確保設置已初始化
onMounted(() => { });

// 保存設置並更新原始任務
const saveSettings = () => {
  // 停止 tempTask 的reactive更新
  let tempRenderMethod: ACTIONS = tempTask.value!.renderMethod! as ACTIONS
  let tempSettings = tempTask.value!.settings!

  if (
    taskStore.hasTasksSelected &&
    taskStore.selectedTasks.length > 1 &&
    confirm("是否要將相同的設置應用於所有選中的任務？")
  ) {
    taskStore.selectedTasks.forEach((selectedTask) => {
      // 將更改應用到原始任務
      selectedTask!.renderMethod = tempRenderMethod;
      selectedTask!.settings![tempRenderMethod] =
        tempSettings!.clone()[tempRenderMethod];
      // 如果任務尚未準備好，將其標記為就緒
      if (selectedTask!.status === TASK_STATUS.Preparing) {
        selectedTask!.status = TASK_STATUS.Ready;
      }
      logger.debug(`Settings saved for task: ${selectedTask!.id}`);
    });
  } else {
    taskStore.selectedTask!.renderMethod = tempRenderMethod;
    taskStore.selectedTask!.settings![tempRenderMethod] = tempSettings!.clone()[tempRenderMethod];
    logger.debug(`Settings saved for task: ${taskStore.selectedTask!.id}`);

    // 如果任務尚未準備好，將其標記為就緒
    if (taskStore.selectedTask!.status === TASK_STATUS.Preparing) {
      taskStore.selectedTask!.status = TASK_STATUS.Ready;
    }
  }

  // 保存更改到本地存儲
  taskStore.saveTasks();
  emit("close");
};
</script>

<style scoped>
.task-settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #333;
  /* 添加深色文字顏色 */
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

.container-group {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  background-color: #f9f9f9;
  margin-bottom: 8px;
}

.container-title {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 10px;
  color: #444;
}

.container-children {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 8px;
}
</style>
