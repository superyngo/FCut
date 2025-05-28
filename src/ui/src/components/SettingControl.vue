<template> <!-- InputRange 類型 -->
  <div class="form-group" v-if="setting.type === 'InputRange'">
    <label :for="setting.id">{{ setting.label }}</label>
    <div class="range-container">
      <input type="range" :id="setting.id" v-model.number="setting.value" :min="(setting as InputRange).min"
        :title="typeof (setting as InputRange).title === 'function' ? (setting.title as () => string)() : setting.title"
        :max="(setting as InputRange).max" :step="(setting as InputRange).step" />
      <span>{{ setting.value }}</span>
    </div>
  </div>
  <!-- InputText 類型 -->
  <div class="form-group" v-else-if="setting.type === 'InputText'">
    <label :for="setting.id">{{ JSON.stringify(setting.regexValidator) }}</label>
    <input type="text" :id="setting.id" v-model="setting.value"
      :title="typeof (setting as InputRange).title === 'function' ? (setting.title as () => string)() : setting.title"
      :placeholder="typeof setting.label === 'string' ? setting.label : setting.label()"
      @input="validateInput($event, setting)" />
  </div>

  <!-- Selection 類型 -->
  <div class="form-group" v-else-if="setting.type === 'Selection'">
    <label :for="setting.id"
      :title="typeof (setting as InputRange).title === 'function' ? (setting.title as () => string)() : setting.title">
      {{ setting.label }}
    </label>
    <select :id="setting.id" v-model="setting.value">
      <option v-for="option in (setting as any).options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>

  <!-- Button 類型 -->
  <div class="form-group" v-else-if="setting.type === 'Button'">
    <button :id="setting.id"
      :title="typeof (setting as InputRange).title === 'function' ? (setting.title as () => string)() : setting.title"
      @click="(e) => (setting as any).action && (setting as any).action(e)"
      :disabled="typeof (setting as any).disabled === 'boolean' ? (setting as any).disabled : false" :class="{
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
import { InputRange } from "../models/elements";
import { logger } from '../utils/logger';

// 使用 defineModel 代替 props 和 emit
const setting = defineModel<any>({
  required: true
});

// 驗證輸入函數
function validateInput(event: Event, setting: any) {
  const target = event.target as HTMLInputElement;
  const newValue = target.value;

  // 檢查是否有 regexValidator
  if (setting.regexValidator) {
    let regex: RegExp;

    // 如果是字串，轉換為 RegExp
    if (typeof setting.regexValidator === 'string') {
      regex = new RegExp(setting.regexValidator);
    } else {
      regex = setting.regexValidator;
    }

    // 如果不符合正則表達式，則恢復到之前的值
    if (!regex.test(newValue)) {
      target.value = setting.value;
      return;
    }
  }

  // 如果驗證通過或沒有驗證器，更新值
  setting.value = newValue;
}
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
