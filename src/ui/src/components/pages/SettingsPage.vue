<template>
    <div class="page-container">
        <h1>{{ $t('settings.title') }}</h1>
        <p>{{ $t('settings.desc') }}</p>
        <!-- 語系切換 -->
        <div class="setting-item">
            <label for="lang-select">{{ $t('settings.language') }}</label>
            <select id="lang-select" :value="locale" @change="onLocaleChange">
                <option value="zh-TW">繁體中文</option>
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
            </select>
        </div>
        <!-- 配色主題設定 -->
        <div class="setting-item">
            <label for="theme-select">{{ $t('settings.theme') }}</label>
            <select id="theme-select" :value="theme" @change="onThemeChange">
                <option value="dark">{{ $t('settings.theme_dark') }}</option>
                <option value="light">{{ $t('settings.theme_light') }}</option>
            </select>
        </div>
        <!-- <div class="setting-item">
            <label for="autosave-toggle">{{ $t('settings.autosave') }}</label>
            <input type="checkbox" id="autosave-toggle" checked />
        </div> -->
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAppState } from '@/stores/stores';

const appState = useAppState();
const { t } = appState; // 從 appState 獲取翻譯函數
const { locale, theme } = storeToRefs(appState);

function onLocaleChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    appState.setLocale(val);
}
function onThemeChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    appState.setTheme(val);
}
</script>

<style scoped>
.page-container {
    padding: 20px;
    color: var(--app-text-color);
    background-color: var(--app-bg-color);
    height: 100%;
    overflow-y: auto;
}

h1 {
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--app-text-color);
    border-bottom: none;
    padding-bottom: 0;
    font-size: 24px;
}

p {
    line-height: 1.6;
    color: var(--app-text-color);
    opacity: 0.8;
    margin-bottom: 15px;
}

.setting-item {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    padding: 12px;
    background-color: var(--app-surface-color);
    border-radius: 8px;
    border: 1px solid var(--app-border-color);
    transition: all 0.3s ease;
}

.setting-item:hover {
    background-color: var(--app-hover-color);
}

.setting-item label {
    margin-right: 15px;
    color: var(--app-text-color);
    font-weight: 500;
    min-width: 100px;
}

.setting-item select {
    padding: 8px 12px;
    border: 1px solid var(--app-border-color);
    border-radius: 6px;
    background-color: var(--app-bg-color);
    color: var(--app-text-color);
    font-size: 14px;
    min-width: 150px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.setting-item select:hover {
    border-color: var(--app-accent-color);
}

.setting-item select:focus {
    outline: none;
    border-color: var(--app-accent-color);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.setting-item select option {
    background-color: var(--app-surface-color);
    color: var(--app-text-color);
    padding: 8px;
}
</style>
