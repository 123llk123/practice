import { createApp } from 'vue';
import App from './App.vue';
import router from './router';  // 导入路由实例
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import axios from 'axios';

const app = createApp(App);

// 关键：使用路由插件
app.use(router);  // 注册路由
app.use(ElementPlus);  // 注册 Element Plus

// 全局挂载 axios（可选）
app.config.globalProperties.$axios = axios;

app.mount('#app');