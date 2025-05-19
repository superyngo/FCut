<template>
    <div class="page-container">
        <h1>說明</h1>
        <p>歡迎來到 FCut 說明中心。以下是一些可以幫助您開始使用的資訊：</p>
        <ul>
            <li><strong>如何匯入影片？</strong><br>點擊主介面上的「新增」按鈕，然後選擇您的影片檔案。</li>
            <li><strong>如何剪輯影片？</strong><br>在時間軸上選取您想剪輯的片段，並使用剪輯工具。</li>
            <li><strong>遇到問題怎麼辦？</strong><br>請檢查我們的線上 FAQ 或聯絡支援團隊。</li>
        </ul>
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
