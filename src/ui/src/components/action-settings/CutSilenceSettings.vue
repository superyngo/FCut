<template>
    <div class="cut-silence-settings">
        <div class="form-group">
            <label for="silence-threshold">{{ $t('actionSettings.CutSilence.threshold') }}</label>
            <div class="range-container">
                <input id="silence-threshold" type="range" v-model.number="silenceThreshold" :min="minDb" :max="maxDb"
                    :step="1" :disabled="disabled" class="db-range" />
                <span class="db-value">{{ silenceThreshold }} dB</span>
            </div>
            <div class="threshold-scale">
                <span class="scale-label">{{ $t('actionSettings.CutSilence.conservative') }}</span>
                <span class="scale-label">{{ $t('actionSettings.CutSilence.standard') }}</span>
                <span class="scale-label">{{ $t('actionSettings.CutSilence.aggressive') }}</span>
            </div>
            <!-- 2. 動態說明 -->
            <div class="quality-description">{{ getSpeedDescription() }}</div>
        </div>

        <!-- <div class="presets">
            <h4>推薦設定</h4>
            <div class="preset-buttons">
                <button v-for="preset in silencePresets" :key="preset.name" @click="applyPreset(preset)"
                    :disabled="disabled" :class="{ active: silenceThreshold === preset.value }" class="preset-button">
                    {{ preset.name }}
                    <small>{{ preset.value }} dB</small>
                </button>
            </div>
        </div> -->
        <div class="info-section">
            <h4>{{ $t('actionSettings.CutSilence.settingDesc') }}</h4>
            <div class="info-grid">
                <div class="info-item">
                    <strong>-45 dB</strong>
                    <span>{{ $t('actionSettings.CutSilence.qualityRange.conservative') }}</span>
                </div>
                <div class="info-item">
                    <strong>-35 dB</strong>
                    <span>{{ $t('actionSettings.CutSilence.qualityRange.gentle') }}</span>
                </div>
                <div class="info-item">
                    <strong>-23 dB</strong>
                    <span>{{ $t('actionSettings.CutSilence.qualityRange.standard') }}</span>
                </div>
                <div class="info-item">
                    <strong>-15 dB</strong>
                    <span>{{ $t('actionSettings.CutSilence.qualityRange.aggressive') }}</span>
                </div>
                <div class="info-item">
                    <strong>-10 dB</strong>
                    <span>{{ $t('actionSettings.CutSilence.qualityRange.maximum') }}</span>
                </div>
            </div>
        </div>

        <!-- <div class="warning" v-if="showWarning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ warningMessage }}</span>
        </div> -->
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ActionSettingsProps, ActionSettingsEmits } from './types';
import { useAppState } from "@/stores/stores"
const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數
const props = defineProps<ActionSettingsProps>();
const emit = defineEmits<ActionSettingsEmits>();

const silenceThreshold = ref<number>(-23);
const minDb = -45;
const maxDb = -10;

// 預設選項
const silencePresets = [
    { name: t('actionSettings.CutSilence.conservative'), value: -40, description: t('actionSettings.CutSilence.descConservative') },
    { name: t('actionSettings.CutSilence.standard'), value: -23, description: t('actionSettings.CutSilence.descStandard') },
    { name: t('actionSettings.CutSilence.aggressive'), value: -15, description: t('actionSettings.CutSilence.descAggressive') },
    { name: t('actionSettings.CutSilence.lecture'), value: -30, description: t('actionSettings.CutSilence.descLecture') },
    { name: t('actionSettings.CutSilence.music'), value: -35, description: t('actionSettings.CutSilence.descMusic') }
];

// 警告訊息
const showWarning = computed(() => {
    return silenceThreshold.value > -12;
});

const warningMessage = computed(() => {
    if (silenceThreshold.value > -12) {
        return t('actionSettings.CutSilence.warning');
    }
    return '';
});

// 動態說明
const getSpeedDescription = (): string => {
    if (silenceThreshold.value <= -40) return t('actionSettings.CutSilence.qualityRange.conservative');
    if (silenceThreshold.value <= -35) return t('actionSettings.CutSilence.qualityRange.gentle');
    if (silenceThreshold.value <= -23) return t('actionSettings.CutSilence.qualityRange.standard');
    if (silenceThreshold.value <= -15) return t('actionSettings.CutSilence.qualityRange.aggressive');
    return t('actionSettings.CutSilence.qualityRange.maximum');
};

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
    color: var(--app-text-color);
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
    background: var(--app-accent-color);
    cursor: pointer;
    border: 2px solid var(--app-surface-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.db-range::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--app-accent-color);
    cursor: pointer;
    border: 2px solid var(--app-surface-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.db-value {
    font-weight: bold;
    font-size: 16px;
    color: var(--app-text-color);
    min-width: 70px;
    text-align: center;
    font-family: monospace;
}

.threshold-scale {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--app-text-secondary-color);
    margin-top: 4px;
}

.info-section {
    background: var(--app-background-secondary-color);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--app-border-color);
}

.info-section h4 {
    margin: 0 0 12px 0;
    color: var(--app-text-color);
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
    color: var(--app-text-secondary-color);
    min-width: 60px;
    font-family: monospace;
}

.info-item span {
    color: var(--app-text-color);
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
    border: 1px solid var(--app-border-color);
    border-radius: 4px;
    background: var(--app-surface-color);
    color: var(--app-text-color);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.preset-button:hover:not(:disabled) {
    background: var(--app-hover-color);
    border-color: var(--app-accent-color);
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

.quality-description {
    font-size: 13px;
    color: var(--app-text-secondary-color);
    font-style: italic;
    padding: 8px 12px;
    background: var(--app-background-secondary-color);
    border-radius: 4px;
    border-left: 3px solid var(--app-accent-color);
}
</style>
