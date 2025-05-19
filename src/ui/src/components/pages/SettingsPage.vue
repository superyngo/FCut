<template>
    <div class="page-container">
        <h1>設定</h1>
        <p>這裡是設定頁面的內容。您可以在這裡調整應用程式的各種選項。</p>
        <!-- 範例設定 -->
        <div class="setting-item">
            <label for="theme-select">應用程式主題：</label>
            <select id="theme-select">
                <option value="dark">暗色</option>
                <option value="light">亮色</option>
            </select>
        </div>
        <div class="setting-item">
            <label for="autosave-toggle">自動儲存：</label>
            <input type="checkbox" id="autosave-toggle" checked />
        </div>
    </div>
</template>

<script setup lang="ts">
// import { useModalStore } from '../../stores/stores'; // No longer needed

// const modalStore = useModalStore(); // No longer needed

// const goBackToMenu = (event: MouseEvent) => { // No longer needed
//   modalStore.openMenuAndCloseCurrentPage(event); // No longer needed
// }; // No longer needed
</script>

<style scoped>
.page-container {
    padding: 20px;
    color: #333;
    height: 100%;
    overflow-y: auto;
}

/* .page-header { // No longer needed
    display: flex; // No longer needed
    align-items: center; // No longer needed
    margin-bottom: 20px; // No longer needed
} */

/* .back-icon { // No longer needed
    cursor: pointer; // No longer needed
    margin-right: 10px; // No longer needed
    color: #555; // No longer needed
    width: 28px; // No longer needed
    height: 28px; // No longer needed
} */

/* .back-icon:hover { // No longer needed
    color: #000; // No longer needed
} */

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

.setting-item {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
}

.setting-item label {
    margin-right: 10px;
    color: #333;
}
</style>
