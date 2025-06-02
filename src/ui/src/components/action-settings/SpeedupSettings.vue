<template>
    <div class="speedup-settings">
        <!-- 1. 輸入區 -->
        <div class="form-group">
            <label for="speed-multiple">加速倍數</label>
            <div class="range-container">
                <input id="speed-multiple" type="range" v-model.number="speedMultiple" :min="minSpeed" :max="maxSpeed"
                    :step="stepSpeed" :disabled="disabled" class="speed-range" />
                <span class="speed-value">{{ speedMultiple }}x</span>
            </div>
            <!-- 2. 動態說明 -->
            <div class="quality-description">{{ getSpeedDescription() }}</div>
        </div>

        <!-- 3. 動態估算 -->
        <div class="info-section">
            <div class="info-item">
                <i class="fas fa-clock"></i>
                <span>預估時間縮短：{{ estimatedReduction }}%</span>
            </div>
        </div>

        <!-- 4. 預設按鈕 -->
        <div class="speed-presets">
            <button v-for="preset in speedPresets" :key="preset" @click="setSpeedPreset(preset)" :disabled="disabled"
                :class="{ active: speedMultiple === preset }" class="preset-button">
                {{ preset }}x
            </button>
        </div>

        <!-- 5. 靜態說明 -->
        <div class="info-section">
            <div class="info-item">
                <i class="fas fa-info-circle"></i>
                <span>建議範圍：1.25x - 4x，過高可能影響音質</span>
            </div>
        </div>

        <!-- 6. 警告訊息 -->
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

const speedMultiple = ref<number>(3);
const minSpeed = 1;
const maxSpeed = 10;
const stepSpeed = 0.1;
const validationError = ref<string>('');

// 預設的加速倍數選項
const speedPresets = [1.25, 1.5, 2, 2.5, 3, 4, 5];

// 動態說明
const getSpeedDescription = (): string => {
    if (speedMultiple.value <= 1.25) return '最接近原速，音質最佳';
    if (speedMultiple.value <= 2) return '溫和加速，音質影響極小';
    if (speedMultiple.value <= 4) return '明顯加速，音質略有損失';
    if (speedMultiple.value <= 6) return '高倍速，音質明顯下降';
    return '極高倍速，僅建議用於快速瀏覽';
};

// 計算預估時間縮短百分比
const estimatedReduction = computed(() => {
    return Math.round((1 - 1 / speedMultiple.value) * 100);
});

// 設定預設倍數
const setSpeedPreset = (preset: number) => {
    speedMultiple.value = preset;
};

// 驗證設定
const validate = (): { valid: boolean; message?: string } => {
    if (speedMultiple.value < minSpeed || speedMultiple.value > maxSpeed) {
        return { valid: false, message: `加速倍數必須在 ${minSpeed} 到 ${maxSpeed} 之間` };
    }
    return { valid: true };
};

// 重置設定
const reset = () => {
    speedMultiple.value = 3;
};

// 獲取設定值
const getSettings = () => {
    return {
        multiple: speedMultiple.value
    };
};

// 監聽設定變化
watch(speedMultiple, () => {
    const validation = validate();
    if (!validation.valid) {
        validationError.value = validation.message || '';
        emit('validation-error', validation.message || '');
    } else {
        validationError.value = '';
        emit('validation-error', '');
    }
    emit('update:settings', getSettings());
});

// 從props初始化設定
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings) {
            speedMultiple.value = settings.multiple ?? 3;
        } else {
            reset();
        }
    } else {
        reset();
    }
});

// 暴露組件方法
defineExpose({
    validate,
    reset,
    getSettings
});
</script>

<style scoped>
.speedup-settings {
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

.speed-range {
    flex: 1;
    height: 6px;
    background: #ddd;
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.speed-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4caf50;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.speed-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4caf50;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.speed-value {
    font-weight: bold;
    font-size: 16px;
    color: #4caf50;
    min-width: 50px;
    text-align: center;
}

.speed-presets {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.preset-button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    color: #333;
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

.info-section {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #666;
}

.info-item:last-child {
    margin-bottom: 0;
}

.info-item i {
    color: #4caf50;
    width: 16px;
}

.error-message {
    color: #d9534f;
    background: #f2dede;
    border: 1px solid #ebccd1;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
}
</style>
