import { createI18n } from "vue-i18n";
import zhTW from "./locales/zh-TW";
import zhCN from "./locales/zh-CN";
import en from "./locales/en";

const messages = {
  en: en,
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  // 添加'zh'語言作為'zh-TW'的別名，解決瀏覽器自動偵測問題
  // zh: zhTW,
};

const i18n = createI18n({
  legacy: false,
  locale: "zh-TW",
  fallbackLocale: ["zh-TW", "en"], // 使用陣列形式提供多個fallback選項
  messages,
  // 禁用瀏覽器語言自動偵測，避免尋找不存在的語言
  silentTranslationWarn: true,
  // 設定語言不存在時的fallback策略
  // fallbackWarn: false,
  // missingWarn: false,
});

export default i18n;
