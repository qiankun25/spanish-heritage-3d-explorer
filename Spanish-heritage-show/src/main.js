import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";

// 在开发环境中加载浏览器测试工具
if (import.meta.env.DEV) {
  import('./tests/browserTest.js');
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
