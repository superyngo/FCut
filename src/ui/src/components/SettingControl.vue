<template>
  <!-- InputRange 類型 -->
  <div class="form-group" v-if="modelValue.type === 'InputRange'">
    <label :for="modelValue.id">{{ modelValue.label }}</label>
    <div class="range-container">
      <input type="range" :id="modelValue.id" :value="modelValue.value" @input="updateValue($event)"
        :min="(modelValue as InputRange).min" :max="(modelValue as InputRange).max"
        :step="(modelValue as InputRange).step" />
      <span>{{ modelValue.value }}</span>
    </div>
  </div>

  <!-- InputText 類型 -->
  <div class="form-group" v-else-if="modelValue.type === 'InputText'">
    <label :for="modelValue.id">{{ modelValue.label }}</label>
    <input type="text" :id="modelValue.id" :value="modelValue.value" @input="updateValue($event)"
      :placeholder="typeof modelValue.label === 'string' ? modelValue.label : modelValue.label()" />
  </div>

  <!-- Selection 類型 -->
  <div class="form-group" v-else-if="modelValue.type === 'Selection'">
    <label :for="modelValue.id">{{ modelValue.label }}</label>
    <select :id="modelValue.id" :value="modelValue.value" @change="updateValue($event)">
      <option v-for="option in (modelValue as any).options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>

  <!-- Button 類型 -->
  <div class="form-group" v-else-if="modelValue.type === 'Button'">
    {{ modelValue.action }}
    <button :id="modelValue.id" @click="(e) => (modelValue as any).action && (modelValue as any).action(e)" :disabled="typeof (modelValue as any).disabled === 'boolean'
      ? (modelValue as any).disabled
      : false" :class="{
        'hidden': typeof (modelValue as any).visible === 'boolean'
          ? !(modelValue as any).visible
          : false
      }">
      <i v-if="(modelValue as any).icon" :class="(modelValue as any).icon"></i>
      {{ modelValue.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { InputRange, InputText, Selection, Button } from "../models/elements";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

// 更新值並觸發事件讓父組件知道值已經改變
const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;

  // 創建對象的副本，以避免直接修改 props
  const updatedSetting = { ...props.modelValue };

  // 判斷是否為 range input，如果是則轉換為數字
  if (props.modelValue.type === 'InputRange') {
    updatedSetting.value = Number(target.value);
  } else {
    updatedSetting.value = target.value;
  }

  // 向父組件發出更新事件
  emit('update:modelValue', updatedSetting);
};
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
