import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
import { useAPP_STORE } from "./stores/app";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
await useAPP_STORE().initFromPython();
