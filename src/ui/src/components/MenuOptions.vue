<template>
  <ul class="menu-options-list">
    <li v-for="(option, index) in options" :key="index" @click="option.action" class="menu-item">
      {{ option.label }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useModalStore } from '../stores/stores'; // 匯入 useModalStore

const modalStore = useModalStore(); // 獲取 modal store 實例

const options = ref([
  { label: '設定', action: () => modalStore.openSettingsPage() }, // 更新 action
  { label: '關於', action: () => modalStore.openAboutPage() },    // 更新 action
  { label: '說明', action: () => modalStore.openHelpPage() },      // 更新 action
]);
</script>

<style scoped>
.menu-options-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.menu-item {
  color: #555;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
  display: block;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

/* 動畫效果 */
.menu-options-list.dropdown-enter-active,
.menu-options-list.dropdown-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.menu-options-list.dropdown-enter-from,
.menu-options-list.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>