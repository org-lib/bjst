import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 页面禁止复制
// document.onselectstart = function () { return false }
window.ontouchstart = function (e) { e.preventDefault(); };
// document.ontouchstart = function (e) { e.preventDefault(); };
createApp(App).mount('#app')
