<template>
  <div class="task-list">
    <ul>
      <li v-for="task in tasks" :key="task.id" class="task-item">
        {{ task.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const tasks = ref([
  { id: 1, name: 'Task 1' },
  { id: 2, name: 'Task 2' },
  { id: 3, name: 'Task 3' },
  // Add more tasks as needed
]);
</script>

<style scoped>
.task-list {
  max-height: 400px; /* Adjust height as needed */
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}

.task-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
}

.task-item:last-child {
  border-bottom: none;
}
</style>