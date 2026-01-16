import { createRouter, createWebHistory } from 'vue-router';
import BoreholeManager from '../views/BoreholeManager.vue';

const routes = [
    {
        path: '/borehole',
        name: 'BoreholeManager',
        component: BoreholeManager
    },
    {
        path: '/',
        redirect: '/borehole' // 默认打开钻孔页面
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/borehole' // 输错地址也跳转到钻孔页面，防止白屏
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;