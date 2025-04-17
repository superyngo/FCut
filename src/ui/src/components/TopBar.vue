<template>
  <div class="top-bar">
    <!-- Iterate over Map values -->
    <button
      v-for="button in buttons.values()"
      :key="button.label"
      :class="{ hidden: !button.visible }"
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
import { ref } from "vue";
import MenuOptions from "./MenuOptions.vue";
import { BaseClass } from "../utils/BaseModel";

class Button extends BaseClass {
  id?: string | undefined = undefined;
  label: string | undefined = undefined;
  icon: string | undefined = undefined;
  action: (() => void) | undefined = undefined;
  visible?: boolean = true;

  constructor(data: Record<string, any>) {
    super();
    this._init(data);
  }
}

const isMenuVisible = ref(false);

// Use a Map for buttons_data
const buttons_data = new Map<string, Button>([
  [
    "Menu",
    new Button({
      label: "Menu",
      icon: "fas fa-bars",
      action: () => toggleMenu(),
    }),
  ],
  [
    "Add",
    new Button({
      label: "➕",
      icon: "fas fa-plus",
      // Assuming addTask should be called here instead of updateDeleteButtonVisibility
      action: () => updateDeleteButtonVisibility(true),
    }),
  ],
  [
    "Delete",
    new Button({
      label: "➖",
      icon: "fas fa-minus",
      action: () => deleteTask(),
      visible: false, // Keep initial visibility state
    }),
  ],
  [
    "Clear",
    new Button({
      label: "Clear",
      icon: "fas fa-trash",
      action: () => clearCompletedTasks(),
    }),
  ],
]);

// Update the type of the buttons ref
const buttons = ref<Map<string, Button>>(buttons_data);

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value;
};

const addTask = () => {
  console.log("Task added");
  // Logic to add a new task
  // Maybe you want to show the delete button when a task is added?
  // updateDeleteButtonVisibility(true);
};

const deleteTask = () => {
  console.log("Task deleted");
  // Logic to delete selected tasks
  // Maybe hide the delete button if no tasks are left selected?
  // updateDeleteButtonVisibility(false);
};

const clearCompletedTasks = () => {
  console.log("Completed tasks cleared");
  // Logic to clear all completed tasks
  // Hide delete button after clearing
  updateDeleteButtonVisibility(false);
};

// Logic to update the visibility of the delete button using the Map
const updateDeleteButtonVisibility = (hasSelectedTasks: boolean) => {
  const deleteButton = buttons.value.get("Delete"); // Access by key 'Delete'
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

.hidden {
  display: none;
}
</style>
