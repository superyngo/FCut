<template> <!-- InputRange 類型 -->
  <div class="form-group" v-if="setting.type === 'InputRange'">
    <label :for="setting.id">{{ setting.label }}</label>
    <div class="range-container">
      <input type="range" :id="setting.id" v-model.number="setting.value" :min="(setting as InputRange).min"
        :max="(setting as InputRange).max" :step="(setting as InputRange).step" />
      <span>{{ setting.value }}</span>
    </div>
  </div>

  <!-- InputText 類型 -->
  <div class="form-group" v-else-if="setting.type === 'InputText'">
    <label :for="setting.id">{{ setting.label }}</label>
    <input type="text" :id="setting.id" v-model="setting.value"
      :placeholder="typeof setting.label === 'string' ? setting.label : setting.label()" />
  </div>

  <!-- Selection 類型 -->
  <div class="form-group" v-else-if="setting.type === 'Selection'">
    <label :for="setting.id">{{ setting.label }}</label>
    <select :id="setting.id" v-model="setting.value">
      <option v-for="option in (setting as any).options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>

  <!-- Button 類型 -->
  <div class="form-group" v-else-if="setting.type === 'Button'">
    <button :id="setting.id" @click="(e) => (setting as any).action && (setting as any).action(e)" :disabled="typeof (setting as any).disabled === 'boolean'
      ? (setting as any).disabled
      : false" :class="{
        'hidden': typeof (setting as any).visible === 'boolean'
          ? !(setting as any).visible
          : false
      }">
      <i v-if="(setting as any).icon" :class="(setting as any).icon"></i>
      {{ setting.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineModel } from 'vue';
import { InputRange, InputText, Selection, Button } from "../models/elements";

// 使用 defineModel 代替 props 和 emit
const setting = defineModel<any>({
  required: true
});
</script>

<style scoped>
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

.range-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-container input[type="range"] {
  flex-grow: 1;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #2196F3;
  color: white;
}

button:hover:not(:disabled) {
  background-color: #0b7dda;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.hidden {
  display: none;
}

button i {
  margin-right: 5px;
}
</style>
