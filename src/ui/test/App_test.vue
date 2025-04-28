<template>
  <div class="test-app">
    <h2>KeyStore 功能測試</h2>

    <div class="test-section">
      <h3>按鍵監聽測試</h3>
      <div class="key-display">
        <h4>修飾鍵狀態：</h4>
        <div>
          <span
            class="modifier-state"
            :class="keyStore.isShiftPressed ? 'active' : 'inactive'"
          >
            Shift: {{ keyStore.isShiftPressed ? "按下" : "未按" }}
          </span>
          <span
            class="modifier-state"
            :class="keyStore.isCtrlPressed ? 'active' : 'inactive'"
          >
            Ctrl: {{ keyStore.isCtrlPressed ? "按下" : "未按" }}
          </span>
          <span
            class="modifier-state"
            :class="keyStore.isAltPressed ? 'active' : 'inactive'"
          >
            Alt: {{ keyStore.isAltPressed ? "按下" : "未按" }}
          </span>
          <span
            class="modifier-state"
            :class="keyStore.isMetaPressed ? 'active' : 'inactive'"
          >
            Meta: {{ keyStore.isMetaPressed ? "按下" : "未按" }}
          </span>
        </div>

        <h4>輸入框焦點狀態：</h4>
        <div>
          <span
            class="modifier-state"
            :class="keyStore.isInputFocused ? 'active' : 'inactive'"
          >
            Input Focused: {{ keyStore.isInputFocused ? "是" : "否" }}
          </span>
        </div>

        <div class="input-test">
          <h4>輸入框測試：</h4>
          <input
            type="text"
            placeholder="點擊這裡測試輸入框焦點狀態"
            v-model="inputText"
          />
          <p>你可以在輸入框聚焦時按下按鍵，測試 ignoreWhenInputFocused 選項</p>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>註冊按鍵事件測試</h3>

      <div class="key-register">
        <h4>註冊新的按鍵監聽：</h4>
        <div class="form-group">
          <label>按鍵名稱：</label>
          <input type="text" v-model="newKeyName" placeholder="例如: a" />
        </div>

        <div class="form-group">
          <label>事件類型：</label>
          <select v-model="eventType">
            <option value="onPress">按下時 (onPress)</option>
            <option value="onRelease">釋放時 (onRelease)</option>
          </select>
        </div>

        <div class="form-group">
          <label>防抖延遲 (ms)：</label>
          <input type="number" v-model.number="debounceTime" placeholder="0" />
        </div>

        <div class="form-group">
          <label>節流延遲 (ms)：</label>
          <input type="number" v-model.number="throttleTime" placeholder="0" />
        </div>

        <div class="form-group">
          <label>修飾鍵：</label>
          <div>
            <input type="checkbox" id="shift" v-model="withShift" />
            <label for="shift">Shift</label>

            <input type="checkbox" id="ctrl" v-model="withCtrl" />
            <label for="ctrl">Ctrl</label>

            <input type="checkbox" id="alt" v-model="withAlt" />
            <label for="alt">Alt</label>
          </div>
        </div>

        <div class="form-group">
          <label>其他選項：</label>
          <div>
            <input
              type="checkbox"
              id="preventDefault"
              v-model="preventDefault"
            />
            <label for="preventDefault">阻止默認行為</label>

            <input
              type="checkbox"
              id="ignoreInput"
              v-model="ignoreWhenInputFocused"
            />
            <label for="ignoreInput">輸入框聚焦時忽略</label>
          </div>
        </div>

        <button @click="registerKeyListener">註冊監聽器</button>
      </div>

      <div class="registered-keys">
        <h4>已註冊的按鍵：</h4>
        <div v-if="registeredKeys.length === 0" class="no-keys">
          尚未註冊任何按鍵
        </div>
        <div v-else class="key-list">
          <div
            v-for="(key, index) in registeredKeys"
            :key="index"
            class="key-item"
          >
            <div>
              <strong>按鍵:</strong> {{ key.keyName }} | <strong>事件:</strong>
              {{ key.config.type }} | <strong>修飾鍵:</strong>
              {{ formatModifiers(key.config.withControl) }}
            </div>
            <div>
              <strong>按下次數:</strong> {{ key.pressCount }} |
              <strong>防抖/節流:</strong> {{ formatDelays(key.config) }}
            </div>
            <button @click="removeKeyListener(index)" class="remove-btn">
              移除
            </button>
          </div>
        </div>
      </div>

      <div class="key-events-log">
        <h4>按鍵事件紀錄：</h4>
        <div class="log-container">
          <div
            v-for="(log, index) in keyEventLogs"
            :key="index"
            class="log-item"
          >
            {{ log }}
          </div>
        </div>
        <button @click="clearLogs" class="clear-btn">清除紀錄</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useKey, useKeyListener } from "../src/stores/keyStore";
import { modifier_keys } from "../src/utils/on_events";

// 使用 KeyStore，自動啟動按鍵監聽
const keyStore = useKeyListener();

// 表單數據
const inputText = ref("");
const newKeyName = ref("");
const eventType = ref("onPress");
const debounceTime = ref(0);
const throttleTime = ref(0);
const withShift = ref(false);
const withCtrl = ref(false);
const withAlt = ref(false);
const preventDefault = ref(false);
const ignoreWhenInputFocused = ref(false);

