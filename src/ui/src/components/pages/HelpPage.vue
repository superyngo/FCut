<template>
    <div class="page-container">
        <h1>{{ $t('help.title') }}</h1>
        <p>{{ $t('help.welcome') }}</p>
        <ul>
            <li><strong>{{ $t('help.import_title') }}</strong><br>{{ $t('help.import_desc') }}</li>
            <li><strong>{{ $t('help.cut_title') }}</strong><br>{{ $t('help.cut_desc') }}</li>
            <li><strong>{{ $t('help.problem_title') }}</strong><br>{{ $t('help.problem_desc') }}</li>
        </ul>
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
    margin-bottom: 15px;
}

ul {
    list-style-type: disc;
    padding-left: 20px;
    color: #444;
}

li {
    margin-bottom: 10px;
    line-height: 1.6;
}

strong {
    color: #222;
}
</style>
