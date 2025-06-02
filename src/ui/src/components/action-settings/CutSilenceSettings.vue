ㄑ<template>
    <div class="cut-silence-settings">
        <div class="form-group"> <label for="silence-threshold">靜音閾值 (dB)</label>
            <div class="range-container">
                <input id="silence-threshold" type="range" v-model.number="silenceThreshold" :min="minDb" :max="maxDb"
                    :step="1" :disabled="disabled" class="db-range" />
                <span class="db-value">{{ silenceThreshold }} dB</span>
            </div>
            <div class="threshold-scale">
                <span class="scale-label">保守</span>
                <span class="scale-label">標準</span>
                <span class="scale-label">積極</span>
            </div>
        </div>

        <div class="info-section">
            <h4>設定說明</h4>
            <div class="info-grid">
                <div class="info-item">
                    <strong>-45 dB</strong>
                    <span>保守模式，幾乎不會移除任何片段</span>
                </div>
                <div class="info-item">
                    <strong>-35 dB</strong>
                    <span>溫和模式，只移除明顯的靜音段</span>
                </div>
                <div class="info-item">
                    <strong>-23 dB</strong>
                    <span>標準模式，移除靜音和輕微背景音</span>
                </div>
                <div class="info-item">
                    <strong>-15 dB</strong>
                    <span>積極模式，會移除較多的安靜片段</span>
                </div>
                <div class="info-item">
                    <strong>-10 dB</strong>
                    <span>最積極，只保留音量較大的內容</span>
                </div>
            </div>
        </div>

        <div class="presets">
            <h4>推薦設定</h4>
            <div class="preset-buttons">
                <button v-for="preset in silencePresets" :key="preset.name" @click="applyPreset(preset)"
                    :disabled="disabled" :class="{ active: silenceThreshold === preset.value }" class="preset-button">
                    {{ preset.name }}
                    <small>{{ preset.value }} dB</small>
                </button>
            </div>
        </div>

        <div class="warning" v-if="showWarning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ warningMessage }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ActionSettingsProps, ActionSettingsEmits } from './types';

const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>();

const silenceThreshold = ref<number>(-23);
const minDb = -45;
const maxDb = -10;

// 預設選項
const silencePresets = [
    { name: '保守', value: -40, description: '只移除明顯靜音' },
    { name: '標準', value: -23, description: '平衡的靜音檢測' },
    { name: '積極', value: -15, description: '較敏感的靜音移除' },
    { name: '講座', value: -30, description: '適合演講內容' },
    { name: '音樂', value: -35, description: '適合含音樂的內容' }
];

// 警告訊息
const showWarning = computed(() => {
    return silenceThreshold.value > -12;
});

const warningMessage = computed(() => {
    if (silenceThreshold.value > -12) {
        return '閾值設定過高，可能會移除過多的音頻內容';
    }
    return '';
});

// 應用預設
const applyPreset = (preset: any) => {
    silenceThreshold.value = preset.value;
};

// 重置設定
const reset = () => {
    silenceThreshold.value = -23;
};

// 獲取設定值
const getSettings = () => {
    return {
        threshold: silenceThreshold.value
    };
};

// 監聽設定變化
watch(silenceThreshold, () => {
    emit('update:settings', getSettings());
});

// 初始化
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings) {
            silenceThreshold.value = settings.threshold ?? -23;
        } else {
            reset();
        }
    } else {
        reset();
    }
});

// 暴露方法
defineExpose({
    reset,
    getSettings,
    validate: () => ({ valid: true })
});
</script>

<style scoped>
.cut-silence-settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-group label {
    font-weight: bold;
    color: #333;
    font-size: 14px;
}

.range-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.db-range {
    flex: 1;
    height: 6px;
    background: linear-gradient(to right, #4caf50, #ff9800, #f44336);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.db-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #333;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.db-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #333;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.db-value {
    font-weight: bold;
    font-size: 16px;
    color: #333;
    min-width: 70px;
    text-align: center;
    font-family: monospace;
}

.threshold-scale {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #888;
    margin-top: 4px;
}

.info-section {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.info-section h4 {
    margin: 0 0 12px 0;
    color: #333;
}

.info-grid {
    display: grid;
    gap: 8px;
}

.info-item {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 13px;
}

.info-item strong {
    color: #666;
    min-width: 60px;
    font-family: monospace;
}

.info-item span {
    color: #555;
    flex: 1;
}

.presets h4 {
    margin: 0 0 12px 0;
    color: #333;
}

.preset-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
}

.preset-button {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    color: #333;
    /* 添加深色文字 */
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.preset-button:hover:not(:disabled) {
    background: #f0f0f0;
    border-color: #4caf50;
}

.preset-button.active {
    background: #4caf50;
    color: white;
    border-color: #4caf50;
}

.preset-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.preset-button small {
    font-size: 11px;
    opacity: 0.8;
}

.warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    color: #856404;
    font-size: 13px;
}

.warning i {
    color: #f39c12;
}
</style>