// 儲存已註冊的按鍵監聽器
const registeredKeys = ref<
  Array<{
    keyName: string;
    config: any;
    handle: any;
    pressCount: number;
  }>
>([]);

// 按鍵事件紀錄
const keyEventLogs = ref<string[]>([]);

// 格式化修飾鍵顯示
const formatModifiers = (modifiers?: modifier_keys[]) => {
  if (!modifiers || modifiers.length === 0) return "無";

  const modifierMap: Record<modifier_keys, string> = {
    [modifier_keys.Shift]: "Shift",
    [modifier_keys.Control]: "Ctrl",
    [modifier_keys.Alt]: "Alt",
  };

  return modifiers.map((mod) => modifierMap[mod]).join("+");
};

// 格式化延遲設置
const formatDelays = (config: any) => {
  if (config.debounce && config.debounce > 0) {
    return `防抖 ${config.debounce}ms`;
  }
  if (config.throttle && config.throttle > 0) {
    return `節流 ${config.throttle}ms`;
  }
  return "無";
};

// 註冊按鍵監聽
const registerKeyListener = () => {
  if (!newKeyName.value) {
    alert("請輸入按鍵名稱");
    return;
  }

  // 構建修飾鍵配置
  const modifiers: modifier_keys[] = [];
  if (withShift.value) modifiers.push(modifier_keys.Shift);
  if (withCtrl.value) modifiers.push(modifier_keys.Control);
  if (withAlt.value) modifiers.push(modifier_keys.Alt);

  // 構建配置對象
  const config = {
    type: eventType.value as "onPress" | "onRelease",
    callback: () => {
      const foundKey = registeredKeys.value.find(
        (k) =>
          k.keyName === newKeyName.value && k.config.type === eventType.value
      );

      if (foundKey) {
        foundKey.pressCount++;
      }

      // 添加事件紀錄
      const timestamp = new Date().toLocaleTimeString();
      keyEventLogs.value.unshift(
        `[${timestamp}] ${newKeyName.value} ${
          eventType.value === "onPress" ? "按下" : "釋放"
        }`
      );
    },
    withControl: modifiers.length > 0 ? modifiers : undefined,
    preventDefault: preventDefault.value || false,
    ignoreWhenInputFocused: ignoreWhenInputFocused.value || false,
  };

  // 添加防抖/節流設置
  if (debounceTime.value > 0) {
    config.debounce = debounceTime.value;
  }

  if (throttleTime.value > 0) {
    config.throttle = throttleTime.value;
  }

  // 註冊監聽器
  const handle = keyStore.on_keys(newKeyName.value, config);

  // 保存到已註冊列表
  registeredKeys.value.push({
    keyName: newKeyName.value,
    config,
    handle,
    pressCount: 0,
  });

  // 重置表單
  newKeyName.value = "";
  eventType.value = "onPress";
  debounceTime.value = 0;
  throttleTime.value = 0;
  withShift.value = false;
  withCtrl.value = false;
  withAlt.value = false;
  preventDefault.value = false;
  ignoreWhenInputFocused.value = false;
};

// 移除按鍵監聽器
const removeKeyListener = (index: number) => {
  const key = registeredKeys.value[index];
  key.handle.remove();
  registeredKeys.value.splice(index, 1);
};

// 清除事件紀錄
const clearLogs = () => {
  keyEventLogs.value = [];
};

// 組件卸載時清理所有監聽器
onUnmounted(() => {
  registeredKeys.value.forEach((key) => {
    key.handle.remove();
  });
});
</script>

<style scoped>
.test-app {
  padding: 20px 0;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2,
h3,
h4 {
  margin-top: 0;
  color: #2c3e50;
}

h3 {
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

.key-display {
  background-color: #eee;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
}

.modifier-state {
  display: inline-block;
  margin-right: 10px;
  padding: 5px 10px;
  border-radius: 3px;
  font-weight: bold;
}

.active {
  background-color: #2ecc71;
  color: white;
}

.inactive {
  background-color: #e74c3c;
  color: white;
}

.input-test {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #ccc;
}

input[type="text"],
input[type="number"],
select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
  min-width: 200px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: inline-block;
  width: 120px;
  font-weight: bold;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background-color: #2980b9;
}

.registered-keys {
  margin-top: 30px;
}

.no-keys {
  color: #7f8c8d;
  font-style: italic;
}

.key-item {
  background-color: #fff;
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remove-btn {
  background-color: #e74c3c;
  padding: 5px 10px;
  margin: 0;
}

.remove-btn:hover {
  background-color: #c0392b;
}

.key-events-log {
  margin-top: 30px;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background-color: #2c3e50;
  color: #ecf0f1;
  border-radius: 5px;
  padding: 10px;
  font-family: monospace;
}

.log-item {
  margin-bottom: 5px;
  padding: 3px 0;
  border-bottom: 1px solid #34495e;
}

.clear-btn {
  background-color: #95a5a6;
  margin-top: 10px;
}

.clear-btn:hover {
  background-color: #7f8c8d;
}
</style>
