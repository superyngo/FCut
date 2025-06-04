<template>
    <div class="page-container">
        <h1>{{ $t('about.title') }}</h1>
        <p><strong>{{ $t('about.version') }}</strong> {{ constants!.DEV_INFO.APP_VERSION }}</p>
        <p><strong>{{ $t('about.copyright') }}</strong> &copy; {{ constants!.DEV_INFO.COMPANY }}</p>
        <p>{{ $t('about.desc') }}</p>
        <p>{{ $t('about.thanks') }}</p>
    </div>
</template>

<script setup lang="ts">
import { useAppState } from '@/stores/stores';
const appState = useAppState();
const { constants } = appState;


</script>

<style scoped>
.page-container {
    padding: 20px;
    color: var(--app-text-color);
    height: 100%;
    overflow-y: auto;
}

h1 {
    margin-top: 0;
    margin-bottom: 20px;
    /* Adjusted margin-bottom */
    color: var(--app-text-color);
    border-bottom: none;
    padding-bottom: 0;
    font-size: 24px;
}

p {
    line-height: 1.6;
    color: var(--app-text-color);
    opacity: 0.8;
    margin-bottom: 10px;
}

strong {
    color: var(--app-text-color);
    font-weight: 600;
}
</style>
