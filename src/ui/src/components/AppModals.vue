<template>
  <teleport to="body">
    <!-- Menu Modal -->
    <div
      v-if="modalStore.activeModals.menu.isOpen"
      class="modal-overlay"
      @click.self="modalStore.closeMenu()"
    >
      <div class="modal-content menu-modal">
        <div class="modal-header">
          <h3>選單</h3>
          <button @click="modalStore.closeMenu()" class="close-button">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <!-- 選單內容將在這裡顯示 -->
          <div class="menu-items">
            <button class="menu-item">設定</button>
            <button class="menu-item">關於</button>
            <button class="menu-item">說明</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Settings Modal -->
    <div
      v-if="modalStore.activeModals.taskSettings.isOpen"
      class="modal-overlay"
      @click.self="modalStore.closeTaskSettings()"
    >
      <div class="modal-content settings-modal">
        <div class="modal-header">
          <h3>任務設定</h3>
          <button @click="modalStore.closeTaskSettings()" class="close-button">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <TaskSettingsForm
            v-if="modalStore.activeModals.taskSettings.taskData"
            :task="modalStore.activeModals.taskSettings.taskData"
            @close="modalStore.closeTaskSettings()"
          />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useModalStore } from "../stores/stores";
import TaskSettingsForm from "./TaskSettingsForm.vue";

const modalStore = useModalStore();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  width: 90%;
  max-width: 500px;
  animation: modal-appear 0.3s ease;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #555;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: #000;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
  max-height: 70vh;
}

/* 特定模態框的自定義樣式 */
.settings-modal {
  max-width: 600px; /* 設定對話框可以更寬一些 */
}

.menu-modal {
  max-width: 300px; /* 選單對話框可以窄一些 */
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  padding: 12px;
  text-align: left;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
