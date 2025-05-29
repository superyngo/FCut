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
    <label :for="setting.id">{{ setting.label }}</label>
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

    // 處理不同類型的 regexValidator
    if (setting.regexValidator instanceof RegExp) {
      regex = setting.regexValidator;
    } else if (typeof setting.regexValidator === 'object' && setting.regexValidator.__type === 'RegExp') {
      // 處理我們自定義的序列化格式
      regex = new RegExp(setting.regexValidator.source, setting.regexValidator.flags);
    } else if (typeof setting.regexValidator === 'string') {
      // 如果是字串，嘗試解析
      if (setting.regexValidator.startsWith('/') && setting.regexValidator.lastIndexOf('/') > 0) {
        // 處理 /pattern/flags 格式
        const lastSlash = setting.regexValidator.lastIndexOf('/');
        const pattern = setting.regexValidator.slice(1, lastSlash);
        const flags = setting.regexValidator.slice(lastSlash + 1);
        regex = new RegExp(pattern, flags);
      } else {
        // 簡單字符串，直接作為模式
        regex = new RegExp(setting.regexValidator);
      }
    } else {
      logger.error('無效的 regexValidator 格式:', setting.regexValidator);
      return;
    }


    // 如果不符合正則表達式，則恢復到之前的值
    if (!regex.test(newValue)) {
      target.value = setting.oldValue;
      return;
    }
  }

  // 如果驗證通過或沒有驗證器，更新值
  setting.oldValue = newValue;
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
