<template>
  <div class="menu-options">
    <ul>
      <li v-for="(option, index) in options" :key="index" @click="option.action">
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const options = ref([
  { label: 'Option 1', action: () => console.log('Option 1 selected') },
  { label: 'Option 2', action: () => console.log('Option 2 selected') },
  { label: 'Option 3', action: () => console.log('Option 3 selected') },
]);
</script>

<style scoped>
.menu-options {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 10px;
  z-index: 1000;
}

.menu-options ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-options li {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-options li:hover {
  background-color: #f0f0f0;
}
</style>