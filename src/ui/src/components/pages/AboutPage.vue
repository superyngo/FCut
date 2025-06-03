<template>
    <div class="page-container">
        <h1>{{ $t('about.title') }}</h1>
        <p><strong>{{ $t('about.version') }}</strong> 1.0.0 ({{ $t('about.example') }})</p>
        <p><strong>{{ $t('about.copyright') }}</strong> &copy; 2025 {{ $t('about.app_or_author') }}</p>
        <p>{{ $t('about.desc') }}</p>
        <p>{{ $t('about.thanks') }}</p>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page-container {
    padding: 20px;
    color: #333;
    height: 100%;
    overflow-y: auto;
}

h1 {
    margin-top: 0;
    margin-bottom: 20px;
    /* Adjusted margin-bottom */
    color: #111;
    border-bottom: none;
    padding-bottom: 0;
    font-size: 24px;
}

p {
    line-height: 1.6;
    color: #444;
    margin-bottom: 10px;
}

strong {
    color: #222;
}
</style>
