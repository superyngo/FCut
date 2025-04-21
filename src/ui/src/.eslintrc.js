// .eslintrc.js 或 .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended", // 使用 Vue 3 推薦規則
    "@vue/eslint-config-typescript/recommended", // 使用 TypeScript 推薦規則
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  plugins: [
    "vue", // 確保 vue 插件已啟用
  ],
  rules: {
    // 在這裡加入或覆寫您需要的規則
    // 例如：
    // 'vue/no-unused-vars': 'error',
    // 'vue/html-indent': ['error', 2],
    // '@typescript-eslint/no-unused-vars': ['error'],
  },
  // 告訴 ESLint 如何解析 .vue 檔案
  overrides: [
    {
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser", // 使用 TypeScript 解析器解析 <script> 區塊
        sourceType: "module",
      },
    },
  ],
};
