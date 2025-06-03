<template>
    <div class="jumpcut-settings"> <!-- 1. 輸入區 -->
        <div class="settings-grid">
            <div class="form-group">
                <label for="p1-duration">{{ $t('actionSettings.Jumpcut.p1Duration') }}</label>
                <div class="input-container">
                    <input id="p1-duration" type="number" v-model.number="p1Duration" :min="0" :max="60" :step="0.1"
                        :disabled="disabled" class="number-input" />
                    <span class="unit">{{ $t('actionSettings.Jumpcut.units.seconds') }}</span>
                </div>
                <!-- 動態說明 -->
                <small class="help-text">{{ $t('actionSettings.Jumpcut.helpText.p1Duration') }}</small>
            </div>

            <div class="form-group">
                <label for="p2-duration">{{ $t('actionSettings.Jumpcut.p2Duration') }}</label>
                <div class="input-container">
                    <input id="p2-duration" type="number" v-model.number="p2Duration" :min="0" :max="60" :step="0.1"
                        :disabled="disabled" class="number-input" />
                    <span class="unit">{{ $t('actionSettings.Jumpcut.units.seconds') }}</span>
                </div>
                <!-- 動態說明 -->
                <small class="help-text">{{ $t('actionSettings.Jumpcut.helpText.p2Duration') }}</small>
            </div>
            <div class="form-group">
                <label for="p1-multiple">{{ $t('actionSettings.Jumpcut.p1Multiple') }}</label>
                <div class="input-container">
                    <input id="p1-multiple" type="number" v-model.number="p1Multiple" :min="1" :max="10" :step="0.1"
                        :disabled="disabled" class="number-input" />
                    <span class="unit">{{ $t('actionSettings.Jumpcut.units.times') }}</span>
                </div>
                <!-- 動態說明 -->
                <small class="help-text">{{ $t('actionSettings.Jumpcut.helpText.p1Multiple') }}</small>
            </div>

            <div class="form-group">
                <label for="p2-multiple">{{ $t('actionSettings.Jumpcut.p2Multiple') }}</label>
                <div class="input-container">
                    <input id="p2-multiple" type="number" v-model.number="p2Multiple" :min="1" :max="20" :step="0.1"
                        :disabled="disabled" class="number-input" />
                    <span class="unit">{{ $t('actionSettings.Jumpcut.units.times') }}</span>
                </div>
                <!-- 動態說明 -->
                <small class="help-text">{{ $t('actionSettings.Jumpcut.helpText.p2Multiple') }}</small>
            </div>
        </div> <!-- 2. 動態估算區塊（預覽與平均加速） -->
        <div class="pattern-preview">
            <h4>{{ $t('actionSettings.Jumpcut.patternPreview') }}</h4>
            <div class="pattern-visualization">
                <div class="pattern-segment p1" :style="{ width: segmentWidthP1 + '%' }">
                    <span>原速 {{ p1Duration }}{{ $t('actionSettings.Jumpcut.units.seconds') }}</span>
                    <small>{{ p1Multiple }}{{ $t('actionSettings.Jumpcut.units.times') }}</small>
                </div>
                <div class="pattern-segment p2" :style="{ width: segmentWidthP2 + '%' }">
                    <span>快進 {{ p2Duration }}{{ $t('actionSettings.Jumpcut.units.seconds') }}</span>
                    <small>{{ p2Multiple }}{{ $t('actionSettings.Jumpcut.units.times') }}</small>
                </div>
            </div>
            <div class="pattern-info">
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>{{ $t('actionSettings.Jumpcut.totalCycle') }}：{{ totalCycleDuration.toFixed(1) }}{{
                        $t('actionSettings.Jumpcut.units.seconds') }}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>{{ $t('actionSettings.Jumpcut.avgSpeed') }}：{{ averageSpeedup.toFixed(2) }}{{
                        $t('actionSettings.Jumpcut.units.times') }}</span>
                </div>
            </div>
        </div> <!-- 3. 預設按鈕區塊 -->
        <div class="presets">
            <h4>{{ $t('actionSettings.Jumpcut.preset') }}</h4>
            <div class="preset-buttons">
                <button v-for="preset in jumpCutPresets" :key="preset.name" @click="applyPreset(preset)"
                    :disabled="disabled" class="preset-button">
                    {{ $t(`actionSettings.Jumpcut.presets.${preset.name}`) }}
                </button>
            </div>
        </div> <!-- 4. 靜態說明區塊（如有） -->
        <div class="info-section">
            <div class="info-grid">
                <div class="info-item">
                    <span>{{ $t('actionSettings.Jumpcut.info') }}</span>
                </div>
            </div>
        </div>

        <!-- 5. 警告訊息 -->
        <div v-if="validationError" class="error-message">
            {{ validationError }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ActionSettingsProps, ActionSettingsEmits } from './types';
