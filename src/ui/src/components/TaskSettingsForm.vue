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

    <!-- 使用新的ACTION設定組件系統 -->
    <div v-if="tempTask!.renderMethod" class="settings-fields">
      <ActionSettings :task="tempTask" :disabled="isTaskInProgress" @update:settings="handleSettingsUpdate"
        @validation-error="handleValidationError" ref="actionSettingsRef" />
    </div>

    <!-- 驗證錯誤提示 -->
    <div v-if="validationError" class="validation-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>{{ validationError }}</span>
    </div>

    <div class="form-actions">
      <button @click="saveSettings" class="save-button">儲存</button>
      <button @click="closeTaskSetting" class="cancel-button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useTasks, useModalStore } from "../stores/stores";
import { TASK_STATUS, ACTIONS } from "../models/tasks";
import { logger } from "../utils/logger";
import { ActionSettings } from "./action-settings";

const modalStore = useModalStore();
const taskStore = useTasks();
const { tempTask } = storeToRefs(taskStore);

const actionSettingsRef = ref<InstanceType<typeof ActionSettings> | null>(null);
const validationError = ref<string>('');

const closeTaskSetting = () => {
  // 使用 store 的 closeTaskSettings 函數來正確清理 tempTask
  modalStore.closeTaskSettings();
};

// 檢查任務是否在進行中（排隊或正在渲染）
const isTaskInProgress = computed(() => {
  return [TASK_STATUS.Queued, TASK_STATUS.Rendering].includes(
    taskStore.selectedTask!.status
  );
});

// 處理設定更新
const handleSettingsUpdate = (settings: any) => {
  // 允許更新 tempTask 以讓使用者看到變更
  // 但只有在點擊儲存時才會將變更應用到原始任務
  if (tempTask.value && tempTask.value.renderMethod && tempTask.value.settings) {
    tempTask.value.settings.updateActionSettings(tempTask.value.renderMethod as ACTIONS, settings);
  }
  logger.debug('Settings updated in tempTask:', settings);
};

// 處理驗證錯誤
const handleValidationError = (message: string) => {
  // 簡化錯誤處理邏輯，直接更新或清除錯誤訊息
  validationError.value = message;
};

// 監聽ACTION切換，進行驗證和格式化
let previousRenderMethod: string | null = null;
let isInitializing = true;
let isRestoring = false; // 新增標誌來防止恢復操作觸發錯誤清除

// 確保組件引用已準備好的輔助函數
const waitForComponentReady = async (maxRetries = 10): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    if (actionSettingsRef.value) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  return false;
};

watch(() => tempTask.value?.renderMethod, async (newMethod, oldMethod) => {
  // 第一次執行時跳過驗證，只記錄當前方法
  if (isInitializing) {
    previousRenderMethod = newMethod || null;
    isInitializing = false;
    return;
  }

  // 如果是恢復操作觸發的，跳過處理但保持錯誤訊息
  if (isRestoring) {
    isRestoring = false;
    return;
  }
  // 如果有之前的ACTION且需要進行驗證，在切換之前檢查當前組件
  if (previousRenderMethod && previousRenderMethod !== "" && actionSettingsRef.value) {
    // 直接驗證當前顯示的ACTION組件（這是舊的ACTION）
    const validation = actionSettingsRef.value.validate();
    if (!validation.valid) {
      // 驗證失敗，阻止切換
      const errorMessage = `請先修復 ${previousRenderMethod} 的設定錯誤：${validation.message || '設定驗證失敗'}`;
      validationError.value = errorMessage;

      // 恢復到之前的方法，阻止切換
      isRestoring = true;
      nextTick(() => {
        if (tempTask.value) {
          tempTask.value.renderMethod = previousRenderMethod as ACTIONS;
        }
      });
      return;
    } else {
      // 驗證成功，保存舊的 ACTION 設定到 tempTask
      const formattedSettings = actionSettingsRef.value.getSettings();
      if (tempTask.value && tempTask.value.settings) {
        tempTask.value.settings.updateActionSettings(previousRenderMethod as ACTIONS, formattedSettings);
      }
      logger.debug(`Validation passed and settings saved for action: ${previousRenderMethod}`, formattedSettings);
      validationError.value = '';
    }
  } else {
    validationError.value = '';
  }

  // 更新previousRenderMethod
  previousRenderMethod = newMethod || null;

  // 等待新組件載入並檢查其狀態
  if (newMethod) {
    await nextTick();
    await nextTick();

    setTimeout(async () => {
      const newComponentReady = await waitForComponentReady();
      if (newComponentReady && actionSettingsRef.value) {
        const validation = actionSettingsRef.value.validate();
        if (!validation.valid) {
          validationError.value = validation.message || '當前設定有錯誤';
        }
      }
    }, 100);
  }
}, { immediate: true });

// 保存設置並更新原始任務
const saveSettings = () => {
  // 驗證設定（現在阻止保存）
  if (actionSettingsRef.value) {
    const validation = actionSettingsRef.value.validate();
    if (!validation.valid) {
      validationError.value = validation.message || '設定驗證失敗';
      // 阻止保存操作
      return;
    }
  }

  // 獲取當前設定（在這裡會進行時間戳格式化）
  const currentSettings = actionSettingsRef.value?.getSettings() || {};
  const tempRenderMethod: ACTIONS = tempTask.value!.renderMethod! as ACTIONS;
  if (
    tempTask.value!.selected &&
    taskStore.selectedTasks.length > 1 &&
    confirm("是否要將相同的設置應用於所有選中的任務？")
  ) {
    taskStore.selectedTasks.forEach((selectedTask) => {
      // 直接使用新的簡化設定格式
      selectedTask!.renderMethod = tempRenderMethod;
      selectedTask!.settings!.updateActionSettings(tempRenderMethod, currentSettings);

      // 如果任務尚未準備好，將其標記為就緒
      if (selectedTask!.status === TASK_STATUS.Preparing) {
        selectedTask!.status = TASK_STATUS.Ready;
      }
      logger.debug(`Settings saved for task: ${selectedTask!.id}`, {
        action: tempRenderMethod,
        newSettings: currentSettings
      });
    });
  } else {
    // 直接使用新的簡化設定格式
    taskStore.selectedTask!.renderMethod = tempRenderMethod;
    taskStore.selectedTask!.settings!.updateActionSettings(tempRenderMethod, currentSettings);

    logger.debug(`Settings saved for task: ${taskStore.selectedTask!.id}`, {
      action: tempRenderMethod,
      newSettings: currentSettings
    });

    // 如果任務尚未準備好，將其標記為就緒
    if (taskStore.selectedTask!.status === TASK_STATUS.Preparing) {
      taskStore.selectedTask!.status = TASK_STATUS.Ready;
    }
  }

  // 保存更改到本地存儲
  taskStore.saveTasks();
  closeTaskSetting();
};
</script>

<style scoped>
.task-settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #333;
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
}

.validation-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #d73927;
  /* 改為紅色字體 */
}

.validation-error i {
  color: #d73927;
  /* 圖標也改為紅色 */
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
