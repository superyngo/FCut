<template>
    <div class="cut-motionless-settings">
        <div class="form-group">
            <label for="motion-threshold">動作檢測閾值</label>
            <div class="range-container">
                <input id="motion-threshold" type="range" v-model.number="motionThreshold" :min="minThreshold"
                    :max="maxThreshold" :step="stepThreshold" :disabled="disabled" class="motion-range" />
                <span class="threshold-value">{{ formatThreshold(motionThreshold) }}</span>
            </div>
            <div class="threshold-scale">
                <span class="scale-label">敏感</span>
                <span class="scale-label">中等</span>
                <span class="scale-label">寬鬆</span>
            </div>
            <!-- 動態說明 -->
            <div class="quality-description">{{ getThresholdDescription() }}</div>
        </div>

        <div class="presets">
            <h4>場景預設</h4>
            <div class="preset-buttons">
                <button v-for="preset in motionPresets" :key="preset.name" @click="applyPreset(preset)"
                    :disabled="disabled" :class="{ active: isPresetActive(preset) }" class="preset-button">
                    <div class="preset-name">{{ preset.name }}</div>
                    <div class="preset-value">{{ formatThreshold(preset.value) }}</div>
                    <div class="preset-desc">{{ preset.description }}</div>
                </button>
            </div>
        </div>

        <div class="advanced-options">
            <h4>進階選項</h4>
            <div class="option-grid">
                <div class="form-group">
                    <label>
                        <input type="checkbox" v-model="enableSmoothing" :disabled="disabled" />
                        啟用平滑處理
                    </label>
                    <small>減少短暫的動作檢測誤判</small>
                </div>

                <div class="form-group">
                    <label for="min-segment">最小保留段落 (秒)</label>
                    <input id="min-segment" type="number" v-model.number="minSegmentDuration" :min="0.1" :max="10"
                        :step="0.1" :disabled="disabled" class="number-input" />
                    <small>避免產生過短的片段</small>
                </div>
            </div>
        </div>

        <!-- 靜態說明 -->
        <div class="info-section">
            <h4>設定說明</h4>
            <div class="info-content">
                <p>動作檢測閾值決定了多少像素變化會被視為「有動作」：</p>
                <ul>
                    <li><strong>低閾值 (0.0001 - 0.001)</strong>：敏感檢測，保留微小動作</li>
                    <li><strong>中閾值 (0.001 - 0.01)</strong>：平衡檢測，適合大多數場景</li>
                    <li><strong>高閾值 (0.01 - 1.0)</strong>：只保留明顯的動作變化</li>
                </ul>
            </div>
        </div>

        <!-- 警告訊息 -->
        <div v-if="validationError" class="error-message">
            {{ validationError }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ActionSettingsProps, ActionSettingsEmits } from './types';

const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>();

const motionThreshold = ref<number>(0.00095);
const enableSmoothing = ref<boolean>(true);
const minSegmentDuration = ref<number>(1.0);

const minThreshold = 0.0001;
const maxThreshold = 1.0;
const stepThreshold = 0.0001;
const validationError = ref<string>('');

// 預設選項
const motionPresets = [
    {
        name: '靜態內容',
        value: 0.0005,
        description: '簡報、文檔閱讀'
    },
    {
        name: '標準講座',
        value: 0.00095,
        description: '人物講解、教學'
    },
    {
        name: '動態內容',
        value: 0.005,
        description: '遊戲、演示操作'
    },
    {
        name: '運動影片',
        value: 0.02,
        description: '體感遊戲、運動'
    },
    {
        name: '電影級',
        value: 0.1,
        description: '電影、高動作內容'
    }
];

// 格式化閾值顯示
const formatThreshold = (value: number): string => {
    if (value >= 0.01) {
        return value.toFixed(3);
    } else if (value >= 0.001) {
        return value.toFixed(4);
    } else {
        return value.toFixed(5);
    }
};

