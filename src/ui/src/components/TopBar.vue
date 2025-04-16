<template>
  <div class="top-bar">
    <button
      v-for="(button, index) in buttons"
      :key="index"
      v-if="button.visible !== false"
      @click="button.action"
      class="icon-button"
    >
      <i :class="button.icon"></i>
      <span>{{ button.label }}</span>
    </button>
    <MenuOptions v-if="isMenuVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MenuOptions from './MenuOptions.vue';

const isMenuVisible = ref(false);

const buttons_data = [
  { label: 'Menu', icon: 'fas fa-bars', action: () => toggleMenu() },
  { label: '➕', icon: 'fas fa-plus', action: () => addTask() },
  { label: '➖', icon: 'fas fa-minus', action: () => deleteTask(), visible: false },
  { label: 'Clear', icon: 'fas fa-trash', action: () => clearCompletedTasks() },
];

const buttons = ref<{
  label: string;
  icon: string;
  action: () => void;
  visible?: boolean;
}[]>(buttons_data);



const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value;
};

const addTask = () => {
  console.log('Task added');
  // Logic to add a new task
};

const deleteTask = () => {
  console.log('Task deleted');
  // Logic to delete selected tasks
};

const clearCompletedTasks = () => {
  console.log('Completed tasks cleared');
  // Logic to clear all completed tasks
};

// Logic to update the visibility of the delete button
const updateDeleteButtonVisibility = (hasSelectedTasks: boolean) => {
  const deleteButton = buttons.value.find(button => button.label === '➖');
  if (deleteButton) {
    deleteButton.visible = hasSelectedTasks;
  }
};

// Example: Call this function when the task selection changes
// updateDeleteButtonVisibility(true or false);
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
</style>