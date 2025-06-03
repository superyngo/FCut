<template>
  <ul class="menu-options-list">
    <li v-for="(option, index) in options" :key="index" @click="option.action" class="menu-item">
      {{ $t(option.label) }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useModalStore, useAppState } from '../stores/stores'; // 匯入 useModalStore 和 useAppState

const modalStore = useModalStore(); // 獲取 modal store 實例
const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數

const options = ref([
  { label: 'menu.options.settings', action: () => modalStore.openSettingsPage() }, // 更新 action
  { label: 'menu.options.about', action: () => modalStore.openAboutPage() },    // 更新 action
  { label: 'menu.options.help', action: () => modalStore.openHelpPage() },      // 更新 action
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
  color: var(--app-text-color);
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
  display: block;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid var(--app-border-color);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: var(--app-hover-color);
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