// 獲取當前閾值描述
const getThresholdDescription = (): string => {
    if (motionThreshold.value < 0.001) {
        return '極敏感檢測，保留所有微小動作';
    } else if (motionThreshold.value < 0.01) {
        return '敏感檢測，適合靜態內容';
    } else if (motionThreshold.value < 0.1) {
        return '標準檢測，適合一般動態內容';
    } else {
        return '寬鬆檢測，只保留明顯動作';
    }
};

// 應用預設
const applyPreset = (preset: any) => {
    motionThreshold.value = preset.value;
};

// 檢查預設是否啟用
const isPresetActive = (preset: any): boolean => {
    return Math.abs(motionThreshold.value - preset.value) < 0.00001;
};

// 驗證設定
const validate = (): { valid: boolean; message?: string } => {
    if (motionThreshold.value < minThreshold || motionThreshold.value > maxThreshold) {
        return {
            valid: false,
            message: `動作閾值必須在 ${minThreshold} 到 ${maxThreshold} 之間`
        };
    }

    if (minSegmentDuration.value < 0.1) {
        return {
            valid: false,
            message: '最小段落時間不能少於0.1秒'
        };
    }

    return { valid: true };
};

// 重置設定
const reset = () => {
    motionThreshold.value = 0.00095;
    enableSmoothing.value = true;
    minSegmentDuration.value = 1.0;
};

// 獲取設定值
const getSettings = () => {
    return {
        threshold: motionThreshold.value,
        smoothing: enableSmoothing.value,
        minSegment: minSegmentDuration.value
    };
};

// 監聽設定變化
watch([motionThreshold, enableSmoothing, minSegmentDuration], () => {
    const validation = validate();
    if (!validation.valid) {
        validationError.value = validation.message || '';
        emit('validation-error', validation.message || '');
    } else {
        validationError.value = '';
        emit('validation-error', '');
    }
    emit('update:settings', getSettings());
}, { deep: true });

// 初始化
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings) {
            motionThreshold.value = settings.threshold ?? 0.00095;
        } else {
            reset();
        }
    } else {
        reset();
    }
});

// 暴露方法
defineExpose({
    validate,
    reset,
    getSettings
});
</script>

<style scoped>
.cut-motionless-settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-weight: bold;
    color: #333;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.range-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.motion-range {
    flex: 1;
    height: 6px;
    background: linear-gradient(to right, #4caf50, #2196f3, #ff9800);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.motion-range::-webkit-slider-thumb {
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

.motion-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #333;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.threshold-value {
    font-weight: bold;
    font-size: 14px;
    color: #333;
    min-width: 80px;
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

.info-content p {
    margin: 0 0 12px 0;
    color: #555;
    font-size: 14px;
}

.info-content ul {
    margin: 0 0 12px 0;
    padding-left: 20px;
    color: #555;
    font-size: 13px;
}

.info-content li {
    margin-bottom: 4px;
}

.current-setting {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #e3f2fd;
    border-radius: 4px;
    font-size: 13px;
    color: #1976d2;
}

.presets h4 {
    margin: 0 0 12px 0;
    color: #333;
}

.preset-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
}

.preset-button {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    color: #333;
    /* 添加深色文字 */
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
}

.preset-button:hover:not(:disabled) {
    background: #f0f0f0;
    border-color: #4caf50;
    transform: translateY(-1px);
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

.preset-name {
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 4px;
}

.preset-value {
    font-family: monospace;
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 4px;
}

.preset-desc {
    font-size: 11px;
    opacity: 0.7;
}

.advanced-options {
    border-top: 1px solid #eee;
    padding-top: 16px;
}

.advanced-options h4 {
    margin: 0 0 12px 0;
    color: #333;
}

.option-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.number-input {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    width: 80px;
}

input[type="checkbox"] {
    margin-right: 8px;
}

small {
    font-size: 11px;
    color: #888;
    font-style: italic;
}

.error-message {
    color: #d9534f;
    background: #f2dede;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #ebccd1;
    font-size: 14px;
    margin-top: 12px;
}

@media (max-width: 600px) {
    .option-grid {
        grid-template-columns: 1fr;
    }

    .preset-buttons {
        grid-template-columns: 1fr;
    }
}
</style>