import { useAppState } from "@/stores/stores"

const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數
const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>()

const p1Duration = ref<number>(2);
const p2Duration = ref<number>(2);
const p1Multiple = ref<number>(1);
const p2Multiple = ref<number>(8);

const validationError = ref<string>('');

// 預設模式
const jumpCutPresets = [
    { name: 'gentle', p1Duration: 3, p2Duration: 1, p1Multiple: 1, p2Multiple: 4 },
    { name: 'standard', p1Duration: 2, p2Duration: 2, p1Multiple: 1, p2Multiple: 8 },
    { name: 'aggressive', p1Duration: 1, p2Duration: 3, p1Multiple: 1, p2Multiple: 15 },
    { name: 'lecture', p1Duration: 5, p2Duration: 1, p1Multiple: 1, p2Multiple: 6 },
];

// 計算總循環時間
const totalCycleDuration = computed(() => {
    return p1Duration.value + p2Duration.value;
});

// 計算平均加速倍數
const averageSpeedup = computed(() => {
    const totalCycleDuration = p1Duration.value + p2Duration.value;

    // 如果總週期時間為 0，返回 1（無意義但不會錯誤）
    if (totalCycleDuration === 0) {
        return 1;
    }

    const totalActualTime = p1Duration.value / p1Multiple.value + p2Duration.value / p2Multiple.value;

    // 防止除零錯誤或無效計算
    if (totalActualTime === 0 || !isFinite(totalActualTime)) {
        return 1;
    }

    const result = totalCycleDuration / totalActualTime;

    // 確保結果是有效數字
    return isFinite(result) && result > 0 ? result : 1;
});

// 計算可視化區段寬度
const segmentWidthP1 = computed(() => {
    const total = p1Duration.value + p2Duration.value;
    return total > 0 ? (p1Duration.value / total) * 100 : 50;
});

const segmentWidthP2 = computed(() => {
    const total = p1Duration.value + p2Duration.value;
    return total > 0 ? (p2Duration.value / total) * 100 : 50;
});

// 應用預設
const applyPreset = (preset: any) => {
    p1Duration.value = preset.p1Duration;
    p2Duration.value = preset.p2Duration;
    p1Multiple.value = preset.p1Multiple;
    p2Multiple.value = preset.p2Multiple;
};

// 驗證設定
const validate = (): { valid: boolean; message?: string } => {
    // 1. A段和B段持續時間不能同時為0，至少有一個須大於0
    if (p1Duration.value === 0 && p2Duration.value === 0) {
        return { valid: false, message: t('actionSettings.Jumpcut.error.durationZero') };
    }

    // 2. p1及p2持續時間皆須>=0
    if (p1Duration.value < 0 || p2Duration.value < 0) {
        return { valid: false, message: t('actionSettings.Jumpcut.error.durationNegative') };
    }

    // 3. p1及p2倍速皆須>=1
    if (p1Multiple.value < 1 || p2Multiple.value < 1) {
        return { valid: false, message: t('actionSettings.Jumpcut.error.multiple') };
    }

    return { valid: true };
};

