import './cmarked'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

import './style.css'
import App from './NewApp.vue'

const pinia = createPinia()

createApp(App).use(VueQueryPlugin).use(pinia).mount('#app')
