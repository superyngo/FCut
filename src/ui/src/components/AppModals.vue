<template>
  <!-- Menu Modal -->
  <BaseModal v-if="modalStore.activeModals.menu.isOpen" v-model:is-open="modalStore.activeModals.menu.isOpen"
    :title="modalStore.activeModals.menu.title" modal-class="menu-modal" :content-style="modalStore.menuModalStyle">
    <MenuOptions />
  </BaseModal>

  <!-- Task Settings Modal -->
  <BaseModal v-if="modalStore.activeModals.taskSettings.isOpen"
    v-model:is-open="modalStore.activeModals.taskSettings.isOpen" :title="modalStore.activeModals.taskSettings.title"
    modal-class="settings-modal" :content-style="modalStore.settingsModalStyle">
    <TaskSettingsForm v-if="taskStore.tempTask" />
  </BaseModal>

  <!-- Settings Page Modal -->
  <BaseModal v-if="modalStore.activeModals.settingsPage.isOpen"
    v-model:is-open="modalStore.activeModals.settingsPage.isOpen" :title="modalStore.activeModals.settingsPage.title"
    modal-class="page-modal" :show-back-button="true" @back-clicked="handlePageBackNavigation">
    <SettingsPage />
  </BaseModal>

  <!-- About Page Modal -->
  <BaseModal v-if="modalStore.activeModals.aboutPage.isOpen" v-model:is-open="modalStore.activeModals.aboutPage.isOpen"
    :title="modalStore.activeModals.aboutPage.title" modal-class="page-modal" :show-back-button="true"
    @back-clicked="handlePageBackNavigation">
    <AboutPage />
  </BaseModal>

  <!-- Help Page Modal -->
  <BaseModal v-if="modalStore.activeModals.helpPage.isOpen" v-model:is-open="modalStore.activeModals.helpPage.isOpen"
    :title="modalStore.activeModals.helpPage.title" modal-class="page-modal" :show-back-button="true"
    @back-clicked="handlePageBackNavigation">
    <HelpPage />
  </BaseModal>
</template>

<script setup lang="ts">
import { useModalStore, useTasks } from "../stores/stores";
import TaskSettingsForm from "./TaskSettingsForm.vue";
import MenuOptions from "./MenuOptions.vue";
import SettingsPage from "./pages/SettingsPage.vue";
import AboutPage from "./pages/AboutPage.vue";
import HelpPage from "./pages/HelpPage.vue";
import BaseModal from "./BaseModal.vue"; // 新增 BaseModal 的引入

const modalStore = useModalStore();
const taskStore = useTasks();



const handlePageBackNavigation = (event?: MouseEvent) => {
  modalStore.openMenuAndCloseCurrentPage(event);
};
</script>

<style scoped>
/* 保留特定模態框的自定義樣式 */
/* BaseModal 已經處理了 .modal-overlay, .modal-content, .modal-header, .modal-body 的通用樣式 */
/* 如果 BaseModal 的樣式不足夠，可以在這裡覆蓋或添加 */

/* .settings-modal { */
/* Task Settings Modal */
/* max-width 來自 BaseModal props 或其內部樣式，如果需要特定於 AppModals 的覆蓋則保留 */
/* } */

/* .menu-modal { */
/* max-width 來自 BaseModal props 或其內部樣式 */
/* position: absolute; */
/* 如果 menuModalStyle 控制了 top/left 且 BaseModal 未處理 */
/* } */

/* .page-modal { */
/* 用於 SettingsPage, AboutPage, HelpPage */
/* max-width 來自 BaseModal props 或其內部樣式 */
/* } */

/* 由於 BaseModal 內部有自己的動畫，這裡的 modal-appear 可能不再需要，或者需要協調 */
/* @keyframes modal-appear { ... } */
</style>