// 重置設定
const reset = () => {
    p1Duration.value = 2;
    p2Duration.value = 2;
    p1Multiple.value = 1;
    p2Multiple.value = 8;
};

// 獲取設定值
const getSettings = () => {
    return {
        p1_duration: p1Duration.value,
        p2_duration: p2Duration.value,
        p1_multiple: p1Multiple.value,
        p2_multiple: p2Multiple.value
    };
};

// 監聽設定變化
watch([p1Duration, p2Duration, p1Multiple, p2Multiple], () => {
    const validation = validate();
    // 只有當驗證失敗時才發送錯誤訊息，成功時發送空字符串清除錯誤
    if (!validation.valid) {
        validationError.value = validation.message || '';
        emit('validation-error', validation.message || '');
    } else {
        validationError.value = '';
        emit('validation-error', ''); // 清除錯誤訊息
    }
    emit('update:settings', getSettings());
}, { deep: true });

// 初始化
onMounted(() => {
    if (props.task?.settings && props.task.renderMethod) {
        // 直接從新的簡化設定格式載入
        const settings = props.task.settings[props.task.renderMethod];
        if (settings) {
            // 使用 ?? 運算符來正確處理 0 值
            p1Duration.value = settings.p1_duration ?? 2;
            p2Duration.value = settings.p2_duration ?? 2;
            p1Multiple.value = settings.p1_multiple ?? 1;
            p2Multiple.value = settings.p2_multiple ?? 8;
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
.jumpcut-settings {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-weight: bold;
    color: var(--app-text-color);
    font-size: 14px;
}

.input-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.number-input {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--app-border-color);
    border-radius: 4px;
    font-size: 14px;
    background-color: var(--app-input-background-color);
    color: var(--app-text-color);
}

.unit {
    font-size: 12px;
    color: var(--app-text-secondary-color);
    min-width: 20px;
}

.help-text {
    font-size: 12px;
    color: var(--app-text-secondary-color);
    font-style: italic;
}

.pattern-preview {
    background: var(--app-background-secondary-color);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--app-border-color);
}

.pattern-preview h4 {
    margin: 0 0 12px 0;
    color: var(--app-text-color);
}

.pattern-visualization {
    display: flex;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--app-border-color);
    margin-bottom: 12px;
}

.pattern-segment {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
    position: relative;
}

.pattern-segment.p1 {
    background: linear-gradient(135deg, #4caf50, #66bb6a);
}

.pattern-segment.p2 {
    background: linear-gradient(135deg, #ff9800, #ffb74d);
}

.pattern-segment span {
    font-size: 11px;
}

.pattern-segment small {
    font-size: 10px;
    opacity: 0.9;
}

.pattern-info {
    display: flex;
    gap: 20px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--app-text-secondary-color);
}

.info-item i {
    color: var(--app-accent-color);
    width: 16px;
}

.presets h4 {
    margin: 0 0 12px 0;
    color: var(--app-text-color);
}

.preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.preset-button {
    padding: 8px 16px;
    border: 1px solid var(--app-border-color);
    border-radius: 4px;
    background: var(--app-surface-color);
    color: var(--app-text-color);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
}

.preset-button:hover:not(:disabled) {
    background: var(--app-hover-color);
    border-color: var(--app-accent-color);
}

.preset-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.info-section {
    background: var(--app-background-secondary-color);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--app-border-color);
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

.error-message {
    color: #d32f2f;
    background: #f8d7da;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #f5c6cb;
    font-size: 14px;
    margin-top: 12px;
}

@media (max-width: 600px) {
    .settings-grid {
        grid-template-columns: 1fr;
    }

    .pattern-info {
        flex-direction: column;
        gap: 8px;
    }
}
</style>
