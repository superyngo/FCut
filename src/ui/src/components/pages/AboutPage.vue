<template>
    <div class="page-container">
        <h1>關於 FCut</h1>
        <p><strong>版本：</strong> 1.0.0 (此為範例)</p>
        <p><strong>版權：</strong> &copy; 2025 您的應用程式名稱或開發者</p>
        <p>FCut 是一款旨在簡化影片編輯流程的工具，提供強大而直觀的功能。</p>
        <p>感謝您使用 FCut！</p>
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
    margin-bottom: 10px;
}

strong {
    color: #222;
}
</style>
